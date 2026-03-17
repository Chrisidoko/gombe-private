// app/api/schools/fees/route.ts

import { NextResponse } from "next/server";
import pool from "@/lib/db";
import crypto from "crypto";

/*
3-stage fee progression:
Stage 1 — Consent Letter Fee (₦300,000) — every school pays this first, regardless of category. This is the entry-level fee that's been owed since inception. Show this to all schools always.
Stage 2 — Administrative Fees — processing, inspection etc. These show after or alongside Stage 1. Still visible to all schools.
Stage 3 — Certificate Fee (₦300k / ₦350k / ₦1,000,000) — this only becomes visible when BOTH conditions are met:
* license_status !== "Active" — they don't already have an active license
* approval_status === "approved" — the ministry has reviewed and approved their assessment form
So the certificate fee is essentially locked/hidden until the school has fulfilled the earlier stages and received ministry approval. This prevents schools from seeing or attempting to pay the final fee before they're eligible.
*/

type Fee = {
  id: number;
  name: string;
  description: string;
  amount: number;
  category: string;
  mandatory: boolean;
  stage: number;
  status: "paid" | "unpaid" | "pending";
  reference?: string | null; // ← add
  tpui?: string | null; // ← add
  db_id?: number | null;
};

type FeeGroup = {
  category: string;
  stage: number;
  fees: Fee[];
  locked: boolean;
  lockReason?: "active_license" | "assessment_pending" | "stage_incomplete";
};

