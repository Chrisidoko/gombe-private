// approve
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import nodemailer from "nodemailer";
import { getUserFromCookie } from "@/lib/auth";
import { createNoticeBatch } from "@/lib/annualNotices";

export async function POST(req: Request) {
  const user = await getUserFromCookie();
  if (!user || user.institution !== "CBS_Admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const {
      school_id,
      inspector_name,
      inspector_email,
      location_type,
      premises_category,
    } = await req.json();

    if (
      !["urban", "rural"].includes(location_type) ||
      !["A", "B", "C"].includes(premises_category)
    ) {
      return NextResponse.json(
        { error: "Location and premises category are required" },
        { status: 400 },
      );
    }

    const result = await pool.query(
      `UPDATE schoolskano
       SET approval_status = 'approved',
           assigned_inspector_name = COALESCE($2, assigned_inspector_name),
           assigned_inspector_email = COALESCE($3, assigned_inspector_email),
           location_type = $4,
           premises_category = $5
       WHERE school_id = $1
       RETURNING email, name, license_status`,
      [
        school_id,
        inspector_name || null,
        inspector_email || null,
        location_type,
        premises_category,
      ],
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    const { email, name, license_status } = result.rows[0];

    // A newly approved school gets a full notice for the current year, queued
    // for Operator 2 like any other. Approval itself must not depend on it:
    // if this fails, Operator 1 can still prepare the notice from their page.
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await createNoticeBatch(client, {
        year: new Date().getFullYear(),
        schools: [{ school_id, location_type, premises_category }],
        source: "school_approval",
        createdBy: user.name || "admin",
      });
      await client.query("COMMIT");
    } catch (noticeError) {
      await client.query("ROLLBACK");
      console.error("Notice for newly approved school failed:", noticeError);
    } finally {
      client.release();
    }
    const hasActiveLicense = license_status === "Active";

    // const purchaseLink = `https://kaptems.payprosolutionsltd.com/school-overview?school_id=${encodeURIComponent(school_id)}`;

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
        from: `"GESMS" <${process.env.SMTP_USER}>`,
        to: email,
        subject: "Your School Registration Has Been Approved",
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 560px; margin: auto;">
            <h2 style="color: #16a34a;">Gombe Private Tertiary Institution Portal</h2>
            <p>Dear <strong>${name}</strong>,</p>
            <p>Your institution has been successfully approved on the Gombe Private Tertiary Institution Portal.</p>
            <p>You can now continue using the portal to handle your certificate management and school assessments.</p>
            <br />
            <p>Best Regards,<br>GESMS Assessment Team</p>
          </div>
        `,
      });
    } else {
      // License is not active — prompt school to purchase license
      await transporter.sendMail({
        from: `"GESMS" <${process.env.SMTP_USER}>`,
        to: email,
        subject: "Action Required: Purchase Your Consent Certificate ",
        html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 560px; margin: auto;">
          <h2 style="color: #16a34a;">Gombe Private Tertiary Institution Portal</h2>
            <p>Dear <strong>${name}</strong>,</p>
            <p>Your institution has been approved on the Gombe Private Tertiary Institution Portal.</p>
            <p>To fully access all portal features and remain compliant, please login and navigate to compliance standing to purchase your Consent Certificate</p>
            <br />
            <p>Best Regards,<br>GESMS Assessment Team</p>
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
