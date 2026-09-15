// Credo Central ("eTransact") client — direct integration, sharing the same
// Credo merchant account as payments-gateway (see PAYMENTS_GATEWAY.md's
// "Why this exists": this app's payment confirmations trigger private-uni-
// specific side effects — license activation — that don't fit
// payments-gateway's generic external-partner model, so this is its own
// integration rather than routed through that service).
//
// Deliberately minimal for now: initialize + verify only, no webhook
// signature verification (deferred — see reconcileEtransact.ts, which
// relies purely on the return-page/verify path, the same "poll/return page
// reconciles independently of any webhook" pattern payments-gateway already
// proved out).
//
// Docs: https://docs.credocentral.com/docs/developers/accept-payments

const CREDO_BASE_URL = process.env.CREDO_BASE_URL || "https://api.credodemo.com";
const REQUEST_TIMEOUT_MS = 15_000;

export class EtransactError extends Error {
  status: number | null;
  body: unknown;
  constructor(message: string, status: number | null = null, body: unknown = null) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

async function credoFetch(
  path: string,
  { authKey, body }: { authKey: string; body?: unknown },
) {
  const url = `${CREDO_BASE_URL}${path}`;

  let res: Response;
  try {
    res = await fetch(url, {
      method: body ? "POST" : "GET",
      headers: { Authorization: authKey, "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (err) {
    if (err instanceof Error && err.name === "TimeoutError") {
      throw new EtransactError(`Credo request to ${path} timed out after ${REQUEST_TIMEOUT_MS}ms.`);
    }
    throw err;
  }

  const payload = await res.json().catch(() => null);

  if (!res.ok || !payload || payload.status !== 200) {
    console.error("Credo request failed:", path, res.status, payload);
    throw new EtransactError(
      `Credo request to ${path} failed: ${res.status} ${res.statusText}`,
      res.status,
      payload,
    );
  }

  return payload.data;
}

// amount is Naira — converted to kobo here, matching payments-gateway's
// convention of keeping unit conversion inside the gateway client, never at
// the DB layer.
export async function initializeTransaction({
  amountNaira,
  email,
  reference,
  callbackUrl,
}: {
  amountNaira: number;
  email: string;
  reference: string;
  callbackUrl: string;
}) {
  const publicKey = process.env.CREDO_PUBLIC_KEY;
  if (!publicKey) throw new Error("CREDO_PUBLIC_KEY not configured");

  const body: Record<string, unknown> = {
    amount: Math.round(amountNaira * 100),
    email,
    currency: "NGN",
    // 1 = merchant bears the transaction fee (Gombe State absorbs it,
    // rather than adding it on top of what the school/payer is charged).
    // https://docs.credocentral.com/docs/settlement
    bearer: 1,
    channels: ["CARD", "BANK"],
    initializeAccount: 0,
    reference,
    callbackUrl,
  };

  // 88/12 govt/PayPro-Zenith split — fixed for every gombe-privateuni
  // transaction (unlike payments-gateway's external partners, who each need
  // their own split, hence that service's DB-backed Dynamic split instead).
  // A single fixed policy is exactly what Credo's Preconfigured split is
  // for: set up once in Credo's dashboard, referenced here by code.
  // https://docs.credocentral.com/docs/settlement/dynamic
  if (process.env.CREDO_SERVICE_CODE) {
    body.serviceCode = process.env.CREDO_SERVICE_CODE;
  }

  const data = await credoFetch("/transaction/initialize", { authKey: publicKey, body });

  return {
    authorizationUrl: data.authorizationUrl as string,
    gatewayReference: data.credoReference as string,
  };
}

export async function verifyTransaction(transRef: string) {
  const secretKey = process.env.CREDO_SECRET_KEY;
  if (!secretKey) throw new Error("CREDO_SECRET_KEY not configured");

  const data = await credoFetch(`/transaction/${encodeURIComponent(transRef)}/verify`, {
    authKey: secretKey,
  });

  return {
    transRef: data.transRef as string,
    businessRef: data.businessRef as string,
    // Naira — confirmed against a real webhook example in payments-gateway
    // (transAmount 1000.0, transFeeAmount 15.0, settlementAmount 985.0 —
    // only makes sense as Naira). See PAYMENTS_GATEWAY.md's eTransact
    // section for the full reasoning.
    amount: data.transAmount as number,
    isPaid: data.status === 0,
    raw: data,
  };
}
