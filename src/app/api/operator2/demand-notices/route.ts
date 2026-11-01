// Operator 2 — list pending demand notices submitted by Operator 1
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getUserFromCookie } from "@/lib/auth";

export async function GET() {
  const user = await getUserFromCookie();
  if (!user || user.institution !== "CBS_Operator2") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { rows } = await pool.query(`
      SELECT n.*, s.name AS subhead_name, h.name AS head_name
      FROM pending_demand_notices n
      LEFT JOIN revenue_subheads s ON s.id = n.revenue_subhead_id
      LEFT JOIN revenue_heads h ON h.id = s.head_id
      WHERE n.status = 'pending_approval'
      ORDER BY n.created_at DESC
    `);
    return NextResponse.json(rows);
  } catch (error) {
    console.error("Op2 demand notices fetch failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
