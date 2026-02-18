import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET() {
  try {
    const result = await pool.query(`
      SELECT
        COUNT(*)                                            AS total_schools,
        COUNT(*) FILTER (WHERE approval_status = 'approved') AS active_schools,
        COUNT(*) FILTER (WHERE approval_status = 'unapproved')  AS unapproved_approvals,
        COUNT(license_number) FILTER (WHERE license_number IS NOT NULL AND license_number <> '' AND approval_status = 'approved') AS total_licenses
      FROM schoolskano;
    `);

    const row = result.rows[0];

    return NextResponse.json({
      totalSchools: Number(row.total_schools),
      activeSchools: Number(row.active_schools),
      pendingApprovals: Number(row.unapproved_approvals),
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
