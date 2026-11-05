// Operator 2 decides a PAYE return. Approval makes it payable by its filing
// date, or within the grace days if that has already passed.
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getUserFromCookie } from "@/lib/auth";
import { requireRole } from "@/lib/apiAuth";
import { notifySchool } from "@/lib/annualNotices";
import { PAYE_PAYMENT_GRACE_DAYS, periodLabel } from "@/lib/paye";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await requireRole("CBS_Operator2");
  if (denied) return denied;

  const user = await getUserFromCookie();
  const { id } = await params;
  const { action, reason } = await req.json();

  if (action !== "approve" && action !== "reject") {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }
  if (action === "reject" && !reason?.trim()) {
    return NextResponse.json({ error: "A reason is required" }, { status: 400 });
  }

  try {
    const { rows } = await pool.query(
      action === "approve"
        ? `UPDATE paye_returns
           SET status = CASE WHEN declared_paye = 0 THEN 'waived' ELSE 'unpaid' END,
               reviewed_by = $1, reviewed_at = NOW(),
               payment_due_date = GREATEST(filing_due_date, CURRENT_DATE + $3::integer)
           WHERE id = $2 AND status = 'recommended'
           RETURNING school_id, period::text, declared_paye, payment_due_date::text`
        : `UPDATE paye_returns
           SET status = 'rejected', reviewed_by = $1, reviewed_at = NOW(), rejection_reason = $3
           WHERE id = $2 AND status = 'recommended'
           RETURNING school_id, period::text, declared_paye, payment_due_date::text`,
      [user?.name || "operator2", id, action === "approve" ? PAYE_PAYMENT_GRACE_DAYS : reason.trim()],
    );
    if (rows.length === 0) {
      return NextResponse.json(
        { error: "Return not found or already reviewed" },
        { status: 404 },
      );
    }

    const ret = rows[0];
    const month = periodLabel(ret.period);
    await notifySchool(
      ret.school_id,
      action === "approve" ? "PAYE return approved" : "PAYE return returned",
      action === "approve"
        ? `Your PAYE return for ${month} has been approved for ₦${Number(ret.declared_paye).toLocaleString()}. Payment is due by ${new Date(ret.payment_due_date).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })}.`
        : `Your PAYE return for ${month} was returned for correction: ${reason.trim()}`,
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PAYE return decision failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
