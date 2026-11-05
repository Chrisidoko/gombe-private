// The staff rows behind one PAYE return. Salaries, so only the school and the
// tax operators and Finance can see them.
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { requireSchoolAccess } from "@/lib/apiAuth";
import { PAYE_STAFF_ROLES } from "@/lib/paye";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const returnId = parseInt(id, 10);
  if (isNaN(returnId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  try {
    const ret = await pool.query(`SELECT school_id FROM paye_returns WHERE id = $1`, [
      returnId,
    ]);
    if (!ret.rows[0]) {
      return NextResponse.json({ error: "Return not found" }, { status: 404 });
    }
    const denied = await requireSchoolAccess(ret.rows[0].school_id, PAYE_STAFF_ROLES);
    if (denied) return denied;

    const { rows } = await pool.query(
      `SELECT staff_name, staff_group, role, gross_pay, paye_deducted, expected_paye
       FROM paye_return_staff WHERE return_id = $1 ORDER BY id`,
      [returnId],
    );
    return NextResponse.json({ staff: rows });
  } catch (error) {
    console.error("PAYE staff fetch failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
