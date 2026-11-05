// Operator 1 recommends a PAYE return to Operator 2, or sends it back to the school.
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getUserFromCookie } from "@/lib/auth";
import { requireRole } from "@/lib/apiAuth";
import { notifySchool } from "@/lib/annualNotices";
import { periodLabel } from "@/lib/paye";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await requireRole("CBS_Operator");
  if (denied) return denied;

  const user = await getUserFromCookie();
  const { id } = await params;
  const { action, reason } = await req.json();

  if (action !== "recommend" && action !== "reject") {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }
  if (action === "reject" && !reason?.trim()) {
    return NextResponse.json({ error: "A reason is required" }, { status: 400 });
  }

  try {
    const { rows } = await pool.query(
      `UPDATE paye_returns
       SET status = $1, recommended_by = $2, recommended_at = NOW(), rejection_reason = $3
       WHERE id = $4 AND status = 'pending_review'
       RETURNING school_id, period::text`,
      [
        action === "recommend" ? "recommended" : "rejected",
        user?.name || "operator",
        action === "reject" ? reason.trim() : null,
        id,
      ],
    );
    if (rows.length === 0) {
      return NextResponse.json(
        { error: "Return not found or already reviewed" },
        { status: 404 },
      );
    }

    if (action === "reject") {
      await notifySchool(
        rows[0].school_id,
        "PAYE return returned",
        `Your PAYE return for ${periodLabel(rows[0].period)} was returned for correction: ${reason.trim()}`,
      );
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PAYE return review failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
