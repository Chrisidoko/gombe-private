// API route that queries the database and returns all school license information
//  i also update the license information from this route, so it will handle both GET and PATCH requests
// The patch was done speifically to handle the license information update from the license modal, so it only updates the license fields
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
        [tin],
      );

      if (result.rows.length === 0) {
        return NextResponse.json(
          { error: "School not found" },
          { status: 404 },
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
      { status: 500 },
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const { school_id, license_number, license_expiry_date } = await req.json();

    if (!school_id || !license_number || !license_expiry_date) {
      return NextResponse.json(
        {
          error:
            "school_id, license_number, and license_expiry_date are required",
        },
        { status: 400 },
      );
    }

    await pool.query(
      `UPDATE schoolskano
       SET license_number      = $2,
           license_expiry_date = $3
           
       WHERE school_id = $1`,
      [school_id, license_number, license_expiry_date],
    );

    return NextResponse.json({
      message: "License information saved successfully",
    });
  } catch (error) {
    console.error("License update failed:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
