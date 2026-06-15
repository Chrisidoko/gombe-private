// app/api/admin/schools/[school_id]/route.ts
import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ school_id: string }> }, // ← Promise type
) {
  try {
    const { school_id } = await params;
    const decodedId = decodeURIComponent(school_id);

    const result = await pool.query(
      `SELECT
        school_id, tin,  name, email, contact_person_phone, contact_person, contact_person_designation, address,
        lga, state, ownership, proprietor_name, website,
        approval_status, license_status,
        license_number, last_license_renewal, license_expiry_date,
        form_status, programmes, courses, mode_of_operation,
        avg_fee, total_revenue, academic_session, category,
        session_start, session_end,
        enumerator_name,
        created_at, updated_at
       FROM schoolskano
       WHERE school_id = $1`,
      [decodedId],
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Institution not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error("Institution detail fetch failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch institution" },
      { status: 500 },
    );
  }
}
