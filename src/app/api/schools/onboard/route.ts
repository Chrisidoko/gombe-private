// i dont think i use this one for anything i will check later
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { generateSchoolID } from "@/lib/generateSchoolID";
import { findLGA, findCategory } from "@/lib/schoolIdConstants";

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
        lga,
        category,
      } = body;

      if (!lga || !findLGA(lga) || !category || !findCategory(category)) {
        await client.query("ROLLBACK");
        return NextResponse.json(
          { success: false, error: "Valid LGA and school category are required" },
          { status: 400 },
        );
      }

      const school_id = await generateSchoolID(lga, category);

      const query = `
        INSERT INTO schoolskano (
          school_id,
          name,
          registered_for_tax,
          tin,
          last_tax_filing,
          license_number,
          last_license_renewal,
          lga,
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
        sanitize(lga),
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
