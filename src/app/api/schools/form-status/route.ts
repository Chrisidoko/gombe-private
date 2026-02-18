// app/api/schools/form-status/route.ts

import { NextResponse } from "next/server";
import pool from "@/lib/db";

//If form_status !== "complete", the modal renders and blocks the entire UI (no close button intentionally)
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
      "SELECT form_status FROM schoolskano WHERE school_id = $1",
      [school_id],
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    return NextResponse.json({ form_status: result.rows[0].form_status });
  } catch (error) {
    console.error("form-status check failed:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

//On success → hits PATCH to update the DB → modal shows success → page reloads and modal is gone for good
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
        "UPDATE schoolskano SET form_status = 'complete', email = $2 WHERE school_id = $1",
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

    return NextResponse.json({ message: "Form status updated to complete" });
  } catch (error) {
    console.error("form-status update failed:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
