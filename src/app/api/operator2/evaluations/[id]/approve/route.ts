// Operator 2 final-approves a self-assessment.
// Cloned from /api/assessment/approve — same PayKaduna + email logic.
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import nodemailer from "nodemailer";
import crypto from "crypto";
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

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Fetch assessment
    const asmtRes = await client.query(
      `SELECT * FROM schoolskano_assessments WHERE id = $1 AND status = 'under_review'`,
      [assessmentId],
    );
    if (asmtRes.rowCount === 0) {
      await client.query("ROLLBACK");
      return NextResponse.json(
        { error: "Assessment not found or not awaiting Op2 review" },
        { status: 404 },
      );
    }
    const asmt = asmtRes.rows[0];
    const amount = asmt.commission_amount;
    const school_id = asmt.school_id;

    // Mark approved
    await client.query(
      `UPDATE schoolskano_assessments SET status = 'approved' WHERE id = $1`,
      [assessmentId],
    );

    // Generate invoice
    const invoice_number = `INV-${school_id}-${Date.now()}`;
    const { rows } = await client.query(
      `INSERT INTO schoolkano_invoices
         (school_id, invoice_number, assessment_id, amount, status, issue_date, due_date)
       VALUES ($1, $2, $3, $4, 'unpaid', NOW(), NOW() + INTERVAL '14 days')
       RETURNING id, invoice_number, due_date`,
      [school_id, invoice_number, assessmentId, amount],
    );
    const invoiceId = rows[0].id;
    const dueDate = rows[0].due_date;

    // Fetch school info
    const schoolRes = await client.query(
      "SELECT email, name, phone, address FROM schoolskano WHERE school_id = $1",
      [school_id],
    );
    const school = schoolRes.rows[0];
    if (!school) throw new Error("School not found");

    // Create bill with payment gateway (skipped when gateway is not yet configured)
    const GATEWAY_ACTIVE = process.env.PAYKADUNA_API_KEY !== "STUB_NOT_ACTIVE";
    let billReference: string | null = null;
    let billStatus: string | null = null;
    let tpui: string | null = null;

    if (GATEWAY_ACTIVE) {
      const billPayload = {
        engineCode: process.env.PAYKADUNA_ENGINE_CODE,
        identifier: school_id,
        firstName: school.name.split(" ")[0] || school.name,
        middleName: school.name.split(" ")[1] || "",
        lastName: school.name.split(" ").slice(2).join(" ") || school.name.split(" ")[0],
        address: school.address || "Gombe, Nigeria",
        telephone: school.phone || "08000000000",
        esBillDetailsDto: [
          {
            amount: parseFloat(amount),
            mdasId: parseInt(process.env.MDAS_ID || "3654"),
            narration: `Institution Payment - ${invoice_number}`,
          },
        ],
      };

      const jsonPayload = JSON.stringify(billPayload);
      const apiKey = process.env.PAYKADUNA_API_KEY!;
      const signature = crypto
        .createHmac("sha256", apiKey)
        .update(jsonPayload)
        .digest("base64");

      const billResponse = await fetch(
        `${process.env.NEXT_PUBLIC_PAYKADUNA_URL}api/ESBills/CreateESBill`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Api-Signature": signature },
          body: jsonPayload,
        },
      );

      if (!billResponse.ok) {
        const errorText = await billResponse.text();
        throw new Error(`Bill creation failed: ${errorText}`);
      }

      const billData = await billResponse.json();
      billReference = billData.bill?.billReference || invoice_number;
      billStatus = billData.bill?.payStatus || "Unpaid";
      tpui = billData.bill?.tpui || "";

      await client.query(
        `UPDATE schoolkano_invoices
         SET bill_reference = $1, status = $2, tpui = $3, updated_at = NOW()
         WHERE id = $4`,
        [billReference, billStatus, tpui, invoiceId],
      );
    } else {
      console.log("⚠️ Payment gateway not configured — invoice created without bill reference.");
    }

    // Send email
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      throw new Error("Missing SMTP credentials");
    }

    const formattedDue = new Date(dueDate).toLocaleDateString("en-NG", {
      year: "numeric", month: "long", day: "numeric",
    });

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
      subject: `Invoice for School Assessment (${school.name})`,
      html: `
        <h2>Invoice Notification</h2>
        <p>Dear ${school.name},</p>
        <p>Your assessment has been approved. Please proceed to make payment for the generated invoice.</p>
        <p><strong>Invoice Reference:</strong> ${invoice_number}</p>
        ${billReference && billReference !== invoice_number ? `<p><strong>Bill Reference:</strong> ${billReference}</p>` : ""}
        <p><strong>Amount Due:</strong> ₦${parseFloat(amount).toLocaleString()}</p>
        <p><strong>Status:</strong> ${billStatus || "Unpaid"}</p>
        <p><strong>Payment Due Date:</strong> ${formattedDue}</p>
        <br/>
        <a href="https://kaptems.payprosolutionsltd.com/"
           style="background-color:#28a745;color:white;padding:10px 20px;text-decoration:none;border-radius:8px;">
          Go to Dashboard
        </a>
      `,
    });

    await client.query("COMMIT");

    return NextResponse.json({
      success: true,
      invoice: { id: invoiceId, invoice_number, bill_reference: billReference, due_date: dueDate },
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Op2 evaluation approve failed:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    client.release();
  }
}
