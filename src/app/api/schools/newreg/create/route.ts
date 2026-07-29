// app/api/schools/newreg/create/route.ts
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

    console.log("📥 Received payload:", JSON.stringify(body, null, 2));

    function sanitize<T>(value: T): T | null {
      return value === "" || value === undefined ? null : value;
    }

    // ✅ SECTION A — REGISTER SCHOOL
    if (section === "A") {
      const {
        officialName,
        cacNumber,
        proprietorName,
        address,
        lga,
        category,
        email,
        phone,
        website,
      } = body;

      console.log("🔍 Extracted values:", {
        officialName,
        cacNumber,
        proprietorName,
        address,
        lga,
        category,
        email,
        phone,
        website,
      });

      // Validate required fields
      if (!officialName || !email) {
        await client.query("ROLLBACK");
        return NextResponse.json(
          {
            success: false,
            message: "School name and email are required.",
          },
          { status: 400 },
        );
      }

      if (!lga || !findLGA(lga)) {
        await client.query("ROLLBACK");
        return NextResponse.json(
          { success: false, message: "Valid LGA is required." },
          { status: 400 },
        );
      }

      if (!category || !findCategory(category)) {
        await client.query("ROLLBACK");
        return NextResponse.json(
          { success: false, message: "Valid school category is required." },
          { status: 400 },
        );
      }

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
      const school_id = await generateSchoolID(lga, category);

      // ✅ 3. Insert new school
      const insertQuery = `
        INSERT INTO schoolskano (
          school_id,
          name,
          cac_number,
          proprietor_name,
          address,
          state,
          lga,
          category,
          email,
          phone,
          website
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
        RETURNING school_id, name, email;
      `;

      const values = [
        sanitize(school_id),
        sanitize(officialName),
        sanitize(cacNumber),
        sanitize(proprietorName),
        sanitize(address),
        "Gombe",
        sanitize(lga),
        sanitize(category),
        sanitize(email),
        sanitize(phone),
        sanitize(website),
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
      { status: 400 },
    );
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Registration failed:", error);

    return NextResponse.json(
      { success: false, error: "Server error during registration" },
      { status: 500 },
    );
  } finally {
    client.release();
  }
}
