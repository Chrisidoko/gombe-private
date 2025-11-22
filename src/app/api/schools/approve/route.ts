//approve
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import nodemailer from "nodemailer";

export async function POST(req: Request) {
  try {
    const { school_id } = await req.json();

    const result = await pool.query(
      `UPDATE schoolskano 
       SET approval_status = 'approved'
       WHERE school_id = $1
       RETURNING email, name`,
      [school_id]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    const { email, name } = result.rows[0];

    const signupLink = `https://privateuni.payprosolutionsltd.com/signup?school_id=${school_id}`;

    // ✅ Verify SMTP credentials
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      throw new Error("Missing SMTP credentials in environment variables.");
    }

    // ✅ Send approval email
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
      to: email,
      subject: "Your School Registration Has Been Approved",
      html: `
        <p>Dear <strong>${name}</strong>,</p>
        <p>Your institution has been successfully approved on the Kaduna Private University Portal.</p>
        <p>You can now proceed to create your admin account and start onboarding:</p>
       <p>Click below to sign up and complete your registration:</p>
        <p>
            <a href="${signupLink}" style="color:#28a745;font-weight:bold;">
               Complete Registration
           </a>
        </p>
        <br />
        <p>Best Regards,<br>Kadirs School Assessment Team</p>
      `,
    });

    return NextResponse.json({ message: "School approved & email sent ✅" });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to approve school" },
      { status: 500 }
    );
  }
}
