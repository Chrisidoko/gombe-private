// Everything waiting for Operator 2's decision across the five Reviews tabs,
// oldest first, for the dashboard's "Waiting for your decision" list. Each
// item says which tab to open it in.
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { requireRole } from "@/lib/apiAuth";

export async function GET() {
  const denied = await requireRole("CBS_Operator2");
  if (denied) return denied;

  try {
    const { rows } = await pool.query(`
      -- A bulk assessment bills each approved school by its tier's fee
      SELECT 'bulk' AS tab, 'Ministry Assessment' AS kind, b.id,
             b.title AS title, b.total_schools || ' institutions' AS detail,
             COALESCE(b.tier_1_fee, 0) * (SELECT COUNT(*) FROM schoolskano WHERE approval_status = 'approved' AND tier = 1)
           + COALESCE(b.tier_2_fee, 0) * (SELECT COUNT(*) FROM schoolskano WHERE approval_status = 'approved' AND tier = 2)
           + COALESCE(b.tier_3_fee, 0) * (SELECT COUNT(*) FROM schoolskano WHERE approval_status = 'approved' AND tier = 3) AS amount,
             b.created_at AS waiting_since
      FROM schoolkano_bulk_assessments b
      WHERE b.status = 'pending_approval'

      UNION ALL
      SELECT 'self', 'Self Assessment', a.id, s.name,
             'Recommended by ' || COALESCE(a.op1_reviewed_by, 'Operator 1'),
             a.commission_amount, a.created_at
      FROM schoolskano_assessments a
      JOIN schoolskano s ON s.school_id = a.school_id
      WHERE a.status = 'under_review'

      UNION ALL
      SELECT 'demand', 'Demand Notice', n.id, n.title, n.school_name,
             n.amount, n.created_at
      FROM pending_demand_notices n
      WHERE n.status = 'pending_approval'

      UNION ALL
      -- A returned batch waits again from when it was sent back
      SELECT 'annual', 'Annual Notice', b.id,
             b.year || ' Single Demand Notice',
             COUNT(DISTINCT n.id) || ' institutions',
             COALESCE(SUM(l.amount), 0), COALESCE(b.reviewed_at, b.created_at)
      FROM annual_notice_batches b
      JOIN annual_notices n ON n.batch_id = b.id
      LEFT JOIN annual_notice_lines l ON l.notice_id = n.id
      WHERE b.status = 'pending_approval'
      GROUP BY b.id

      UNION ALL
      SELECT 'tax', 'Tax Declaration', d.id, sc.name,
             s.name || ' ' || an.year, d.amount, d.recommended_at
      FROM tax_declarations d
      JOIN annual_notice_lines l ON l.id = d.line_id
      JOIN annual_notices an ON an.id = l.notice_id
      JOIN revenue_subheads s ON s.id = l.revenue_subhead_id
      LEFT JOIN schoolskano sc ON sc.school_id = d.school_id
      WHERE d.status = 'recommended'

      UNION ALL
      SELECT 'tax', 'PAYE Return', r.id, sc.name,
             TRIM(to_char(r.period, 'FMMonth YYYY')), r.declared_paye, r.recommended_at
      FROM paye_returns r
      LEFT JOIN schoolskano sc ON sc.school_id = r.school_id
      WHERE r.status = 'recommended'

      UNION ALL
      SELECT 'tax', 'Objection', o.id, sc.name, s.name, l.amount, o.created_at
      FROM notice_objections o
      JOIN annual_notice_lines l ON l.id = o.line_id
      JOIN revenue_subheads s ON s.id = l.revenue_subhead_id
      LEFT JOIN schoolskano sc ON sc.school_id = o.school_id
      WHERE o.status = 'pending'

      ORDER BY waiting_since ASC NULLS LAST
    `);

    return NextResponse.json(
      rows.map((r) => ({
        ...r,
        amount: r.amount === null ? null : Number(r.amount),
      })),
    );
  } catch (error) {
    console.error("Waiting items fetch failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
