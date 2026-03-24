// app/api/dashboard/revenue-performance/route.ts
import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const year = parseInt(
      searchParams.get("year") || String(new Date().getFullYear()),
    );

    // ── Fetch targets for the year ────────────────────────────────────────
    const targetsResult = await pool.query(
      `SELECT quarter, target, notes
       FROM revenue_targets
       WHERE year = $1
       ORDER BY quarter ASC`,
      [year],
    );

    // ── Fetch actual collections per quarter from transactionskano ────────
    const actualsResult = await pool.query(
      `SELECT
         EXTRACT(QUARTER FROM paid_at)::INTEGER AS quarter,
         SUM(amount::numeric) AS actual
       FROM transactionskano
       WHERE status = 'Paid'
         AND paid_at >= DATE_TRUNC('year', $1::date)
         AND paid_at < DATE_TRUNC('year', $1::date) + INTERVAL '1 year'
       GROUP BY EXTRACT(QUARTER FROM paid_at)`,
      [`${year}-01-01`],
    );

    // ── Build maps for easy lookup ────────────────────────────────────────
    const targetMap: Record<number, number> = {};
    targetsResult.rows.forEach((row) => {
      targetMap[row.quarter] = Number(row.target);
    });

    const actualMap: Record<number, number> = {};
    actualsResult.rows.forEach((row) => {
      actualMap[row.quarter] = Number(row.actual);
    });

    const QUARTER_LABELS: Record<number, { label: string; period: string }> = {
      1: { label: "Q1", period: "Jan – Mar" },
      2: { label: "Q2", period: "Apr – Jun" },
      3: { label: "Q3", period: "Jul – Sep" },
      4: { label: "Q4", period: "Oct – Dec" },
    };

    // ── Build quarters array ──────────────────────────────────────────────
    const quarters = [1, 2, 3, 4].map((q) => ({
      quarter: q,
      label: QUARTER_LABELS[q].label,
      period: QUARTER_LABELS[q].period,
      expected: targetMap[q] ?? 0,
      actual: actualMap[q] ?? 0,
    }));

    // ── Cumulative totals ─────────────────────────────────────────────────
    const expectedAnnual = quarters.reduce((s, q) => s + q.expected, 0);
    const cumulativeExpected = expectedAnnual;
    const cumulativeActual = quarters.reduce((s, q) => s + q.actual, 0);
    const variance = cumulativeActual - cumulativeExpected;
    const performancePct =
      cumulativeExpected > 0
        ? parseFloat(((cumulativeActual / cumulativeExpected) * 100).toFixed(1))
        : null;

    // ── Check if targets have been set ───────────────────────────────────
    const targetsSet = targetsResult.rows.length > 0;

    return NextResponse.json({
      year,
      targetsSet,
      expectedAnnual,
      quarters,
      summary: {
        cumulativeExpected,
        cumulativeActual,
        variance,
        performancePct,
      },
    });
  } catch (error) {
    console.error("Revenue performance fetch failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch revenue performance" },
      { status: 500 },
    );
  }
}
