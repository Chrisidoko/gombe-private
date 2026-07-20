import { NextResponse } from "next/server";
import pool from "@/lib/db";
import nodemailer from "nodemailer";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const { reason } = await req.json();

    const requestResult = await pool.query(
      `SELECT acr.school_id, s.email, s.name
       FROM academic_change_requests acr
       JOIN schoolskano s ON s.school_id = acr.school_id
       WHERE acr.id = $1 AND acr.status = 'pending'`,
      [id],
    );

    if (requestResult.rowCount === 0) {
      return NextResponse.json(
        { error: "Request not found or already processed" },
        { status: 404 },
      );
    }

    const { email, name } = requestResult.rows[0];

    await pool.query(
      `UPDATE academic_change_requests
       SET status = 'rejected', rejection_reason = $2, updated_at = NOW()
       WHERE id = $1`,
      [id, reason || null],
    );

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
        to: email,
        subject: "Academic Profile Update Request — Not Approved",
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 560px; margin: auto;">
            <h2 style="color: #dc2626;">Gombe Private Tertiary Institution Portal</h2>
            <p>Dear <strong>${name}</strong>,</p>
            <p>Your request to update your institution's academic profile has been reviewed and <strong>was not approved</strong> at this time.</p>
            ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ""}
            <p>Your currently approved academic data remains unchanged on the portal. You may submit a new request after addressing the concerns above.</p>
            <br />
            <p>Best Regards,<br>GESMS Assessment Team</p>
          </div>
        `,
      });
    }

    return NextResponse.json({ message: "Request rejected" });
  } catch (error) {
    console.error("Reject academic-change-request error:", error);
    return NextResponse.json(
      { error: "Failed to reject request" },
      { status: 500 },
    );
  }
}
