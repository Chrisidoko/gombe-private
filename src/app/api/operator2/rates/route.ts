// Operator 2 views and sets the annual notice rates. A rate applies from its
// year onward, so a year with no rate of its own uses the latest earlier one.
// Saving a rate for a year adds or updates that year's row; earlier years and
// notices already prepared keep their amounts.
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getUserFromCookie } from "@/lib/auth";
import { requireRole } from "@/lib/apiAuth";

const RATED_CHARGE_TYPES = ["annual_fixed", "annual_premises"];
const LOCATIONS = ["urban", "rural"];
const CATEGORIES = ["A", "B", "C"];

type Change = {
  subhead_id: number;
  location_type: string | null;
  premises_category: string | null;
  amount: number;
};

export async function GET(req: Request) {
  const denied = await requireRole("CBS_Operator2");
  if (denied) return denied;

  const year = parseInt(
    new URL(req.url).searchParams.get("year") ||
      String(new Date().getFullYear()),
    10,
  );
  if (!Number.isInteger(year) || year < 2000) {
    return NextResponse.json({ error: "Invalid year" }, { status: 400 });
  }

  try {
    const subheads = await pool.query(
      `SELECT s.id, s.code, s.name, s.charge_type, h.name AS head_name
       FROM revenue_subheads s
       JOIN revenue_heads h ON h.id = s.head_id
       WHERE s.active AND s.charge_type = ANY($1)
       ORDER BY h.sort_order, s.sort_order`,
      [RATED_CHARGE_TYPES],
    );
    // The rate in force for the year, and the year it was set for
    const rates = await pool.query(
      `SELECT DISTINCT ON (subhead_id, premises_category, location_type)
         subhead_id, TRIM(premises_category) AS premises_category, location_type,
         amount, year AS from_year
       FROM revenue_rates
       WHERE year <= $1
       ORDER BY subhead_id, premises_category, location_type, year DESC`,
      [year],
    );
    const history = await pool.query(
      `SELECT c.year, TRIM(c.premises_category) AS premises_category, c.location_type,
              c.old_amount, c.new_amount, c.note, c.changed_by, c.changed_at,
              s.name AS subhead_name
       FROM revenue_rate_changes c
       JOIN revenue_subheads s ON s.id = c.subhead_id
       ORDER BY c.changed_at DESC
       LIMIT 20`,
    );

    return NextResponse.json({
      year,
      subheads: subheads.rows.map((s) => ({
        ...s,
        rates: rates.rows
          .filter((r) => r.subhead_id === s.id)
          .map((r) => ({ ...r, amount: Number(r.amount) })),
      })),
      history: history.rows,
    });
  } catch (error) {
    console.error("Rates fetch failed:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PUT(req: Request) {
  const denied = await requireRole("CBS_Operator2");
  if (denied) return denied;

  const { year, changes, note } = await req.json();
  const currentYear = new Date().getFullYear();
  if (!Number.isInteger(year) || year < currentYear || year > currentYear + 1) {
    return NextResponse.json(
      { error: "Rates can only be set for this year or next" },
      { status: 400 },
    );
  }
  if (!Array.isArray(changes) || changes.length === 0) {
    return NextResponse.json({ error: "Nothing to save" }, { status: 400 });
  }

  const user = await getUserFromCookie();
  const client = await pool.connect();
  try {
    const subheads = await client.query(
      `SELECT id, charge_type FROM revenue_subheads WHERE charge_type = ANY($1)`,
      [RATED_CHARGE_TYPES],
    );
    const chargeTypeOf = new Map(
      subheads.rows.map((s) => [s.id, s.charge_type]),
    );

    // Check everything before writing anything
    for (const c of changes as Change[]) {
      const type = chargeTypeOf.get(c.subhead_id);
      const amount = Number(c.amount);
      if (!type) {
        return NextResponse.json({ error: "Unknown rate" }, { status: 400 });
      }
      if (!Number.isFinite(amount) || amount < 0) {
        return NextResponse.json(
          { error: "Amounts must be 0 or more" },
          { status: 400 },
        );
      }
      const premises = type === "annual_premises";
      const validCell = premises
        ? LOCATIONS.includes(c.location_type ?? "") &&
          CATEGORIES.includes(c.premises_category ?? "")
        : c.location_type === null && c.premises_category === null;
      if (!validCell) {
        return NextResponse.json(
          { error: "Invalid rate cell" },
          { status: 400 },
        );
      }
    }

    await client.query("BEGIN");
    let saved = 0;
    for (const c of changes as Change[]) {
      const amount = Number(c.amount);
      const current = await client.query(
        `SELECT amount FROM revenue_rates
         WHERE subhead_id = $1 AND year <= $2
           AND COALESCE(TRIM(premises_category), '') = COALESCE($3, '')
           AND COALESCE(location_type, '') = COALESCE($4, '')
         ORDER BY year DESC LIMIT 1`,
        [c.subhead_id, year, c.premises_category, c.location_type],
      );
      const oldAmount = current.rows[0] ? Number(current.rows[0].amount) : null;
      if (oldAmount === amount) continue;

      const updated = await client.query(
        `UPDATE revenue_rates SET amount = $5
         WHERE subhead_id = $1 AND year = $2
           AND COALESCE(TRIM(premises_category), '') = COALESCE($3, '')
           AND COALESCE(location_type, '') = COALESCE($4, '')`,
        [c.subhead_id, year, c.premises_category, c.location_type, amount],
      );
      if (updated.rowCount === 0) {
        await client.query(
          `INSERT INTO revenue_rates (subhead_id, year, premises_category, location_type, amount)
           VALUES ($1, $2, $3, $4, $5)`,
          [c.subhead_id, year, c.premises_category, c.location_type, amount],
        );
      }
      await client.query(
        `INSERT INTO revenue_rate_changes
           (subhead_id, year, premises_category, location_type, old_amount, new_amount, note, changed_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          c.subhead_id,
          year,
          c.premises_category,
          c.location_type,
          oldAmount,
          amount,
          typeof note === "string" && note.trim() ? note.trim() : null,
          user?.name || "operator2",
        ],
      );
      saved++;
    }
    await client.query("COMMIT");
    return NextResponse.json({ success: true, saved });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Saving rates failed:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  } finally {
    client.release();
  }
}
