// app/api/license/update/route.ts

import { NextResponse } from "next/server";
import pool from "@/lib/db";

// Helper function to generate a unique license number
function generateLicenseNumber(): string {
  const prefix = "KD"; // Kaduna state prefix
  const year = new Date().getFullYear();
  const random = Math.floor(100000 + Math.random() * 900000); // 6-digit random number
  return `${prefix}-${year}-${random}`;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { school_id, bill_reference } = body;

    if (!school_id) {
      return NextResponse.json(
        { error: "school_id is required" },
        { status: 400 },
      );
    }

    // Generate license information
    const license_number = generateLicenseNumber();
    const issue_date = new Date(); // Current date
    const expiry_date = new Date();
    expiry_date.setFullYear(expiry_date.getFullYear() + 1); // One year from now

    // Update the database
    const result = await pool.query(
      `UPDATE schoolskano 
       SET 
         license_number = $1,
         last_license_renewal = $2,
         license_expiry_date = $3,
         license_status = $4
       WHERE school_id = $5
       RETURNING id, name, school_id, license_number, last_license_renewal, license_expiry_date, license_status`,
      [
        license_number,
        issue_date.toISOString(),
        expiry_date.toISOString(),
        "Valid", // Update license status to active
        school_id,
      ],
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    const updatedSchool = result.rows[0];

    return NextResponse.json({
      success: true,
      message: "License updated successfully",
      data: {
        school_id: updatedSchool.school_id,
        school_name: updatedSchool.name,
        license_number: updatedSchool.license_number,
        issue_date: updatedSchool.last_license_renewal,
        expiry_date: updatedSchool.license_expiry_date,
        license_status: updatedSchool.license_status,
      },
    });
  } catch (error) {
    console.error("License update failed:", error);
    return NextResponse.json(
      { error: "Failed to update license" },
      { status: 500 },
    );
  }
}
