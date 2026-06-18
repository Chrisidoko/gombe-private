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
      proprietorNin,
      propertyType,
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
        proprietor_nin = COALESCE($3, proprietor_nin),
        property_type = COALESCE($4, property_type),
        contact_person = COALESCE($5, contact_person),
        contact_person_phone = COALESCE($6, contact_person_phone),
        contact_person_designation = COALESCE($7, contact_person_designation),
        ownership = COALESCE($8, ownership),
        tin = COALESCE($9, tin),
        last_tax_filing = COALESCE($10, last_tax_filing),
        address = COALESCE($11, address),
        lga = COALESCE($12, lga),
        category = COALESCE($13, category),
        website = COALESCE($14, website),
        mode_of_operation = COALESCE($15::jsonb, mode_of_operation),
        avg_fee = COALESCE($16, avg_fee),
        total_revenue = COALESCE($17, total_revenue),
        academic_session = COALESCE($18, academic_session),
        session_start = COALESCE($19, session_start),
        session_end = COALESCE($20, session_end),
        programmes = COALESCE($21::jsonb, programmes),
        courses = COALESCE($22::jsonb, courses),
        license_status = COALESCE($23, license_status),
        form_status = 'complete',
        updated_at = NOW()
       WHERE school_id = $1
       RETURNING *`,
      [
        user.institution,
        proprietorName || null,
        proprietorNin || null,
        propertyType || null,
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
        programmes != null ? JSON.stringify(programmes) : null,
        courses != null ? JSON.stringify(courses) : null,
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
