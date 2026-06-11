import { NextResponse } from "next/server";
import pool from "@/lib/db";

// GET — list all pending academic change requests, newest first
export async function GET() {
  try {
    const result = await pool.query(
      `SELECT acr.id, acr.school_id, acr.status,
              acr.current_snapshot, acr.requested_changes,
              acr.rejection_reason, acr.created_at,
              s.name AS school_name, s.email AS school_email
       FROM academic_change_requests acr
       JOIN schoolskano s ON s.school_id = acr.school_id
       WHERE acr.status = 'pending'
       ORDER BY acr.created_at DESC`,
    );

    return NextResponse.json({ requests: result.rows });
  } catch (error) {
    console.error("GET admin/academic-change-requests error:", error);
    return NextResponse.json(
      { error: "Failed to fetch change requests" },
      { status: 500 },
    );
  }
}
