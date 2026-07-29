// /api/fee-payment/pay-bill/route.ts
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import crypto from "crypto";

const GATEWAY_ACTIVE = process.env.PAYKADUNA_API_KEY !== "STUB_NOT_ACTIVE";

export async function POST(req: Request) {
  if (!GATEWAY_ACTIVE) {
    return NextResponse.json(
      { error: "Payment gateway not yet configured for Gombe State. Contact the system administrator." },
      { status: 503 },
    );
  }

  const client = await pool.connect();

  try {
    const body = await req.json();
    const { db_id, school_id } = body;

    // console.log("🔹 Initiating checkout for fee:", fee_id);

    if (!db_id || !school_id) {
      return NextResponse.json(
        { error: "Missing fee_id or school_id" },
        { status: 400 },
      );
    }

    // Fetch fee details including bill_reference
    const feeRes = await client.query(
      `SELECT id, fee_id, status, reference
   FROM schoolkano_payments
   WHERE id = $1 AND school_id = $2`, // ← query by fee_id + school_id
      [db_id, school_id],
    );

    if (feeRes.rows.length === 0) {
      return NextResponse.json({ error: "Fee not found" }, { status: 404 });
    }

    const fee = feeRes.rows[0];

    if (fee.status !== "unpaid") {
      return NextResponse.json(
        { error: "Fee is already paid" },
        { status: 400 },
      );
    }

    if (!fee.reference) {
      return NextResponse.json(
        { error: "Bill reference not found. Please contact support." },
        { status: 400 },
      );
    }

    // Create checkout session with PayKaduna
    const checkoutPayload = {
      billReference: fee.reference,
    };

    const jsonPayload = JSON.stringify(checkoutPayload);

    // Generate HMAC SHA256 signature
    const apiKey = process.env.PAYKADUNA_API_KEY;
    if (!apiKey) {
      throw new Error("PayKaduna API key not configured");
    }

    const signature = crypto
      .createHmac("sha256", apiKey)
      .update(jsonPayload)
      .digest("base64");

    let baseUrl = process.env.NEXT_PUBLIC_PAYKADUNA_URL || "";
    if (!baseUrl.startsWith("http://") && !baseUrl.startsWith("https://")) {
      baseUrl = `https://${baseUrl}`;
    }
    const apiUrl = `${baseUrl}api/ESBills/CreateESTransaction`;

    // console.log("🔹 Creating checkout session...");
    // console.log("📍 API URL:", apiUrl);
    // console.log("📦 Payload:", checkoutPayload);

    const checkoutResponse = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Signature": signature,
      },
      body: jsonPayload,
    });

    if (!checkoutResponse.ok) {
      const errorData = await checkoutResponse.text();
      console.error("❌ PayKaduna API error:", errorData);
      throw new Error(
        `Checkout creation failed: ${checkoutResponse.statusText}`,
      );
    }

    const checkoutData = await checkoutResponse.json();
    // console.log("✅ Checkout session created:", checkoutData);

    const checkoutUrl = checkoutData.checkoutUrl;

    if (!checkoutUrl) {
      throw new Error("No checkout URL received from PayKaduna");
    }

    // console.log("✅ Redirecting to checkout URL");

    return NextResponse.json({
      success: true,
      checkoutUrl,
    });
  } catch (error: unknown) {
    console.error(" Error creating checkout:", error);

    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  } finally {
    client.release();
  }
}
