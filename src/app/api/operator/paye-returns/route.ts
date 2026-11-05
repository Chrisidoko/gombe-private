// Operator 1 — PAYE returns to review, and months past their filing date with
// no return, which need an estimate.
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { requireRole } from "@/lib/apiAuth";
import { getUnfiledPayeMonths } from "@/lib/paye";

export async function GET() {
  const denied = await requireRole("CBS_Operator");
  if (denied) return denied;

  try {
    const returns = await pool.query(
      `SELECT r.id, r.period::text, r.filing_due_date::text, r.declared_paye, r.expected_paye,
              r.total_gross, r.staff_count, r.note, r.created_at, sc.name AS school_name
       FROM paye_returns r
       LEFT JOIN schoolskano sc ON sc.school_id = r.school_id
       WHERE r.status = 'pending_review'
       ORDER BY r.created_at ASC`,
    );
    const unfiled = await getUnfiledPayeMonths();
    return NextResponse.json({ returns: returns.rows, unfiled });
  } catch (error) {
    console.error("PAYE returns fetch failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
