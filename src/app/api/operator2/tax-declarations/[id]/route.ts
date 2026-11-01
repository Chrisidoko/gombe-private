// Operator 2 decides a declaration. Approval puts the amount on the notice line
// and starts that line's own 30 days.
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getUserFromCookie } from "@/lib/auth";
import { requireRole } from "@/lib/apiAuth";
import { notifySchool, PAYMENT_WINDOW_DAYS } from "@/lib/annualNotices";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await requireRole("CBS_Operator2");
  if (denied) return denied;

  const user = await getUserFromCookie();
  const { id } = await params;
  const { action, reason } = await req.json();
  const name = user?.name || "operator2";

  if (action !== "approve" && action !== "reject") {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }
  if (action === "reject" && !reason?.trim()) {
    return NextResponse.json({ error: "A reason is required" }, { status: 400 });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query(
      `UPDATE tax_declarations
       SET status = $1, reviewed_by = $2, reviewed_at = NOW(), rejection_reason = $3
       WHERE id = $4 AND status = 'recommended'
       RETURNING line_id, school_id, amount`,
      [
        action === "approve" ? "approved" : "rejected",
        name,
        action === "reject" ? reason.trim() : null,
        id,
      ],
    );
    if (rows.length === 0) {
      await client.query("ROLLBACK");
      return NextResponse.json(
        { error: "Declaration not found or already reviewed" },
        { status: 404 },
      );
    }
    const declaration = rows[0];

    if (action === "approve") {
      const nothingDue = Number(declaration.amount) === 0;
      await client.query(
        `UPDATE annual_notice_lines
         SET amount = $1, status = $2, due_date = CURRENT_DATE + $3::integer
         WHERE id = $4 AND status = 'awaiting_declaration'`,
        [
          declaration.amount,
          nothingDue ? "waived" : "unpaid",
          PAYMENT_WINDOW_DAYS,
          declaration.line_id,
        ],
      );
    }
    await client.query("COMMIT");

    await notifySchool(
      declaration.school_id,
      action === "approve" ? "Tax declaration approved" : "Tax declaration returned",
      action === "approve"
        ? `Your tax declaration has been approved for ₦${Number(declaration.amount).toLocaleString()}. Payment is due within ${PAYMENT_WINDOW_DAYS} days.`
        : `Your tax declaration was returned for correction: ${reason.trim()}`,
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Declaration decision failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  } finally {
    client.release();
  }
}
