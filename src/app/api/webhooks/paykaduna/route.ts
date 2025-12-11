// /api/webhooks/paykaduna/route.ts
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import crypto from "crypto";
import nodemailer from "nodemailer";

export async function POST(req: Request) {
  const client = await pool.connect();

  try {
    // Step 1: Get the signature from headers
    const signature = req.headers.get("X-Signature");

    if (!signature) {
      console.error("❌ Missing X-Signature header");
      return NextResponse.json(
        { status: "error", message: "Missing signature" },
        { status: 401 }
      );
    }

    // Step 2: Get the raw body
    const body = await req.json();
    console.log("🔹 Webhook received:", body);

    const { billReference, paymentGateway, status, paidat } = body;

    if (!billReference || !status) {
      console.error("❌ Missing required fields");
      return NextResponse.json(
        { status: "error", message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Step 3: Verify signature
    const apiKey = process.env.PAYKADUNA_WEBHOOK_API_KEY;
    if (!apiKey) {
      throw new Error("PayKaduna API key not configured");
    }
    const jsonPayload = JSON.stringify(body);

    const expectedSignature = crypto
      .createHmac("sha256", apiKey)
      .update(jsonPayload)
      .digest("base64");

    if (signature !== expectedSignature) {
      console.error("❌ Invalid signature");
      console.error("Expected:", expectedSignature);
      console.error("Received:", signature);
      return NextResponse.json(
        { status: "error", error: "Invalid signature" },
        { status: 403 }
      );
    }

    console.log("✅ Signature verified");

    await client.query("BEGIN");

    // Step 4: Find invoice by bill reference
    const invoiceRes = await client.query(
      `SELECT id, invoice_number, bill_reference, amount, status, school_id 
       FROM schoolkano_invoices 
       WHERE bill_reference = $1`,
      [billReference]
    );

    if (invoiceRes.rows.length === 0) {
      await client.query("ROLLBACK");
      console.error("❌ Invoice not found for bill reference:", billReference);
      return NextResponse.json(
        { status: "error", message: "Invoice not found" },
        { status: 404 }
      );
    }

    const invoice = invoiceRes.rows[0];

    // Step 5: Update invoice status if paid
    if (status.toLowerCase() === "paid") {
      await client.query(
        `UPDATE schoolkano_invoices 
         SET status = 'Paid'
         WHERE id = $1 AND status = 'Unpaid'`,
        [invoice.id]
      );

      console.log("✅ Invoice marked as paid");

      // Step 6: Log transaction
      const paidAtDate = paidat;

      await client.query(
        `INSERT INTO transactionskano 
         (invoice_number, reference, amount, status, payment_method, gateway_response, payment_item, paid_at, created_at, school_id)
         VALUES ($1, $2, $3, 'Paid', 'paykaduna', $4, 'Assessment Payment', $5, NOW(), $6)
         ON CONFLICT (reference) 
         DO UPDATE SET 
           status = 'Paid', 
           gateway_response = $4,
           paid_at = $5,
           created_at = NOW()`,
        [
          invoice.invoice_number,
          billReference,
          invoice.amount,
          paymentGateway || "Unknown",
          paidAtDate,
          invoice.school_id,
        ]
      );
      console.log("📝 Inserting transaction:", {
        invoice_number: invoice.invoice_number,
        reference: billReference,
        amount: invoice.amount,
        status: "Paid",
        payment_method: "paykaduna",
        gateway_response: paymentGateway || "Unknown",
        payment_item: "Assessment Payment",
        paid_at: paidAtDate,
        school_id: invoice.school_id,
      });

      console.log("✅ Transaction logged");

      // Step 7: Send confirmation email to school
      const schoolRes = await client.query(
        "SELECT email, name FROM schoolskano WHERE school_id = $1",
        [invoice.school_id]
      );

      if (schoolRes.rows.length > 0) {
        const school = schoolRes.rows[0];

        try {
          if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
            throw new Error("SMTP credentials not configured");
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

          await transporter.sendMail({
            from: `"CBS Portal" <${process.env.SMTP_USER}>`,
            to: school.email,
            subject: `Payment Confirmation - ${school.name}`,
            html: `
              <h2>Payment Confirmation</h2>
              <p>Dear ${school.name},</p>
              <p>We have received your payment successfully.</p>
              <p><strong>Invoice Number:</strong> ${invoice.invoice_number}</p>
              <p><strong>Bill Reference:</strong> ${billReference}</p>
              <p><strong>Amount Paid:</strong> ₦${parseFloat(
                invoice.amount
              ).toLocaleString()}</p>
              <p><strong>Payment Date:</strong> ${new Date(
                paidat || Date.now()
              ).toLocaleDateString("en-NG", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}</p>
              <br/>
              <p>Thank you for your payment.</p>
              <br/>

            `,
          });

          console.log("✅ Confirmation email sent");
        } catch (emailError) {
          console.error("⚠️ Failed to send confirmation email:", emailError);
          // Don't fail the webhook if email fails
        }
      }

      await client.query("COMMIT");

      return NextResponse.json({
        status: "success",
        message: "Payment processed successfully",
        billReference: invoice.bill_reference,
      });
    } else {
      // Payment not successful - log attempt
      await client.query(
        `INSERT INTO transactionskano 
         (invoice_id, reference, amount, status, payment_method, gateway_response, payment_item, created_at)
         VALUES ($1, $2, $3, $4, 'paykaduna', $5, 'Assessment Payment', NOW())
         ON CONFLICT (reference) 
         DO UPDATE SET status = $4`,
        [
          invoice.id,
          billReference,
          invoice.amount,
          status,
          paymentGateway || "Unknown",
        ]
      );

      await client.query("COMMIT");

      return NextResponse.json({
        success: true,
        message: "Payment status updated",
        status: status,
      });
    }
  } catch (error: unknown) {
    await client.query("ROLLBACK");
    console.error("🔥 Webhook processing error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";

    return NextResponse.json(
      { status: "error", error: errorMessage },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
