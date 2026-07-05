// app/api/invoice-payment/pay/route.ts
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

  let invoice_id: string | number | undefined;

  try {
    const body = await req.json();
    invoice_id = body.invoice_id;

    if (!invoice_id) {
      return NextResponse.json(
        { error: "invoice_id is required" },
        { status: 400 },
      );
    }

    // ── Step 1: Fetch invoice + school info in one query ──────────────────
    const invoiceRes = await client.query(
      `SELECT
         i.id,
         i.school_id,
         i.invoice_number,
         i.amount,
         i.status,
         i.bill_reference,
         i.is_creating_bill,
         s.name    AS school_name,
         s.phone   AS school_phone,
         s.address AS school_address,
         s.email   AS school_email
       FROM schoolkano_invoices i
       LEFT JOIN schoolskano s ON s.school_id = i.school_id
       WHERE i.id = $1`,
      [invoice_id],
    );

    if (invoiceRes.rows.length === 0) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const invoice = invoiceRes.rows[0];

    // ── Step 2: Guard checks ──────────────────────────────────────────────
    if (invoice.status === "Paid") {
      return NextResponse.json(
        { error: "This invoice has already been paid" },
        { status: 400 },
      );
    }

    if (invoice.is_creating_bill) {
      return NextResponse.json(
        {
          error:
            "Payment is already being processed. Please wait a moment and try again.",
        },
        { status: 429 },
      );
    }

    // ── Step 3: If bill reference already exists — go straight to checkout ─
    if (invoice.bill_reference) {
      const checkoutUrl = `https://paykaduna.com/make_payment_tsp?ref=${invoice.bill_reference}`;
      return NextResponse.json({ success: true, checkoutUrl });
    }

    // ── Step 4: No bill reference — create one now ─────────────────────────
    // Lock the row to prevent duplicate creation from parallel requests
    await client.query(
      `UPDATE schoolkano_invoices SET is_creating_bill = true WHERE id = $1`,
      [invoice_id],
    );

    const apiKey = process.env.PAYKADUNA_API_KEY;
    if (!apiKey) throw new Error("PayKaduna API key not configured");

    // Build bill payload
    const nameParts = (invoice.school_name || "School").split(" ");
    const firstName = nameParts[0] || invoice.school_name;
    const middleName = nameParts[1] || "";
    const lastName =
      nameParts.length > 2 ? nameParts.slice(2).join(" ") : nameParts[0];

    const billPayload = {
      engineCode: process.env.PAYKADUNA_ENGINE_CODE,
      identifier: `${invoice.school_id}`, // Unique identifier for this bill --- stable per school, remains the same all through, allows idempotency per school
      firstName,
      middleName,
      lastName,
      address: invoice.school_address || "Kaduna, Nigeria",
      telephone: invoice.school_phone || "08000000000",
      esBillDetailsDto: [
        {
          amount: parseFloat(invoice.amount),
          mdasId: parseInt(process.env.MDAS_ID || "3654"),
          narration: `Assessment Invoice ${invoice.invoice_number} — ${invoice.school_name}`,
        },
      ],
    };

    const jsonPayload = JSON.stringify(billPayload);
    const signature = crypto
      .createHmac("sha256", apiKey)
      .update(jsonPayload)
      .digest("base64");

    let baseUrl = process.env.NEXT_PUBLIC_PAYKADUNA_URL || "";
    if (!baseUrl.startsWith("http://") && !baseUrl.startsWith("https://")) {
      baseUrl = `https://${baseUrl}`;
    }

    console.log("Creating bill for invoice:", invoice.invoice_number);

    const billResponse = await fetch(`${baseUrl}api/ESBills/CreateESBill`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Signature": signature,
      },
      body: jsonPayload,
    });

    if (!billResponse.ok) {
      const errText = await billResponse.text();
      console.error("PayKaduna bill creation error:", errText);

      // Release the lock before returning error
      await client.query(
        `UPDATE schoolkano_invoices SET is_creating_bill = false WHERE id = $1`,
        [invoice_id],
      );

      throw new Error(`Bill creation failed: ${billResponse.statusText}`);
    }

    const billData = await billResponse.json();
    const billReference = billData.bill?.billReference || null;

    if (!billReference) {
      await client.query(
        `UPDATE schoolkano_invoices SET is_creating_bill = false WHERE id = $1`,
        [invoice_id],
      );
      throw new Error("No bill reference returned from PayKaduna");
    }

    console.log("Bill created:", billReference);

    // ── Step 5: Save bill reference and release lock ───────────────────────
    await client.query(
      `UPDATE schoolkano_invoices
       SET bill_reference    = $1,
           is_creating_bill  = false
       WHERE id = $2`,
      [billReference, invoice_id],
    );

    // ── Step 6: Return checkout URL ───────────────────────────────────────
    const checkoutUrl = `https://paykaduna.com/make_payment_tsp?ref=${billReference}`;

    return NextResponse.json({ success: true, checkoutUrl });
  } catch (error: unknown) {
    // Always release the lock on any unhandled error
    if (invoice_id) {
      await client
        .query(
          `UPDATE schoolkano_invoices SET is_creating_bill = false WHERE id = $1`,
          [invoice_id],
        )
        .catch(() => {}); // silently ignore if this also fails
    }
    console.error("Invoice payment error:", error);

    const message =
      error instanceof Error ? error.message : "An unknown error occurred";

    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  } finally {
    client.release();
  }
}
