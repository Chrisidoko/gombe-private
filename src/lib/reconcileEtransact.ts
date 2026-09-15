// Reconciles one Credo transaction against schoolkano_payments (fees) or
// schoolkano_invoices (invoices). No webhook yet (deferred — see
// PAYMENTS_GATEWAY.md discussion) — this is called from the return-page
// route only, the same "verify directly with the gateway, never trust a
// redirect" principle payments-gateway's own reconcile.js already proved
// out. Only ever transitions unpaid -> paid, same reasoning: verify()'s
// non-zero status codes beyond "0 = successful" aren't documented, so this
// doesn't guess at a "failed" mapping.
import pool from "@/lib/db";
import { verifyTransaction } from "@/lib/etransact";
import { activateLicense } from "@/lib/activateLicense";

type ReconcileResult = { isPaid: boolean };

async function upsertTransactionskano(
  client: import("pg").PoolClient,
  {
    reference,
    amount,
    paymentMethod,
    gatewayResponse,
    paymentItem,
    schoolId,
  }: {
    reference: string;
    amount: number;
    paymentMethod: string;
    gatewayResponse: unknown;
    paymentItem: string;
    schoolId: string | null;
  },
) {
  let lga: string | null = null;
  let category: string | null = null;
  if (schoolId) {
    const schoolRes = await client.query(
      `SELECT lga, category FROM schoolskano WHERE school_id = $1`,
      [schoolId],
    );
    lga = schoolRes.rows[0]?.lga ?? null;
    category = schoolRes.rows[0]?.category ?? null;
  }

  const paidAt = new Date();
  await client.query(
    `INSERT INTO transactionskano
       (reference, amount, status, payment_method, gateway_response, payment_item, paid_at, created_at, school_id, lga, category)
     VALUES ($1, $2, 'Paid', $3, $4, $5, $6, NOW(), $7, $8, $9)
     ON CONFLICT (reference) DO UPDATE SET
       status = 'Paid', gateway_response = $4, paid_at = $6, lga = $8, category = $9`,
    [reference, amount, paymentMethod, JSON.stringify(gatewayResponse), paymentItem, paidAt, schoolId, lga, category],
  );
}

export async function reconcileFeePayment(feeId: number): Promise<ReconcileResult> {
  const client = await pool.connect();
  try {
    const { rows } = await client.query(
      `SELECT id, school_id, fee_id, fee_name, amount, status, reference, credo_reference
       FROM schoolkano_payments WHERE id = $1`,
      [feeId],
    );
    const fee = rows[0];
    if (!fee || fee.status === "paid" || !fee.credo_reference) {
      return { isPaid: fee?.status === "paid" };
    }

    const verified = await verifyTransaction(fee.credo_reference);
    const amountMatches = Number(verified.amount) === Number(fee.amount);
    if (!verified.isPaid || !amountMatches) return { isPaid: false };

    await client.query("BEGIN");
    try {
      await client.query(
        `UPDATE schoolkano_payments SET status = 'paid', paid_at = NOW() WHERE id = $1 AND status != 'paid'`,
        [feeId],
      );

      if ([1, 2, 3].includes(fee.fee_id) && fee.school_id) {
        await activateLicense(client, fee.school_id);
      }

      await upsertTransactionskano(client, {
        reference: fee.reference,
        amount: fee.amount,
        paymentMethod: "etransact",
        gatewayResponse: verified.raw,
        paymentItem: fee.fee_name,
        schoolId: fee.school_id,
      });

      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    }

    return { isPaid: true };
  } finally {
    client.release();
  }
}

export async function reconcileInvoicePayment(invoiceId: number): Promise<ReconcileResult> {
  const client = await pool.connect();
  try {
    const { rows } = await client.query(
      `SELECT id, school_id, invoice_number, amount, status, bill_reference, credo_reference
       FROM schoolkano_invoices WHERE id = $1`,
      [invoiceId],
    );
    const invoice = rows[0];
    if (!invoice || invoice.status === "Paid" || !invoice.credo_reference) {
      return { isPaid: invoice?.status === "Paid" };
    }

    const verified = await verifyTransaction(invoice.credo_reference);
    const amountMatches = Number(verified.amount) === Number(invoice.amount);
    if (!verified.isPaid || !amountMatches) return { isPaid: false };

    await client.query("BEGIN");
    try {
      await client.query(
        `UPDATE schoolkano_invoices SET status = 'Paid' WHERE id = $1 AND status = 'Unpaid'`,
        [invoiceId],
      );

      await upsertTransactionskano(client, {
        reference: invoice.bill_reference,
        amount: invoice.amount,
        paymentMethod: "etransact",
        gatewayResponse: verified.raw,
        paymentItem: `Assessment Invoice ${invoice.invoice_number}`,
        schoolId: invoice.school_id,
      });

      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    }

    return { isPaid: true };
  } finally {
    client.release();
  }
}
