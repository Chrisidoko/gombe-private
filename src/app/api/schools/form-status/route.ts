// app/api/schools/form-status/route.ts

import { NextResponse } from "next/server";
import pool from "@/lib/db";

// If email_updated !== true, the modal renders and blocks the entire UI (no close button intentionally)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const school_id = searchParams.get("school_id");

    if (!school_id) {
      return NextResponse.json(
        { error: "School ID is required" },
        { status: 400 },
      );
    }

    const result = await pool.query(
      "SELECT email_updated FROM schoolskano WHERE school_id = $1",
      [school_id],
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    return NextResponse.json({ email_updated: result.rows[0].email_updated });
  } catch (error) {
    console.error("email_updated check failed:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

//On success → hits PATCH to update the DB → modal shows success → page reloads and modal is gone for good
// Please not that this only for email update. i am not using patch for check if licence has alrady been updated
export async function PATCH(req: Request) {
  try {
    const { school_id, email } = await req.json();

    if (!school_id) {
      return NextResponse.json(
        { error: "School ID is required" },
        { status: 400 },
      );
    }

    await pool.query("BEGIN");

    try {
      await pool.query(
        "UPDATE schoolskano SET email_updated = true, email = $2 WHERE school_id = $1",
        [school_id, email],
      );

      await pool.query(
        "UPDATE userskano SET email = $2 WHERE institution = $1",
        [school_id, email],
      );

      await pool.query("COMMIT");
    } catch (error) {
      await pool.query("ROLLBACK");
      throw error;
    }

    return NextResponse.json({ message: "Email update complete" });
  } catch (error) {
    console.error("email update failed:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
