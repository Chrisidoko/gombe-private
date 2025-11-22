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
      const { paymentGateway, currentGateway, partnerBanks, paymentReports } =
        body;

      updateQuery = `
        UPDATE schoolskano
        SET payment_gateway = $1,
            current_gateway = $2,
            partner_banks = $3,
            payment_reports = $4
        WHERE school_id = $5
      `;

      values = [
        sanitize(paymentGateway),
        sanitize(currentGateway),
        sanitize(partnerBanks),
        sanitize(paymentReports),
        sanitize(school_id),
      ];
    }

    // ✅ SECTION C — Portal + API Readiness
    else if (section === "C") {
      const {
        schoolportal,
        schoolPortalVendor,
        readyForApi,
        email,
        phone,
        website,
        academicSession,
        weeksPerSemester,
        sessionStart,
        sessionEnd,
      } = body;

      updateQuery = `
        UPDATE schoolskano
        SET school_portal = $1,
            school_portal_vendor = $2,
            ready_for_api = $3,
            email = $4,
            phone = $5,
            website = $6,
            academic_session = COALESCE($7, academic_session),
            weeks_per_semester = COALESCE($8, weeks_per_semester),
            session_start = COALESCE($9, session_start),
            session_end = COALESCE($10, session_end)
        WHERE school_id = $11
      `;

      values = [
        sanitize(schoolportal),
        sanitize(schoolPortalVendor),
        sanitize(readyForApi),
        sanitize(email),
        sanitize(phone),
        sanitize(website),
        sanitize(academicSession),
        sanitize(weeksPerSemester),
        sanitize(sessionStart),
        sanitize(sessionEnd),
        sanitize(school_id),
      ];
    }

    // ✅ SECTION D — Contact Info
    else if (section === "D") {
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
