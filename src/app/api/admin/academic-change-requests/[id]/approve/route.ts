import { NextResponse } from "next/server";
import pool from "@/lib/db";
import nodemailer from "nodemailer";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    // Fetch the pending request
    const requestResult = await pool.query(
      `SELECT acr.*, s.email, s.name
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

    const { school_id, requested_changes, email, name } = requestResult.rows[0];
    const changes = requested_changes as {
      mode_of_operation: string[];
      avg_fee: string;
      total_revenue: string;
      academic_session: string;
      session_start: string;
      session_end: string;
      programmes: string[];
      courses: string[];
    };

    // Apply changes to the live school record
    await pool.query(
      `UPDATE schoolskano
       SET
         mode_of_operation = $2::jsonb,
         avg_fee           = $3,
         total_revenue     = $4,
         academic_session  = $5,
         session_start     = NULLIF($6, ''),
         session_end       = NULLIF($7, ''),
         programmes        = $8::jsonb,
         courses           = $9::jsonb,
         updated_at        = NOW()
       WHERE school_id = $1`,
      [
        school_id,
        JSON.stringify(changes.mode_of_operation ?? []),
        changes.avg_fee || null,
        changes.total_revenue || null,
        changes.academic_session || null,
        changes.session_start || "",
        changes.session_end || "",
        JSON.stringify(changes.programmes ?? []),
        JSON.stringify(changes.courses ?? []),
      ],
    );

    // Mark request as approved
    await pool.query(
      `UPDATE academic_change_requests
       SET status = 'approved', updated_at = NOW()
       WHERE id = $1`,
      [id],
    );

    // Send approval email
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
        from: `"KAPTEMS" <${process.env.SMTP_USER}>`,
        to: email,
        subject: "Your Academic Profile Update Has Been Approved",
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 560px; margin: auto;">
            <h2 style="color: #16a34a;">Kaduna Private Tertiary Institution Portal</h2>
            <p>Dear <strong>${name}</strong>,</p>
            <p>Your request to update your institution's academic profile has been reviewed and <strong>approved</strong> by the Ministry.</p>
            <p>Your updated academic information is now live on the verification portal.</p>
            <br />
            <p>Best Regards,<br>KAPTEMS Assessment Team</p>
          </div>
        `,
      });
    }

    return NextResponse.json({ message: "Academic changes approved and applied" });
  } catch (error) {
    console.error("Approve academic-change-request error:", error);
    return NextResponse.json(
      { error: "Failed to approve request" },
      { status: 500 },
    );
  }
}
