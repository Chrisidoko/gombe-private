import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getUserFromCookie } from "@/lib/auth";

export async function PATCH(
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
    const { reason } = await req.json();

    const result = await pool.query(
      `UPDATE schoolkano_bulk_assessments
       SET status = 'rejected',
           reviewed_by = $1,
           reviewed_at = NOW(),
           rejection_reason = $2
       WHERE id = $3 AND status = 'pending_approval'
       RETURNING id`,
      [user.name || "operator2", reason?.trim() || null, assessmentId],
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: "Assessment not found or already reviewed" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, assessment_id: assessmentId });
  } catch (error) {
    console.error("Op2 bulk reject failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
