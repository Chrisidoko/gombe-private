// lib/annualNotices.ts
import nodemailer from "nodemailer";
import type { PoolClient } from "pg";
import pool from "@/lib/db";

export const PAYMENT_WINDOW_DAYS = 30;
const PREMISES_REGISTRATION = "TRADE_PREMISES_REG";
const PREMISES_RENEWAL = "TRADE_PREMISES_REN";

type EligibleSchool = {
  school_id: string;
  location_type: string;
  premises_category: string;
};

type Subhead = { id: number; code: string; charge_type: string };

// A rate applies from its year onward, so a new year keeps the last known
// amounts until someone adds new ones.
async function getRates(client: PoolClient, year: number) {
  const { rows } = await client.query(
    `SELECT DISTINCT ON (subhead_id, premises_category, location_type)
       subhead_id, premises_category, location_type, amount
     FROM revenue_rates
     WHERE year <= $1
     ORDER BY subhead_id, premises_category, location_type, year DESC`,
    [year],
  );
  return rows as {
    subhead_id: number;
    premises_category: string | null;
    location_type: string | null;
    amount: string;
  }[];
}

async function hasPremisesRegistration(client: PoolClient, schoolId: string) {
  const { rows } = await client.query(
    `SELECT 1
     FROM annual_notice_lines l
     JOIN annual_notices n ON n.id = l.notice_id
     JOIN revenue_subheads s ON s.id = l.revenue_subhead_id
     WHERE n.school_id = $1 AND n.status <> 'rejected' AND s.code = $2
     LIMIT 1`,
    [schoolId, PREMISES_REGISTRATION],
  );
  return rows.length > 0;
}

// Approved schools without a live notice for the year. A school needs its
// location and premises category (set by Admin at approval) to be billed.
export async function getReadiness(year: number) {
  const { rows } = await pool.query(
    `SELECT s.school_id, s.name, s.location_type, s.premises_category
     FROM schoolskano s
     WHERE s.approval_status = 'approved'
       AND NOT EXISTS (
         SELECT 1 FROM annual_notices n
         WHERE n.school_id = s.school_id AND n.year = $1 AND n.status <> 'rejected'
       )
     ORDER BY s.name`,
    [year],
  );
  return {
    ready: rows.filter((s) => s.location_type && s.premises_category),
    missingDetails: rows.filter((s) => !s.location_type || !s.premises_category),
  };
}

// Runs inside the caller's transaction. The batch starts as a draft that
// Operator 1 checks and adjusts before sending it to Operator 2. Schools that
// already have a live notice for the year are skipped. Returns null if none
// needed one.
export async function createNoticeBatch(
  client: PoolClient,
  {
    year,
    schools,
    source,
    createdBy,
  }: {
    year: number;
    schools: EligibleSchool[];
    source: "operator";
    createdBy: string;
  },
) {
  const subheadsRes = await client.query(
    `SELECT id, code, charge_type FROM revenue_subheads
     WHERE active AND charge_type IN ('annual_fixed', 'annual_premises', 'declared')`,
  );
  const subheads: Subhead[] = subheadsRes.rows;
  const rates = await getRates(client, year);

  const rateFor = (subhead: Subhead, school: EligibleSchool) => {
    const rate = rates.find(
      (r) =>
        r.subhead_id === subhead.id &&
        (subhead.charge_type === "annual_fixed" ||
          (r.premises_category === school.premises_category &&
            r.location_type === school.location_type)),
    );
    if (!rate) throw new Error(`No ${year} rate set for ${subhead.code}`);
    return rate.amount;
  };

  const batchRes = await client.query(
    `INSERT INTO annual_notice_batches (year, source, created_by, status)
     VALUES ($1, $2, $3, 'draft') RETURNING id`,
    [year, source, createdBy],
  );
  const batchId: number = batchRes.rows[0].id;

  let created = 0;
  for (const school of schools) {
    const noticeRes = await client.query(
      `INSERT INTO annual_notices (batch_id, school_id, year)
       VALUES ($1, $2, $3)
       ON CONFLICT (school_id, year) WHERE status <> 'rejected' DO NOTHING
       RETURNING id`,
      [batchId, school.school_id, year],
    );
    if (noticeRes.rowCount === 0) continue;
    const noticeId: number = noticeRes.rows[0].id;
    created++;

    const premisesCode = (await hasPremisesRegistration(client, school.school_id))
      ? PREMISES_RENEWAL
      : PREMISES_REGISTRATION;

    for (const subhead of subheads) {
      if (subhead.charge_type === "annual_premises" && subhead.code !== premisesCode) {
        continue;
      }
      const declared = subhead.charge_type === "declared";
      const amount = declared ? null : rateFor(subhead, school);
      // A rate of 0 means the item isn't charged this year
      if (amount !== null && Number(amount) === 0) continue;
      await client.query(
        `INSERT INTO annual_notice_lines (notice_id, revenue_subhead_id, amount, standard_amount, status)
         VALUES ($1, $2, $3, $3, $4)`,
        [noticeId, subhead.id, amount, declared ? "awaiting_declaration" : "unpaid"],
      );
    }
  }

  if (created === 0) {
    await client.query(`DELETE FROM annual_notice_batches WHERE id = $1`, [batchId]);
    return null;
  }
  return { batchId, created };
}

