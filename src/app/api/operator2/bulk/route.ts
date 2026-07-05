// Operator 2 — list bulk assessments pending approval
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getUserFromCookie } from "@/lib/auth";

export async function GET() {
  const user = await getUserFromCookie();
  if (!user || user.institution !== "CBS_Operator2") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await pool.query(`
      SELECT *
      FROM schoolkano_bulk_assessments
      WHERE status = 'pending_approval'
      ORDER BY created_at DESC
    `);
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Op2 bulk fetch failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
