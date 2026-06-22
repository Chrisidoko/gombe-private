// app/api/transactions/all/route.ts
import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    // Get query parameters
    const perPage = parseInt(searchParams.get("per_page") || "10");
    const page = parseInt(searchParams.get("page") || "1");
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");
    const status = searchParams.get("status"); // Optional: filter by status
    const schoolId = searchParams.get("school_id"); // Optional: filter by school
    const lga = searchParams.get("lga"); // Optional: filter by LGA

    // Calculate offset for pagination
    const offset = (page - 1) * perPage;

    // Build WHERE conditions
    const conditions: string[] = [];
    const values: (string | number)[] = [];
    let paramIndex = 1;

    // Date range filter
    if (startDate) {
      conditions.push(`t.updated_at >= $${paramIndex}::date`);
      values.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      conditions.push(`t.updated_at <= $${paramIndex}::date + interval '1 day'`);
      values.push(endDate);
      paramIndex++;
    }

    // Optional status filter
    if (status) {
      conditions.push(`t.status = $${paramIndex}`);
      values.push(status);
      paramIndex++;
    }

    // Optional school filter
    if (schoolId) {
      conditions.push(`t.school_id = $${paramIndex}`);
      values.push(schoolId);
      paramIndex++;
    }

    // Optional LGA filter
    if (lga) {
      conditions.push(`t.lga = $${paramIndex}`);
      values.push(lga);
      paramIndex++;
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM transactionskano t
      ${whereClause}
    `;
    const countResult = await pool.query(countQuery, values);
    const totalRecords = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(totalRecords / perPage);

    // Get paginated transactions — LEFT JOIN brings school name for export
    const dataQuery = `
      SELECT
        t.id,
        t.school_id,
        s.name AS school_name,
        t.lga,
        t.reference,
        t.amount,
        t.status,
        t.payment_item,
        t.invoice_number,
        t.updated_at,
        t.created_at
      FROM transactionskano t
      LEFT JOIN schoolskano s ON s.school_id = t.school_id
      ${whereClause}
      ORDER BY t.updated_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    values.push(perPage, offset);
    const { rows } = await pool.query(dataQuery, values);

    return NextResponse.json({
      success: true,
      transactions: rows,
      pagination: {
        total: totalRecords,
        totalPages,
        currentPage: page,
        perPage,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching all transactions:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch transactions" },
      { status: 500 }
    );
  }
}
