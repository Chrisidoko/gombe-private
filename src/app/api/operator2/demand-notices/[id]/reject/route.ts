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
  const noticeId = parseInt(id, 10);
  if (isNaN(noticeId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  try {
    const { reason } = await req.json();

    const result = await pool.query(
      `UPDATE pending_demand_notices
       SET status = 'rejected',
           reviewed_by = $1,
           reviewed_at = NOW(),
           rejection_reason = $2
       WHERE id = $3 AND status = 'pending_approval'
       RETURNING id`,
      [user.name || "operator2", reason?.trim() || null, noticeId],
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: "Notice not found or already reviewed" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, notice_id: noticeId });
  } catch (error) {
    console.error("Op2 demand notice reject failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
