// Operator 1 — declarations to review, and lines past their notice's due date
// with no declaration, which need an estimate.
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { requireRole } from "@/lib/apiAuth";

export async function GET() {
  const denied = await requireRole("CBS_Operator");
  if (denied) return denied;

  try {
    const declarations = await pool.query(
      `SELECT d.id, d.amount, d.declared_income, d.evidence_url, d.note, d.created_at,
              n.year, sc.name AS school_name, s.name AS subhead_name
       FROM tax_declarations d
       JOIN annual_notice_lines l ON l.id = d.line_id
       JOIN annual_notices n ON n.id = l.notice_id
       JOIN revenue_subheads s ON s.id = l.revenue_subhead_id
       LEFT JOIN schoolskano sc ON sc.school_id = d.school_id
       WHERE d.status = 'pending_review'
       ORDER BY d.created_at ASC`,
    );
    const overdue = await pool.query(
      `SELECT l.id AS line_id, n.year, n.due_date, sc.name AS school_name,
              s.name AS subhead_name, s.code
       FROM annual_notice_lines l
       JOIN annual_notices n ON n.id = l.notice_id
       JOIN revenue_subheads s ON s.id = l.revenue_subhead_id
       LEFT JOIN schoolskano sc ON sc.school_id = n.school_id
       WHERE l.status = 'awaiting_declaration'
         AND n.due_date < CURRENT_DATE
         AND NOT EXISTS (
           SELECT 1 FROM tax_declarations d
           WHERE d.line_id = l.id AND d.status <> 'rejected'
         )
       ORDER BY n.due_date ASC, sc.name`,
    );
    return NextResponse.json({
      declarations: declarations.rows,
      overdue: overdue.rows,
    });
  } catch (error) {
    console.error("Tax declarations fetch failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
