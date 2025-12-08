// /api/payment/checkout/route.ts
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import crypto from "crypto";

export async function POST(req: Request) {
  const client = await pool.connect();

  try {
    const body = await req.json();
    const { invoice_id } = body;

    console.log("🔹 Initiating checkout for invoice:", invoice_id);

    if (!invoice_id) {
      return NextResponse.json(
        { error: "Missing invoice_id" },
        { status: 400 }
      );
    }

    // Fetch invoice details including tpui and bill_reference
    const invoiceRes = await client.query(
      `SELECT id, invoice_number, bill_reference, tpui, amount, status, school_id 
       FROM schoolkano_invoices 
       WHERE id = $1`,
      [invoice_id]
    );

    if (invoiceRes.rows.length === 0) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const invoice = invoiceRes.rows[0];

    if (invoice.status !== "Unpaid") {
      return NextResponse.json(
        { error: "Invoice is already paid" },
        { status: 400 }
      );
    }

    if (!invoice.bill_reference) {
      return NextResponse.json(
        { error: "Bill reference not found. Please contact support." },
        { status: 400 }
      );
    }

    if (!invoice.tpui) {
      return NextResponse.json(
        { error: "TPUI not found. Please contact support." },
        { status: 400 }
      );
    }

    // Create checkout session with PayKaduna
    const checkoutPayload = {
      tpui: invoice.tpui,
      billReference: invoice.bill_reference,
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

    console.log("🔹 Creating checkout session...");
    console.log("📍 API URL:", apiUrl);
    console.log("📦 Payload:", checkoutPayload);

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
        `Checkout creation failed: ${checkoutResponse.statusText}`
      );
    }

    const checkoutData = await checkoutResponse.json();
    console.log("✅ Checkout session created:", checkoutData);

    const checkoutUrl = checkoutData.checkoutUrl;

    if (!checkoutUrl) {
      throw new Error("No checkout URL received from PayKaduna");
    }

    console.log("✅ Redirecting to checkout URL");

    return NextResponse.json({
      success: true,
      checkoutUrl,
    });
  } catch (error: unknown) {
    console.error("🔥 Error creating checkout:", error);

    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  } finally {
    client.release();
  }
}
