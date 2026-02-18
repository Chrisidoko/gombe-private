// Verify OTP -> specifically for form status check flow (can be reused for other flows later)
// This used to verify otp to change email of school account.. make shift process during the early onboarding faces

// Verify OTP
import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { school_id, otp } = await req.json();

    const result = await pool.query(
      `SELECT o.id 
         FROM otps o
         JOIN schoolskano s ON o.school_id = s.id
        WHERE s.school_id = $1
          AND o.otp_code = $2
          AND o.expires_at > NOW()`,
      [school_id, otp],
    );

    if (result.rows.length === 0) {
      return NextResponse.json({
        valid: false,
        message: "Invalid or expired OTP",
      });
    }

    return NextResponse.json({
      valid: true,
      message: "OTP verified successfully",
    });
  } catch (error) {
    console.error("Error verifying OTP:", error);
    return NextResponse.json({ valid: false, message: "Server error" });
  }
}
