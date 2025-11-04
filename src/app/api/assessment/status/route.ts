// this is for the school to know their status of submition
import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const school_id = searchParams.get("school_id");

    if (!school_id) {
      return NextResponse.json(
        { error: "Missing school_id parameter" },
        { status: 400 }
      );
    }

    // Check if the school already has a pending assessment
    const result = await pool.query(
      `SELECT status FROM schoolskano_assessments WHERE school_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [school_id]
    );

    if (result.rows.length === 0) {
      // No assessment record found
      return NextResponse.json({ status: "none" }, { status: 200 });
    }

    const latestStatus = result.rows[0].status;

    return NextResponse.json({ status: latestStatus }, { status: 200 });
  } catch (error) {
    console.error("Error fetching assessment status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
