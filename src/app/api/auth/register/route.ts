import { NextResponse } from "next/server";
import pool from "@/lib/db";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import nodemailer from "nodemailer";

export async function POST(req: Request) {
  try {
    const { name, email, institution, password } = await req.json();

    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate unique verification token
    const token = crypto.randomBytes(32).toString("hex");

    // Insert user record
    const result = await pool.query(
      `INSERT INTO userskano (name, email, institution, password_hash, verification_token, is_verified, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, name, email, institution`,
      [
        name,
        email,
        institution,
        hashedPassword,
        token,
        false, // no auto-verify — every new account is pending verification
        "pending",
      ]
    );

    // const user = result.rows[0];

    // If user is not CBS Admin, send email to school for verification
    if (institution !== "CBS Admin") {
      // Fetch the school’s official email
      const schoolResult = await pool.query(
        `SELECT email FROM schoolskano WHERE school_id = $1`,
        [institution] // <--- as the second argument, not after the string
      );

      const schoolEmail = schoolResult.rows[0]?.email;

      if (schoolEmail) {
        // Construct verification link
        const verificationLink = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/verify?token=${token}`;

        // ✅ Verify SMTP credentials
        if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
          throw new Error("Missing SMTP credentials in environment variables.");
        }

        // Send email to the school
        const transporter = nodemailer.createTransport({
          host: "paypro-solutions.com",
          port: 465,
          secure: true,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS.replace("%40", "@"),
          },
        });

        await transporter.sendMail({
          from: `"CBS Portal" <${process.env.SMTP_USER}>`,
          to: schoolEmail,
          subject: "New Account Verification Request",
          html: `
            <p>Hello,</p>
            <p>A new user has has registered under your institution:</p>
            <ul>
              <li><strong>Name:</strong> ${name}</li>
              <li><strong>Email:</strong> ${email}</li>
            </ul>
            <p>Click the link below to verify this account:</p>
            <p><a href="${verificationLink}" target="_blank">Verify Account</a></p>
            <p>If you didn’t expect this request, you can ignore this email.</p>
          `,
        });
      }
    }

    return NextResponse.json(
      { user: result.rows[0], message: "Account created successfully" },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("Error creating account:", error);

    // ✅ Handle duplicate email case
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "23505"
    ) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 400 }
      );
    }

    // ❌ Default error handler
    return NextResponse.json(
      { error: "Failed to create account." },
      { status: 500 }
    );
  }
}
