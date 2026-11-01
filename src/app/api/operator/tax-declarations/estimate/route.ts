// Operator 1 enters an estimate for a line with no declaration after the
// notice's due date. It goes to Operator 2 like a recommended declaration.
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getUserFromCookie } from "@/lib/auth";
import { requireRole } from "@/lib/apiAuth";

export async function POST(req: Request) {
  const denied = await requireRole("CBS_Operator");
  if (denied) return denied;

  const user = await getUserFromCookie();
  const { line_id, amount, note } = await req.json();

  const parsedAmount = Number(amount);
  if (!Number.isInteger(line_id) || !Number.isFinite(parsedAmount) || parsedAmount <= 0) {
    return NextResponse.json({ error: "Invalid line or amount" }, { status: 400 });
  }
  if (!note?.trim()) {
    return NextResponse.json(
      { error: "Explain how the estimate was reached" },
      { status: 400 },
    );
  }

  try {
    const { rows } = await pool.query(
      `SELECT n.school_id
       FROM annual_notice_lines l
       JOIN annual_notices n ON n.id = l.notice_id
       WHERE l.id = $1 AND l.status = 'awaiting_declaration' AND n.due_date < CURRENT_DATE`,
      [line_id],
    );
    if (rows.length === 0) {
      return NextResponse.json(
        { error: "This item isn't open for an estimate" },
        { status: 400 },
      );
    }

    const name = user?.name || "operator";
    const result = await pool.query(
      `INSERT INTO tax_declarations
         (line_id, school_id, amount, note, source, status, submitted_by, recommended_by, recommended_at)
       VALUES ($1, $2, $3, $4, 'operator_estimate', 'recommended', $5, $5, NOW())
       ON CONFLICT (line_id) WHERE status <> 'rejected' DO NOTHING
       RETURNING id`,
      [line_id, rows[0].school_id, parsedAmount, note.trim(), name],
    );
    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: "A declaration for this item is already under review" },
        { status: 409 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Tax estimate failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
