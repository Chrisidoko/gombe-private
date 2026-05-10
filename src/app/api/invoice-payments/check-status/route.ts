// /api/payment/check-status/route.ts

// This API route checks the payment status of an invoice using the PayKaduna API.
// It expects a query parameter "bill_reference" to identify the invoice.
// The route will update the invoice status in the database if the payment is confirmed as paid.
// ------I dont think this is being used anywhere, but we can keep it for future use when we want to implement a manual "Check Payment Status". For now, the system relies on PayKaduna's webhook to update payment status automatically. -----

import { NextResponse } from "next/server";
import pool from "@/lib/db";
import crypto from "crypto";

export async function GET(req: Request) {
  const client = await pool.connect();

  try {
    // Get bill_reference from URL query params
    const { searchParams } = new URL(req.url);
    const billReference = searchParams.get("bill_reference");

    // console.log("🔹 Checking payment status for:", billReference);

    if (!billReference) {
      return NextResponse.json(
        { error: "Missing bill_reference parameter" },
        { status: 400 },
      );
    }

    // Step 1: Fetch invoice from database
    const invoiceRes = await client.query(
      `SELECT id, invoice_number, bill_reference, amount, status, school_id 
       FROM schoolkano_invoices 
       WHERE bill_reference = $1`,
      [billReference],
    );

    if (invoiceRes.rows.length === 0) {
      return NextResponse.json(
        { error: "Invoice not found with this bill reference" },
        { status: 404 },
      );
    }

    const invoice = invoiceRes.rows[0];

    // Step 2: Check payment status with PayKaduna API
    const apiKey = process.env.PAYKADUNA_API_KEY;
    if (!apiKey) {
      throw new Error("PayKaduna API key not configured");
    }

    // Build the API path with query string
    const apiPath = `/api/ESBills/GetBill?billreference=${billReference}`;

    // Generate HMAC SHA256 signature for GET request (hash the path + query string)
    const signature = crypto
      .createHmac("sha256", apiKey)
      .update(apiPath)
      .digest("base64");

    let baseUrl = process.env.NEXT_PUBLIC_PAYKADUNA_URL || "";
    if (!baseUrl.startsWith("http://") && !baseUrl.startsWith("https://")) {
      baseUrl = `https://${baseUrl}`;
    }

    // Remove trailing slash if present
    baseUrl = baseUrl.replace(/\/$/, "");

    const fullUrl = `${baseUrl}${apiPath}`;

    // console.log("🔹 Fetching payment status from PayKaduna...");
    // console.log("📍 Full URL:", fullUrl);
    // console.log("🔐 Signature:", signature);

    const statusResponse = await fetch(fullUrl, {
      method: "GET",
      headers: {
        "X-Api-Signature": signature,
      },
    });

    if (!statusResponse.ok) {
      const errorData = await statusResponse.text();
      console.error("❌ PayKaduna API error:", errorData);
      throw new Error(
        `Failed to fetch payment status: ${statusResponse.statusText}`,
      );
    }

    const statusData = await statusResponse.json();
    console.log(" Payment status received:", statusData);

    const payStatus = statusData.bill?.payStatus?.toLowerCase();
    const paymentItem =
      statusData.billItems?.[0]?.revenueHead || "Assessment Payment";

    if (!payStatus) {
      throw new Error("Invalid response format from PayKaduna");
    }

    await client.query("BEGIN");

    // Step 3: Update invoice status if paid
    if (payStatus === "paid") {
      await client.query(
        `UPDATE schoolkano_invoices 
         SET status = 'Paid'
         WHERE id = $1 AND status = 'Unpaid'`,
        [invoice.id],
      );

      console.log("Invoice marked as paid");

      // Step 4: Log transaction in transactions table
      await client.query(
        `INSERT INTO transactionskano 
         (id, reference, amount, status, payment_method, payment_item, invoice_number, school_id, created_at)
         VALUES ($1, $2, $3, 'Paid', 'paykaduna', $4, $5, $6, NOW())
         ON CONFLICT (reference) 
         DO UPDATE SET status = 'Paid', payment_item = $4`,
        [
          invoice.id,
          billReference,
          invoice.amount,
          paymentItem,
          invoice.invoice_number,
          invoice.school_id,
        ],
      );

      console.log(" Transaction logged");
    } else {
      // Log unsuccessful check
      await client.query(
        `INSERT INTO transactionskano 
         (id, reference, amount, status, payment_item, invoice_number, school_id, created_at)
         VALUES ($1, $2, $3, 'pending', $4, $5, $6, NOW())
         ON CONFLICT (reference) 
         DO UPDATE SET status = 'pending'`,
        [
          invoice.id,
          billReference,
          invoice.amount,
          paymentItem,
          invoice.invoice_number,
          invoice.school_id,
        ],
      );

      console.log("Payment still pending");
    }

    await client.query("COMMIT");

    return NextResponse.json({
      success: true,
      invoice_number: invoice.invoice_number,
      bill_reference: billReference,
      payment_status: payStatus,
      invoice_status: payStatus === "paid" ? "Paid" : "Unpaid",
      updated: payStatus === "paid",
    });
  } catch (error: unknown) {
    await client.query("ROLLBACK");
    console.error("🔥 Error checking payment status:", error);

    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  } finally {
    client.release();
  }
}
