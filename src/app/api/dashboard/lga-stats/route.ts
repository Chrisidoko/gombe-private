// app/api/dashboard/lga-stats/route.ts

import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET() {
  try {
    const result = await pool.query(`
      SELECT 
        lga,
        COUNT(*) AS count
      FROM schoolskano
      WHERE lga IS NOT NULL AND lga <> ''
      GROUP BY lga
      ORDER BY count DESC
    `);

    const data = result.rows.map((row) => ({
      lga: row.lga,
      count: Number(row.count),
    }));

    return NextResponse.json(data);
  } catch (error) {
    console.error("LGA stats query failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch LGA stats" },
      { status: 500 },
    );
  }
}
