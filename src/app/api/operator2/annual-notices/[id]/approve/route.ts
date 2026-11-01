// Operator 2 approves a batch — notices go live here and the 30 days start.
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getUserFromCookie } from "@/lib/auth";
import { requireRole } from "@/lib/apiAuth";
import { issueNoticeBatch, sendNoticeEmails } from "@/lib/annualNotices";

export async function PATCH(
  _req: Request,
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

  const client = await pool.connect();
  let issued;
  try {
    await client.query("BEGIN");
    const batchRes = await client.query(
      `UPDATE annual_notice_batches
       SET status = 'approved', reviewed_by = $1, reviewed_at = NOW()
       WHERE id = $2 AND status = 'pending_approval'`,
      [user?.name || "operator2", batchId],
    );
    if (batchRes.rowCount === 0) {
      await client.query("ROLLBACK");
      return NextResponse.json(
        { error: "Batch not found or already reviewed" },
        { status: 404 },
      );
    }
    issued = await issueNoticeBatch(client, batchId);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Annual notice approval failed:", error);
    return NextResponse.json({ error: "Approval failed" }, { status: 500 });
  } finally {
    client.release();
  }

  // After the commit: the notices are valid and visible on the portal even if
  // an email fails, so a mail problem must not undo them.
  const emails = await sendNoticeEmails(issued);
  return NextResponse.json({ success: true, issued: issued.length, emails });
}
