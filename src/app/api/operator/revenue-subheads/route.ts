// Sub-Heads Operator 1 can raise through Other Fees, grouped by Head. Annual
// notice and Compliance Standing items are left out so they can't be charged
// a second time from here.
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getUserFromCookie } from "@/lib/auth";

export async function GET() {
  const user = await getUserFromCookie();
  if (!user || user.institution !== "CBS_Operator") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { rows } = await pool.query(
      `SELECT s.id, s.name, h.name AS head_name
       FROM revenue_subheads s
       JOIN revenue_heads h ON h.id = s.head_id
       WHERE s.charge_type = 'manual' AND s.active
       ORDER BY h.sort_order, s.sort_order`,
    );
    return NextResponse.json(rows);
  } catch (error) {
    console.error("Revenue sub-heads fetch failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
