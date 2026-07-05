import { NextResponse } from "next/server";
import pool from "@/lib/db";
import nodemailer from "nodemailer";
import { getUserFromCookie } from "@/lib/auth";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getUserFromCookie();
  if (!user || user.institution !== "CBS_Operator2") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const assessmentId = parseInt(id, 10);
  if (isNaN(assessmentId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  try {
    const { reason } = await req.json();

    const result = await pool.query(
      `UPDATE schoolskano_assessments
       SET status = 'rejected'
       WHERE id = $1 AND status = 'under_review'
       RETURNING school_id`,
      [assessmentId],
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: "Assessment not found or not awaiting Op2 review" },
        { status: 404 },
      );
    }

    const school_id = result.rows[0].school_id;
    const schoolRes = await pool.query(
      "SELECT name, email FROM schoolskano WHERE school_id = $1",
      [school_id],
    );
    const school = schoolRes.rows[0];

    if (school && process.env.SMTP_USER && process.env.SMTP_PASS) {
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
        from: `"GAPTEMS" <${process.env.SMTP_USER}>`,
        to: school.email,
        subject: `Assessment Review Update for ${school.name}`,
        html: `
          <h2>Assessment Rejection Notice</h2>
          <p>Dear ${school.name},</p>
          <p>Your submitted assessment has been <strong>rejected</strong> after ministry review.</p>
          ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ""}
          <p>Please review your submission and reapply if applicable.</p>
          <br/>
          <p>Best regards,<br/>GAPTEMS Assessment Team</p>
        `,
      });
    }

    return NextResponse.json({ success: true, assessment_id: assessmentId });
  } catch (error) {
    console.error("Op2 evaluation reject failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
