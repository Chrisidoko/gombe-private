// src/app/api/schools/forsignup/route.ts
// simply to pull all the existing school

import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET() {
  try {
    //  Fetch all schools (id, school_id, and name)
    const result = await pool.query(
      `SELECT id, school_id, name FROM schoolskano ORDER BY name ASC`
    );

    return NextResponse.json(result.rows, { status: 200 });
  } catch (error) {
    console.error("Database query failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch schools" },
      { status: 500 }
    );
  }
}
