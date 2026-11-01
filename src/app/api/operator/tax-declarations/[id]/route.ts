// Operator 1 recommends a declaration to Operator 2, or sends it back to the school.
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getUserFromCookie } from "@/lib/auth";
import { requireRole } from "@/lib/apiAuth";
import { notifySchool } from "@/lib/annualNotices";

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
      action === "recommend"
        ? `UPDATE tax_declarations
           SET status = 'recommended', recommended_by = $1, recommended_at = NOW()
           WHERE id = $2 AND status = 'pending_review'
           RETURNING school_id`
        : `UPDATE tax_declarations
           SET status = 'rejected', recommended_by = $1, recommended_at = NOW(), rejection_reason = $3
           WHERE id = $2 AND status = 'pending_review'
           RETURNING school_id`,
      action === "recommend"
        ? [user?.name || "operator", id]
        : [user?.name || "operator", id, reason.trim()],
    );
    if (rows.length === 0) {
      return NextResponse.json(
        { error: "Declaration not found or already reviewed" },
        { status: 404 },
      );
    }

    if (action === "reject") {
      await notifySchool(
        rows[0].school_id,
        "Tax declaration returned",
        `Your tax declaration was returned for correction: ${reason.trim()}`,
      );
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Declaration review failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
