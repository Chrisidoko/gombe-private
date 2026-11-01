// Operator 2 — annual notice batches waiting for review, with each school's
// lines so the amounts can be checked before anything is issued.
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { requireRole } from "@/lib/apiAuth";

export async function GET() {
  const denied = await requireRole("CBS_Operator2");
  if (denied) return denied;

  try {
    const batches = await pool.query(
      `SELECT id, year, source, created_by, created_at
       FROM annual_notice_batches
       WHERE status = 'pending_approval'
       ORDER BY created_at ASC`,
    );
    const lines = await pool.query(
      `SELECT n.batch_id, n.school_id, sc.name AS school_name,
              sc.location_type, sc.premises_category,
              l.amount, s.name AS subhead_name, h.name AS head_name
       FROM annual_notices n
       JOIN annual_notice_batches b ON b.id = n.batch_id
       JOIN annual_notice_lines l ON l.notice_id = n.id
       JOIN revenue_subheads s ON s.id = l.revenue_subhead_id
       JOIN revenue_heads h ON h.id = s.head_id
       LEFT JOIN schoolskano sc ON sc.school_id = n.school_id
       WHERE b.status = 'pending_approval'
       ORDER BY sc.name, h.sort_order, s.sort_order`,
    );
    return NextResponse.json(
      batches.rows.map((batch) => ({
        ...batch,
        lines: lines.rows.filter((l) => l.batch_id === batch.id),
      })),
    );
  } catch (error) {
    console.error("Op2 annual notices fetch failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
