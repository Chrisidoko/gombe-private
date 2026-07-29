// app/api/schools/fees/route.ts

import { NextResponse } from "next/server";
import pool from "@/lib/db";
import crypto from "crypto";

/*
3-stage fee structure (Gombe State):
Stage 1 — Application Fees (Application Form + Guideline Booklet) — every school pays this first. Always visible.
Stage 2 — Registration — shown once Stage 1 is fully paid. Contains three line items:
  * Registration — one-time, unlocks the stage itself.
  * Monitoring, Supervision & Evaluation — visible from the moment Stage 2 unlocks, same as
    Registration — no dependency between the two, the school can pay either first. Recurs
    annually: once paid, it's due again exactly one year after that payment.
  * Annual Renewal of Registration — only exists once Registration itself has been paid (it's a
    renewal *of* the registration). Recurs annually: due one year after Registration was paid,
    then one year after each subsequent Renewal payment.
  Neither recurring fee is ever shown as a locked preview — each is fully omitted from the
  response until its own cycle is actually due, so schools never see next year's fee ahead of time.

  PENDING: the Ministry may want Monitoring & Evaluation (and possibly Renewal) aligned to a
  fixed, shared calendar window instead of a per-school anniversary — e.g. to coordinate
  inspector field visits. This per-school-anniversary model is an interim placeholder; revisit
  once that feedback lands.
Stage 3 — Certificate Fee (Issuing of Certificate) — locked until ALL of:
  * Registration paid
  * license_status !== "Active" — no active license already
  * approval_status === "approved" — ministry has reviewed and approved the assessment form

Pricing is tiered by school category:
  - "university" tier: University
  - "hnd" tier: Polytechnic, College, School of Health Technology, Exam Center
*/

type FeeTier = "university" | "hnd";

type FeeDefinition = {
  id: number;
  name: string;
  description: string;
  group: string;
  stage: number;
  mandatory: boolean;
  recurring: boolean;
  amounts: Record<FeeTier, number>;
};

const FEE_DEFINITIONS: FeeDefinition[] = [
  // Stage 1 — Application Fees
  {
    id: 1,
    name: "Application Form",
    description: "One-time application form fee for institution registration.",
    group: "Application Fees",
    stage: 1,
    mandatory: true,
    recurring: false,
    amounts: { university: 50000, hnd: 50000 },
  },
  {
    id: 2,
    name: "Guideline Booklet",
    description: "Covers the cost of the issued guideline booklet.",
    group: "Application Fees",
    stage: 1,
    mandatory: true,
    recurring: false,
    amounts: { university: 60000, hnd: 60000 },
  },

  // Stage 2 — Registration
  {
    id: 3,
    name: "Registration",
    description: "One-time institution registration fee.",
    group: "Registration",
    stage: 2,
    mandatory: true,
    recurring: false,
    amounts: { university: 300000, hnd: 200000 },
  },

  // Stage 3 — Certificate Fee (locked until assessment approved)
  {
    id: 4,
    name: "Issuing of Certificate",
    description: "Ministry's issuance of the institution's certificate of registration.",
    group: "Certificate Fee",
    stage: 3,
    mandatory: true,
    recurring: false,
    amounts: { university: 40000, hnd: 40000 },
  },

  // Recurs every year, only visible once Registration is paid — same bracket as Registration
  {
    id: 5,
    name: "Monitoring, Supervision and Evaluation",
    description: "Annual monitoring, supervision and evaluation fee.",
    group: "Registration",
    stage: 2,
    mandatory: true,
    recurring: true,
    amounts: { university: 60000, hnd: 60000 },
  },
  // Recurs annually, but only becomes due one year after Registration — omitted until then
  {
    id: 6,
    name: "Annual Renewal of Registration",
    description: "Annual renewal of the institution's registration.",
    group: "Registration",
    stage: 2,
    mandatory: true,
    recurring: true,
    amounts: { university: 150000, hnd: 100000 },
  },
];

const GROUP_ORDER = ["Application Fees", "Registration", "Certificate Fee"];

const REGISTRATION_FEE_ID = 3;
const MONITORING_FEE_ID = 5;
const RENEWAL_FEE_ID = 6;
const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

function resolveTier(category: string | null): FeeTier {
  return category === "University" ? "university" : "hnd";
}

// ── Local payment reference generation ──────────────────────────────────────
// Replaces the old PayKaduna CreateESBill call — we mint our own reference so
// it can be handed to whichever payment gateway Gombe State ultimately wires up.
const REFERENCE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I
const REFERENCE_LENGTH = 10;
const MAX_REFERENCE_ATTEMPTS = 20;

