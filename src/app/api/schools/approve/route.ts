// approve
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
       RETURNING email, name, license_status`,
      [school_id],
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    const { email, name, license_status } = result.rows[0];
    const hasActiveLicense = license_status === "Active";

    // const purchaseLink = `https://kaptems.payprosolutionsltd.com/signup?school_id=${school_id}`;

    const purchaseLink = `https://kaptems.payprosolutionsltd.com/school-overview?school_id=${school_id}`;

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

    // ✅ Conditional email based on license_status
    if (hasActiveLicense) {
      // License is active — send standard approval email
      await transporter.sendMail({
        from: `"KAPTEMS" <${process.env.SMTP_USER}>`,
        to: email,
        subject: "Your School Registration Has Been Approved",
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 560px; margin: auto;">
            <h2 style="color: #16a34a;">Kaduna Private Tertiary Institution Portal</h2>
            <p>Dear <strong>${name}</strong>,</p>
            <p>Your institution has been successfully approved on the Kaduna Private Tertiary Institution Portal.</p>
            <p>You can now continue using the portal to handle your certificate management and school assessments.</p>
            <br />
            <p>Best Regards,<br>KAPTEMS Assessment Team</p>
          </div>
        `,
      });
    } else {
      // License is not active — prompt school to purchase license
      await transporter.sendMail({
        from: `"KAPTEMS" <${process.env.SMTP_USER}>`,
        to: email,
        subject: "Action Required: Purchase Your Consent Certificate ",
        html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 560px; margin: auto;">
          <h2 style="color: #16a34a;">Kaduna Private Tertiary Institution Portal</h2>
            <p>Dear <strong>${name}</strong>,</p>
            <p>Your institution has been approved on the Kaduna Private Tertiary Institution Portal.</p>
            <p>To fully access all portal features and remain compliant, please proceed to purchase your Consent Certificate:</p>

            <div style="margin: 24px 0;">
              <a href="${purchaseLink}" 
                style="display: inline-block; background-color: #16a34a; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-weight: bold; font-size: 15px;">
                Purchase Certificate →
              </a>
            </div>
            <p style="color: #6b7280; font-size: 13px;">
              If the button doesn't work, copy and paste this link into your browser:<br/>
              <span style="color: #16a34a;">${purchaseLink}</span>
            </p>
            <br />
            <p>Best Regards,<br>KAPTEMS Assessment Team</p>
          </div>
`,
      });
    }

    return NextResponse.json({
      message: hasActiveLicense
        ? "School approved & approval email sent"
        : "School approved & Certificate purchase email sent",
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to approve school" },
      { status: 500 },
    );
  }
}
