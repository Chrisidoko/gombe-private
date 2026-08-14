import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q")?.trim();

    if (!query || query.length < 2) {
      return NextResponse.json(
        { error: "Search query must be at least 2 characters" },
        { status: 400 },
      );
    }

    const result = await pool.query(
      `SELECT school_id, name, license_number
       FROM schoolskano
       WHERE name ILIKE $1 AND license_number IS NOT NULL
       ORDER BY name ASC
       LIMIT 10`,
      [`%${query}%`],
    );

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("School name search failed:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
