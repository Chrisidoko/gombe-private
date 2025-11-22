// api/assessment/pending/route.ts
import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET() {
  try {
    const result = await pool.query(`
      SELECT 
        a.id, 
        a.school_id, 
        a.total_revenue, 
        a.commission_amount, 
        a.created_at,
        a.population_100,
        a.fee_100,
        a.population_200,
        a.fee_200,
        a.population_300,
        a.fee_300,
        a.population_400,
        a.fee_400,
        a.population_500,
        a.fee_500,
        a.population_postgrad,
        a.fee_postgrad,
        s.name AS school_name, 
        s.email AS school_email
      FROM schoolskano_assessments a
      JOIN schoolskano s ON s.school_id = a.school_id
      WHERE a.status = 'pending'
      ORDER BY a.created_at DESC
    `);

    return NextResponse.json({ assessments: result.rows }, { status: 200 });
  } catch (error) {
    console.error("Error fetching pending assessments:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// This is for admin view of request.
// import { NextResponse } from "next/server";
// import pool from "@/lib/db";

// export async function GET() {
//   try {
//     // Fetch all pending assessments with school info
//     const result = await pool.query(`
//       SELECT a.id, a.school_id, a.total_revenue, a.commission_amount, a.created_at,
//              s.name AS school_name, s.email AS school_email
//       FROM schoolskano_assessments a
//       JOIN schoolskano s ON s.school_id = a.school_id
//       WHERE a.status = 'pending'
//       ORDER BY a.created_at DESC
//     `);

//     return NextResponse.json({ assessments: result.rows }, { status: 200 });
//   } catch (error) {
//     console.error("Error fetching pending assessments:", error);
//     return NextResponse.json(
//       { error: "Internal server error" },
//       { status: 500 }
//     );
//   }
// }
