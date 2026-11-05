// Reminds Operator 1 when this year's Single Demand Notice still has to go
// out: in January for every school, and during the year for schools approved
// since. Feeds the Annual Notices badge and the dashboard banner.
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { requireRole } from "@/lib/apiAuth";
import { getReadiness } from "@/lib/annualNotices";

export async function GET() {
  const denied = await requireRole("CBS_Operator");
  if (denied) return denied;

  const year = new Date().getFullYear();
  try {
    const { ready, missingDetails } = await getReadiness(year);
    const draft = await pool.query(
      `SELECT b.rejection_reason, COUNT(n.id)::int AS schools
       FROM annual_notice_batches b
       JOIN annual_notices n ON n.batch_id = b.id
       WHERE b.year = $1 AND b.status = 'draft'
       GROUP BY b.id`,
      [year],
    );
    const draftRow = draft.rows[0];
    const draftSchools = draftRow?.schools ?? 0;

    return NextResponse.json({
      year,
      waiting: ready.length,
      missingDetails: missingDetails.length,
      draftSchools,
      draftReturned: !!draftRow?.rejection_reason,
      // Schools that still need something done by Operator 1 this year
      count: ready.length + missingDetails.length + draftSchools,
    });
  } catch (error) {
    console.error("Annual notice alerts failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
