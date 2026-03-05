// app/api/finance/summaries/route.ts
import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET() {
  try {
    const result = await pool.query(`
      SELECT
        COUNT(*) FILTER (
          WHERE status = 'Paid'
          AND paid_at >= CURRENT_DATE
          AND paid_at < CURRENT_DATE + INTERVAL '1 day'
        ) AS today_count,

        COALESCE(SUM(amount) FILTER (
          WHERE status = 'Paid'
          AND paid_at >= CURRENT_DATE
          AND paid_at < CURRENT_DATE + INTERVAL '1 day'
        ), 0) AS today_total,

        COUNT(*) FILTER (
          WHERE status = 'Paid'
          AND paid_at >= DATE_TRUNC('week', NOW())
          AND paid_at < NOW()
        ) AS week_count,

        COALESCE(SUM(amount) FILTER (
          WHERE status = 'Paid'
          AND paid_at >= DATE_TRUNC('week', NOW())
          AND paid_at < NOW()
        ), 0) AS week_total,

        COUNT(*) FILTER (
          WHERE status = 'Paid'
          AND paid_at >= DATE_TRUNC('month', NOW())
          AND paid_at < NOW()
        ) AS month_count,

        COALESCE(SUM(amount) FILTER (
          WHERE status = 'Paid'
          AND paid_at >= DATE_TRUNC('month', NOW())
          AND paid_at < NOW()
        ), 0) AS month_total,

        COUNT(*) FILTER (
          WHERE status = 'Paid'
          AND paid_at >= DATE_TRUNC('year', NOW())
          AND paid_at < NOW()
        ) AS year_count,

        COALESCE(SUM(amount) FILTER (
          WHERE status = 'Paid'
          AND paid_at >= DATE_TRUNC('year', NOW())
          AND paid_at < NOW()
        ), 0) AS year_total

      FROM transactionskano
    `);

    const row = result.rows[0];

    // Add this query inside your GET, before the return
    const topPaymentsResult = await pool.query(`
      SELECT
        payment_item,
        COUNT(*)        AS transaction_count,
        SUM(amount::numeric) AS total_amount
      FROM transactionskano
      WHERE status = 'Paid'
        AND payment_item IS NOT NULL
      GROUP BY payment_item
      ORDER BY total_amount DESC
      LIMIT 6
    `);

    const topPayments = topPaymentsResult.rows.map((row) => ({
      name: row.payment_item,
      count: Number(row.transaction_count),
      total: Number(row.total_amount),
    }));

    return NextResponse.json({
      today: {
        count: Number(row.today_count),
        total: Number(row.today_total),
      },
      week: {
        count: Number(row.week_count),
        total: Number(row.week_total),
      },
      month: {
        count: Number(row.month_count),
        total: Number(row.month_total),
      },
      year: {
        count: Number(row.year_count),
        total: Number(row.year_total),
      },
      topPayments,
    });
  } catch (error) {
    console.error("Summaries fetch failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch summaries" },
      { status: 500 },
    );
  }
}
