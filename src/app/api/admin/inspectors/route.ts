import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { requireRole } from "@/lib/apiAuth";

// GET — list approved inspector accounts, for the "assign inspector" dropdown
export async function GET() {
  const denied = await requireRole("CBS_Admin");
  if (denied) return denied;

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
