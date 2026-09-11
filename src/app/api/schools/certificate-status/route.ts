// app/api/schools/certificate-status/route.ts
//
// Whether a school may download its Consent Certificate. Deliberately keyed
// off a real paid row in schoolkano_payments (fee_id 4 — "Issuing of
// Certificate", see FEE_DEFINITIONS in api/schools/fees/route.ts) rather
// than schoolskano.license_status, which a school can currently set itself
// via its own profile form with no verification — that self-report must
// never be treated as equivalent to an actual payment. This is a minimal,
// interim gate; schoolkano_payments is the fact of record until a more
// permanent flow (e.g. deriving license_status only from real payments) is
// established.
import { NextResponse } from "next/server";
import pool from "@/lib/db";

const CERTIFICATE_FEE_ID = 4;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const school_id = searchParams.get("school_id");

    if (!school_id) {
      return NextResponse.json(
        { error: "school_id is required" },
        { status: 400 },
      );
    }

    const result = await pool.query(
      `SELECT paid_at FROM schoolkano_payments
       WHERE school_id = $1 AND fee_id = $2 AND status = 'paid'
       ORDER BY paid_at DESC
       LIMIT 1`,
      [school_id, CERTIFICATE_FEE_ID],
    );

    return NextResponse.json({
      paid: result.rows.length > 0,
      paidAt: result.rows[0]?.paid_at ?? null,
    });
  } catch (error) {
    console.error("Certificate status check failed:", error);
    return NextResponse.json(
      { error: "Failed to check certificate status" },
      { status: 500 },
    );
  }
}
