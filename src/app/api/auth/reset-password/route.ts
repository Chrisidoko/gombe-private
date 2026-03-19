// app/api/auth/reset-password/route.ts
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json(
        { error: "Token and password are required" },
        { status: 400 },
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 },
      );
    }

    // Find valid token
    const tokenRes = await pool.query(
      `SELECT user_id, expires_at, used
       FROM password_reset_tokens
       WHERE token = $1`,
      [token],
    );

    if (tokenRes.rows.length === 0) {
      return NextResponse.json(
        { error: "Invalid or expired reset link." },
        { status: 400 },
      );
    }

    const resetToken = tokenRes.rows[0];

    // Check if already used
    if (resetToken.used) {
      return NextResponse.json(
        { error: "This reset link has already been used." },
        { status: 400 },
      );
    }

    // Check expiry
    if (new Date() > new Date(resetToken.expires_at)) {
      return NextResponse.json(
        { error: "This reset link has expired. Please request a new one." },
        { status: 400 },
      );
    }

    // Hash new password
    const password_hash = await bcrypt.hash(password, 12);

    // Update password
    await pool.query(`UPDATE userskano SET password_hash = $1 WHERE id = $2`, [
      password_hash,
      resetToken.user_id,
    ]);

    // Mark token as used
    await pool.query(
      `UPDATE password_reset_tokens SET used = true WHERE token = $1`,
      [token],
    );

    return NextResponse.json({
      success: true,
      message: "Password reset successfully. You can now log in.",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: "Failed to reset password" },
      { status: 500 },
    );
  }
}
