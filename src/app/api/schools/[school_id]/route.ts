// src/app/api/schools/[school_id]/route.ts

import { NextResponse } from "next/server";
import pool from "@/lib/db"; // PostgreSQL pool setup

export async function GET(
  request: Request,
  context: { params: Promise<{ school_id: string }> } // 👈 params as a Promise
) {
  try {
    const { school_id } = await context.params; // 👈 awaited before use

    const result = await pool.query(
      `SELECT * FROM schoolskano WHERE school_id = $1`,
      [school_id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
