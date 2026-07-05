// Operator 1 recommends approve or reject for a self-assessment.
// Does NOT generate invoices or send emails — that happens only after Op2 final-approves.
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getUserFromCookie } from "@/lib/auth";

export async function POST(req: Request) {
  const user = await getUserFromCookie();
  if (!user || user.institution !== "CBS_Operator") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { assessment_id, recommendation, note } = await req.json();

    if (!assessment_id || !["recommend_approve", "recommend_reject"].includes(recommendation)) {
      return NextResponse.json(
        { error: "assessment_id and recommendation ('recommend_approve' | 'recommend_reject') are required" },
        { status: 400 },
      );
    }

    const result = await pool.query(
      `UPDATE schoolskano_assessments
       SET status = 'under_review',
           op1_recommendation = $1,
           op1_note = $2
       WHERE id = $3 AND status = 'pending'
       RETURNING id`,
      [recommendation, note ?? null, assessment_id],
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: "Assessment not found or already reviewed" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, assessment_id });
  } catch (error) {
    console.error("Recommend route failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
