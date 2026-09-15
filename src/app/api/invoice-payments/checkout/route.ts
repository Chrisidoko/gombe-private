// app/api/invoice-payment/pay/route.ts
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { initializeTransaction } from "@/lib/etransact";

const GATEWAY_ACTIVE = process.env.CREDO_PUBLIC_KEY !== "STUB_NOT_ACTIVE";

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

    // ── Step 3: Initialize a fresh Credo transaction ───────────────────────
    // No session-reuse/caching for now (unlike PayKaduna's cached
    // bill_reference, reused indefinitely) — every "Pay Now" click gets its
    // own Credo session. invoice_number is already a stable, unique
    // identifier, reused directly as Credo's businessRef.
    // Trailing slash stripped defensively — see the return route for why.
    const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
    const { authorizationUrl, gatewayReference } = await initializeTransaction({
      amountNaira: Number(invoice.amount),
      email: invoice.school_email || "no-reply@gombeprivateuni.example.com",
      reference: invoice.invoice_number,
      callbackUrl: `${baseUrl}/api/payments/etransact/return?type=invoice&id=${invoice.id}`,
      // 88/12 split applied automatically inside initializeTransaction()
      // via CREDO_SERVICE_CODE (Preconfigured split) — see src/lib/etransact.ts.
    });

    await client.query(
      `UPDATE schoolkano_invoices SET credo_reference = $1 WHERE id = $2`,
      [gatewayReference, invoice.id],
    );

    return NextResponse.json({ success: true, checkoutUrl: authorizationUrl });
  } catch (error: unknown) {
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
