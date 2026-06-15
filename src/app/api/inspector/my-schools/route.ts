import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getUserFromCookie } from "@/lib/auth";

export async function GET() {
  const user = await getUserFromCookie();
  if (!user || user.role !== "inspector") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await pool.query(
      `SELECT school_id, name, email, form_status, approval_status, created_at
       FROM schoolskano
       WHERE enumerator_name = $1
       ORDER BY created_at DESC`,
      [user.name],
    );

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Failed to fetch inspector schools:", error);
    return NextResponse.json(
      { error: "Failed to fetch schools" },
      { status: 500 },
    );
  }
}
