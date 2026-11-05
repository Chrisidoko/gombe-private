// Operator 1 enters an estimate for a month with no PAYE return after its
// filing date. It goes to Operator 2 like a recommended return.
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getUserFromCookie } from "@/lib/auth";
import { requireRole } from "@/lib/apiAuth";
import { getPayeSubheadId, getUnfiledPayeMonths } from "@/lib/paye";

export async function POST(req: Request) {
  const denied = await requireRole("CBS_Operator");
  if (denied) return denied;

  const user = await getUserFromCookie();
  const { school_id, period, amount, note } = await req.json();

  const parsedAmount = Number(amount);
  if (typeof school_id !== "string" || typeof period !== "string" || !Number.isFinite(parsedAmount) || parsedAmount <= 0) {
    return NextResponse.json({ error: "Invalid month or amount" }, { status: 400 });
  }
  if (!note?.trim()) {
    return NextResponse.json(
      { error: "Explain how the estimate was reached" },
      { status: 400 },
    );
  }

  try {
    const month = (await getUnfiledPayeMonths(school_id)).find(
      (m) => m.period === period,
    );
    if (!month) {
      return NextResponse.json(
        { error: "This month isn't open for an estimate" },
        { status: 400 },
      );
    }

    const name = user?.name || "operator";
    const result = await pool.query(
      `INSERT INTO paye_returns
         (school_id, period, filing_due_date, source, status, declared_paye, note,
          submitted_by, recommended_by, recommended_at, revenue_subhead_id)
       VALUES ($1, $2, $3, 'operator_estimate', 'recommended', $4, $5, $6, $6, NOW(), $7)
       ON CONFLICT (school_id, period) WHERE status <> 'rejected' DO NOTHING
       RETURNING id`,
      [
        school_id,
        period,
        month.filing_due_date,
        parsedAmount,
        note.trim(),
        name,
        await getPayeSubheadId(),
      ],
    );
    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: "A return for this month is already filed" },
        { status: 409 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PAYE estimate failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
