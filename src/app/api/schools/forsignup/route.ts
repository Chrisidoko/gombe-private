// src/app/api/schools/forsignup/route.ts
import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(req: Request) {
  try {
    // Read query parameter from URL
    const url = new URL(req.url);
    const schoolId = url.searchParams.get("school_id");

    let result;

    if (schoolId) {
      // Fetch single school by school_id
      result = await pool.query(
        `SELECT id, school_id, name, email FROM schoolskano WHERE school_id = $1`,
        [schoolId]
      );

      if (result.rows.length === 0) {
        return NextResponse.json(
          { error: "School not found" },
          { status: 404 }
        );
      }

      return NextResponse.json(result.rows[0], { status: 200 });
    }

    // Fetch all schools if no school_id provided
    result = await pool.query(
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
