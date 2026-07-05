import { NextResponse } from "next/server";
import { getUserFromCookie } from "@/lib/auth";
import pool from "@/lib/db";

// GET — return the school's current pending change request (if any)
export async function GET() {
  try {
    const user = await getUserFromCookie();
    if (!user?.institution) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const result = await pool.query(
      `SELECT id, status, current_snapshot, requested_changes, rejection_reason, created_at
       FROM academic_change_requests
       WHERE school_id = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [user.institution],
    );

    return NextResponse.json({ request: result.rows[0] ?? null });
  } catch (error) {
    console.error("GET academic-change-request error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}

// POST — create (or replace) a pending change request
export async function POST(req: Request) {
  try {
    const user = await getUserFromCookie();
    if (!user?.institution) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { requested_changes } = await req.json();

    // Fetch the current approved academic data to store as snapshot
    const schoolResult = await pool.query(
      `SELECT mode_of_operation, avg_fee, total_revenue, academic_session,
              session_start, session_end, programmes, courses
       FROM schoolskano
       WHERE school_id = $1 AND approval_status = 'approved'`,
      [user.institution],
    );

    if (schoolResult.rowCount === 0) {
      return NextResponse.json(
        { message: "School not found or not yet approved" },
        { status: 404 },
      );
    }

    const current = schoolResult.rows[0];
    const current_snapshot = {
      mode_of_operation: current.mode_of_operation ?? [],
      avg_fee: current.avg_fee ?? "",
      total_revenue: current.total_revenue ?? "",
      academic_session: current.academic_session ?? "",
      session_start: current.session_start ?? "",
      session_end: current.session_end ?? "",
      programmes: current.programmes ?? [],
      courses: current.courses ?? [],
      total_students: current.total_students?.toString() ?? "",
      enrollment_snapshot_date: current.enrollment_snapshot_date ?? "",
      graduated_count: current.graduated_count?.toString() ?? "",
    };

    // Replace any existing pending request for this school
    await pool.query(
      `DELETE FROM academic_change_requests
       WHERE school_id = $1 AND status = 'pending'`,
      [user.institution],
    );

    const insertResult = await pool.query(
      `INSERT INTO academic_change_requests
         (school_id, status, current_snapshot, requested_changes)
       VALUES ($1, 'pending', $2::jsonb, $3::jsonb)
       RETURNING id, status, current_snapshot, requested_changes, created_at`,
      [
        user.institution,
        JSON.stringify(current_snapshot),
        JSON.stringify(requested_changes),
      ],
    );

    return NextResponse.json({ request: insertResult.rows[0] });
  } catch (error) {
    console.error("POST academic-change-request error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}

// DELETE — withdraw the pending request
export async function DELETE() {
  try {
    const user = await getUserFromCookie();
    if (!user?.institution) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await pool.query(
      `DELETE FROM academic_change_requests
       WHERE school_id = $1 AND status = 'pending'`,
      [user.institution],
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE academic-change-request error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
