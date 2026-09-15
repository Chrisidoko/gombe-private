// /api/fee-payment/pay-bill/route.ts
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

  try {
    const body = await req.json();
    const { db_id, school_id } = body;

    if (!db_id || !school_id) {
      return NextResponse.json(
        { error: "Missing fee_id or school_id" },
        { status: 400 },
      );
    }

    // Fetch fee details, joined with the school for the email Credo requires
    const feeRes = await client.query(
      `SELECT p.id, p.fee_id, p.fee_name, p.status, p.reference, p.amount, s.email AS school_email
       FROM schoolkano_payments p
       LEFT JOIN schoolskano s ON s.school_id = p.school_id
       WHERE p.id = $1 AND p.school_id = $2`,
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

    // Trailing slash stripped defensively — see the return route for why.
    const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
    const { authorizationUrl, gatewayReference } = await initializeTransaction({
      amountNaira: Number(fee.amount),
      email: fee.school_email || "no-reply@gombeprivateuni.example.com",
      reference: fee.reference,
      callbackUrl: `${baseUrl}/api/payments/etransact/return?type=fee&id=${fee.id}`,
      // 88/12 split applied automatically inside initializeTransaction()
      // via CREDO_SERVICE_CODE (Preconfigured split) — see src/lib/etransact.ts.
    });

    await client.query(
      `UPDATE schoolkano_payments SET credo_reference = $1 WHERE id = $2`,
      [gatewayReference, fee.id],
    );

    return NextResponse.json({
      success: true,
      checkoutUrl: authorizationUrl,
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
