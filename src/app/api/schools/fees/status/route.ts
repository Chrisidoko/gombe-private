// app/api/schools/compliance/route.ts

import { NextResponse } from "next/server";
import pool from "@/lib/db";

/*
  Compliance Score Progression (Ministry Defined):
  ─────────────────────────────────────────────────
  0%  → Default (nothing paid)
  40% → Consent Letter fee paid (₦300,000)         fee_id: 6
  44% → Compliance Guidelines fee paid (₦10,000)   fee_id: 5
  50% → Self Assessment Questionnaire paid     
  55% → Questionnaire uploaded/doc uploaded         fee_id: 4, doc_approval =  'pending'
  60% → Admin approves everything                   fee_id: 4, doc_approval =  'approved'
  100% → Certificate fee invoice paid (₦300,000+)   fee_id: 1 | 2 | 3
 
*/

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

    // ── Fetch payment records ─────────────────────────────────────────────
    const paymentsResult = await pool.query(
      `SELECT fee_id, status, doc_approval
       FROM schoolkano_payments
       WHERE school_id = $1`,
      [school_id],
    );
    // ── Fetch school license status ───────────────────────────────────────
    const schoolResult = await pool.query(
      `SELECT form_status, approval_status, license_status
   FROM schoolskano
   WHERE school_id = $1`,
      [school_id],
    );
    const fees = paymentsResult.rows;
    const school = schoolResult.rows[0] ?? {};

    // ── Individual checks ─────────────────────────────────────────────────
    const consentPaid = fees.find((f) => f.fee_id === 6)?.status === "paid";
    const guidelinesPaid = fees.find((f) => f.fee_id === 5)?.status === "paid";
    const applicationFee = fees.find((f) => f.fee_id === 4);
    const applicationPaid = applicationFee?.status === "paid";
    const questionnaireUploaded =
      applicationFee?.doc_approval === "pending" ||
      applicationFee?.doc_approval === "approved";
    const certificateFee = fees.find((f) => [1, 2, 3].includes(f.fee_id));
    // ── Certificate is satisfied if fee is paid OR license is already Active
    const certificatePaid =
      certificateFee?.status === "paid" || school.license_status === "Active";

    // ── Score calculation (ministry progression) ──────────────────────────
    let complianceScore = 0;

    if (consentPaid) complianceScore = 40; // Step 1 — ₦300,000 consent letter
    if (consentPaid && guidelinesPaid) complianceScore = 44; // Step 2 — ₦10,000 guidelines
    if (consentPaid && guidelinesPaid && applicationPaid) complianceScore = 50; // Step 3 — SAQ  paid
    if (
      consentPaid &&
      guidelinesPaid &&
      applicationPaid &&
      questionnaireUploaded
    )
      complianceScore = 55; // Step 4 — SAQ uploaded
    if (consentPaid && guidelinesPaid && applicationPaid && certificatePaid)
      complianceScore = 90; // Step 5 — Admin approved
    if (
      consentPaid &&
      guidelinesPaid &&
      applicationPaid &&
      questionnaireUploaded &&
      certificatePaid
    )
      complianceScore = 100; // Step 6 — Certificate paid

    // ── Build milestone list for UI ───────────────────────────────────────
    const milestones = [
      {
        label: "Establishment Fee",
        // detail: "₦300,000",
        completed: consentPaid,
        score: 40,
      },
      {
        label: "Compliance Guidelines Fee",
        // detail: "₦10,000",
        completed: guidelinesPaid,
        score: 4,
      },
      {
        label: "Self Assessment Questionnaire",
        // detail: "₦50,000",
        completed: applicationPaid,
        score: 6,
      },
      //   {
      //     label: "Questionnaire Uploaded",
      //     detail: "Document submitted",
      //     completed: questionnaireUploaded,
      //     score: 55,
      //   },
      {
        label: "Ministry Approval",
        // detail: "Admin review complete",
        completed: questionnaireUploaded, // Show as completed once uploaded, since admin approval is internal
        score: 10,
      },
      {
        label: "Certificate Fee Paid",
        // detail: "₦300,000 – ₦1,000,000",
        completed: certificatePaid,
        score: 40,
      },
    ];

    return NextResponse.json({
      complianceScore,
      consentLetterPaid: consentPaid,
      guidelinesPaid,
      applicationPaid,
      questionnaireUploaded,
      //   questionnaireApproved,
      certificatePaid,
      milestones,
      totalFees: fees.length,
      paidFees: fees.filter((f) => f.status === "paid").length,
      unpaidFees: fees.filter((f) => f.status === "unpaid").length,
    });
  } catch (error) {
    console.error("Compliance fetch failed:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
