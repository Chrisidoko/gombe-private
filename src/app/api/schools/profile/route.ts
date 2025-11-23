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
        { status: 401 }
      );
    }

    const data = await req.json();

    const {
      // General Information

      proprietorName,
      chairmanName,
      ownershipType,
      tin,
      lastTaxFiling,
      address,
      lga,

      // Academic Information
      modeOfOperation,
      avgFee,
      totalRevenue,
      // academicSession,
      // weeksPerSemester,
      // sessionStart,
      // sessionEnd,
      programmes,

      // License Information
      licenceStatus,
      prevAmount,
      prevDate,
    } = data;

    // Update the school record
    const result = await pool.query(
      `UPDATE schoolskano
       SET
       
        proprietor_name = COALESCE($2, proprietor_name),
        chairman_name = COALESCE($3, chairman_name),
        ownership = COALESCE($4, ownership),
        tin = COALESCE($5, tin),
        last_tax_filing = COALESCE($6, last_tax_filing),
        address = COALESCE($7, address),
        lga = COALESCE($8, lga),
        mode_of_operation = COALESCE($9::jsonb, mode_of_operation),
        avg_fee = COALESCE($10, avg_fee),
        total_revenue = COALESCE($11, total_revenue),
        programmes = COALESCE($12::jsonb, programmes),
        licence_status = COALESCE($13, licence_status),
        prev_amount = COALESCE($14, prev_amount),
        prev_licence_date = COALESCE($15, prev_licence_date),
        form_status = 'completed',
        updated_at = NOW()
       WHERE school_id = $1
       RETURNING *`,
      [
        user.institution,
        proprietorName || null,
        chairmanName || null,
        ownershipType || null,
        tin || null,
        lastTaxFiling || null,
        address || null,
        lga || null,
        JSON.stringify(modeOfOperation || []), // ✅ Convert to JSON string
        avgFee || null,
        totalRevenue || null,
        JSON.stringify(programmes || []), // ✅ Convert to JSON string
        licenceStatus || null,
        prevAmount || null,
        prevDate || null,
      ]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { success: false, message: "School not found" },
        { status: 404 }
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
      { status: 500 }
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
