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

const CERTIFICATE_FEE_ID = 4;

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
    revenueSubheadId,
  }: {
    reference: string;
    amount: number;
    paymentMethod: string;
    gatewayResponse: unknown;
    paymentItem: string;
    schoolId: string | null;
    revenueSubheadId: number | null;
  },
) {
  let lga: string | null = null;
  let category: string | null = null;
  let payerName: string | null = null;

  if (schoolId) {
    const schoolRes = await client.query(
      `SELECT lga, category, name FROM schoolskano WHERE school_id = $1`,
      [schoolId],
    );
    lga = schoolRes.rows[0]?.lga ?? null;
    category = schoolRes.rows[0]?.category ?? null;
    payerName = schoolRes.rows[0]?.name ?? null;
  }

  const paidAt = new Date();
  await client.query(
    `INSERT INTO transactionskano
     (reference, amount, status, payment_method, gateway_response, payment_item, paid_at, created_at, school_id, lga, category, payer_name, revenue_subhead_id)
   VALUES ($1, $2, 'Paid', $3, $4, $5, $6, NOW(), $7, $8, $9, $10, $11)
   ON CONFLICT (reference) DO UPDATE SET
     status = 'Paid', gateway_response = $4, paid_at = $6, lga = $8, category = $9,
     payer_name = COALESCE(transactionskano.payer_name, $10),
     revenue_subhead_id = COALESCE(transactionskano.revenue_subhead_id, $11)`,
    [
      reference,
      amount,
      paymentMethod,
      JSON.stringify(gatewayResponse),
      paymentItem,
      paidAt,
      schoolId,
      lga,
      category,
      payerName,
      revenueSubheadId,
    ],
  );
}

export async function reconcileFeePayment(
  feeId: number,
): Promise<ReconcileResult> {
  const client = await pool.connect();
  try {
    const { rows } = await client.query(
      `SELECT p.id, p.school_id, p.fee_id, p.fee_name, p.amount, p.status, p.reference, p.credo_reference,
              (SELECT s.id FROM revenue_subheads s WHERE s.fee_id = p.fee_id) AS revenue_subhead_id
       FROM schoolkano_payments p WHERE p.id = $1`,
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
      const upd = await client.query(
        `UPDATE schoolkano_payments SET status = 'paid', paid_at = NOW()
         WHERE id = $1 AND status != 'paid'`,
        [feeId],
      );

      // The certificate is issued once, by its own fee. rowCount guards
      // against activating again on a repeat confirmation of the same payment.
      if (
        upd.rowCount === 1 &&
        fee.fee_id === CERTIFICATE_FEE_ID &&
        fee.school_id
      ) {
        await activateLicense(client, fee.school_id);
      }

      await upsertTransactionskano(client, {
        reference: fee.reference,
        amount: fee.amount,
        paymentMethod: "etransact",
        gatewayResponse: verified.raw,
        paymentItem: fee.fee_name,
        schoolId: fee.school_id,
        revenueSubheadId: fee.revenue_subhead_id,
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

export async function reconcileInvoicePayment(
  invoiceId: number,
): Promise<ReconcileResult> {
  const client = await pool.connect();
  try {
    const { rows } = await client.query(
      `SELECT id, school_id, invoice_number, title, amount, status, bill_reference, credo_reference, revenue_subhead_id
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
        reference: invoice.invoice_number,
        amount: invoice.amount,
        paymentMethod: "etransact",
        gatewayResponse: verified.raw,
        paymentItem: invoice.title || "Assessment Invoice",
        schoolId: invoice.school_id,
        revenueSubheadId: invoice.revenue_subhead_id,
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

export async function reconcileNoticeLine(
  lineId: number,
): Promise<ReconcileResult> {
  const client = await pool.connect();
  try {
    const { rows } = await client.query(
      `SELECT l.id, l.amount, l.status, l.reference, l.credo_reference, l.revenue_subhead_id,
              n.school_id, n.year, s.name AS subhead_name
       FROM annual_notice_lines l
       JOIN annual_notices n ON n.id = l.notice_id
       JOIN revenue_subheads s ON s.id = l.revenue_subhead_id
       WHERE l.id = $1`,
      [lineId],
    );
    const line = rows[0];
    if (!line || line.status === "paid" || !line.credo_reference) {
      return { isPaid: line?.status === "paid" };
    }

    const verified = await verifyTransaction(line.credo_reference);
    const amountMatches = Number(verified.amount) === Number(line.amount);
    if (!verified.isPaid || !amountMatches) return { isPaid: false };

    await client.query("BEGIN");
    try {
      await client.query(
        `UPDATE annual_notice_lines SET status = 'paid', paid_at = NOW()
         WHERE id = $1 AND status = 'unpaid'`,
        [lineId],
      );

      await upsertTransactionskano(client, {
        reference: line.reference,
        amount: line.amount,
        paymentMethod: "etransact",
        gatewayResponse: verified.raw,
        paymentItem: `${line.subhead_name} ${line.year}`,
        schoolId: line.school_id,
        revenueSubheadId: line.revenue_subhead_id,
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
