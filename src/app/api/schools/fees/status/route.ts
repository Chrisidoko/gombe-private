// app/api/schools/compliance/route.ts

import { NextResponse } from "next/server";
import pool from "@/lib/db";

/*
  Compliance Score Progression (Gombe fee structure):
  ─────────────────────────────────────────────────
  0%   → Default (nothing paid)
  25%  → Application Form paid                       fee_id: 1
  40%  → + Guideline Booklet paid                     fee_id: 2
  65%  → + Registration paid                          fee_id: 3
  100% → + Certificate issued/paid (or license Active) fee_id: 4

  Annual Compliance (Monitoring & Evaluation + Annual Renewal, fee_id: 5 & 6)
  is reported separately as `annualComplianceCurrent` — it's a recurring
  obligation once registered, not part of the one-time 0-100 ladder.
*/

const CURRENT_YEAR_FEE_IDS = [5, 6]; // recurring — only this year's row counts

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

    const currentYear = new Date().getFullYear();

    // ── Fetch payment records (current-year row for recurring fees) ────────
    const paymentsResult = await pool.query(
      `SELECT fee_id, status
       FROM schoolkano_payments
       WHERE school_id = $1 AND (fee_year IS NULL OR fee_year = $2)`,
      [school_id, currentYear],
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
    const applicationFormPaid = fees.find((f) => f.fee_id === 1)?.status === "paid";
    const guidelinesPaid = fees.find((f) => f.fee_id === 2)?.status === "paid";
    const registrationPaid = fees.find((f) => f.fee_id === 3)?.status === "paid";
    const certificateFee = fees.find((f) => f.fee_id === 4);
    const certificatePaid =
      certificateFee?.status === "paid" || school.license_status === "Active";

    const annualComplianceCurrent = CURRENT_YEAR_FEE_IDS.every(
      (id) => fees.find((f) => f.fee_id === id)?.status === "paid",
    );

    // ── Score calculation ───────────────────────────────────────────────
    let complianceScore = 0;
    if (applicationFormPaid) complianceScore = 25;
    if (applicationFormPaid && guidelinesPaid) complianceScore = 40;
    if (applicationFormPaid && guidelinesPaid && registrationPaid)
      complianceScore = 65;
    if (
      applicationFormPaid &&
      guidelinesPaid &&
      registrationPaid &&
      certificatePaid
    )
      complianceScore = 100;

    // ── Build milestone list for UI ───────────────────────────────────────
    const milestones = [
      {
        label: "Application Form",
        completed: applicationFormPaid,
        score: 25,
      },
      {
        label: "Guideline Booklet",
        completed: guidelinesPaid,
        score: 15,
      },
      {
        label: "Registration",
        completed: registrationPaid,
        score: 25,
      },
      {
        label: "Certificate Issued",
        completed: certificatePaid,
        score: 35,
      },
    ];

    return NextResponse.json({
      complianceScore,
      applicationFormPaid,
      guidelinesPaid,
      registrationPaid,
      certificatePaid,
      annualComplianceCurrent,
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
