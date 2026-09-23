// app/api/admin/staff-accounts/route.ts
//
// Admin-only provisioning for internal CBS/ministry staff roles — replaces
// self-signup for these roles (public /signup let anyone self-select
// "CBS_Admin" and simply wait for approval, with no server-side validation
// on the institution value at all). Mirrors how /api/schools/create-school
// already provisions school accounts directly, bypassing the
// pending/approve queue.
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import nodemailer from "nodemailer";
import { getUserFromCookie } from "@/lib/auth";

const STAFF_ROLES: Record<string, string> = {
  CBS_Admin: "Admin",
  CBS_Finance: "Management",
  CBS_Inspector: "Inspector",
  CBS_Operator: "Operator",
  CBS_Operator2: "Operator 2 (Reviewer)",
};

// GET — list existing staff accounts (admin-created only, since self
// -signup for these roles no longer exists).
export async function GET() {
  const admin = await getUserFromCookie();
  if (!admin || admin.institution !== "CBS_Admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await pool.query(
      `SELECT id, name, email, institution, status, created_at
       FROM userskano
       WHERE institution = ANY($1)
       ORDER BY created_at DESC`,
      [Object.keys(STAFF_ROLES)],
    );
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("List staff accounts failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch staff accounts" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  const admin = await getUserFromCookie();
  if (!admin || admin.institution !== "CBS_Admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { name, email, institution } = await req.json();

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    if (!email || !email.trim() || !email.includes("@")) {
      return NextResponse.json(
        { error: "A valid email is required" },
        { status: 400 },
      );
    }
    if (!institution || !(institution in STAFF_ROLES)) {
      return NextResponse.json(
        {
          error: `institution must be one of: ${Object.keys(STAFF_ROLES).join(", ")}`,
        },
        { status: 400 },
      );
    }

    // A real password never leaves the server — the account is unusable
    // until the new user sets their own via the reset-password link below.
    const randomPassword = crypto.randomBytes(24).toString("hex");
    const passwordHash = await bcrypt.hash(randomPassword, 10);

    const result = await pool.query(
      `INSERT INTO userskano (name, email, institution, password_hash, is_verified, status)
       VALUES ($1, $2, $3, $4, true, 'approved')
       RETURNING id, name, email, institution, created_at`,
      [name.trim(), email.trim(), institution, passwordHash],
    );
    const user = result.rows[0];

    // Same token shape/table as /api/auth/forgot-password — one active
    // token per user, 1 hour expiry, consumed by the existing
    // /reset-password page.
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    await pool.query(
      `INSERT INTO password_reset_tokens (user_id, token, expires_at)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id)
       DO UPDATE SET token = $2, expires_at = $3, used = false`,
      [user.id, token, expiresAt],
    );

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const setPasswordUrl = `${baseUrl}reset-password?token=${token}`;

    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
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
        from: `"GESMS" <${process.env.SMTP_USER}>`,
        to: user.email,
        subject: "Your GESMS Staff Account Has Been Created",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 520px; margin: auto; line-height: 1.6;">
            <h2 style="color: #28a745;">Gombe State Private Tertiary Institution Portal</h2>
            <p>Dear <strong>${user.name}</strong>,</p>
            <p>An administrator has created a <strong>${STAFF_ROLES[institution]}</strong> account for you on GESMS.</p>
            <p>Click below to set your password and sign in:</p>
            <div style="margin: 28px 0;">
              <a href="${setPasswordUrl}"
                 style="display: inline-block; background-color: #28a745; color: #ffffff;
                        text-decoration: none; padding: 12px 28px; border-radius: 6px;
                        font-weight: bold; font-size: 15px;">
                Set Your Password →
              </a>
            </div>
            <p style="color: #6b7280; font-size: 13px;">
              This link expires in <strong>1 hour</strong>. If it expires, use
              "Forgot password" on the login page with this email address.
            </p>
            <br/>
            <p>Best Regards,<br/>GESMS Team</p>
          </div>
        `,
      });
    }

    return NextResponse.json(
      {
        user: { ...user, role_label: STAFF_ROLES[institution] },
        message: "Staff account created — a set-password email was sent.",
      },
      { status: 201 },
    );
  } catch (error: unknown) {
    console.error("Create staff account failed:", error);

    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "23505"
    ) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Failed to create staff account." },
      { status: 500 },
    );
  }
}
