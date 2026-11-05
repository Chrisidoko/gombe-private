// A school's monthly PAYE returns: the months it owes, its People list to fill
// a return from, and last month's staff rows to copy. POST files a return.
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getUserFromCookie } from "@/lib/auth";
import { requireSchoolAccess } from "@/lib/apiAuth";
import { reconcilePayeReturn } from "@/lib/reconcileEtransact";
import {
  expectedMonthlyPaye,
  getPayeSubheadId,
  getSchoolPayeMonths,
  isOwedPeriod,
  PAYE_STAFF_ROLES,
  sameName,
  STAFF_GROUPS,
  type PayeStaffRow,
  type StaffGroup,
} from "@/lib/paye";

const MAX_STAFF_ROWS = 2000;

async function getPeople(schoolId: string) {
  const { rows } = await pool.query(
    `SELECT academic_staff, non_academic_staff FROM schoolskano WHERE school_id = $1`,
    [schoolId],
  );
  const school = rows[0];
  if (!school) return null;
  return [
    ...((school.academic_staff ?? []) as { name: string; qualification?: string }[]).map(
      (s) => ({ name: s.name, staff_group: "academic" as StaffGroup, role: s.qualification ?? null }),
    ),
    ...((school.non_academic_staff ?? []) as { name: string; role?: string }[]).map(
      (s) => ({ name: s.name, staff_group: "non_academic" as StaffGroup, role: s.role ?? null }),
    ),
  ].filter((p) => p.name?.trim());
}

