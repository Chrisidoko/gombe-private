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
      return value === "" ? null : value;
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
        category,
      } = body;

      const school_id = await generateSchoolID(officialName);

      const query = `
        INSERT INTO schoolskano (
          school_id,
          name,
          registered_for_tax,
          tin,
          last_tax_filing,
          license_number,
          last_license_renewal,
          category
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
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
        sanitize(category), // since category is now SINGLE VALUE
      ];

      const result = await client.query(query, values);
      console.log("✅ Section A saved:", result.rows[0]);
    }

    await client.query("COMMIT");
    return NextResponse.json({ success: true });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Save failed:", error);
    return NextResponse.json({ success: false, error }, { status: 500 });
  } finally {
    client.release();
  }
}