// Runs inside the caller's transaction. The 30 days start here, at approval.
export async function issueNoticeBatch(client: PoolClient, batchId: number) {
  const { rows } = await client.query(
    `UPDATE annual_notices
     SET status = 'issued',
         issued_at = NOW(),
         due_date = CURRENT_DATE + $2::integer,
         notice_number = 'GIRS/DN/MoE/' || year || '/' || LPAD(id::text, 4, '0')
     WHERE batch_id = $1 AND status = 'pending_approval'
     RETURNING id, school_id, year, notice_number, due_date`,
    [batchId, PAYMENT_WINDOW_DAYS],
  );
  // Items set to 0 for a school don't apply to it: nothing due
  await client.query(
    `UPDATE annual_notice_lines l
     SET status = 'waived'
     FROM annual_notices n
     WHERE n.id = l.notice_id AND n.batch_id = $1 AND l.status = 'unpaid' AND l.amount = 0`,
    [batchId],
  );
  await client.query(
    `UPDATE annual_notice_lines l
     SET due_date = n.due_date
     FROM annual_notices n
     WHERE n.id = l.notice_id AND n.batch_id = $1 AND l.status = 'unpaid'`,
    [batchId],
  );
  return rows as {
    id: number;
    school_id: string;
    year: number;
    notice_number: string;
    due_date: Date;
  }[];
}

// Everything a school can see: its issued notices with their lines, newest
// first, plus where each line's declaration and objection stand. Arrears are
// the unpaid lines on any notice before the latest one.
export async function getSchoolNotices(schoolId: string) {
  const { rows } = await pool.query(
    `SELECT n.id AS notice_id, n.year, n.notice_number, n.issued_at, n.due_date AS notice_due_date,
            l.id, l.amount, l.status, l.due_date, l.reference, l.paid_at,
            s.code, s.name AS subhead_name, s.charge_type, s.sort_order,
            h.name AS head_name, h.sort_order AS head_order,
            d.status AS declaration_status, d.rejection_reason AS declaration_rejection,
            o.status AS objection_status, o.decision_note AS objection_note
     FROM annual_notices n
     JOIN annual_notice_lines l ON l.notice_id = n.id
     JOIN revenue_subheads s ON s.id = l.revenue_subhead_id
     JOIN revenue_heads h ON h.id = s.head_id
     LEFT JOIN LATERAL (
       SELECT status, rejection_reason FROM tax_declarations
       WHERE line_id = l.id ORDER BY created_at DESC LIMIT 1
     ) d ON true
     LEFT JOIN LATERAL (
       SELECT status, decision_note FROM notice_objections
       WHERE line_id = l.id ORDER BY created_at DESC LIMIT 1
     ) o ON true
     WHERE n.school_id = $1 AND n.status = 'issued'
     ORDER BY n.year DESC, h.sort_order, s.sort_order`,
    [schoolId],
  );
  return rows;
}

