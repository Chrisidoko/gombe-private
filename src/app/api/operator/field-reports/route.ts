import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getUserFromCookie } from "@/lib/auth";

export async function GET() {
  const user = await getUserFromCookie();
  if (!user || user.role !== "operator") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Cleanup-on-fetch: delete closed reports whose 30-day window has elapsed
    await pool.query(
      `DELETE FROM inspector_field_reports
       WHERE delete_after IS NOT NULL AND delete_after < now()`
    );

    const result = await pool.query(
      `SELECT id, school_id, school_name, inspector_name, inspector_email,
              subject, message, status, created_at, acknowledged_at, closed_at
       FROM inspector_field_reports
       ORDER BY created_at DESC`
    );

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Failed to fetch field reports:", error);
    return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 });
  }
}
