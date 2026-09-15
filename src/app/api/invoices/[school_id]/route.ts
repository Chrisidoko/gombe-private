//This is specifically to fetch invoice by school_Id - PLEASE NOTE
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { reconcileInvoicePayment } from "@/lib/reconcileEtransact";

export async function GET(
  _req: Request,
  context: { params: Promise<{ school_id: string }> }
) {
  try {
    const { school_id } = await context.params; // 👈 awaited before use

    const query = `
      SELECT id, invoice_number, title, amount, status, issue_date, due_date
      FROM schoolkano_invoices
      WHERE school_id = $1
      ORDER BY issue_date DESC
    `;
    const { rows } = await pool.query(query, [school_id]);

    // Re-verify any invoice still "Unpaid" with an attempted Credo checkout —
    // no webhook yet, so this is what catches a payment completed after the
    // payer closed the checkout tab without the return redirect firing.
    // reconcileInvoicePayment() itself no-ops (a single SELECT, no Credo
    // call) for anything without a credo_reference, so this stays cheap on
    // every normal page load.
    for (const row of rows) {
      if (row.status !== "Unpaid") continue;
      try {
        const { isPaid } = await reconcileInvoicePayment(row.id);
        if (isPaid) row.status = "Paid";
      } catch (err) {
        console.error(`Reconcile check failed for invoice ${row.id}:`, err);
      }
    }

    return NextResponse.json({ invoices: rows });
  } catch (error) {
    console.error("Error fetching invoices:", error);
    return NextResponse.json(
      { error: "Failed to fetch invoices" },
      { status: 500 }
    );
  }
}
