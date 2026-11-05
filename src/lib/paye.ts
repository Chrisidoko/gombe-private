// lib/paye.ts
// Monthly PAYE returns. A school owes one for every month from PAYE_FIRST_PERIOD
// or its first annual notice, whichever is later, filed and paid by the 10th
// of the following month.
import pool from "@/lib/db";
import { PAYE_FIRST_PERIOD, PAYE_SUBHEAD_CODE } from "@/lib/payeShared";

export * from "@/lib/payeShared";

// Months the school owes a return for, up to the current one, as
// first-of-month dates with their filing due date.
const OWED_MONTHS_SQL = `
  WITH starts AS (
    SELECT n.school_id,
           GREATEST($1::date, date_trunc('month', MIN(n.issued_at))::date) AS first_period
    FROM annual_notices n
    WHERE n.status = 'issued'
    GROUP BY n.school_id
  )
  SELECT s.school_id, gs::date AS period,
         (gs + interval '1 month' + interval '9 days')::date AS filing_due_date
  FROM starts s,
       generate_series(s.first_period, date_trunc('month', CURRENT_DATE), interval '1 month') gs
`;

export async function getSchoolPayeMonths(schoolId: string) {
  const { rows } = await pool.query(
    `SELECT m.period::text, m.filing_due_date::text,
            r.id, r.status, r.source, r.declared_paye, r.staff_count, r.total_gross,
            r.payment_due_date::text, r.reference, r.rejection_reason, r.paid_at
     FROM (${OWED_MONTHS_SQL}) m
     LEFT JOIN LATERAL (
       SELECT * FROM paye_returns pr
       WHERE pr.school_id = m.school_id AND pr.period = m.period
       ORDER BY (pr.status <> 'rejected') DESC, pr.created_at DESC
       LIMIT 1
     ) r ON true
     WHERE m.school_id = $2
     ORDER BY m.period DESC`,
    [PAYE_FIRST_PERIOD, schoolId],
  );
  return rows;
}

// Months whose filing date has passed with no live return, for Operator 1 to
// estimate and for the Tax Audit.
export async function getUnfiledPayeMonths(schoolId?: string) {
  const { rows } = await pool.query(
    `SELECT m.school_id, m.period::text, m.filing_due_date::text, sc.name AS school_name
     FROM (${OWED_MONTHS_SQL}) m
     LEFT JOIN schoolskano sc ON sc.school_id = m.school_id
     WHERE m.filing_due_date < CURRENT_DATE
       AND ($2::varchar IS NULL OR m.school_id = $2)
       AND NOT EXISTS (
         SELECT 1 FROM paye_returns pr
         WHERE pr.school_id = m.school_id AND pr.period = m.period
           AND pr.status <> 'rejected'
       )
     ORDER BY m.filing_due_date ASC, sc.name`,
    [PAYE_FIRST_PERIOD, schoolId ?? null],
  );
  return rows as {
    school_id: string;
    period: string;
    filing_due_date: string;
    school_name: string | null;
  }[];
}

// Whether a month is one the school owes and can file now.
export async function isOwedPeriod(schoolId: string, period: string) {
  const { rows } = await pool.query(
    `SELECT m.filing_due_date::text FROM (${OWED_MONTHS_SQL}) m
     WHERE m.school_id = $2 AND m.period = $3::date`,
    [PAYE_FIRST_PERIOD, schoolId, period],
  );
  return rows[0]?.filing_due_date as string | undefined;
}

export async function getPayeSubheadId() {
  const { rows } = await pool.query(
    `SELECT id FROM revenue_subheads WHERE code = $1`,
    [PAYE_SUBHEAD_CODE],
  );
  return rows[0].id as number;
}

// Who may see a school's salary rows besides the school itself.
export const PAYE_STAFF_ROLES = ["CBS_Operator", "CBS_Operator2", "CBS_Finance"];
