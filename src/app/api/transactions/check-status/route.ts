// Manually re-verifies one transaction with Credo — the finance/operator
// transaction tables' "Check status" action. Closes the gap the return-page
// redirect and focus-triggered re-fetch (see src/app/api/schools/fees/route.ts,
// src/app/api/invoices/[school_id]/route.ts) don't cover: a payer who never
// revisits their own fees/Invoices page leaves nothing to trigger
// reconciliation on its own — staff can force it here instead. No webhook
// yet, so this is one of three reconciliation triggers, same reasoning
// throughout this integration.
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { reconcileFeePayment, reconcileInvoicePayment } from "@/lib/reconcileEtransact";

export async function POST(req: Request) {
  try {
    const { reference } = await req.json();
    if (!reference || typeof reference !== "string") {
      return NextResponse.json({ error: "reference is required" }, { status: 400 });
    }

    // transactionskano.reference is the businessRef used at Credo initialize
    // time — schoolkano_payments.reference for fees, schoolkano_invoices.
    // invoice_number for invoices (see src/app/api/fee-payment/pay-bill and
    // invoice-payments/checkout routes). Same dual lookup the old PayKaduna
    // webhook used to route between the two tables.
    const feeRes = await pool.query(
      `SELECT id FROM schoolkano_payments WHERE reference = $1`,
      [reference],
    );
    if (feeRes.rows.length > 0) {
      const { isPaid } = await reconcileFeePayment(feeRes.rows[0].id);
      return NextResponse.json({ success: true, isPaid });
    }

    const invoiceRes = await pool.query(
      `SELECT id FROM schoolkano_invoices WHERE invoice_number = $1`,
      [reference],
    );
    if (invoiceRes.rows.length > 0) {
      const { isPaid } = await reconcileInvoicePayment(invoiceRes.rows[0].id);
      return NextResponse.json({ success: true, isPaid });
    }

    return NextResponse.json(
      { error: "Not a fee or invoice payment — can't be re-checked from here." },
      { status: 404 },
    );
  } catch (error) {
    console.error("Transaction status check failed:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
