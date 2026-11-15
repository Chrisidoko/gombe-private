// app/api/schools/form-status/route.ts

import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import pool from "@/lib/db";
import { requireSchoolAccess } from "@/lib/apiAuth";

// If email_updated !== true, the modal renders and blocks the entire UI (no close button intentionally)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const school_id = searchParams.get("school_id");

    const denied = await requireSchoolAccess(school_id);
    if (denied) return denied;

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
//
// The last step of the modal: the verified email becomes the school's login
// email and the school replaces the default password with its own. The OTP is
// checked again here and used up, so this can't be called without one.
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const school_id: string | undefined = body.school_id;
    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const otp = typeof body.otp === "string" ? body.otp.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";

    // Only the school itself, not staff, can set its login
    const denied = await requireSchoolAccess(school_id, []);
    if (denied) return denied;

    if (!school_id) {
      return NextResponse.json(
        { error: "School ID is required" },
        { status: 400 },
      );
    }
    if (!email.includes("@")) {
      return NextResponse.json(
        { error: "A valid email is required" },
        { status: 400 },
      );
    }
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 },
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const school = await client.query(
        `SELECT s.id FROM schoolskano s
         JOIN otps o ON o.school_id = s.id
         WHERE s.school_id = $1 AND o.otp_code = $2 AND o.expires_at > NOW()
         LIMIT 1`,
        [school_id, otp],
      );
      if (school.rows.length === 0) {
        await client.query("ROLLBACK");
        return NextResponse.json(
          {
            error:
              "This OTP is invalid or has expired. Go back and request a new one.",
          },
          { status: 400 },
        );
      }

      const takenBy = await client.query(
        `SELECT 1 FROM userskano WHERE lower(email) = $1 AND institution <> $2`,
        [email, school_id],
      );
      if (takenBy.rows.length > 0) {
        await client.query("ROLLBACK");
        return NextResponse.json(
          { error: "This email is already used by another account." },
          { status: 409 },
        );
      }

      await client.query(
        "UPDATE schoolskano SET email_updated = true, email = $2 WHERE school_id = $1",
        [school_id, email],
      );

      await client.query(
        "UPDATE userskano SET email = $2, password_hash = $3 WHERE institution = $1",
        [school_id, email, passwordHash],
      );

      await client.query("DELETE FROM otps WHERE school_id = $1", [
        school.rows[0].id,
      ]);

      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }

    return NextResponse.json({ message: "Email and password updated", email });
  } catch (error) {
    console.error("email update failed:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