// ── Fee definitions ────────────────────────────────────────────────────────────
const ALL_FEES = [
  // Stage 1 — Consent Letter (every school pays this first)
  {
    id: 6,
    name: "Establishment Fee",
    description:
      "Ministry's approval of consent for establishment of your institution. Required by all institutions.",
    amount: 300000,
    category: "Consent Letter",
    mdasId: 3651,
    mandatory: true,
    stage: 1,
  },

  // Stage 2 — Administrative Fees
  {
    id: 4,
    name: "Self Assessment Questionnaire",
    description:
      "One-time fee covering administrative processing of institution assessment/registration.",
    amount: 20000,
    category: "Administrative Fees",
    mdasId: 3649,
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
    mdasId: 3650,
    document_url: "/guidelines.pdf",
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
    mdasId: 3652,
    mandatory: true,
    stage: 3,
  },
  {
    id: 2,
    name: "Certificate Fee — Category 2",
    description: "Certificate fee for HND / Bachelor's Degree institutions.",
    amount: 350000,
    category: "Certificate Fee",
    mdasId: 3652,
    mandatory: true,
    stage: 3,
  },
  {
    id: 3,
    name: "Certificate Fee — Category 3",
    description: "Certificate fee for Master's Degree / PhD institutions.",
    amount: 1000000,
    category: "Certificate Fee",
    mdasId: 3652,
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
    const referenceMap: Record<number, string | null> = {}; // ← add
    const tpuiMap: Record<number, string | null> = {};
    const dbIdMap: Record<number, number> = {}; // fee_id → table row id
    if (school_id) {
      const existing = await pool.query(
        `SELECT id, fee_id, status, doc_approval FROM schoolkano_payments WHERE school_id = $1`,
        [school_id],
      );
      existing.rows.forEach((row) => {
        paymentMap[row.fee_id] = row.status;
        docApprovalMap[row.fee_id] = row.doc_approval ?? "not_required"; // ← add this
        referenceMap[row.fee_id] = row.reference ?? null; // ← add
        tpuiMap[row.fee_id] = row.tpui ?? null; // ← add
        dbIdMap[row.fee_id] = row.id; // ← add this
      });

      // Upsert unpaid records and generate bill reference if not already created
      for (const fee of applicableFees) {
        // Step 1 — insert if not exists
        await pool.query(
          `INSERT INTO schoolkano_payments (school_id, fee_id, fee_name, amount, status)
     VALUES ($1, $2, $3, $4, 'unpaid')
     ON CONFLICT (school_id, fee_id) DO NOTHING`,
          [school_id, fee.id, fee.name, fee.amount],
        );

        // Step 2 — check if this row already has a reference
        const existing = await pool.query(
          `SELECT reference FROM schoolkano_payments 
            WHERE school_id = $1 AND fee_id = $2`,
          [school_id, fee.id],
        );

        const alreadyHasReference = existing.rows[0]?.reference;
        if (alreadyHasReference) continue; // ← skip, reference already exists

        // Step 3 — fetch school info for bill payload
        const schoolRes = await pool.query(
          `SELECT email, name, phone, lga, address FROM schoolskano WHERE school_id = $1`,
          [school_id],
        );
        if (schoolRes.rows.length === 0) continue;
        const school = schoolRes.rows[0];

        // Step 4 — build and send bill to PayKaduna
        try {
          const nameParts = school.name.split(" ");
          const firstName = nameParts[0] || school.name;
          const middleName = nameParts[1] || "";
          const lastName =
            nameParts.length > 2 ? nameParts.slice(2).join(" ") : nameParts[0];

          const billPayload = {
            engineCode: process.env.PAYKADUNA_ENGINE_CODE,
            // identifier: `${school_id}-${fee.id}-${Date.now()}`, // unique per fee
            identifier: `${school_id}`, // stable per school, remains the same all through, allows idempotency
            firstName,
            middleName,
            lastName,
            address: school.address || "Kaduna, Nigeria",
            telephone: school.phone || "08000000000",
            esBillDetailsDto: [
              {
                amount: fee.amount,
                mdasId: fee.mdasId,
                narration: `${fee.name} - ${school.name}`,
              },
            ],
          };

          const jsonPayload = JSON.stringify(billPayload);
          const signature = crypto
            .createHmac("sha256", process.env.PAYKADUNA_API_KEY!)
            .update(jsonPayload)
            .digest("base64");

          const billResponse = await fetch(
            `${process.env.NEXT_PUBLIC_PAYKADUNA_URL}api/ESBills/CreateESBill`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "X-Api-Signature": signature,
              },
              body: jsonPayload,
            },
          );

          if (billResponse.ok) {
            const billData = await billResponse.json();
            const billReference = billData.bill?.billReference || null;
            const tpui = billData.bill?.tpui || null;

            // Step 5 — store reference back to this specific fee row
            if (billReference) {
              await pool.query(
                `UPDATE schoolkano_payments 
           SET reference = $1, tpui = $2, lga = $3
           WHERE school_id = $4 AND fee_id = $5`,
                [billReference, tpui, school.lga, school_id, fee.id],
              );

              // Update paymentMap so the response reflects the new reference
              paymentMap[fee.id] = paymentMap[fee.id] ?? "unpaid";
            }
          } else {
            console.error(
              `Bill creation failed for fee ${fee.id}:`,
              await billResponse.text(),
            );
          }
        } catch (billErr) {
          // Don't crash the whole fees fetch if bill creation fails for one fee
          console.error(`Bill error for fee ${fee.id}:`, billErr);
        }
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
            reference: referenceMap[f.id] ?? null, // ← add
            tpui: tpuiMap[f.id] ?? null, // ← add
            db_id: dbIdMap[f.id] ?? null, // ← add this
          }));

        if (!fees.length) return null;

        const stage = fees[0].stage;

        // Determine if this group is locked
        let locked = false;
        let lockReason:
          | "active_license"
          | "assessment_pending"
          | "stage_incomplete"
          | undefined;
        if (stage === 2) locked = !stage1Paid;
        if (stage === 3) {
          const licenseStatus = searchParams.get("license_status");
          if (licenseStatus === "Active") {
            locked = true;
            lockReason = "active_license";
          } else {
            locked = !stage2Paid || !showCertificate;
            lockReason = !showCertificate
              ? "assessment_pending"
              : "stage_incomplete";
          }
        }

        return { category, stage, fees, locked, lockReason };
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
