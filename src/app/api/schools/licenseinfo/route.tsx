// API route that queries the database and returns all school information

import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const tin = searchParams.get("tin");

    let result;

    if (tin) {
      // ✅ Fetch a single school by TIN
      result = await pool.query(
        `SELECT id, name, school_id, state, ownership, lga, address, email, phone, tin, license_number, license_status, last_license_renewal, license_expiry_date 
         FROM schoolskano 
         WHERE tin = $1`,
        [tin]
      );

      if (result.rows.length === 0) {
        return NextResponse.json(
          { error: "School not found" },
          { status: 404 }
        );
      }
    } else {
      // ✅ Fetch all schools if no TIN is provided
      result = await pool.query(`
        SELECT id, name, school_id, state, ownership, lga, address, email, phone, tin, license_number, license_status, last_license_renewal, license_expiry_date 
        FROM schoolskano;
      `);
    }

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Database query failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch schools" },
      { status: 500 }
    );
  }
}
