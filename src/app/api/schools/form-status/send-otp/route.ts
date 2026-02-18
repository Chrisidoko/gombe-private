// Send OTP -> specifically for form status check flow (can be reused for other flows later)
// This used to send otp to change email of school account make shift process during the early onboarding faces
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import nodemailer from "nodemailer";

export async function POST(req: Request) {
  try {
    const { school_id, email } = await req.json();

    if (!school_id) {
      return NextResponse.json(
        { error: "School ID is required" },
        { status: 400 },
      );
    }

    // ✅ Query school info
    const result = await pool.query(
      "SELECT id, name FROM schoolskano WHERE school_id = $1",
      [school_id],
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    const school = result.rows[0];
    // ✅ Cleanup: remove expired OTPs + any existing OTPs for this school
    await pool.query(
      `
      DELETE FROM otps
      WHERE expires_at < NOW()
      OR id = $1
    `,
      [school.id],
    );

    //safely send and store in your DB for later verification
    const otp = Math.floor(100000 + Math.random() * 900000);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await pool.query(
      "INSERT INTO otps (school_id, otp_code, expires_at) VALUES ($1, $2, $3)",
      [school.id, otp, expiresAt],
    );

    // ✅ Verify SMTP credentials
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      throw new Error("Missing SMTP credentials in environment variables.");
    }

    const transporter = nodemailer.createTransport({
      host: "paypro-solutions.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS.replace("%40", "@"),
      },
    });

    // ✅ Include school name in the email body
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2 style="color: #28a745;">Kaduna State IRS</h2>
        <p>Hello <b>${school.name}</b>,</p>
        <p>Your One-Time Password (OTP) for login is:</p>
        <h3 style="color: #333; font-size: 22px;">${otp}</h3>
        <p>This code will expire in 10 minutes. Do not share it with anyone.</p>
        <br />
        <p>Best regards,<br/>PayPro Solutions Support Team</p>
      </div>
    `;

    await transporter.sendMail({
      from: `"CBS Portal" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Your OTP Code",
      html: htmlContent,
    });

    return NextResponse.json({
      message: `OTP sent successfully to ${school.name}`,
      otp,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    console.error("Error sending OTP:", message);

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
