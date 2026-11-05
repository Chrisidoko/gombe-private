// Operator 2 returns a batch to Operator 1 as a draft, with the reason, so it
// can be corrected and sent again.
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
  if (!reason?.trim()) {
    return NextResponse.json(
      { error: "Say what needs correcting" },
      { status: 400 },
    );
  }
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const batchRes = await client.query(
      `UPDATE annual_notice_batches
       SET status = 'draft', reviewed_by = $1, reviewed_at = NOW(), rejection_reason = $2
       WHERE id = $3 AND status = 'pending_approval'`,
      [user?.name || "operator2", reason.trim(), batchId],
    );
    if (batchRes.rowCount === 0) {
      await client.query("ROLLBACK");
      return NextResponse.json(
        { error: "Batch not found or already reviewed" },
        { status: 404 },
      );
    }
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
