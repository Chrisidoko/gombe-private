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
      locationType,
      category,
      website,
      // Gombe general additions
      vcName,
      gsmNo,
      yearEstablished,

      // Academic Information
      modeOfOperation,
      avgFee,
      totalRevenue,
      academicSession,
      sessionStart,
      sessionEnd,
      programmes,
      courses,
      // Gombe academic additions
      totalStudents,
      enrollmentSnapshotDate,
      graduatedCount,

      // Infrastructure
      labStatus,
      libraryStatus,

      // People
      boardMembers,
      academicStaff,
      nonAcademicStaff,

      // License Information
      license_claim,
    } = data;

    // Only mark complete when every required section has its minimum fields
    const generalOk  = !!(proprietorName && contact_person && category && locationType && vcName);
    const academicOk = !!(modeOfOperation?.length && programmes?.length && totalStudents);
    const infraOk    = !!(labStatus && libraryStatus);
    const peopleOk   = !!(boardMembers?.length || academicStaff?.length);
    const licenseOk  = !!license_claim;
    const newFormStatus = (generalOk && academicOk && infraOk && peopleOk && licenseOk)
      ? "complete"
      : "pending";

    // Update the school record
    const result = await pool.query(
      `UPDATE schoolskano
       SET
        proprietor_name              = COALESCE($2,  proprietor_name),
        proprietor_nin               = COALESCE($3,  proprietor_nin),
        property_type                = COALESCE($4,  property_type),
        contact_person               = COALESCE($5,  contact_person),
        contact_person_phone         = COALESCE($6,  contact_person_phone),
        contact_person_designation   = COALESCE($7,  contact_person_designation),
        ownership                    = COALESCE($8,  ownership),
        tin                          = COALESCE($9,  tin),
        last_tax_filing              = COALESCE($10, last_tax_filing),
        address                      = COALESCE($11, address),
        lga                          = COALESCE($12, lga),
        category                     = COALESCE($13, category),
        website                      = COALESCE($14, website),
        -- Academic details of an approved school only change through an
        -- academic change request approved by the Ministry, so they're kept here
        mode_of_operation            = CASE WHEN approval_status = 'approved' THEN mode_of_operation ELSE COALESCE($15::jsonb, mode_of_operation) END,
        avg_fee                      = CASE WHEN approval_status = 'approved' THEN avg_fee ELSE COALESCE($16, avg_fee) END,
        total_revenue                = CASE WHEN approval_status = 'approved' THEN total_revenue ELSE COALESCE($17, total_revenue) END,
        academic_session             = CASE WHEN approval_status = 'approved' THEN academic_session ELSE COALESCE($18, academic_session) END,
        session_start                = CASE WHEN approval_status = 'approved' THEN session_start ELSE COALESCE($19, session_start) END,
        session_end                  = CASE WHEN approval_status = 'approved' THEN session_end ELSE COALESCE($20, session_end) END,
        programmes                   = CASE WHEN approval_status = 'approved' THEN programmes ELSE COALESCE($21::jsonb, programmes) END,
        courses                      = CASE WHEN approval_status = 'approved' THEN courses ELSE COALESCE($22::jsonb, courses) END,
        -- The school's own answer; only approval or the Certificate fee activates
        license_claim                = CASE WHEN approval_status = 'approved' THEN license_claim ELSE COALESCE($23, license_claim) END,
        vc_name                      = COALESCE($24, vc_name),
        gsm_no                       = COALESCE($25, gsm_no),
        year_established             = COALESCE($26::integer, year_established),
        total_students               = CASE WHEN approval_status = 'approved' THEN total_students ELSE COALESCE($27::integer, total_students) END,
        enrollment_snapshot_date     = CASE WHEN approval_status = 'approved' THEN enrollment_snapshot_date ELSE COALESCE($28::date, enrollment_snapshot_date) END,
        graduated_count              = CASE WHEN approval_status = 'approved' THEN graduated_count ELSE COALESCE($29::integer, graduated_count) END,
        lab_status                   = COALESCE($30, lab_status),
        library_status               = COALESCE($31, library_status),
        board_members                = COALESCE($32::jsonb, board_members),
        academic_staff               = COALESCE($33::jsonb, academic_staff),
        non_academic_staff           = COALESCE($34::jsonb, non_academic_staff),
        form_status                  = CASE WHEN approval_status = 'approved' THEN 'complete' ELSE $35 END,
        -- Sets the Business Premises rate, so it's fixed once confirmed at approval
        location_type                = CASE WHEN approval_status = 'approved' AND location_type IS NOT NULL
                                            THEN location_type ELSE COALESCE($36, location_type) END,
        updated_at                   = NOW()
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
        ["Active", "Expired", "None"].includes(license_claim) ? license_claim : null,
        vcName || null,
        gsmNo || null,
        yearEstablished || null,
        totalStudents || null,
        enrollmentSnapshotDate || null,
        graduatedCount || null,
        labStatus || null,
        libraryStatus || null,
        boardMembers != null ? JSON.stringify(boardMembers) : null,
        academicStaff != null ? JSON.stringify(academicStaff) : null,
        nonAcademicStaff != null ? JSON.stringify(nonAcademicStaff) : null,
        newFormStatus,
        locationType === "urban" || locationType === "rural" ? locationType : null,
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
