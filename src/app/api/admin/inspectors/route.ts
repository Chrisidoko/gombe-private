import { NextResponse } from "next/server";
import pool from "@/lib/db";

// GET — list approved inspector accounts, for the "assign inspector" dropdown
export async function GET() {
  try {
    const result = await pool.query(
      `SELECT id, name, email
       FROM userskano
       WHERE institution = 'CBS_Inspector' AND status = 'approved'
       ORDER BY name ASC`,
    );

    return NextResponse.json({ inspectors: result.rows });
  } catch (error) {
    console.error("GET admin/inspectors error:", error);
    return NextResponse.json(
      { error: "Failed to fetch inspectors" },
      { status: 500 },
    );
  }
}
