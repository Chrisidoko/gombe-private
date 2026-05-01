// app/api/operator/invoices/route.ts
import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET() {
  try {
    // ── Summaries ─────────────────────────────────────────────────────────
    const summaryResult = await pool.query(`
      SELECT
        COUNT(*) FILTER (
          WHERE issue_date >= CURRENT_DATE
          AND issue_date < CURRENT_DATE + INTERVAL '1 day'
        ) AS today_count,

        COALESCE(SUM(amount::numeric) FILTER (
          WHERE issue_date >= CURRENT_DATE
          AND issue_date < CURRENT_DATE + INTERVAL '1 day'
        ), 0) AS today_total,

        COUNT(*) FILTER (
          WHERE issue_date >= DATE_TRUNC('week', NOW())
        ) AS week_count,

        COALESCE(SUM(amount::numeric) FILTER (
          WHERE issue_date >= DATE_TRUNC('week', NOW())
        ), 0) AS week_total,

        COUNT(*) FILTER (
          WHERE issue_date >= DATE_TRUNC('month', NOW())
        ) AS month_count,

        COALESCE(SUM(amount::numeric) FILTER (
          WHERE issue_date >= DATE_TRUNC('month', NOW())
        ), 0) AS month_total,

        COUNT(*) FILTER (WHERE status = 'Unpaid') AS total_pending,
        COUNT(*) FILTER (WHERE status = 'Paid')   AS total_paid,

        COALESCE(SUM(amount::numeric) FILTER (
          WHERE status = 'Unpaid'
        ), 0) AS pending_value

      FROM schoolkano_invoices
    `);

    // ── Pending invoices — created within last 24hrs or still unpaid ──────
    // Exclude paid invoices older than 24 hours
    // Show: all unpaid + paid within last 24hrs — sorted by issue_date DESC
    const invoicesResult = await pool.query(`
      SELECT
        i.id,
        i.invoice_number,
        i.school_id,
        i.amount,
        i.status,
        i.issue_date,
        i.due_date,
        i.bill_reference,
        s.name AS school_name,
        s.lga,
        s.email AS school_email
      FROM schoolkano_invoices i
      LEFT JOIN schoolskano s ON s.school_id = i.school_id
      WHERE
        i.status = 'Unpaid'
        OR (
          i.status = 'Paid'
          AND i.issue_date >= NOW() - INTERVAL '24 hours'
        )
      ORDER BY i.issue_date DESC
      LIMIT 20
    `);

    const row = summaryResult.rows[0];
    const invoices = invoicesResult.rows.map((inv) => ({
      ...inv,
      amount: Number(inv.amount),
      isOverdue:
        inv.due_date &&
        new Date(inv.due_date) < new Date() &&
        inv.status === "Unpaid",
    }));

    return NextResponse.json({
      summary: {
        today: {
          count: Number(row.today_count),
          total: Number(row.today_total),
        },
        week: { count: Number(row.week_count), total: Number(row.week_total) },
        month: {
          count: Number(row.month_count),
          total: Number(row.month_total),
        },
        pending: {
          count: Number(row.total_pending),
          value: Number(row.pending_value),
        },
        paid: { count: Number(row.total_paid) },
      },
      invoices,
    });
  } catch (error) {
    console.error("Operator invoices fetch failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch invoices" },
      { status: 500 },
    );
  }
}