export async function GET(
  _req: Request,
  context: { params: Promise<{ school_id: string }> },
) {
  const { school_id } = await context.params;
  const denied = await requireSchoolAccess(school_id, PAYE_STAFF_ROLES);
  if (denied) return denied;

  try {
    let months = await getSchoolPayeMonths(school_id);

    // Catches a payment completed after the payer closed the checkout tab,
    // as the notice and invoice routes do.
    let changed = false;
    for (const m of months) {
      if (m.status !== "unpaid" || !m.reference) continue;
      try {
        const { isPaid } = await reconcilePayeReturn(m.id);
        changed = changed || isPaid;
      } catch (err) {
        console.error(`Reconcile check failed for PAYE return ${m.id}:`, err);
      }
    }
    if (changed) months = await getSchoolPayeMonths(school_id);

    const people = (await getPeople(school_id)) ?? [];
    const last = await pool.query(
      `SELECT st.staff_name, st.staff_group, st.role, st.gross_pay, st.paye_deducted
       FROM paye_return_staff st
       WHERE st.return_id = (
         SELECT id FROM paye_returns
         WHERE school_id = $1 AND source = 'school'
         ORDER BY period DESC, created_at DESC
         LIMIT 1
       )
       ORDER BY st.id`,
      [school_id],
    );

    return NextResponse.json({ months, people, lastStaff: last.rows });
  } catch (error) {
    console.error("PAYE returns fetch failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

function parseRows(input: unknown): PayeStaffRow[] | string {
  if (!Array.isArray(input) || input.length === 0) return "Add at least one staff member";
  if (input.length > MAX_STAFF_ROWS) return `A return can list at most ${MAX_STAFF_ROWS} staff`;

  const rows: PayeStaffRow[] = [];
  for (const [i, raw] of input.entries()) {
    const name = String(raw?.staff_name ?? "").trim();
    const group = raw?.staff_group;
    const gross = Number(raw?.gross_pay);
    const paye = Number(raw?.paye_deducted);
    const row = `Row ${i + 1}`;
    if (!name) return `${row}: name is missing`;
    if (!STAFF_GROUPS.includes(group)) return `${row}: choose academic or non-academic`;
    if (raw?.gross_pay === "" || !Number.isFinite(gross) || gross < 0)
      return `${row}: gross pay is missing or invalid`;
    if (raw?.paye_deducted === "" || !Number.isFinite(paye) || paye < 0)
      return `${row}: PAYE deducted is missing or invalid`;
    if (paye > gross) return `${row}: PAYE deducted is more than gross pay`;
    if (rows.some((r) => sameName(r.staff_name, name))) return `${row}: ${name} is listed twice`;
    rows.push({
      staff_name: name,
      staff_group: group,
      role: String(raw?.role ?? "").trim() || null,
      gross_pay: gross,
      paye_deducted: paye,
    });
  }
  return rows;
}

export async function POST(
  req: Request,
  context: { params: Promise<{ school_id: string }> },
) {
  const { school_id } = await context.params;
  // Only the school itself files
  const denied = await requireSchoolAccess(school_id, []);
  if (denied) return denied;

  const { period, rows: rawRows, note } = await req.json();
  if (typeof period !== "string" || !/^\d{4}-\d{2}-01$/.test(period)) {
    return NextResponse.json({ error: "Invalid month" }, { status: 400 });
  }
  const rows = parseRows(rawRows);
  if (typeof rows === "string") {
    return NextResponse.json({ error: rows }, { status: 400 });
  }

  const filingDueDate = await isOwedPeriod(school_id, period);
  if (!filingDueDate) {
    return NextResponse.json(
      { error: "This month isn't open for a PAYE return" },
      { status: 400 },
    );
  }

  const people = await getPeople(school_id);
  if (!people) {
    return NextResponse.json({ error: "School not found" }, { status: 404 });
  }

  const year = Number(period.slice(0, 4));
  const withExpected = rows.map((r) => ({
    ...r,
    expected_paye: expectedMonthlyPaye(r.gross_pay, year),
  }));
  const total = (key: "gross_pay" | "paye_deducted" | "expected_paye") =>
    withExpected.reduce((t, r) => t + r[key], 0);

  const user = await getUserFromCookie();
  const subheadId = await getPayeSubheadId();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const inserted = await client.query(
      `INSERT INTO paye_returns
         (school_id, period, filing_due_date, declared_paye, expected_paye, total_gross,
          staff_count, note, submitted_by, revenue_subhead_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (school_id, period) WHERE status <> 'rejected' DO NOTHING
       RETURNING id`,
      [
        school_id,
        period,
        filingDueDate,
        total("paye_deducted"),
        total("expected_paye"),
        total("gross_pay"),
        rows.length,
        typeof note === "string" && note.trim() ? note.trim() : null,
        user?.name || "school",
        subheadId,
      ],
    );
    if (inserted.rowCount === 0) {
      await client.query("ROLLBACK");
      return NextResponse.json(
        { error: "A return for this month is already filed" },
        { status: 409 },
      );
    }
    const returnId: number = inserted.rows[0].id;

    await client.query(
      `INSERT INTO paye_return_staff
         (return_id, staff_name, staff_group, role, gross_pay, paye_deducted, expected_paye)
       SELECT $1, * FROM UNNEST($2::text[], $3::text[], $4::text[], $5::numeric[], $6::numeric[], $7::numeric[])`,
      [
        returnId,
        withExpected.map((r) => r.staff_name),
        withExpected.map((r) => r.staff_group),
        withExpected.map((r) => r.role),
        withExpected.map((r) => r.gross_pay),
        withExpected.map((r) => r.paye_deducted),
        withExpected.map((r) => r.expected_paye),
      ],
    );

    // Staff on the payroll but not yet in People are added there, so they
    // only have to be entered once.
    const newStaff = rows.filter(
      (r) => !people.some((p) => sameName(p.name, r.staff_name)),
    );
    const newAcademic = newStaff
      .filter((r) => r.staff_group === "academic")
      .map((r) => ({ name: r.staff_name, qualification: r.role ?? "" }));
    const newNonAcademic = newStaff
      .filter((r) => r.staff_group === "non_academic")
      .map((r) => ({ name: r.staff_name, role: r.role ?? "" }));
    if (newStaff.length > 0) {
      await client.query(
        `UPDATE schoolskano
         SET academic_staff = COALESCE(academic_staff, '[]'::jsonb) || $2::jsonb,
             non_academic_staff = COALESCE(non_academic_staff, '[]'::jsonb) || $3::jsonb
         WHERE school_id = $1`,
        [school_id, JSON.stringify(newAcademic), JSON.stringify(newNonAcademic)],
      );
    }

    await client.query("COMMIT");
    return NextResponse.json({ success: true, addedToPeople: newStaff.length });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("PAYE return filing failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  } finally {
    client.release();
  }
}
