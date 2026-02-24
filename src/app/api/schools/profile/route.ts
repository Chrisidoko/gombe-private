// app/api/school/profile/route.ts
import { NextResponse } from "next/server";
import { getUserFromCookie } from "@/lib/auth";
import pool from "@/lib/db";

export async function POST(req: Request) {
  try {
    const user = await getUserFromCookie();

    if (!user || !user.institution) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const data = await req.json();

    const {
      // General Information
      proprietorName,
      contact_person,
      contact_person_phone,
      contact_person_designation,
      ownershipType,
      tin,
      lastTaxFiling,
      address,
      lga,
      category,
      website,

      // Academic Information
      modeOfOperation,
      avgFee,
      totalRevenue,
      academicSession,
      // weeksPerSemester,
      sessionStart,
      sessionEnd,
      programmes,
      courses,

      // License Information
      license_status,
      // license_number,
      // license_expiry_date,
    } = data;

    // Update the school record
    const result = await pool.query(
      `UPDATE schoolskano
       SET
       
        proprietor_name = COALESCE($2, proprietor_name),
        contact_person = COALESCE($3, contact_person),
        contact_person_phone = COALESCE($4, contact_person_phone),
        contact_person_designation = COALESCE($5, contact_person_designation),
        ownership = COALESCE($6, ownership),
        tin = COALESCE($7, tin),
        last_tax_filing = COALESCE($8, last_tax_filing),
        address = COALESCE($9, address),
        lga = COALESCE($10, lga),
        category = COALESCE($11, category),
        website = COALESCE($12, website),
        mode_of_operation = COALESCE($13::jsonb, mode_of_operation),
        avg_fee = COALESCE($14, avg_fee),
        total_revenue = COALESCE($15, total_revenue),
        academic_session = COALESCE($16, academic_session),
        session_start = COALESCE($17, session_start),
        session_end = COALESCE($18, session_end),
        programmes = COALESCE($19::jsonb, programmes),
        courses = COALESCE($20::jsonb, courses),
        license_status = COALESCE($21, license_status),
        form_status = 'complete',
        updated_at = NOW()
       WHERE school_id = $1
       RETURNING *`,
      [
        user.institution,
        proprietorName || null,
        contact_person || null,
        contact_person_phone || null,
        contact_person_designation || null,
        ownershipType || null,
        tin || null,
        lastTaxFiling || null,
        address || null,
        lga || null,
        category || null,
        website || null,
        modeOfOperation != null ? JSON.stringify(modeOfOperation) : null,
        avgFee || null,
        totalRevenue || null,
        academicSession || null,
        sessionStart || null,
        sessionEnd || null,
        programmes != null ? JSON.stringify(programmes) : null, // ✅ Convert to JSON string
        courses != null ? JSON.stringify(courses) : null, // ✅ Convert to JSON string
        license_status || null,
      ],
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { success: false, message: "School not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      school: result.rows[0],
    });
  } catch (error) {
    console.error("Error updating school profile:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

// Optional: GET endpoint to fetch current profile data
// export async function GET() {
//   try {
//     const user = await getUserFromCookie();

//     if (!user || !user.institution) {
//       return NextResponse.json(
//         { success: false, message: "Unauthorized" },
//         { status: 401 }
//       );
//     }

//     const result = await pool.query(
//       `SELECT * FROM schoolskano WHERE school_id = $1`,
//       [user.institution]
//     );

//     if (result.rowCount === 0) {
//       return NextResponse.json(
//         { success: false, message: "School not found" },
//         { status: 404 }
//       );
//     }

//     return NextResponse.json({
//       success: true,
//       school: result.rows[0],
//     });
//   } catch (error) {
//     console.error("Error fetching school profile:", error);
//     return NextResponse.json(
//       { success: false, message: "Internal server error" },
//       { status: 500 }
//     );
//   }
// }
