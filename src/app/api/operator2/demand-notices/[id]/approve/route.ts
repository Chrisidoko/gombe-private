// Operator 2 approves a staged demand notice — invoice, PayKaduna bill, and email fire here.
// Mirrors the logic that was in /api/operator/invoices/demand-notice before the layered approach.
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
  const noticeId = parseInt(id, 10);
  if (isNaN(noticeId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Fetch the pending notice
    const noticeRes = await client.query(
      `SELECT * FROM pending_demand_notices WHERE id = $1 AND status = 'pending_approval'`,
      [noticeId],
    );
    if (noticeRes.rowCount === 0) {
      await client.query("ROLLBACK");
      return NextResponse.json(
        { error: "Notice not found or already reviewed" },
        { status: 404 },
      );
    }
    const notice = noticeRes.rows[0];

    // Fetch full school record (need phone + address for PayKaduna)
    const schoolRes = await client.query(
      "SELECT email, name, phone, address FROM schoolskano WHERE school_id = $1",
      [notice.school_id],
    );
    const school = schoolRes.rows[0];
    if (!school) throw new Error("School not found");

    // Create invoice
    const invoice_number = `INV-${notice.school_id}-${Date.now()}`;
    const due_days = 14;
    const { rows } = await client.query(
      `INSERT INTO schoolkano_invoices
         (school_id, invoice_number, title, amount, status, issue_date, due_date)
       VALUES ($1, $2, $3, $4, 'Unpaid', NOW(), NOW() + INTERVAL '${due_days} days')
       RETURNING id, invoice_number, due_date`,
      [notice.school_id, invoice_number, notice.title, notice.amount],
    );
    const invoiceId = rows[0].id;
    const dueDate = rows[0].due_date;

    // Create bill with payment gateway (skipped when gateway is not yet configured)
    const GATEWAY_ACTIVE = process.env.PAYKADUNA_API_KEY !== "STUB_NOT_ACTIVE";
    let billReference = invoice_number;
    let billStatus = "Unpaid";
    let tpui = "";

    if (GATEWAY_ACTIVE) {
      const billPayload = {
        engineCode: process.env.PAYKADUNA_ENGINE_CODE,
        identifier: notice.school_id,
        firstName: school.name.split(" ")[0] || school.name,
        middleName: school.name.split(" ")[1] || "",
        lastName: school.name.split(" ").slice(2).join(" ") || school.name.split(" ")[0],
        address: school.address || "Gombe, Nigeria",
        telephone: school.phone || "08000000000",
        esBillDetailsDto: [
          {
            amount: parseFloat(notice.amount),
            mdasId: parseInt(process.env.MDAS_ID || "3654"),
            narration: `${notice.title} - ${invoice_number}`,
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

      // Update invoice with bill reference
      await client.query(
        `UPDATE schoolkano_invoices
         SET bill_reference = $1, status = $2, tpui = $3, updated_at = NOW()
         WHERE id = $4`,
        [billReference, billStatus, tpui, invoiceId],
      );
    } else {
      console.log("⚠️ Payment gateway not configured — invoice created without bill reference.");
    }

    // Mark notice as approved and link invoice
    await client.query(
      `UPDATE pending_demand_notices
       SET status = 'approved', reviewed_by = $1, reviewed_at = NOW(), invoice_id = $2
       WHERE id = $3`,
      [user.name || "operator2", invoiceId, noticeId],
    );

    // Send email to school
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
      from: `"GESMS" <${process.env.SMTP_USER}>`,
      to: school.email,
      subject: `${notice.title} — ${school.name}`,
      html: `
        <h2>${notice.title}</h2>
        <p>Dear ${school.name},</p>
        <p>A demand notice has been issued to your institution by the Gombe State Private Tertiary Education Management System (GESMS).</p>
        <table style="border-collapse:collapse;width:100%;max-width:480px;margin-top:16px;">
          <tr>
            <td style="padding:8px 12px;background:#f9fafb;border:1px solid #e5e7eb;font-weight:600;font-size:13px;">Notice</td>
            <td style="padding:8px 12px;border:1px solid #e5e7eb;font-size:13px;">${notice.title}</td>
          </tr>
          <tr>
            <td style="padding:8px 12px;background:#f9fafb;border:1px solid #e5e7eb;font-weight:600;font-size:13px;">Invoice Reference</td>
            <td style="padding:8px 12px;border:1px solid #e5e7eb;font-size:13px;">${invoice_number}</td>
          </tr>
          ${billReference !== invoice_number ? `
          <tr>
            <td style="padding:8px 12px;background:#f9fafb;border:1px solid #e5e7eb;font-weight:600;font-size:13px;">Bill Reference</td>
            <td style="padding:8px 12px;border:1px solid #e5e7eb;font-size:13px;">${billReference}</td>
          </tr>` : ""}
          <tr>
            <td style="padding:8px 12px;background:#f9fafb;border:1px solid #e5e7eb;font-weight:600;font-size:13px;">Amount Due</td>
            <td style="padding:8px 12px;border:1px solid #e5e7eb;font-size:13px;font-weight:700;color:#dc2626;">₦${parseFloat(notice.amount).toLocaleString()}</td>
          </tr>
          <tr>
            <td style="padding:8px 12px;background:#f9fafb;border:1px solid #e5e7eb;font-weight:600;font-size:13px;">Payment Due Date</td>
            <td style="padding:8px 12px;border:1px solid #e5e7eb;font-size:13px;">${formattedDue}</td>
          </tr>
        </table>
        ${notice.narration ? `<p style="font-size:13px;color:#374151;margin-top:16px;padding:12px 16px;background:#f9fafb;border-left:3px solid #d1d5db;border-radius:4px;">${notice.narration}</p>` : ""}
        <br/>
        <p style="font-size:13px;color:#6b7280;">Please log in to your dashboard to make payment before the due date.</p>
        <br/>
        <a href="https://kaptems.payprosolutionsltd.com/"
           style="background-color:#166534;color:white;padding:10px 20px;text-decoration:none;border-radius:8px;font-size:14px;font-weight:600;">
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
    console.error("Op2 demand notice approve failed:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    client.release();
  }
}
