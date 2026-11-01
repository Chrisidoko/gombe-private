// Operator 2 decides an objection. Upholding it sets a revised amount; a
// dismissal leaves the line as it was and it can be paid again.
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getUserFromCookie } from "@/lib/auth";
import { requireRole } from "@/lib/apiAuth";
import { notifySchool } from "@/lib/annualNotices";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await requireRole("CBS_Operator2");
  if (denied) return denied;

  const user = await getUserFromCookie();
  const { id } = await params;
  const { action, revised_amount, note } = await req.json();

  if (action !== "uphold" && action !== "dismiss") {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }
  if (!note?.trim()) {
    return NextResponse.json({ error: "Record the decision" }, { status: 400 });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query(
      `SELECT o.line_id, o.school_id, l.amount
       FROM notice_objections o
       JOIN annual_notice_lines l ON l.id = o.line_id
       WHERE o.id = $1 AND o.status = 'pending' AND l.status = 'unpaid'
       FOR UPDATE OF o`,
      [id],
    );
    if (rows.length === 0) {
      await client.query("ROLLBACK");
      return NextResponse.json(
        { error: "Objection not found or already decided" },
        { status: 404 },
      );
    }
    const objection = rows[0];

    const revised = Number(revised_amount);
    if (
      action === "uphold" &&
      (revised_amount === "" ||
        !Number.isFinite(revised) ||
        revised < 0 ||
        revised >= Number(objection.amount))
    ) {
      await client.query("ROLLBACK");
      return NextResponse.json(
        { error: "The revised amount must be lower than the current amount" },
        { status: 400 },
      );
    }

    await client.query(
      `UPDATE notice_objections
       SET status = $1, previous_amount = $2, revised_amount = $3,
           decision_note = $4, decided_by = $5, decided_at = NOW()
       WHERE id = $6`,
      [
        action === "uphold" ? "upheld" : "dismissed",
        objection.amount,
        action === "uphold" ? revised : null,
        note.trim(),
        user?.name || "operator2",
        id,
      ],
    );

    // A new amount needs a new gateway reference, so both are cleared
    if (action === "uphold") {
      await client.query(
        `UPDATE annual_notice_lines
         SET amount = $1, status = $2, reference = NULL, credo_reference = NULL
         WHERE id = $3`,
        [revised, revised === 0 ? "waived" : "unpaid", objection.line_id],
      );
    }
    await client.query("COMMIT");

    await notifySchool(
      objection.school_id,
      "Objection decided",
      action === "uphold"
        ? `Your objection was upheld. The amount is now ₦${revised.toLocaleString()}. ${note.trim()}`
        : `Your objection was not upheld. ${note.trim()}`,
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Objection decision failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  } finally {
    client.release();
  }
}
