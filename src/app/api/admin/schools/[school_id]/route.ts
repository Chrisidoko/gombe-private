// app/api/admin/schools/[school_id]/route.ts
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getUserFromCookie } from "@/lib/auth";
import { requireRole } from "@/lib/apiAuth";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ school_id: string }> }, // ← Promise type
) {
  const denied = await requireRole("CBS_Admin");
  if (denied) return denied;

  try {
    const { school_id } = await params;
    const decodedId = decodeURIComponent(school_id);

    const result = await pool.query(
      `SELECT
        school_id, tin, name, email, contact_person_phone, contact_person, contact_person_designation, address,
        lga, state, ownership, proprietor_name, proprietor_nin, property_type, website,
        approval_status, license_status,
        license_number, last_license_renewal, license_expiry_date,
        form_status, programmes, courses, mode_of_operation,
        avg_fee, total_revenue, academic_session, category,
        session_start, session_end,
        enumerator_name,
        assigned_inspector_name, assigned_inspector_email,
        location_type, premises_category,
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

// Corrects the details behind a school's Business Premises rate after approval
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ school_id: string }> },
) {
  const user = await getUserFromCookie();
  if (!user || user.institution !== "CBS_Admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { school_id } = await params;
    const { location_type, premises_category } = await req.json();

    if (
      !["urban", "rural"].includes(location_type) ||
      !["A", "B", "C"].includes(premises_category)
    ) {
      return NextResponse.json(
        { error: "Location and premises category are required" },
        { status: 400 },
      );
    }

    const result = await pool.query(
      `UPDATE schoolskano
       SET location_type = $2, premises_category = $3
       WHERE school_id = $1`,
      [decodeURIComponent(school_id), location_type, premises_category],
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: "Institution not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Premises details update failed:", error);
    return NextResponse.json(
      { error: "Failed to update premises details" },
      { status: 500 },
    );
  }
}
