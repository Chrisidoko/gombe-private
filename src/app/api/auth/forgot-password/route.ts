// app/api/auth/forgot-password/route.ts
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import nodemailer from "nodemailer";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Check if user exists
    const userRes = await pool.query(
      `SELECT id, name, email FROM userskano WHERE email = $1`,
      [email],
    );

    // Always return success even if email not found — prevents email enumeration
    if (userRes.rows.length === 0) {
      return NextResponse.json({
        success: true,
        message: "If this email exists, a reset link has been sent.",
      });
    }

    const user = userRes.rows[0];

    // Generate secure random token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store token in DB — upsert so only one active token per user
    await pool.query(
      `INSERT INTO password_reset_tokens (user_id, token, expires_at)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id)
       DO UPDATE SET token = $2, expires_at = $3, used = false`,
      [user.id, token, expiresAt],
    );

    // Build reset URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const resetUrl = `${baseUrl}/reset-password?token=${token}`;

    // Send email
    const transporter = nodemailer.createTransport({
      host: "paypro-solutions.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS?.replace("%40", "@"),
      },
    });

    await transporter.sendMail({
      from: `"KAPTEMS" <${process.env.SMTP_USER}>`,
      to: user.email,
      subject: "Password Reset Request — KAPTEMS",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 520px; margin: auto; line-height: 1.6;">
          <h2 style="color: #16a34a;">Password Reset</h2>
          <p>Dear <strong>${user.name}</strong>,</p>
          <p>We received a request to reset your password. Click the button below to proceed:</p>
          <div style="margin: 28px 0;">
            <a href="${resetUrl}"
               style="display: inline-block; background-color: #16a34a; color: #ffffff;
                      text-decoration: none; padding: 12px 28px; border-radius: 6px;
                      font-weight: bold; font-size: 15px;">
              Reset Password →
            </a>
          </div>
          <p style="color: #6b7280; font-size: 13px;">
            This link expires in <strong>1 hour</strong>. If you did not request a
            password reset, please ignore this email.
          </p>
          <p style="color: #6b7280; font-size: 12px;">
            If the button doesn't work, copy and paste this link:<br/>
            <span style="color: #16a34a;">${resetUrl}</span>
          </p>
          <br/>
          <p>Best Regards,<br/>KAPTEMS Team</p>
        </div>
      `,
    });

    return NextResponse.json({
      success: true,
      message: "If this email exists, a reset link has been sent.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 },
    );
  }
}
