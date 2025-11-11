import { NextResponse } from "next/server";
import pool from "@/lib/db";
import nodemailer from "nodemailer";

export async function POST(req: Request) {
  try {
    const { school_id, reason } = await req.json();

    // Update only approval status, no reason stored
    const result = await pool.query(
      `UPDATE schoolskano 
       SET approval_status = 'rejected'
       WHERE school_id = $1
       RETURNING email, name`,
      [school_id]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    const { email, name } = result.rows[0];

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

    const rejectionText = reason?.trim()
      ? `
      <p><strong>Reason for rejection:</strong></p>
      <blockquote style="background: #f8d7da; padding: 10px; border-left: 4px solid #dc3545;">
        ${reason}
      </blockquote>`
      : `<p>No specific reason was provided.</p>`;

    await transporter.sendMail({
      from: `"CBS Portal" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "School Registration Rejected",
      html: `
        <p>Dear <strong>${name}</strong>,</p>
        <p>Your institution's onboarding application has been reviewed but unfortunately was <strong>not approved</strong>.</p>
        ${rejectionText}
        <p>You may correct the submission and reapply if applicable.</p>
        <br />
        <p>Regards,<br>KIRS School Assessment Team</p>
      `,
    });

    return NextResponse.json({
      message: "School rejected and email sent ❌",
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to reject school" },
      { status: 500 }
    );
  }
}
