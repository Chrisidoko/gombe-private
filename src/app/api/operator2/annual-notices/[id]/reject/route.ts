// Operator 2 rejects a batch — Operator 1 can correct and prepare it again.
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getUserFromCookie } from "@/lib/auth";
import { requireRole } from "@/lib/apiAuth";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await requireRole("CBS_Operator2");
  if (denied) return denied;

  const user = await getUserFromCookie();
  const { id } = await params;
  const batchId = parseInt(id, 10);
  if (isNaN(batchId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const { reason } = await req.json();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const batchRes = await client.query(
      `UPDATE annual_notice_batches
       SET status = 'rejected', reviewed_by = $1, reviewed_at = NOW(), rejection_reason = $2
       WHERE id = $3 AND status = 'pending_approval'`,
      [user?.name || "operator2", reason?.trim() || null, batchId],
    );
    if (batchRes.rowCount === 0) {
      await client.query("ROLLBACK");
      return NextResponse.json(
        { error: "Batch not found or already reviewed" },
        { status: 404 },
      );
    }
    await client.query(
      `UPDATE annual_notices SET status = 'rejected' WHERE batch_id = $1`,
      [batchId],
    );
    await client.query("COMMIT");
    return NextResponse.json({ success: true });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Annual notice rejection failed:", error);
    return NextResponse.json({ error: "Rejection failed" }, { status: 500 });
  } finally {
    client.release();
  }
}
