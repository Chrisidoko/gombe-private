// Operator 2 — preview which schools, per fee category, a pending bulk
// assessment would invoice. Read-only mirror of the eligibility query in
// [id]/approve/route.ts, so what's previewed here is exactly who gets
// invoiced on approval.
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getUserFromCookie } from "@/lib/auth";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getUserFromCookie();
  if (!user || user.institution !== "CBS_Operator2") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const assessmentId = parseInt(id, 10);
  if (isNaN(assessmentId)) {
    return NextResponse.json({ error: "Invalid assessment id" }, { status: 400 });
  }

  try {
    const asmtRes = await pool.query(
      `SELECT tier_1_fee, tier_2_fee, tier_3_fee
       FROM schoolkano_bulk_assessments WHERE id = $1`,
      [assessmentId],
    );
    if (asmtRes.rowCount === 0) {
      return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
    }
    const asmt = asmtRes.rows[0];

    const schoolsRes = await pool.query(`
      SELECT school_id, name, lga, tier
      FROM schoolskano
      WHERE approval_status = 'approved' AND tier IS NOT NULL
      ORDER BY name ASC
    `);

    const TIER_META = [
      { tier: 1, label: "Category A", fee: asmt.tier_1_fee },
      { tier: 2, label: "Category B", fee: asmt.tier_2_fee },
      { tier: 3, label: "Category C", fee: asmt.tier_3_fee },
    ];

    const categories = TIER_META.map((t) => ({
      tier: t.tier,
      label: t.label,
      fee: t.fee,
      schools: t.fee
        ? schoolsRes.rows
            .filter((s) => s.tier === t.tier)
            .map((s) => ({ school_id: s.school_id, name: s.name, lga: s.lga }))
        : [],
    }));

    return NextResponse.json({
      categories,
      total: categories.reduce((sum, c) => sum + c.schools.length, 0),
    });
  } catch (error) {
    console.error("Op2 bulk schools fetch failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
