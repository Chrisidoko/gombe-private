import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { generateSchoolID } from "@/lib/generateSchoolID";

export async function POST(req: Request) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const body = await req.json();
    const { section } = body;

    function sanitize<T>(value: T): T | null {
      return value === "" || value === undefined ? null : value;
    }

    // ✅ SECTION A — REGISTER SCHOOL
    if (section === "A") {
      const {
        officialName,
        registeredForTax,
        tin,
        lastTaxFiling,
        licenseNumber,
        lastLicenseRenewal,
        licenseExpiry,
        category,
      } = body;

      // // ✅ 1. Check if school already exists using license number
      // const checkQuery = `
      //   SELECT school_id FROM schoolskano WHERE license_number = $1 LIMIT 1;
      // `;
      // const checkResult = await client.query(checkQuery, [
      //   sanitize(licenseNumber),
      // ]);

      // if (checkResult.rows.length > 0) {
      //   // School already exists
      //   await client.query("ROLLBACK");
      //   return NextResponse.json(
      //     {
      //       success: false,
      //       message: "This school is already registered.",
      //       school_id: checkResult.rows[0].school_id,
      //     },
      //     { status: 400 }
      //   );
      // }

      // ✅ 2. Generate school ID
      const school_id = await generateSchoolID(officialName);

      // ✅ 3. Insert new school
      const insertQuery = `
        INSERT INTO schoolskano (
          school_id,
          name,
          registered_for_tax,
          tin,
          last_tax_filing,
          license_number,
          last_license_renewal,
          license_expiry_date,
          category
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
        RETURNING school_id;
      `;

      const values = [
        sanitize(school_id),
        sanitize(officialName),
        sanitize(registeredForTax),
        sanitize(tin),
        sanitize(lastTaxFiling),
        sanitize(licenseNumber),
        sanitize(lastLicenseRenewal),
        sanitize(licenseExpiry),
        sanitize(category),
      ];

      const result = await client.query(insertQuery, values);
      await client.query("COMMIT");

      return NextResponse.json({
        success: true,
        school_id: result.rows[0].school_id,
        message: "School successfully registered.",
      });
    }

    return NextResponse.json(
      { success: false, message: "Invalid section" },
      { status: 400 }
    );
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Registration failed:", error);

    return NextResponse.json(
      { success: false, error: "Server error during registration" },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
