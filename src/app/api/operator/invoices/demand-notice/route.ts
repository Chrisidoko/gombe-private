import { NextResponse } from "next/server";
import pool from "@/lib/db";
import nodemailer from "nodemailer";
import crypto from "crypto";
import { getUserFromCookie } from "@/lib/auth";

export async function POST(req: Request) {
  const user = await getUserFromCookie();
  if (!user || user.role !== "operator") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const client = await pool.connect();

  try {
    const body = await req.json();
    const { school_id, title, amount, due_days = 14, narration } = body;

    if (!school_id || !title?.trim() || !amount) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    await client.query("BEGIN");

    // Step 1: Generate invoice
    const invoice_number = `INV-${school_id}-${Date.now()}`;
    const { rows } = await client.query(
      `INSERT INTO schoolkano_invoices
         (school_id, invoice_number, title, amount, status, issue_date, due_date)
       VALUES ($1, $2, $3, $4, 'Unpaid', NOW(), NOW() + INTERVAL '${parseInt(due_days, 10)} days')
       RETURNING id, invoice_number, due_date`,
      [school_id, invoice_number, title.trim(), parsedAmount],
    );

    const invoiceId = rows[0].id;
    const dueDate = rows[0].due_date;

    // Step 2: Fetch school info
    const schoolRes = await client.query(
      "SELECT email, name, phone, address FROM schoolskano WHERE school_id = $1",
      [school_id],
    );
    const school = schoolRes.rows[0];
    if (!school) throw new Error("School not found");

    // Step 3: Create bill with PayKaduna
    let billReference: string | null = null;
    let billStatus: string | null = null;
    let tpui: string | null = null;

    const billPayload = {
      engineCode: process.env.PAYKADUNA_ENGINE_CODE,
      identifier: school_id,
      firstName: school.name.split(" ")[0] || school.name,
      middleName: school.name.split(" ")[1] || "",
      lastName:
        school.name.split(" ").slice(2).join(" ") || school.name.split(" ")[0],
      address: school.address || "Kaduna, Nigeria",
      telephone: school.phone || "08000000000",
      esBillDetailsDto: [
        {
          amount: parsedAmount,
          mdasId: parseInt(process.env.MDAS_ID || "3654"),
          narration: `${title.trim()} - ${invoice_number}`,
        },
      ],
    };

    const jsonPayload = JSON.stringify(billPayload);
    const apiKey = process.env.PAYKADUNA_API_KEY;
    if (!apiKey) throw new Error("PayKaduna API key not configured");

    const signature = crypto
      .createHmac("sha256", apiKey)
      .update(jsonPayload)
      .digest("base64");

    const billResponse = await fetch(
      `${process.env.NEXT_PUBLIC_PAYKADUNA_URL}api/ESBills/CreateESBill`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Api-Signature": signature,
        },
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

    // Step 4: Update invoice with bill reference
    await client.query(
      `UPDATE schoolkano_invoices
       SET bill_reference = $1, status = $2, tpui = $3, updated_at = NOW()
       WHERE id = $4`,
      [billReference, billStatus, tpui, invoiceId],
    );

    // Step 5: Send email
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      throw new Error("Missing SMTP credentials");
    }

    const formattedDue = new Date(dueDate).toLocaleDateString("en-NG", {
      year: "numeric",
      month: "long",
      day: "numeric",
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
      from: `"KAPTEMS" <${process.env.SMTP_USER}>`,
      to: school.email,
      subject: `${title.trim()} — ${school.name}`,
      html: `
        <h2>${title.trim()}</h2>
        <p>Dear ${school.name},</p>
        <p>A demand notice has been issued to your institution by the Kaduna State Private Tertiary Education Management System (KAPTEMS).</p>
        <table style="border-collapse:collapse;width:100%;max-width:480px;margin-top:16px;">
          <tr>
            <td style="padding:8px 12px;background:#f9fafb;border:1px solid #e5e7eb;font-weight:600;font-size:13px;">Notice</td>
            <td style="padding:8px 12px;border:1px solid #e5e7eb;font-size:13px;">${title.trim()}</td>
          </tr>
          <tr>
            <td style="padding:8px 12px;background:#f9fafb;border:1px solid #e5e7eb;font-weight:600;font-size:13px;">Invoice Reference</td>
            <td style="padding:8px 12px;border:1px solid #e5e7eb;font-size:13px;">${invoice_number}</td>
          </tr>
          ${billReference && billReference !== invoice_number ? `
          <tr>
            <td style="padding:8px 12px;background:#f9fafb;border:1px solid #e5e7eb;font-weight:600;font-size:13px;">Bill Reference</td>
            <td style="padding:8px 12px;border:1px solid #e5e7eb;font-size:13px;">${billReference}</td>
          </tr>` : ""}
          <tr>
            <td style="padding:8px 12px;background:#f9fafb;border:1px solid #e5e7eb;font-weight:600;font-size:13px;">Amount Due</td>
            <td style="padding:8px 12px;border:1px solid #e5e7eb;font-size:13px;font-weight:700;color:#dc2626;">₦${parsedAmount.toLocaleString()}</td>
          </tr>
          <tr>
            <td style="padding:8px 12px;background:#f9fafb;border:1px solid #e5e7eb;font-weight:600;font-size:13px;">Payment Due Date</td>
            <td style="padding:8px 12px;border:1px solid #e5e7eb;font-size:13px;">${formattedDue}</td>
          </tr>
        </table>
        ${narration ? `<p style="font-size:13px;color:#374151;margin-top:16px;padding:12px 16px;background:#f9fafb;border-left:3px solid #d1d5db;border-radius:4px;">${narration}</p>` : ""}
        <br/>
        <p style="font-size:13px;color:#6b7280;">Please log in to your dashboard to make payment before the due date to avoid penalties.</p>
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
      invoice: {
        id: invoiceId,
        invoice_number,
        title: title.trim(),
        bill_reference: billReference,
        due_date: dueDate,
      },
    });
  } catch (error: unknown) {
    await client.query("ROLLBACK");
    console.error("Demand notice failed:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    client.release();
  }
}
