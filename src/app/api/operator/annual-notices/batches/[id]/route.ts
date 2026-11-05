// Operator 1 discards a draft batch. Drafts never reached a school or Operator
// 2, so they're deleted outright and their schools become ready again.
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { requireRole } from "@/lib/apiAuth";

export async function DELETE(
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

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const batch = await client.query(
      `SELECT 1 FROM annual_notice_batches WHERE id = $1 AND status = 'draft' FOR UPDATE`,
      [batchId],
    );
    if (batch.rows.length === 0) {
      await client.query("ROLLBACK");
      return NextResponse.json({ error: "Draft not found" }, { status: 404 });
    }
    await client.query(
      `DELETE FROM annual_notice_lines
       WHERE notice_id IN (SELECT id FROM annual_notices WHERE batch_id = $1)`,
      [batchId],
    );
    await client.query(`DELETE FROM annual_notices WHERE batch_id = $1`, [batchId]);
    await client.query(`DELETE FROM annual_notice_batches WHERE id = $1`, [batchId]);
    await client.query("COMMIT");
    return NextResponse.json({ success: true });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Discarding notice draft failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  } finally {
    client.release();
  }
}
