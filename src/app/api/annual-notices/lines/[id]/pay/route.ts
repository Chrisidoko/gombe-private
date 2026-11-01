// Starts a Credo checkout for one line of a school's annual notice.
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
  const lineId = parseInt(id, 10);
  if (isNaN(lineId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  try {
    const { rows } = await pool.query(
      `SELECT l.id, l.amount, l.status, l.reference, n.school_id, n.status AS notice_status,
              s.email AS school_email
       FROM annual_notice_lines l
       JOIN annual_notices n ON n.id = l.notice_id
       LEFT JOIN schoolskano s ON s.school_id = n.school_id
       WHERE l.id = $1`,
      [lineId],
    );
    const line = rows[0];
    if (!line) {
      return NextResponse.json({ error: "Line not found" }, { status: 404 });
    }

    // Only the school itself pays; staff have no reason to start a checkout
    const denied = await requireSchoolAccess(line.school_id, []);
    if (denied) return denied;

    if (line.notice_status !== "issued" || line.status !== "unpaid") {
      return NextResponse.json(
        { error: "This item is not available for payment" },
        { status: 400 },
      );
    }

    const objection = await pool.query(
      `SELECT 1 FROM notice_objections WHERE line_id = $1 AND status = 'pending'`,
      [line.id],
    );
    if (objection.rows.length > 0) {
      return NextResponse.json(
        { error: "This item has an objection under review" },
        { status: 400 },
      );
    }

    let reference: string = line.reference;
    if (!reference) {
      reference = await generateUniquePaymentReference();
      await pool.query(
        `UPDATE annual_notice_lines SET reference = $1 WHERE id = $2`,
        [reference, line.id],
      );
    }

    // Trailing slash stripped defensively — see the return route for why.
    const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
    const { authorizationUrl, gatewayReference } = await initializeTransaction({
      amountNaira: Number(line.amount),
      email: line.school_email || "no-reply@gombeprivateuni.example.com",
      reference,
      callbackUrl: `${baseUrl}/api/payments/etransact/return?type=notice&id=${line.id}`,
    });

    await pool.query(
      `UPDATE annual_notice_lines SET credo_reference = $1 WHERE id = $2`,
      [gatewayReference, line.id],
    );

    return NextResponse.json({ success: true, checkoutUrl: authorizationUrl });
  } catch (error) {
    console.error("Notice line checkout failed:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
