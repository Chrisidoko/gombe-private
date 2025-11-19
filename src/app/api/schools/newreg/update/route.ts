import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function POST(req: Request) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const body = await req.json();
    const { section, school_id } = body;

    if (!school_id) {
      return NextResponse.json(
        { success: false, message: "school_id is required" },
        { status: 400 }
      );
    }

    function sanitize<T>(value: T): T | null {
      return value === "" || value === undefined ? null : value;
    }

    // ✅ Check if school exists
    const checkQuery = `SELECT school_id FROM schoolskano WHERE school_id = $1`;
    const check = await client.query(checkQuery, [school_id]);

    if (check.rows.length === 0) {
      await client.query("ROLLBACK");
      return NextResponse.json(
        { success: false, message: "School not found" },
        { status: 404 }
      );
    }

    let updateQuery = "";
    let values: (string | null)[] = [];

    // ✅ SECTION B — Payment Gateway Info
    if (section === "B") {
      const {
        contact_person,
        contact_person_designation,
        contact_person_phone,
        ownershipType,
        category,
      } = body;

      updateQuery = `
        UPDATE schoolskano
        SET contact_person = $1,
            contact_person_designation = $2,
            contact_person_phone = $3,
            ownershipType = $4,
            category = $5,
        WHERE school_id = $6
      `;

      values = [
        sanitize(contact_person),
        sanitize(contact_person_designation),
        sanitize(contact_person_phone),
        sanitize(ownershipType),
        sanitize(category),
        sanitize(school_id),
      ];
    }

    // ✅ SECTION C — Documents
    else if (section === "C") {
      const { email, phone, website } = body;

      updateQuery = `
        UPDATE schoolskano
        SET email = $1,
            phone = $2,
            website = $3
        WHERE school_id = $4
      `;

      values = [
        sanitize(email),
        sanitize(phone),
        sanitize(website),
        sanitize(school_id),
      ];
    }

    // ❗ Invalid section
    else {
      await client.query("ROLLBACK");
      return NextResponse.json(
        { success: false, message: "Invalid section" },
        { status: 400 }
      );
    }

    await client.query(updateQuery, values);
    await client.query("COMMIT");

    return NextResponse.json({
      success: true,
      message: `Section ${section} saved successfully`,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Update failed:", error);
    return NextResponse.json(
      { success: false, message: "Database update failed" },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
