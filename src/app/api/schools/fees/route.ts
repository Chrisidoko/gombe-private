// app/api/schools/fees/route.ts

import { NextResponse } from "next/server";
import pool from "@/lib/db";

type Fee = {
  id: number;
  name: string;
  description: string;
  amount: number;
  category: string;
  mandatory: boolean;
  stage: number;
  status: "paid" | "unpaid" | "pending";
};

type FeeGroup = {
  category: string;
  stage: number;
  fees: Fee[];
  locked: boolean;
};

// ── Fee definitions ────────────────────────────────────────────────────────────
const ALL_FEES = [
  // Stage 1 — Consent Letter (every school pays this first)
  {
    id: 6,
    name: "Consent Letter Fee",
    description:
      "Ministry's approval of consent for establishment of your institution. Required by all institutions.",
    amount: 300000,
    category: "Consent Letter",
    mandatory: true,
    stage: 1,
  },

  // Stage 2 — Administrative Fees
  {
    id: 4,
    name: "Self Assessment Questionnaire",
    description:
      "One-time fee covering administrative processing of institution assessment/registration.",
    amount: 50000,
    category: "Administrative Fees",
    document_url: "/application-form.docx",
    mandatory: true,
    stage: 2,
  },
  {
    id: 5,
    name: "Compliance Guidelines Fee",
    description: "Covers the cost of issued compliance guidelines document.",
    amount: 10000,
    category: "Administrative Fees",
    document_url: "/compliance-guidelines.pdf",
    mandatory: true,
    stage: 2,
  },

  // Stage 3 — Certificate Fee (locked until assessment approved)
  {
    id: 1,
    name: "Certificate Fee — Category 1",
    description: "Certificate fee for NCE / National Diploma institutions.",
    amount: 300000,
    category: "Certificate Fee",
    mandatory: true,
    stage: 3,
  },
  {
    id: 2,
    name: "Certificate Fee — Category 2",
    description: "Certificate fee for HND / Bachelor's Degree institutions.",
    amount: 350000,
    category: "Certificate Fee",
    mandatory: true,
    stage: 3,
  },
  {
    id: 3,
    name: "Certificate Fee — Category 3",
    description: "Certificate fee for Master's Degree / PhD institutions.",
    amount: 1000000,
    category: "Certificate Fee",
    mandatory: true,
    stage: 3,
  },
];

// ── Programme tier mapping ─────────────────────────────────────────────────────
const PROGRAMME_TIERS: Record<string, number> = {
  "National Diploma / NCE": 1,
  "Professional Certifications": 1,
  "Higher National Diploma (HND)": 2,
  "Bachelor's Degree": 2,
  "Postgraduate Diploma (PGD)": 2,
  "Master's Degree": 3,
  "Doctorate Degree (Ph.D.)": 3,
};

function getCertificateFeeId(programmes: string[]): number {
  if (!programmes.length) return 1;
  return programmes.reduce((max, p) => {
    const tier = PROGRAMME_TIERS[p.trim()] ?? 1;
    return Math.max(max, tier);
  }, 1);
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const school_id = searchParams.get("school_id");
    const showCertificate = searchParams.get("show_certificate") === "true";

    let programmes: string[] = [];
    const programmesParam = searchParams.get("programmes");
    if (programmesParam) {
      try {
        programmes = JSON.parse(programmesParam);
      } catch {
        programmes = [];
      }
    }

    // Which certificate fee tier applies to this school
    const certFeeId = getCertificateFeeId(programmes);
    const certFeeIds = [1, 2, 3];

    // Build the applicable fee list
    const applicableFees = ALL_FEES.filter((fee) => {
      // Certificate fees — only include the right tier
      if (certFeeIds.includes(fee.id)) {
        return fee.id === certFeeId;
      }
      return true;
    });

    // Fetch existing payment statuses from DB
    const paymentMap: Record<number, "paid" | "unpaid" | "pending"> = {};
    const docApprovalMap: Record<number, string> = {}; // ← add this
    if (school_id) {
      const existing = await pool.query(
        `SELECT fee_id, status, doc_approval FROM schoolkano_payments WHERE school_id = $1`,
        [school_id],
      );
      existing.rows.forEach((row) => {
        paymentMap[row.fee_id] = row.status;
        docApprovalMap[row.fee_id] = row.doc_approval ?? "not_required"; // ← add this
      });

      // Upsert unpaid records for any new fees not yet in DB
      for (const fee of applicableFees) {
        await pool.query(
          `INSERT INTO schoolkano_payments (school_id, fee_id, fee_name, amount, status)
           VALUES ($1, $2, $3, $4, 'unpaid')
           ON CONFLICT (school_id, fee_id) DO NOTHING`,
          [school_id, fee.id, fee.name, fee.amount],
        );
      }
    }

    // Check if Stage 1 is fully paid (required to determine Stage 2 lock)
    const stage1Fees = applicableFees.filter((f) => f.stage === 1);
    const stage1Paid = stage1Fees.every((f) => paymentMap[f.id] === "paid");

    // Check if Stage 1 + 2 are fully paid (required to unlock Stage 3)
    const stage2Fees = applicableFees.filter((f) => f.stage === 2);
    const stage2Paid = stage2Fees.every((f) => paymentMap[f.id] === "paid");

    // Build fee groups with lock state and payment status
    const groupOrder = [
      "Consent Letter",
      "Administrative Fees",
      "Certificate Fee",
    ];

    const groups: FeeGroup[] = groupOrder
      .map((category) => {
        const fees = applicableFees
          .filter((f) => f.category === category)
          .map((f) => ({
            ...f,
            status: (paymentMap[f.id] ?? "unpaid") as
              | "paid"
              | "unpaid"
              | "pending",

            doc_approval: docApprovalMap[f.id] ?? "not_required", // ← add this
          }));

        if (!fees.length) return null;

        const stage = fees[0].stage;

        // Determine if this group is locked
        let locked = false;
        if (stage === 2) locked = !stage1Paid;
        if (stage === 3) locked = !stage2Paid || !showCertificate;

        return { category, stage, fees, locked };
      })
      .filter(Boolean) as FeeGroup[];

    // Always include Certificate Fee group even when locked, so user sees it's coming
    const hasCertGroup = groups.some((g) => g.category === "Certificate Fee");
    if (!hasCertGroup) {
      const certFee = applicableFees.find((f) => certFeeIds.includes(f.id));
      if (certFee) {
        groups.push({
          category: "Certificate Fee",
          stage: 3,
          locked: true,
          fees: [
            {
              ...certFee,
              status: (paymentMap[certFee.id] ?? "unpaid") as
                | "paid"
                | "unpaid"
                | "pending",
            },
          ],
        });
      }
    }

    return NextResponse.json(groups);
  } catch (error) {
    console.error("Fees fetch failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch fees" },
      { status: 500 },
    );
  }
}
