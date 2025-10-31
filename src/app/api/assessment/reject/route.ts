import { NextResponse } from "next/server";
import pool from "@/lib/db";
import nodemailer from "nodemailer";

export async function POST(req: Request) {
  try {
    const { assessment_id } = await req.json();

    if (!assessment_id) {
      return NextResponse.json(
        { message: "Missing assessment_id" },
        { status: 400 }
      );
    }

    // 🔹 Step 1: Update the assessment status
    const updateQuery = `
      UPDATE schoolskano_assessments
      SET status = 'rejected'
      WHERE id = $1
      RETURNING *;
    `;
    const result = await pool.query(updateQuery, [assessment_id]);

    if (result.rowCount === 0) {
      return NextResponse.json(
        { message: "Assessment not found" },
        { status: 404 }
      );
    }

    const assessment = result.rows[0];

    // 🔹 Step 2: Fetch school details (email, name)
    const schoolQuery = `
      SELECT name, email
      FROM schoolskano
      WHERE school_id = $1
    `;
    const schoolRes = await pool.query(schoolQuery, [assessment.school_id]);

    if (schoolRes.rowCount === 0) {
      return NextResponse.json(
        { message: "School not found" },
        { status: 404 }
      );
    }

    const school = schoolRes.rows[0];

    // 🔹 Step 3: Configure mail transporter
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

    // 🔹 Step 4: Send rejection email
    await transporter.sendMail({
      from: `"CBS Portal" <${process.env.SMTP_USER}>`,
      to: school.email,
      subject: `Assessment Review Update for ${school.name}`,
      html: `
        <h2>Assessment Rejection Notice</h2>
        <p>Dear ${school.name},</p>
        <p>We regret to inform you that your submitted school assessment has been <strong>rejected</strong> after review.</p>
        <p>Please review your submission and reapply if applicable. For assistance, contact the KIRS Assessment Unit.</p>
        <br/>
        <p>Best regards,<br/>KIRS School Assessment Team</p>
      `,
    });

    console.log(`📧 Rejection email sent to ${school.email}`);

    return NextResponse.json({
      message: "Assessment rejected and email sent successfully",
      data: assessment,
    });
  } catch (error) {
    console.error("❌ Error rejecting assessment:", error);
    return NextResponse.json(
      { message: "Server error", error: String(error) },
      { status: 500 }
    );
  }
}
