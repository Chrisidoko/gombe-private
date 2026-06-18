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
      conditions.push(`updated_at >= $${paramIndex}::date`);
      values.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      conditions.push(`updated_at <= $${paramIndex}::date + interval '1 day'`);
      values.push(endDate);
      paramIndex++;
    }

    // Optional status filter
    if (status) {
      conditions.push(`status = $${paramIndex}`);
      values.push(status);
      paramIndex++;
    }

    // Optional school filter
    if (schoolId) {
      conditions.push(`school_id = $${paramIndex}`);
      values.push(schoolId);
      paramIndex++;
    }

    // Optional LGA filter
    if (lga) {
      conditions.push(`lga = $${paramIndex}`);
      values.push(lga);
      paramIndex++;
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM transactionskano
      ${whereClause}
    `;
    const countResult = await pool.query(countQuery, values);
    const totalRecords = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(totalRecords / perPage);

    // Get paginated transactions
    const dataQuery = `
      SELECT
        id,
        school_id,
        lga,
        reference,
        amount,
        status,
        payment_item,
        invoice_number,
        updated_at,
        created_at
      FROM transactionskano
      ${whereClause}
      ORDER BY updated_at DESC
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
