// Operator 2 — declarations recommended by Operator 1, and open objections.
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { requireRole } from "@/lib/apiAuth";

export async function GET() {
  const denied = await requireRole("CBS_Operator2");
  if (denied) return denied;

  try {
    const declarations = await pool.query(
      `SELECT d.id, d.amount, d.evidence_url, d.note, d.source, d.recommended_by,
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
    return NextResponse.json({
      declarations: declarations.rows,
      objections: objections.rows,
    });
  } catch (error) {
    console.error("Op2 tax items fetch failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
