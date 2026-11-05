// Starts a Credo checkout for an approved monthly PAYE return.
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { requireSchoolAccess } from "@/lib/apiAuth";
import { initializeTransaction } from "@/lib/etransact";
import { generateUniquePaymentReference } from "@/lib/paymentReference";

const GATEWAY_ACTIVE = process.env.CREDO_PUBLIC_KEY !== "STUB_NOT_ACTIVE";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!GATEWAY_ACTIVE) {
    return NextResponse.json(
      { error: "Payment gateway not yet configured for Gombe State. Contact the system administrator." },
      { status: 503 },
    );
  }

  const { id } = await params;
  const returnId = parseInt(id, 10);
  if (isNaN(returnId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  try {
    const { rows } = await pool.query(
      `SELECT r.id, r.declared_paye, r.status, r.reference, r.school_id,
              s.email AS school_email
       FROM paye_returns r
       LEFT JOIN schoolskano s ON s.school_id = r.school_id
       WHERE r.id = $1`,
      [returnId],
    );
    const ret = rows[0];
    if (!ret) {
      return NextResponse.json({ error: "Return not found" }, { status: 404 });
    }

    const denied = await requireSchoolAccess(ret.school_id, []);
    if (denied) return denied;

    if (ret.status !== "unpaid") {
      return NextResponse.json(
        { error: "This return is not available for payment" },
        { status: 400 },
      );
    }

    let reference: string = ret.reference;
    if (!reference) {
      reference = await generateUniquePaymentReference();
      await pool.query(`UPDATE paye_returns SET reference = $1 WHERE id = $2`, [
        reference,
        ret.id,
      ]);
    }

    // Trailing slash stripped defensively — see the return route for why.
    const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
    const { authorizationUrl, gatewayReference } = await initializeTransaction({
      amountNaira: Number(ret.declared_paye),
      email: ret.school_email || "no-reply@gombeprivateuni.example.com",
      reference,
      callbackUrl: `${baseUrl}/api/payments/etransact/return?type=paye&id=${ret.id}`,
    });

    await pool.query(`UPDATE paye_returns SET credo_reference = $1 WHERE id = $2`, [
      gatewayReference,
      ret.id,
    ]);

    return NextResponse.json({ success: true, checkoutUrl: authorizationUrl });
  } catch (error) {
    console.error("PAYE checkout failed:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
