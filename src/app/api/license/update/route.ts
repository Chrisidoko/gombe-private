// app/api/license/update/route.ts

import { NextResponse } from "next/server";
import pool from "@/lib/db";

// Generates the next sequential certificate number e.g. MOE/H/0001
async function generateLicenseNumber(): Promise<string> {
  const prefix = "MOE/H";

  // Find the highest existing number with this prefix
  const result = await pool.query(
    `SELECT license_number 
     FROM schoolskano 
     WHERE license_number LIKE $1
     ORDER BY license_number DESC
     LIMIT 1`,
    [`${prefix}/%`],
  );

  let nextNumber = 1; // default start

  if (result.rows.length > 0) {
    const last = result.rows[0].license_number as string;
    // Extract the numeric part after the last "/"  e.g. "MOE/H/0042" → 42
    const parts = last.split("/");
    const lastNum = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(lastNum)) {
      nextNumber = lastNum + 1;
    }
  }

  // Pad to 4 digits: 1 → "0001"
  const padded = String(nextNumber).padStart(4, "0");
  return `${prefix}/${padded}`;
}

// Verify a generated number doesn't already exist (safety net)
async function isNumberTaken(license_number: string): Promise<boolean> {
  const check = await pool.query(
    "SELECT 1 FROM schoolskano WHERE license_number = $1",
    [license_number],
  );
  return check.rows.length > 0;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { school_id } = body;

    if (!school_id) {
      return NextResponse.json(
        { error: "school_id is required" },
        { status: 400 },
      );
    }

    // Check if this school already has a certificate number
    const existing = await pool.query(
      "SELECT license_number FROM schoolskano WHERE school_id = $1",
      [school_id],
    );

    if (existing.rows.length === 0) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    // If school already has a number, reuse it — otherwise generate a new one
    let license_number = existing.rows[0].license_number;

    if (!license_number) {
      license_number = await generateLicenseNumber();

      // Safety net
      if (await isNumberTaken(license_number)) {
        const parts = license_number.split("/");
        const num = parseInt(parts[parts.length - 1], 10) + 1;
        license_number = `MOE/H/${String(num).padStart(4, "0")}`;
      }
    }

    const issue_date = new Date();
    const expiry_date = new Date();
    expiry_date.setFullYear(expiry_date.getFullYear() + 1);

    const result = await pool.query(
      `UPDATE schoolskano 
       SET 
         license_number       = $1,
         last_license_renewal = $2,
         license_expiry_date  = $3,
         license_status       = $4
       WHERE school_id = $5
       RETURNING id, name, school_id, license_number, last_license_renewal, license_expiry_date, license_status`,
      [
        license_number,
        issue_date.toISOString(),
        expiry_date.toISOString(),
        "Active",
        school_id,
      ],
    );

    const updatedSchool = result.rows[0];

    return NextResponse.json({
      success: true,
      message: "Certificate number assigned successfully",
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
