import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET() {
  try {
    const result = await pool.query(
      `SELECT id, school_id, name, email, license_number, created_at
       FROM schoolskano
       WHERE approval_status = 'unapproved'
       ORDER BY created_at DESC`
    );

    return NextResponse.json({ schools: result.rows });
  } catch (error) {
    console.error("❌ Failed to fetch unapproved schools:", error);
    return NextResponse.json({ schools: [], error }, { status: 500 });
  }
}
