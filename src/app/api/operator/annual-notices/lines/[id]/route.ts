// Operator 1 changes one fixed-rate line on a draft notice for a single
// school. Any amount other than the standard rate needs a reason, which
// Operator 2 sees at approval. 0 means the item doesn't apply to the school.
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getUserFromCookie } from "@/lib/auth";
import { requireRole } from "@/lib/apiAuth";

const EDITABLE_CHARGE_TYPES = ["annual_fixed", "annual_premises"];

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await requireRole("CBS_Operator");
  if (denied) return denied;

  const { id } = await params;
  const lineId = parseInt(id, 10);
  if (isNaN(lineId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const { amount, reason } = await req.json();
  const parsed = Number(amount);
  if (amount === "" || amount === null || !Number.isFinite(parsed) || parsed < 0) {
    return NextResponse.json({ error: "Enter an amount of 0 or more" }, { status: 400 });
  }

  try {
    const { rows } = await pool.query(
      `SELECT l.standard_amount, b.status AS batch_status, s.charge_type
       FROM annual_notice_lines l
       JOIN annual_notices n ON n.id = l.notice_id
       JOIN annual_notice_batches b ON b.id = n.batch_id
       JOIN revenue_subheads s ON s.id = l.revenue_subhead_id
       WHERE l.id = $1`,
      [lineId],
    );
    const line = rows[0];
    if (!line) {
      return NextResponse.json({ error: "Line not found" }, { status: 404 });
    }
    if (line.batch_status !== "draft") {
      return NextResponse.json(
        { error: "Only lines on a draft can be changed" },
        { status: 400 },
      );
    }
    if (!EDITABLE_CHARGE_TYPES.includes(line.charge_type)) {
      return NextResponse.json(
        { error: "This item is set by declaration" },
        { status: 400 },
      );
    }

    // Back to the standard rate clears the adjustment
    const isStandard = parsed === Number(line.standard_amount);
    if (!isStandard && !reason?.trim()) {
      return NextResponse.json(
        { error: "Give a reason for changing the standard amount" },
        { status: 400 },
      );
    }

    const user = await getUserFromCookie();
    await pool.query(
      `UPDATE annual_notice_lines
       SET amount = $1,
           adjustment_reason = $2,
           adjusted_by = $3,
           adjusted_at = CASE WHEN $3::text IS NULL THEN NULL ELSE NOW() END
       WHERE id = $4`,
      [
        parsed,
        isStandard ? null : reason.trim(),
        isStandard ? null : user?.name || "operator",
        lineId,
      ],
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Notice line adjustment failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