function randomReference(): string {
  let ref = "";
  for (let i = 0; i < REFERENCE_LENGTH; i++) {
    ref += REFERENCE_CHARS[crypto.randomInt(REFERENCE_CHARS.length)];
  }
  return ref;
}

async function generateUniquePaymentReference(): Promise<string> {
  for (let attempt = 0; attempt < MAX_REFERENCE_ATTEMPTS; attempt++) {
    const candidate = randomReference();
    const existing = await pool.query(
      `SELECT 1 FROM schoolkano_payments WHERE reference = $1
       UNION ALL
       SELECT 1 FROM transactionskano WHERE reference = $1
       LIMIT 1`,
      [candidate],
    );
    if (existing.rows.length === 0) return candidate;
  }
  throw new Error(
    "Could not generate a unique payment reference after multiple attempts.",
  );
}

type FeeGroup = {
  category: string;
  stage: number;
  fees: {
    id: number;
    name: string;
    description: string;
    category: string;
    mandatory: boolean;
    recurring: boolean;
    stage: number;
    amount: number;
    status: "paid" | "unpaid" | "pending";
    reference: string | null;
    db_id: number | null;
  }[];
  locked: boolean;
  lockReason?: "active_license" | "assessment_pending" | "stage_incomplete";
};

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const school_id = searchParams.get("school_id");
    const showCertificate = searchParams.get("show_certificate") === "true";

    // Determine fee tier from the school's category
    let category: string | null = null;
    if (school_id) {
      const schoolRes = await pool.query(
        `SELECT category FROM schoolskano WHERE school_id = $1`,
        [school_id],
      );
      category = schoolRes.rows[0]?.category ?? null;
    }
    const tier = resolveTier(category);

    const applicableFees = FEE_DEFINITIONS.map((def) => ({
      id: def.id,
      name: def.name,
      description: def.description,
      category: def.group,
      stage: def.stage,
      mandatory: def.mandatory,
      recurring: def.recurring,
      amount: def.amounts[tier],
    }));

    // Fetch current payment state
    const paymentMap: Record<number, "paid" | "unpaid" | "pending"> = {};
    const referenceMap: Record<number, string | null> = {};
    const dbIdMap: Record<number, number> = {};

    // Determine due dates for the two annual fees. Each recurs independently off
    // its own last payment — see the PENDING note above re: ministry alignment.
    let registrationPaid = false;
    let monitoringDue = false;
    let monitoringFeeYear: number | null = null;
    let renewalDue = false;
    let renewalFeeYear: number | null = null;

    if (school_id) {
      const currentYear = new Date().getFullYear();
      const paidRows = await pool.query(
        `SELECT fee_id, paid_at FROM schoolkano_payments
         WHERE school_id = $1 AND fee_id = ANY($2) AND status = 'paid'
         ORDER BY paid_at DESC`,
        [school_id, [REGISTRATION_FEE_ID, MONITORING_FEE_ID, RENEWAL_FEE_ID]],
      );

      const registrationPaidAt = paidRows.rows.find(
        (r) => r.fee_id === REGISTRATION_FEE_ID,
      )?.paid_at as Date | undefined;
      registrationPaid = !!registrationPaidAt;

      // Most recent payment per fee (rows are already ordered by paid_at DESC)
      const lastMonitoringPaidAt = paidRows.rows.find(
        (r) => r.fee_id === MONITORING_FEE_ID,
      )?.paid_at as Date | undefined;
      const lastRenewalPaidAt = paidRows.rows.find(
        (r) => r.fee_id === RENEWAL_FEE_ID,
      )?.paid_at as Date | undefined;

      // Monitoring & Evaluation — visible immediately, no prerequisite. Once paid,
      // due again exactly one year later.
      if (lastMonitoringPaidAt) {
        const nextDue = new Date(
          new Date(lastMonitoringPaidAt).getTime() + ONE_YEAR_MS,
        );
        monitoringDue = Date.now() >= nextDue.getTime();
        monitoringFeeYear = nextDue.getFullYear();
      } else {
        monitoringDue = true; // first cycle — always due/visible
        monitoringFeeYear = currentYear;
      }

      // Annual Renewal — only exists once Registration has been paid.
      if (registrationPaidAt) {
        const referenceDate = lastRenewalPaidAt ?? registrationPaidAt;
        const nextDue = new Date(
          new Date(referenceDate).getTime() + ONE_YEAR_MS,
        );
        renewalDue = Date.now() >= nextDue.getTime();
        renewalFeeYear = nextDue.getFullYear();
      }

      // Pull every existing row for this school and keep only the "current" one per
      // fee: one-time fees have a single (fee_year IS NULL) row; Monitoring/Renewal
      // use whichever cycle year was just computed above.
      const existing = await pool.query(
        `SELECT id, fee_id, fee_year, status, reference FROM schoolkano_payments WHERE school_id = $1`,
        [school_id],
      );
      existing.rows.forEach((row) => {
        const isCurrent =
          row.fee_year === null ||
          (row.fee_id === MONITORING_FEE_ID && row.fee_year === monitoringFeeYear) ||
          (row.fee_id === RENEWAL_FEE_ID && row.fee_year === renewalFeeYear);
        if (!isCurrent) return;
        paymentMap[row.fee_id] = row.status;
        referenceMap[row.fee_id] = row.reference ?? null;
        dbIdMap[row.fee_id] = row.id;
      });

      // Upsert unpaid records and generate a local reference if not already created
      for (const fee of applicableFees) {
        // Neither annual fee is created/referenced until its own cycle is due
        if (fee.id === RENEWAL_FEE_ID && !renewalDue) continue;
        if (fee.id === MONITORING_FEE_ID && !monitoringDue) continue;

        const feeYear =
          fee.id === MONITORING_FEE_ID
            ? monitoringFeeYear
            : fee.id === RENEWAL_FEE_ID
              ? renewalFeeYear
              : null;

        // Step 1 — insert if not exists (for this fee/period)
        await pool.query(
          `INSERT INTO schoolkano_payments (school_id, fee_id, fee_year, fee_name, amount, status)
           VALUES ($1, $2, $3, $4, $5, 'unpaid')
           ON CONFLICT (school_id, fee_id, COALESCE(fee_year, 0)) DO NOTHING`,
          [school_id, fee.id, feeYear, fee.name, fee.amount],
        );

        // Step 2 — skip if this row already has a reference
        if (referenceMap[fee.id]) continue;

        const row = await pool.query(
          `SELECT id, reference FROM schoolkano_payments
           WHERE school_id = $1 AND fee_id = $2 AND fee_year IS NOT DISTINCT FROM $3`,
          [school_id, fee.id, feeYear],
        );
        if (row.rows.length === 0 || row.rows[0].reference) continue;

        // Step 3 — generate and store our own reference
        const reference = await generateUniquePaymentReference();
        await pool.query(
          `UPDATE schoolkano_payments SET reference = $1
           WHERE school_id = $2 AND fee_id = $3 AND fee_year IS NOT DISTINCT FROM $4`,
          [reference, school_id, fee.id, feeYear],
        );

        referenceMap[fee.id] = reference;
        dbIdMap[fee.id] = row.rows[0].id;
        paymentMap[fee.id] = paymentMap[fee.id] ?? "unpaid";
      }
    }

    // Stage completion checks
    const stage1Paid = applicableFees
      .filter((f) => f.stage === 1)
      .every((f) => paymentMap[f.id] === "paid");

    const groups: FeeGroup[] = GROUP_ORDER.map((groupName) => {
      const fees = applicableFees
        .filter((f) => f.category === groupName)
        // Neither annual fee is ever shown as a locked preview — fully omitted until due
        .filter((f) => !(f.id === RENEWAL_FEE_ID && !renewalDue))
        .filter((f) => !(f.id === MONITORING_FEE_ID && !monitoringDue))
        .map((f) => ({
          ...f,
          status: (paymentMap[f.id] ?? "unpaid") as "paid" | "unpaid" | "pending",
          reference: referenceMap[f.id] ?? null,
          db_id: dbIdMap[f.id] ?? null,
        }));

      if (!fees.length) return null;

      const stage = fees[0].stage;
      let locked = false;
      let lockReason: FeeGroup["lockReason"];

      if (stage === 2) {
        locked = !stage1Paid;
        lockReason = "stage_incomplete";
      }

      if (stage === 3) {
        const licenseStatus = searchParams.get("license_status");
        if (licenseStatus === "Active") {
          locked = true;
          lockReason = "active_license";
        } else {
          locked = !registrationPaid || !showCertificate;
          lockReason = !showCertificate ? "assessment_pending" : "stage_incomplete";
        }
      }

      return { category: groupName, stage, fees, locked, lockReason };
    }).filter(Boolean) as FeeGroup[];

    return NextResponse.json(groups);
  } catch (error) {
    console.error("Fees fetch failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch fees" },
      { status: 500 },
    );
  }
}
