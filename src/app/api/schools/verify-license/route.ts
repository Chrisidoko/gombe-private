import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const license = searchParams.get("license");

    if (!license) {
      return NextResponse.json(
        { error: "License number is required" },
        { status: 400 },
      );
    }

    // Query database for the license
    const result = await pool.query(
      `SELECT id, name, school_id, state, lga, address, ownership, property_type,
              courses, license_number, license_status, license_expiry_date
       FROM schoolskano
       WHERE license_number = $1`,
      [license],
    );

    if (result.rows.length === 0) {
      // License not found
      return NextResponse.json({ status: "invalid" });
    }

    const school = result.rows[0];

    // Determine validity
    const today = new Date();
    const expiryDate = new Date(school.license_expiry_date);
    let status = "valid";

    if (expiryDate < today) {
      status = "expired";
    } else if (school.license_status === "expired") {
      status = "expired";
    }

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
        license_expiry_date: school.license_expiry_date,
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
