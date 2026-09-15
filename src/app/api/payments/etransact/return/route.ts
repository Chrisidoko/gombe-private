// Where Credo sends the payer's browser back after checkout
// (callbackUrl on initialize — see src/lib/etransact.ts). Reconciles
// directly against Credo's verify endpoint (never trusts the redirect
// itself — see reconcileEtransact.ts) then sends the payer back into the
// page they paid from. No webhook yet, so this return-page path plus a
// manual page refresh is the only reconciliation trigger for now.
import { NextResponse } from "next/server";
import { reconcileFeePayment, reconcileInvoicePayment } from "@/lib/reconcileEtransact";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const id = Number(searchParams.get("id"));
  // Trailing slash stripped defensively — a trailing slash here caused a
  // real double-slash checkoutUrl bug in payments-gateway earlier, same
  // string-concatenation pattern.
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");

  const destination = type === "invoice" ? "/Invoices" : "/fees";

  if (!type || !id || Number.isNaN(id)) {
    return NextResponse.redirect(`${baseUrl}${destination}?payment=error`);
  }

  let isPaid = false;
  try {
    if (type === "fee") {
      ({ isPaid } = await reconcileFeePayment(id));
    } else if (type === "invoice") {
      ({ isPaid } = await reconcileInvoicePayment(id));
    }
  } catch (err) {
    console.error("eTransact return reconciliation failed:", err);
  }

  return NextResponse.redirect(`${baseUrl}${destination}?payment=${isPaid ? "success" : "pending"}`);
}
