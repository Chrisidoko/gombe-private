// lib/taxAudit.ts
// Every liability on record for each school, across the annual notice, the
// Ministry's Compliance Standing fees, and invoices. schoolkano_payments rows
// only exist once a school opens its fees page, so an approved school that
// never has would look clear; its standing fees are added from the schedule.
import pool from "@/lib/db";
import { FEE_DEFINITIONS, resolveTier } from "@/lib/feeDefinitions";

// Owed by every approved school from the start. Certificate and Annual Renewal
// are left out because they depend on later conditions.
const STANDING_FEE_IDS = [1, 2, 3, 5];

export type Liability = {
  school_id: string;
  source: "Annual Notice" | "Compliance Standing" | "Invoice";
  head: string;
  subhead: string;
  year: number;
  assessed: number | null;
  paid: number;
  outstanding: number;
  status: string;
  due_date: string | null;
  overdue: boolean;
  reference: string | null;
  declaration_source: string | null;
  evidence_url: string | null;
  objection_pending: boolean;
};

const UNCLASSIFIED = "Unclassified";

export async function getLiabilities(year: number | null) {
  const { rows } = await pool.query(
    `SELECT n.school_id, 'Annual Notice' AS source, h.name AS head, s.name AS subhead,
            n.year, l.amount AS assessed,
            CASE WHEN l.status = 'paid' THEN l.amount ELSE 0 END AS paid,
            l.status, l.due_date, n.notice_number AS reference,
            d.source AS declaration_source, d.evidence_url,
            EXISTS (
              SELECT 1 FROM notice_objections o
              WHERE o.line_id = l.id AND o.status = 'pending'
            ) AS objection_pending
     FROM annual_notice_lines l
     JOIN annual_notices n ON n.id = l.notice_id AND n.status = 'issued'
     JOIN revenue_subheads s ON s.id = l.revenue_subhead_id
     JOIN revenue_heads h ON h.id = s.head_id
     LEFT JOIN tax_declarations d ON d.line_id = l.id AND d.status = 'approved'

     UNION ALL

     SELECT p.school_id, 'Compliance Standing', COALESCE(h.name, $1), COALESCE(s.name, p.fee_name),
            COALESCE(p.fee_year, EXTRACT(YEAR FROM COALESCE(p.paid_at, p.created_at))::integer),
            p.amount::numeric,
            CASE WHEN p.status = 'paid' THEN p.amount::numeric ELSE 0 END,
            CASE WHEN p.status = 'paid' THEN 'paid' ELSE 'unpaid' END,
            NULL::date, p.reference, NULL, NULL, false
     FROM schoolkano_payments p
     LEFT JOIN revenue_subheads s ON s.fee_id = p.fee_id
     LEFT JOIN revenue_heads h ON h.id = s.head_id

     UNION ALL

     SELECT i.school_id, 'Invoice', COALESCE(h.name, $1), COALESCE(i.title, s.name, 'Invoice'),
            EXTRACT(YEAR FROM i.issue_date)::integer,
            i.amount,
            CASE WHEN LOWER(i.status) = 'paid' THEN i.amount ELSE 0 END,
            CASE WHEN LOWER(i.status) = 'paid' THEN 'paid' ELSE 'unpaid' END,
            i.due_date, i.invoice_number, NULL, NULL, false
     FROM schoolkano_invoices i
     LEFT JOIN revenue_subheads s ON s.id = i.revenue_subhead_id
     LEFT JOIN revenue_heads h ON h.id = s.head_id`,
    [UNCLASSIFIED],
  );

  const today = new Date(new Date().setHours(0, 0, 0, 0));
  const liabilities: Liability[] = rows.map((r) => {
    const assessed = r.assessed === null ? null : Number(r.assessed);
    const paid = Number(r.paid);
    return {
      ...r,
      assessed,
      paid,
      outstanding: r.status === "unpaid" ? (assessed ?? 0) - paid : 0,
      overdue:
        r.status === "unpaid" && !!r.due_date && new Date(r.due_date) < today,
    };
  });

  const approved = await pool.query(
    `SELECT school_id, category FROM schoolskano WHERE approval_status = 'approved'`,
  );
  const billed = await pool.query(
    `SELECT school_id, fee_id FROM schoolkano_payments WHERE fee_id = ANY($1)`,
    [STANDING_FEE_IDS],
  );
  const billedKeys = new Set(billed.rows.map((b) => `${b.school_id}:${b.fee_id}`));
  const currentYear = new Date().getFullYear();
  const standingFees = FEE_DEFINITIONS.filter((f) =>
    STANDING_FEE_IDS.includes(f.id),
  );
  const subheads = await pool.query(
    `SELECT s.fee_id, s.name, h.name AS head_name
     FROM revenue_subheads s
     JOIN revenue_heads h ON h.id = s.head_id
     WHERE s.fee_id = ANY($1)`,
    [STANDING_FEE_IDS],
  );

  for (const school of approved.rows) {
    for (const fee of standingFees) {
      if (billedKeys.has(`${school.school_id}:${fee.id}`)) continue;
      const subhead = subheads.rows.find((s) => s.fee_id === fee.id);
      const amount = fee.amounts[resolveTier(school.category)];
      liabilities.push({
        school_id: school.school_id,
        source: "Compliance Standing",
        head: subhead?.head_name ?? UNCLASSIFIED,
        subhead: subhead?.name ?? fee.name,
        year: currentYear,
        assessed: amount,
        paid: 0,
        outstanding: amount,
        status: "unpaid",
        due_date: null,
        overdue: false,
        reference: null,
        declaration_source: null,
        evidence_url: null,
        objection_pending: false,
      });
    }
  }

  return year === null
    ? liabilities
    : liabilities.filter((l) => l.year === year);
}

export async function getTaxAudit(year: number | null) {
  const liabilities = await getLiabilities(year);
  const { rows: schools } = await pool.query(
    `SELECT school_id, name, tin, lga FROM schoolskano WHERE school_id = ANY($1)`,
    [Array.from(new Set(liabilities.map((l) => l.school_id)))],
  );

  return schools
    .map((school) => {
      const lines = liabilities
        .filter((l) => l.school_id === school.school_id)
        .sort((a, b) => b.year - a.year || a.head.localeCompare(b.head));
      return {
        ...school,
        assessed: lines.reduce((t, l) => t + (l.assessed ?? 0), 0),
        paid: lines.reduce((t, l) => t + l.paid, 0),
        outstanding: lines.reduce((t, l) => t + l.outstanding, 0),
        overdue: lines.reduce((t, l) => t + (l.overdue ? l.outstanding : 0), 0),
        awaiting_declarations: lines.filter(
          (l) => l.status === "awaiting_declaration",
        ).length,
        open_objections: lines.filter((l) => l.objection_pending).length,
        lines,
      };
    })
    .sort((a, b) => b.outstanding - a.outstanding);
}
