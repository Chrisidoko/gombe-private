// /api/webhooks/paykaduna/route.ts
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import crypto from "crypto";
import { activateLicense } from "@/lib/activateLicense";

const GATEWAY_ACTIVE = process.env.PAYKADUNA_WEBHOOK_API_KEY !== "STUB_NOT_ACTIVE";

export async function POST(req: Request) {
  if (!GATEWAY_ACTIVE) {
    return NextResponse.json(
      { status: "error", message: "Payment gateway not yet configured for Gombe State." },
      { status: 503 },
    );
  }

  const client = await pool.connect();

  try {
    // Step 1: Verify signature header exists
    const signature = req.headers.get("X-Signature");
    if (!signature) {
      console.error("Missing X-Signature header");
      return NextResponse.json(
        { status: "error", message: "Missing signature" },
        { status: 401 },
      );
    }

    // Step 2: Parse body
    const body = await req.json();
    console.log("Webhook received:", body);

    const { billReference, paymentGateway, status, paidat } = body;

    if (!billReference || !status) {
      console.error("Missing required fields");
      return NextResponse.json(
        { status: "error", message: "Missing required fields" },
        { status: 400 },
      );
    }

    // Step 3: Verify HMAC signature
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
      console.error(
        "Invalid signature — Expected:",
        expectedSignature,
        "Received:",
        signature,
      );
      return NextResponse.json(
        { status: "error", error: "Invalid signature" },
        { status: 403 },
      );
    }

    console.log("Signature verified");

    await client.query("BEGIN");

    // Step 4: Check both tables for the bill reference
    const paymentRes = await client.query(
      `SELECT id, school_id, fee_id, fee_name, amount, status, lga, reference
       FROM schoolkano_payments
       WHERE reference = $1`,
      [billReference],
    );

    const invoiceRes = await client.query(
      `SELECT id, school_id, invoice_number, bill_reference, amount, status
       FROM schoolkano_invoices
       WHERE bill_reference = $1`,
      [billReference],
    );

    const foundInPayments = paymentRes.rows.length > 0;
    const foundInInvoices = invoiceRes.rows.length > 0;

    // If found in neither — return 200 to avoid webhook retries
    if (!foundInPayments && !foundInInvoices) {
      await client.query("COMMIT");
      console.error(
        "No matching record found in either table for:",
        billReference,
      );
      return NextResponse.json(
        { status: "success", message: "No matching record found" },
        { status: 200 },
      );
    }

    const payment = foundInPayments ? paymentRes.rows[0] : null;
    const invoice = foundInInvoices ? invoiceRes.rows[0] : null;

    // Step 5: Update schoolkano_payments if found
    if (foundInPayments) {
      await client.query(
        `UPDATE schoolkano_payments
         SET status = $2, paid_at = $3
         WHERE reference = $1`,
        [
          billReference,
          status.toLowerCase(),
          status.toLowerCase() === "paid" ? paidat || new Date() : null,
        ],
      );
      console.log(
        "schoolkano_payments updated — status:",
        status.toLowerCase(),
      );

      // Step 6: Check if certificate fee — activate license if so, although i think this one is not neccessary
      const feeId = payment?.fee_id;
      const schoolId = payment?.school_id;

      if (
        [1, 2, 3].includes(feeId) &&
        schoolId &&
        status.toLowerCase() === "paid"
      ) {
        await activateLicense(client, schoolId);
        console.log("License activated for school:", schoolId);
      }
    }

    // Step 7: Update schoolkano_invoices if found
    if (foundInInvoices && status.toLowerCase() === "paid") {
      await client.query(
        `UPDATE schoolkano_invoices
         SET status = 'Paid'
         WHERE bill_reference = $1 AND status = 'Unpaid'`,
        [billReference],
      );
      console.log(
        "schoolkano_invoices updated — invoice:",
        invoice?.invoice_number,
      );
    }

    // Step 8: Log to transactionskano
    // Use payment data if available, fall back to invoice data
    const school_id = payment?.school_id ?? invoice?.school_id;
    const amount = payment?.amount ?? invoice?.amount;
    const payment_item = payment?.fee_name ?? `⁠Assessment Fees`;
    const lga = payment?.lga ?? null;

    await client.query(
      `INSERT INTO transactionskano
         (reference, amount, status, payment_method, gateway_response, payment_item, paid_at, created_at, school_id, lga)
       VALUES ($1, $2, $3, 'paykaduna', $4, $5, $6, NOW(), $7, $8)
       ON CONFLICT (reference)
       DO UPDATE SET
         status           = $3,
         gateway_response = $4,
         paid_at          = $6,
         created_at       = NOW(),
         lga              = $8`,
      [
        billReference,
        amount,
        status.toLowerCase() === "paid" ? "Paid" : status,
        paymentGateway || "Unknown",
        payment_item,
        status.toLowerCase() === "paid" ? paidat || new Date() : null,
        school_id,
        lga,
      ],
    );
    console.log("Transaction logged for:", payment_item);

    await client.query("COMMIT");

    return NextResponse.json({
      status: "success",
      message: "Payment processed successfully",
    });
  } catch (error: unknown) {
    await client.query("ROLLBACK");
    console.error("Webhook processing error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";

    return NextResponse.json(
      { status: "error", error: errorMessage },
      { status: 500 },
    );
  } finally {
    client.release();
  }
}
