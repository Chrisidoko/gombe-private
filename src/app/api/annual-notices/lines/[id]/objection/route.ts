// A school objects to a notice line within its 30 days, under section 90(1)
// of the Gombe Revenue (Codification and Consolidated) Law 2021.
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { requireSchoolAccess } from "@/lib/apiAuth";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const lineId = parseInt(id, 10);
  if (isNaN(lineId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  try {
    const { rows } = await pool.query(
      `SELECT l.status, l.due_date >= CURRENT_DATE AS in_window, n.school_id
       FROM annual_notice_lines l
       JOIN annual_notices n ON n.id = l.notice_id
       WHERE l.id = $1`,
      [lineId],
    );
    const line = rows[0];
    if (!line) {
      return NextResponse.json({ error: "Line not found" }, { status: 404 });
    }

    const denied = await requireSchoolAccess(line.school_id, []);
    if (denied) return denied;

    if (line.status !== "unpaid") {
      return NextResponse.json(
        { error: "Only an unpaid item can be objected to" },
        { status: 400 },
      );
    }
    if (!line.in_window) {
      return NextResponse.json(
        { error: "The 30 days to object to this item have passed" },
        { status: 400 },
      );
    }

    const { grounds } = await req.json();
    if (!grounds?.trim()) {
      return NextResponse.json(
        { error: "State your grounds of objection" },
        { status: 400 },
      );
    }

    const result = await pool.query(
      `INSERT INTO notice_objections (line_id, school_id, grounds)
       VALUES ($1, $2, $3)
       ON CONFLICT (line_id) WHERE status = 'pending' DO NOTHING
       RETURNING id`,
      [lineId, line.school_id, grounds.trim()],
    );
    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: "An objection to this item is already under review" },
        { status: 409 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Notice objection failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
