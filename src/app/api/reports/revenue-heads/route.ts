// What each Head and Sub-Head collected per month of a year, from confirmed
// ledger payments. External partners' payments have no Sub-Head and aren't
// private-uni revenue, so they're left out like every other Finance report.
// Paid rows without a Sub-Head are returned as unmapped, not dropped, so the
// grand total always matches the ledger.
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { requireRole } from "@/lib/apiAuth";

const emptyMonths = () => Array<number>(12).fill(0);
const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);

export async function GET(req: Request) {
  const denied = await requireRole("CBS_Finance", "CBS_Admin");
  if (denied) return denied;

  const { searchParams } = new URL(req.url);
  const year = parseInt(
    searchParams.get("year") || String(new Date().getFullYear()),
  );

  try {
    const subheads = await pool.query(
      `SELECT s.id, s.name, h.id AS head_id, h.name AS head_name
       FROM revenue_subheads s
       JOIN revenue_heads h ON h.id = s.head_id
       ORDER BY h.sort_order, s.sort_order`,
    );
    const paid = await pool.query(
      `SELECT revenue_subhead_id,
              EXTRACT(MONTH FROM paid_at)::integer AS month,
              SUM(amount) AS total
       FROM transactionskano
       WHERE status = 'Paid'
         AND source = 'private-uni'
         AND paid_at >= make_date($1, 1, 1)
         AND paid_at < make_date($1 + 1, 1, 1)
       GROUP BY 1, 2`,
      [year],
    );

    const unmapped = emptyMonths();
    const byId = new Map<number, number[]>();
    for (const row of paid.rows) {
      const months = row.revenue_subhead_id
        ? (byId.get(row.revenue_subhead_id) ?? emptyMonths())
        : unmapped;
      months[row.month - 1] += Number(row.total);
      if (row.revenue_subhead_id) byId.set(row.revenue_subhead_id, months);
    }

    const heads: {
      id: number;
      name: string;
      months: number[];
      total: number;
      subheads: { id: number; name: string; months: number[]; total: number }[];
    }[] = [];
    for (const s of subheads.rows) {
      let head = heads.find((h) => h.id === s.head_id);
      if (!head) {
        head = {
          id: s.head_id,
          name: s.head_name,
          months: emptyMonths(),
          total: 0,
          subheads: [],
        };
        heads.push(head);
      }
      const months = byId.get(s.id) ?? emptyMonths();
      head.subheads.push({ id: s.id, name: s.name, months, total: sum(months) });
      months.forEach((v, i) => {
        head.months[i] += v;
      });
      head.total += sum(months);
    }

    return NextResponse.json({
      year,
      heads,
      unmapped: { months: unmapped, total: sum(unmapped) },
      months: emptyMonths().map(
        (_, i) =>
          heads.reduce((t, h) => t + h.months[i], 0) + unmapped[i],
      ),
      grandTotal: heads.reduce((t, h) => t + h.total, 0) + sum(unmapped),
    });
  } catch (error) {
    console.error("Revenue by head report failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