function createTransporter() {
  return nodemailer.createTransport({
    host: "paypro-solutions.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS?.replace("%40", "@"),
    },
  });
}

// Tells a school about a decision on its declaration or objection. The
// decision is already saved and shows on the portal, so a mail failure is
// only logged.
export async function notifySchool(
  schoolId: string,
  subject: string,
  message: string,
) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) return;
  try {
    const { rows } = await pool.query(
      `SELECT name, email FROM schoolskano WHERE school_id = $1`,
      [schoolId],
    );
    await createTransporter().sendMail({
      from: `"GO-ESMS" <${process.env.SMTP_USER}>`,
      to: rows[0].email,
      subject: `${subject} — ${rows[0].name}`,
      html: `
        <p>Dear ${rows[0].name},</p>
        <p>${message}</p>
        <br/>
        <a href="https://higheredu.gesms.payprosolutionsltd.com/"
           style="background-color:#166534;color:white;padding:10px 20px;text-decoration:none;border-radius:8px;font-size:14px;font-weight:600;">
          Go to Dashboard
        </a>
      `,
    });
  } catch (err) {
    console.error(`Notification failed for ${schoolId}:`, err);
  }
}

export async function sendNoticeEmails(
  notices: { school_id: string; year: number; notice_number: string; due_date: Date }[],
) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return { sent: 0, failed: notices.length };
  }

  const transporter = createTransporter();

  let sent = 0;
  let failed = 0;
  for (const notice of notices) {
    try {
      const { rows } = await pool.query(
        `SELECT s.name, s.email,
           COALESCE(SUM(l.amount) FILTER (WHERE n.year = $2), 0) AS current_total,
           COALESCE(SUM(l.amount) FILTER (WHERE n.year < $2), 0) AS arrears_total
         FROM schoolskano s
         LEFT JOIN annual_notices n ON n.school_id = s.school_id AND n.status = 'issued'
         LEFT JOIN annual_notice_lines l ON l.notice_id = n.id AND l.status = 'unpaid'
         WHERE s.school_id = $1
         GROUP BY s.name, s.email`,
        [notice.school_id, notice.year],
      );
      const school = rows[0];
      const dueDate = new Date(notice.due_date).toLocaleDateString("en-NG", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      const arrears = Number(school.arrears_total);

      await transporter.sendMail({
        from: `"GO-ESMS" <${process.env.SMTP_USER}>`,
        to: school.email,
        subject: `${notice.year} Single Demand Notice — ${school.name}`,
        html: `
          <h2>${notice.year} Single Demand Notice</h2>
          <p>Dear ${school.name},</p>
          <p>Your ${notice.year} Single Demand Notice (${notice.notice_number}) has been issued.</p>
          <p><strong>Amount due:</strong> ₦${Number(school.current_total).toLocaleString()}</p>
          ${arrears > 0 ? `<p><strong>Arrears from earlier years:</strong> ₦${arrears.toLocaleString()}</p>` : ""}
          <p><strong>Payment due by:</strong> ${dueDate}</p>
          <p>Personal Income Tax and PAYE are added once your declaration has been approved. Your next notice will be issued in January.</p>
          <br/>
          <a href="https://higheredu.gesms.payprosolutionsltd.com/"
             style="background-color:#166534;color:white;padding:10px 20px;text-decoration:none;border-radius:8px;font-size:14px;font-weight:600;">
            Go to Dashboard
          </a>
        `,
      });
      sent++;
    } catch (err) {
      console.error(`Notice email failed for ${notice.school_id}:`, err);
      failed++;
    }
  }
  return { sent, failed };
}
