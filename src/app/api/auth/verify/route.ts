//api/auth/verify/route.ts
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import nodemailer from "nodemailer";

// ── GET — fetch all pending accounts ─────────────────────────────────────────
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "pending";

    const result = await pool.query(
      `SELECT
         u.id,
         u.name,
         u.email,
         u.institution,
         u.status,
         u.is_verified,
         u.created_at,
         s.name AS school_name,
         s.lga,
         s.state,
         s.phone
       FROM userskano u
       LEFT JOIN schoolskano s ON s.school_id = u.institution
       WHERE u.status = $1
       ORDER BY u.created_at DESC`,
      [status],
    );

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Accounts fetch failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch accounts" },
      { status: 500 },
    );
  }
}

// ── PATCH — approve or reject an account ─────────────────────────────────────
export async function PATCH(req: Request) {
  try {
    const { id, action } = await req.json();

    if (!id || !["approve", "reject"].includes(action)) {
      return NextResponse.json(
        { error: "id and action (approve|reject) are required" },
        { status: 400 },
      );
    }

    const newStatus = action === "approve" ? "approved" : "rejected";

    const result = await pool.query(
      `UPDATE userskano
       SET status = $1
       WHERE id = $2
       RETURNING id, name, email, institution, status`,
      [newStatus, id],
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    const user = result.rows[0];

    // Send email notification
    try {
      const transporter = nodemailer.createTransport({
        host: "paypro-solutions.com",
        port: 465,
        secure: true,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS?.replace("%40", "@"),
        },
      });

      const portalUrl =
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

      await transporter.sendMail({
        from: `"KAPTEMS" <${process.env.SMTP_USER}>`,
        to: user.email,
        subject:
          action === "approve"
            ? "Account Approved — KAPTEMS Portal"
            : "Account Update — KAPTEMS Portal",
        html:
          action === "approve"
            ? `
            <div style="font-family: Arial, sans-serif; max-width: 520px; margin: auto; line-height: 1.6;">
              <h2 style="color: #16a34a;">Account Approved</h2>
              <p>Dear <strong>${user.name}</strong>,</p>
              <p>Your account on the Kaduna State Private Tertiary Institutions Portal has been <strong>approved</strong>. You can now log in and access all portal features.</p>
              <div style="margin: 24px 0;">
                <a href="${portalUrl}"
                   style="display: inline-block; background-color: #16a34a; color: #ffffff;
                          text-decoration: none; padding: 12px 28px; border-radius: 6px;
                          font-weight: bold; font-size: 15px;">
                  Login to Portal →
                </a>
              </div>
              <p>Best Regards,<br/>KAPTEMS Team</p>
            </div>
          `
            : `
            <div style="font-family: Arial, sans-serif; max-width: 520px; margin: auto; line-height: 1.6;">
              <h2 style="color: #dc2626;">Account Not Approved</h2>
              <p>Dear <strong>${user.name}</strong>,</p>
              <p>Unfortunately your account application has not been approved at this time. Please contact the Ministry for further information.</p>
              <p>Best Regards,<br/>KAPTEMS Team</p>
            </div>
          `,
      });
    } catch (emailErr) {
      console.error("Email notification failed:", emailErr);
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      message: `Account ${newStatus} successfully`,
      user,
    });
  } catch (error) {
    console.error("Account approval failed:", error);
    return NextResponse.json(
      { error: "Failed to update account" },
      { status: 500 },
    );
  }
}
