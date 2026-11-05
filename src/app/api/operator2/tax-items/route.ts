// Operator 2 — declarations and PAYE returns recommended by Operator 1, and
// open objections.
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { requireRole } from "@/lib/apiAuth";

export async function GET() {
  const denied = await requireRole("CBS_Operator2");
  if (denied) return denied;

  try {
    const declarations = await pool.query(
      `SELECT d.id, d.amount, d.declared_income, d.evidence_url, d.note, d.source, d.recommended_by,
              n.year, sc.name AS school_name, s.name AS subhead_name
       FROM tax_declarations d
       JOIN annual_notice_lines l ON l.id = d.line_id
       JOIN annual_notices n ON n.id = l.notice_id
       JOIN revenue_subheads s ON s.id = l.revenue_subhead_id
       LEFT JOIN schoolskano sc ON sc.school_id = d.school_id
       WHERE d.status = 'recommended'
       ORDER BY d.recommended_at ASC`,
    );
    const objections = await pool.query(
      `SELECT o.id, o.grounds, o.created_at, l.amount, n.year, n.notice_number,
              sc.name AS school_name, s.name AS subhead_name
       FROM notice_objections o
       JOIN annual_notice_lines l ON l.id = o.line_id
       JOIN annual_notices n ON n.id = l.notice_id
       JOIN revenue_subheads s ON s.id = l.revenue_subhead_id
       LEFT JOIN schoolskano sc ON sc.school_id = o.school_id
       WHERE o.status = 'pending'
       ORDER BY o.created_at ASC`,
    );
    const payeReturns = await pool.query(
      `SELECT r.id, r.period::text, r.declared_paye, r.expected_paye, r.total_gross,
              r.staff_count, r.note, r.source, r.recommended_by, sc.name AS school_name
       FROM paye_returns r
       LEFT JOIN schoolskano sc ON sc.school_id = r.school_id
       WHERE r.status = 'recommended'
       ORDER BY r.recommended_at ASC`,
    );
    return NextResponse.json({
      declarations: declarations.rows,
      objections: objections.rows,
      payeReturns: payeReturns.rows,
    });
  } catch (error) {
    console.error("Op2 tax items fetch failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
