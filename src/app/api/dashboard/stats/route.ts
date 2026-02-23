import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET() {
  try {
    const result = await pool.query(`
      SELECT
        COUNT(*)                                            AS total_schools,
        COUNT(*) FILTER (WHERE approval_status = 'approved') AS active_schools,
        COUNT(*) FILTER (WHERE approval_status = 'unapproved')  AS unapproved_approvals,
        COUNT(*) FILTER (WHERE category = 'University')  AS total_universities,
        COUNT(*) FILTER (WHERE category = 'Polytechnic')  AS total_polytechnics,
        COUNT(*) FILTER (WHERE category = 'College of Education')  AS total_colleges_of_education,
        COUNT(*) FILTER (WHERE category = 'School of Health Technology')  AS total_schools_of_health_technology,  
        COUNT(license_number) FILTER (WHERE license_number IS NOT NULL AND license_number <> '' AND approval_status = 'approved') AS total_licenses
      FROM schoolskano;
    `);

    const row = result.rows[0];

    return NextResponse.json({
      totalSchools: Number(row.total_schools),
      activeSchools: Number(row.active_schools),
      pendingApprovals: Number(row.unapproved_approvals),
      totalUniversities: Number(row.total_universities),
      totalPolytechnics: Number(row.total_polytechnics),
      totalCollegesOfEducation: Number(row.total_colleges_of_education),
      totalSchoolsOfHealthTechnology: Number(
        row.total_schools_of_health_technology,
      ),
      totalLicenses: Number(row.total_licenses),
    });
  } catch (error) {
    console.error("Stats query failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch school stats" },
      { status: 500 },
    );
  }
}
