import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getUserFromCookie } from "@/lib/auth";

export async function POST(req: Request) {
  const user = await getUserFromCookie();
  if (!user || user.role !== "inspector") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { school_id, school_name, subject, message } = await req.json();

  if (!school_id || !school_name || !subject?.trim() || !message?.trim()) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 },
    );
  }

  if (subject.trim().length > 255) {
    return NextResponse.json({ error: "Subject too long" }, { status: 400 });
  }

  try {
    const result = await pool.query(
      `INSERT INTO inspector_field_reports
        (school_id, school_name, inspector_name, inspector_email, subject, message)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, created_at`,
      [
        school_id,
        school_name,
        user.name,
        user.email,
        subject.trim(),
        message.trim(),
      ],
    );

    return NextResponse.json(
      { success: true, report: result.rows[0] },
      { status: 201 },
    );
  } catch (error) {
    console.error("Failed to submit field report:", error);
    return NextResponse.json(
      { error: "Failed to submit report" },
      { status: 500 },
    );
  }
}

export async function GET() {
  const user = await getUserFromCookie();
  if (!user || user.role !== "inspector") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await pool.query(
      `SELECT id, school_name, subject, message, status, created_at, acknowledged_at, closed_at
       FROM inspector_field_reports
       WHERE inspector_email = $1
       ORDER BY created_at DESC
       LIMIT 50`,
      [user.email],
    );

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Failed to fetch inspector reports:", error);
    return NextResponse.json(
      { error: "Failed to fetch reports" },
      { status: 500 },
    );
  }
}
