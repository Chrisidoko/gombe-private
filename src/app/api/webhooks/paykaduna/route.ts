// /api/webhooks/paykaduna/route.ts
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import crypto from "crypto";
import { activateLicense } from "@/lib/activateLicense";

export async function POST(req: Request) {
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

    // Step 4: Find the fee payment row by bill reference
    const paymentRes = await client.query(
      `SELECT id, school_id, fee_id, fee_name, amount, status, lga, reference
       FROM schoolkano_payments
       WHERE reference = $1`,
      [billReference],
    );

    // If not found in schoolkano_payments — genuine 404, return 200 to avoid retries
    if (paymentRes.rows.length === 0) {
      await client.query("ROLLBACK");
      console.error(
        "No payment record found for bill reference:",
        billReference,
      );
      return NextResponse.json(
        { status: "success", message: "Payment record found" },
        { status: 200 },
      );
    }

    const payment = paymentRes.rows[0];
    console.log("Payment record found:", payment);

    // Step 5: Update schoolkano_payments status
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
    console.log("payments updated — status:", status.toLowerCase());

    // Step 6
    // ── Check if this is a certificate fee payment ──────────────────────
    const paymentRow = await client.query(
      `SELECT fee_id, school_id FROM schoolkano_payments
     WHERE reference = $1`,
      [billReference],
    );

    const feeId = paymentRow.rows[0]?.fee_id;
    const schoolId = paymentRow.rows[0]?.school_id;

    // Certificate fee ids are 1, 2, 3
    if ([1, 2, 3].includes(feeId) && schoolId) {
      await activateLicense(client, schoolId);
    }

    // Step 7: Log to transactionskano
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
         lga = $8
         `,

      [
        billReference,
        payment.amount,
        status.toLowerCase() === "paid" ? "Paid" : status,
        paymentGateway || "Unknown",
        payment.fee_name, // ← from schoolkano_payments
        status.toLowerCase() === "paid" ? paidat || new Date() : null,
        payment.school_id,
        payment.lga,
      ],
    );
    console.log("Transaction logged for fee:", payment.fee_name);

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
