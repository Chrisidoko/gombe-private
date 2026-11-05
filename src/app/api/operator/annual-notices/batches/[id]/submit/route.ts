// Operator 1 sends a draft batch to Operator 2 for approval.
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { requireRole } from "@/lib/apiAuth";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await requireRole("CBS_Operator");
  if (denied) return denied;

  const { id } = await params;
  const batchId = parseInt(id, 10);
  if (isNaN(batchId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  try {
    const result = await pool.query(
      `UPDATE annual_notice_batches
       SET status = 'pending_approval', rejection_reason = NULL
       WHERE id = $1 AND status = 'draft'`,
      [batchId],
    );
    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: "Draft not found or already sent" },
        { status: 404 },
      );
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Notice batch submit failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
