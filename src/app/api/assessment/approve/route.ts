// /api/assessment/approve/route.ts
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import nodemailer from "nodemailer";

export async function POST(req: Request) {
  const client = await pool.connect();

  try {
    const body = await req.json();
    console.log("🟢 Incoming body:", body); // 👈 Log what frontend sent

    const { school_id, assessment_id, amount } = body;

    // Log missing fields for clarity
    if (!school_id || !assessment_id || !amount) {
      console.error("❌ Missing fields:", { school_id, assessment_id, amount });
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    await client.query("BEGIN");
    console.log("🔹 Starting approval for:", { school_id, assessment_id });

    // Update assessment
    await client.query(
      "UPDATE schoolskano_assessments SET status = 'approved' WHERE id = $1",
      [assessment_id]
    );
    console.log("✅ Assessment approved");

    // Generate invoice
    const invoice_number = `INV-${school_id}-${Date.now()}`;
    const insertQuery = `
      INSERT INTO schoolkano_invoices (school_id, invoice_number, assessment_id, amount, status, issue_date, due_date)
      VALUES ($1, $2, $3, $4, 'unpaid', NOW(), NOW() + INTERVAL '14 days')
      RETURNING id, invoice_number, due_date;
    `;

    const { rows } = await client.query(insertQuery, [
      school_id,
      invoice_number,
      assessment_id,
      amount,
    ]);
    console.log("✅ Invoice inserted:", rows[0]);

    // Fetch school info
    const schoolRes = await client.query(
      "SELECT email, name FROM schoolskano WHERE school_id = $1",
      [school_id]
    );
    const school = schoolRes.rows[0];
    console.log("🏫 School found:", school);

    if (!school) throw new Error("School not found");

    // ✅ Verify SMTP credentials
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      throw new Error("Missing SMTP credentials in environment variables.");
    }

    const dueDate = new Date(rows[0].due_date).toLocaleDateString("en-NG", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // Send email
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
      to: school.email,
      subject: `Invoice for School Assessment (${school.name})`,
      html: `
        <h2>Invoice Notification</h2>
        <p>Dear ${school.name},</p>
        <p>Your assessment has been approved. Please proceed to make payment for the generated invoice.</p>
        <p><strong>Invoice Reference:</strong> ${invoice_number}</p>
        <p><strong>Amount Due:</strong> ₦${amount.toLocaleString()}</p>
        <p><strong>Status:</strong> Unpaid</p>
      <p><strong>Payment Due Date:</strong> ${dueDate}</p>
        <br/>
        <a href="https://privateuni.payprosolutionsltd.com/"
           style="background-color:#28a745;color:white;padding:10px 20px;text-decoration:none;border-radius:8px;">Go to Dashboard</a>
      `,
    });

    await client.query("COMMIT");
    console.log("✅ Email sent successfully");

    return NextResponse.json({
      message: "Assessment approved and invoice generated successfully",
      invoice: rows[0],
    });
  } catch (error: unknown) {
    await client.query("ROLLBACK");
    console.error("🔥 Error approving assessment:", error);

    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  } finally {
    client.release();
  }
}
