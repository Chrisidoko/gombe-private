// How many items wait for Operator 2 in each Reviews tab, for the tab badges
// and the sidebar total.
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { requireRole } from "@/lib/apiAuth";

export async function GET() {
  const denied = await requireRole("CBS_Operator2");
  if (denied) return denied;

  try {
    const { rows } = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM schoolkano_bulk_assessments WHERE status = 'pending_approval')::int AS bulk,
        (SELECT COUNT(*) FROM schoolskano_assessments WHERE status = 'under_review')::int AS self,
        (SELECT COUNT(*) FROM pending_demand_notices WHERE status = 'pending_approval')::int AS demand,
        (SELECT COUNT(*) FROM annual_notice_batches WHERE status = 'pending_approval')::int AS annual,
        ((SELECT COUNT(*) FROM tax_declarations WHERE status = 'recommended')
          + (SELECT COUNT(*) FROM paye_returns WHERE status = 'recommended')
          + (SELECT COUNT(*) FROM notice_objections WHERE status = 'pending'))::int AS tax
    `);
    const counts = rows[0];
    return NextResponse.json({
      ...counts,
      total: counts.bulk + counts.self + counts.demand + counts.annual + counts.tax,
    });
  } catch (error) {
    console.error("Review counts failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
