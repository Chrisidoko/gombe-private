// app/api/webhooks/etransact/route.ts
//
// Credo / Etransact webhook receiver.
// Flow: log inbound -> verify X-Credo-Signature -> match our records ->
// hand off to the existing reconcile lib, which re-verifies with the gateway
// (so the webhook body itself is never trusted for amount/status).
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import pool from "@/lib/db";
import {
  reconcileFeePayment,
  reconcileInvoicePayment,
} from "@/lib/reconcileEtransact";

export const runtime = "nodejs"; // needs node crypto + pg
export const dynamic = "force-dynamic";

const ts = () => new Date().toISOString();

function safeEqual(a: string, b: string) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

// SHA512(secretKey + businessCode), hex. Built from OUR env values only.
function expectedSignature(secretKey: string, businessCode: string) {
  return crypto
    .createHash("sha512")
    .update(secretKey + businessCode)
    .digest("hex");
}

type EtransactWebhookBody = {
  event?: string;
  data?: {
    businessCode?: string;
    transRef?: string;
    businessRef?: string;
  };
};

export async function POST(req: NextRequest) {
  const receivedAt = ts();
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";

  // ---- 1. Inbound log (before any validation, so you always see hits) ----
  // The first line in the handler, the INBOUND log, runs before parsing, signature checks or env checks.
  // If a request reaches the route at all, you'll see INBOUND in the logs, even when the signature is wrong or the JSON is bad.
  // So no logs means the request never reached your code.
  console.log(`[etransact-webhook] ${receivedAt} INBOUND ip=${ip}`);

  const secretKey = process.env.CREDO_WEBHOOK_SECRET;
  const businessCode = process.env.CREDO_BUSINESS_CODE;
  if (!secretKey || !businessCode) {
    console.error(`[etransact-webhook] ${ts()} CONFIG_ERROR missing env vars`);
    return NextResponse.json(
      { error: "Server misconfigured" },
      { status: 500 },
    );
  }

  // ---- 2. Parse body ----
  let body: EtransactWebhookBody;
  try {
    body = JSON.parse(await req.text()) as EtransactWebhookBody;
  } catch {
    console.warn(`[etransact-webhook] ${ts()} REJECTED invalid JSON`);
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const event: string | undefined = body?.event;
  const data = body?.data;
  console.log(
    `[etransact-webhook] ${ts()} PARSED event=${event} transRef=${data?.transRef} businessRef=${data?.businessRef}`,
  );

  // ---- 3. Verify signature ----
  const signature = req.headers.get("x-credo-signature") ?? "";
  const signatureOk = safeEqual(
    signature,
    expectedSignature(secretKey, businessCode),
  );
  const businessCodeOk = data?.businessCode === businessCode;

  if (!signatureOk || !businessCodeOk) {
    console.warn(
      `[etransact-webhook] ${ts()} REJECTED invalid signature (signatureOk=${signatureOk}, businessCodeOk=${businessCodeOk})`,
    );
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  // ---- 4. Only act on successful transactions; ack everything else ----
  if (event !== "transaction.successful") {
    console.log(`[etransact-webhook] ${ts()} IGNORED event=${event}`);
    return NextResponse.json({ received: true }, { status: 200 });
  }

  const transRef: string | undefined = data?.transRef;
  const businessRef: string | undefined = data?.businessRef;
  if (!transRef && !businessRef) {
    console.warn(
      `[etransact-webhook] ${ts()} REJECTED no transRef/businessRef`,
    );
    return NextResponse.json({ error: "Missing reference" }, { status: 400 });
  }

  try {
    // ---- 5. Find the record: fee payment first, then invoice ----
    const feeRes = await pool.query(
      `SELECT id FROM schoolkano_payments
       WHERE credo_reference = $1 OR reference = $2
       LIMIT 1`,
      [transRef ?? null, businessRef ?? null],
    );

    if (feeRes.rows[0]) {
      const { isPaid } = await reconcileFeePayment(feeRes.rows[0].id);
      console.log(
        `[etransact-webhook] ${ts()} RECONCILED type=fee id=${feeRes.rows[0].id} isPaid=${isPaid} transRef=${transRef}`,
      );
      return NextResponse.json({ received: true, isPaid }, { status: 200 });
    }

    const invRes = await pool.query(
      `SELECT id FROM schoolkano_invoices
       WHERE credo_reference = $1 OR bill_reference = $2
       LIMIT 1`,
      [transRef ?? null, businessRef ?? null],
    );

    if (invRes.rows[0]) {
      const { isPaid } = await reconcileInvoicePayment(invRes.rows[0].id);
      console.log(
        `[etransact-webhook] ${ts()} RECONCILED type=invoice id=${invRes.rows[0].id} isPaid=${isPaid} transRef=${transRef}`,
      );
      return NextResponse.json({ received: true, isPaid }, { status: 200 });
    }

    // Unknown reference: ack with 200 so Credo doesn't retry forever, but log loudly.
    console.warn(
      `[etransact-webhook] ${ts()} NO_MATCH transRef=${transRef} businessRef=${businessRef}`,
    );
    return NextResponse.json(
      { received: true, matched: false },
      { status: 200 },
    );
  } catch (err) {
    // 500 => Credo retries, which is what we want for transient DB/gateway errors.
    console.error(`[etransact-webhook] ${ts()} ERROR`, err);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}
