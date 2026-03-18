// app/api/admin/schools/route.ts
import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(50, parseInt(searchParams.get("limit") || "20"));
    const offset = (page - 1) * limit;
    const search = searchParams.get("search")?.trim() || "";
    const approval_status = searchParams.get("approval_status") || "";
    const license_status = searchParams.get("license_status") || "";
    const lga = searchParams.get("lga") || "";

    // Build WHERE clauses dynamically
    const conditions: string[] = [];
    const values: (string | number)[] = [];
    let paramIndex = 1;

    if (search) {
      conditions.push(
        `(name ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`,
      );
      values.push(`%${search}%`);
      paramIndex++;
    }

    if (approval_status) {
      conditions.push(`approval_status = $${paramIndex}`);
      values.push(approval_status);
      paramIndex++;
    }

    if (license_status) {
      conditions.push(`license_status = $${paramIndex}`);
      values.push(license_status);
      paramIndex++;
    }

    if (lga) {
      conditions.push(`lga ILIKE $${paramIndex}`);
      values.push(`%${lga}%`);
      paramIndex++;
    }

    const whereClause = conditions.length
      ? `WHERE ${conditions.join(" AND ")}`
      : "";

    // Fetch paginated results
    const dataResult = await pool.query(
      `SELECT
         school_id,
         name,
         email,
         lga,
         state,
         approval_status,
         license_status,
         license_number,
         created_at
       FROM schoolskano
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...values, limit, offset],
    );

    // Fetch total count for pagination
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM schoolskano ${whereClause}`,
      values,
    );

    // Fetch distinct LGAs for filter dropdown
    const lgaResult = await pool.query(
      `SELECT DISTINCT lga FROM schoolskano
       WHERE lga IS NOT NULL AND lga <> ''
       ORDER BY lga ASC`,
    );

    const total = Number(countResult.rows[0].count);
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      data: dataResult.rows,
      pagination: { page, limit, total, totalPages },
      lgas: lgaResult.rows.map((r) => r.lga),
    });
  } catch (error) {
    console.error("Institutions fetch failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch institutions" },
      { status: 500 },
    );
  }
}
