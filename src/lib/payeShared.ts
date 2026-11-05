// lib/payeShared.ts
// The parts of the PAYE rules that the browser needs too. Database queries
// live in paye.ts.
import { assessPit } from "@/lib/pitBands";

export const PAYE_SUBHEAD_CODE = "GIRS_PAYE";

// Monthly returns started with the November 2026 payroll.
export const PAYE_FIRST_PERIOD = "2026-11-01";

// A return approved after its filing date still gets this long to pay.
export const PAYE_PAYMENT_GRACE_DAYS = 10;

export const STAFF_GROUPS = ["academic", "non_academic"] as const;
export type StaffGroup = (typeof STAFF_GROUPS)[number];

export type PayeStaffRow = {
  staff_name: string;
  staff_group: StaffGroup;
  role: string | null;
  gross_pay: number;
  paye_deducted: number;
};

// The PAYE the bands give on a month's pay, assuming the same pay all year.
// No reliefs (pension, NHF, rent) are taken off, so it can run a little above
// what an employer correctly deducts. Operators use it as a guide.
export function expectedMonthlyPaye(grossMonthly: number, year: number) {
  return Math.round(assessPit(grossMonthly * 12, year).tax / 12);
}

export const sameName = (a: string, b: string) =>
  a.trim().toLowerCase() === b.trim().toLowerCase();

// Dates come back from SQL as YYYY-MM-DD text, so they never shift with the
// server's time zone.
export function periodLabel(period: string) {
  return new Date(period).toLocaleDateString("en-NG", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}
