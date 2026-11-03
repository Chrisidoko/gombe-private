import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getCertificateState, getDisplayedExpiry } from "@/lib/certificate";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const license = searchParams.get("license");
    const schoolId = searchParams.get("school_id");

    if (!license && !schoolId) {
      return NextResponse.json(
        { error: "License number or school is required" },
        { status: 400 },
      );
    }

    // Query database for the license or school
    const result = await pool.query(
      `SELECT id, name, school_id, state, lga, address, ownership, property_type,
              courses, license_number, license_status, license_expiry_date
       FROM schoolskano
       WHERE ${schoolId ? "school_id = $1" : "license_number = $1"}`,
      [schoolId || license],
    );

    if (result.rows.length === 0) {
      // License not found
      return NextResponse.json({ status: "invalid" });
    }

    const school = result.rows[0];

    // A number the Ministry hasn't confirmed or issued isn't a valid certificate
    const state = getCertificateState(school);
    const status = state === "none" ? "invalid" : state;

    return NextResponse.json({
      status,
      school: {
        name: school.name,
        school_id: school.school_id,
        state: school.state,
        lga: school.lga,
        address: school.address,
        ownership: school.ownership,
        property_type: school.property_type,
        license_expiry_date: getDisplayedExpiry(school),
        courses: school.courses,
      },
    });
  } catch (error) {
    console.error("License verification failed:", error);
    return NextResponse.json(
      { error: "Failed to verify license" },
      { status: 500 },
    );
  }
}
