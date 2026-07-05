// Operator 2 — list self-assessments that Op1 has recommended (under_review)
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
      SELECT
        a.id,
        a.school_id,
        a.total_revenue,
        a.commission_amount,
        a.created_at,
        a.op1_recommendation,
        a.op1_note,
        a.population_100, a.fee_100,
        a.population_200, a.fee_200,
        a.population_300, a.fee_300,
        a.population_400, a.fee_400,
        a.population_500, a.fee_500,
        a.population_postgrad, a.fee_postgrad,
        s.name  AS school_name,
        s.email AS school_email
      FROM schoolskano_assessments a
      JOIN schoolskano s ON s.school_id = a.school_id
      WHERE a.status = 'under_review'
      ORDER BY a.created_at DESC
    `);

    return NextResponse.json({ assessments: result.rows });
  } catch (error) {
    console.error("Op2 evaluations fetch failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
