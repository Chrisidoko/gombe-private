// app/api/dashboard/lga-revenue/route.ts
import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET() {
  try {
    const result = await pool.query(`
  SELECT
    lga,
    COUNT(*)             AS transaction_count,
    SUM(amount::numeric) AS total_revenue,
    MAX(paid_at)         AS last_payment
  FROM transactionskano
  WHERE status = 'Paid'
    AND lga IS NOT NULL
    AND lga <> ''
    AND paid_at >= DATE_TRUNC('year', NOW())
    AND paid_at < DATE_TRUNC('year', NOW()) + INTERVAL '1 year'
  GROUP BY lga
  ORDER BY total_revenue DESC
`);

    const data = result.rows.map((row) => ({
      lga: row.lga,
      transactionCount: Number(row.transaction_count),
      totalRevenue: Number(row.total_revenue),
      lastPayment: row.last_payment,
    }));

    return NextResponse.json(data);
  } catch (error) {
    console.error("LGA revenue fetch failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch LGA revenue" },
      { status: 500 },
    );
  }
}
