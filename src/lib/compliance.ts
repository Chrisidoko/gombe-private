// lib/compliance.ts
// A school's compliance score and the list of things it still has to act on.
//
// Before approval the score is the four onboarding steps. After approval it
// covers what the school owes now:
//   Annual Renewal of Registration   25  (paid, or not yet due)
//   Single Demand Notice             40  (share of the assessed amount paid)
//   Monthly PAYE returns             25  (share of due months in good standing)
//   Other Notices                    10  (none overdue)
import pool from "@/lib/db";
import { FEE_DEFINITIONS, resolveTier } from "@/lib/feeDefinitions";
import { getSchoolPayeMonths, periodLabel } from "@/lib/paye";

const APPLICATION_FORM_FEE_ID = 1;
const GUIDELINE_FEE_ID = 2;
const REGISTRATION_FEE_ID = 3;
const CERTIFICATE_FEE_ID = 4;
const MONITORING_FEE_ID = 5;
const RENEWAL_FEE_ID = 6;
// Same cycle as api/schools/fees: each annual fee falls due a year after its
// last payment (Renewal starts a year after Registration)
const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

export type ScoreItem = {
  label: string;
  detail: string;
  points: number;
  earned: number;
  completed: boolean;
};

export type ActionItem = {
  label: string;
  source: string;
  amount: number | null;
  dueDate: string | null;
  overdue: boolean;
  href: string;
};

export type ComplianceStatus = {
  phase: "onboarding" | "annual";
  complianceScore: number;
  onboarding: ScoreItem[];
  onboardingComplete: boolean;
  annual: ScoreItem[];
};

const naira = (n: number) => `₦${Math.round(n).toLocaleString()}`;
// Local calendar dates as YYYY-MM-DD; toISOString would shift them to UTC
const localDate = (d: Date) => d.toLocaleDateString("en-CA");
const todayText = () => localDate(new Date());
const dateText = (d: Date | string | null) => (d ? localDate(new Date(d)) : null);

async function getFeeState(schoolId: string) {
  const { rows } = await pool.query(
    `SELECT fee_id, status, paid_at FROM schoolkano_payments
     WHERE school_id = $1
     ORDER BY paid_at DESC NULLS LAST`,
    [schoolId],
  );
  const lastPaid = (feeId: number) =>
    rows.find((r) => r.fee_id === feeId && r.status === "paid")?.paid_at as
      | Date
      | undefined;
  const nextDue = (from: Date | undefined) =>
    from ? new Date(new Date(from).getTime() + ONE_YEAR_MS) : null;

  const registrationPaidAt = lastPaid(REGISTRATION_FEE_ID);
  const renewalDueOn = registrationPaidAt
    ? nextDue(lastPaid(RENEWAL_FEE_ID) ?? registrationPaidAt)
    : null;
  const monitoringPaidAt = lastPaid(MONITORING_FEE_ID);
  // Monitoring is due straight away until its first payment
  const monitoringDueOn = registrationPaidAt
    ? (nextDue(monitoringPaidAt) ?? new Date())
    : null;

  return {
    paid: (feeId: number) => !!lastPaid(feeId),
    renewalDueOn,
    renewalDue: !!renewalDueOn && Date.now() >= renewalDueOn.getTime(),
    monitoringDueOn,
    monitoringDue: !!monitoringDueOn && Date.now() >= monitoringDueOn.getTime(),
  };
}

async function getSchool(schoolId: string) {
  const { rows } = await pool.query(
    `SELECT approval_status, license_status, category FROM schoolskano WHERE school_id = $1`,
    [schoolId],
  );
  return rows[0] as
    | { approval_status: string; license_status: string | null; category: string | null }
    | undefined;
}

// Unpaid and paid notice lines on issued notices up to this year, plus lines
// still waiting for the school's declaration.
async function getNoticeLines(schoolId: string) {
  const { rows } = await pool.query(
    `SELECT l.id, l.amount, l.status, l.due_date::text AS due_date, n.year,
            s.name AS subhead_name,
            EXISTS (
              SELECT 1 FROM tax_declarations d
              WHERE d.line_id = l.id AND d.status <> 'rejected'
            ) AS declared
     FROM annual_notice_lines l
     JOIN annual_notices n ON n.id = l.notice_id
     JOIN revenue_subheads s ON s.id = l.revenue_subhead_id
     WHERE n.school_id = $1 AND n.status = 'issued'
       AND n.year <= EXTRACT(YEAR FROM CURRENT_DATE)
       AND l.status IN ('unpaid', 'paid', 'awaiting_declaration')
     ORDER BY n.year, s.sort_order`,
    [schoolId],
  );
  return rows as {
    id: number;
    amount: string | null;
    status: "unpaid" | "paid" | "awaiting_declaration";
    due_date: string | null;
    year: number;
    subhead_name: string;
    declared: boolean;
  }[];
}

async function getUnpaidInvoices(schoolId: string) {
  const { rows } = await pool.query(
    `SELECT title, invoice_number, amount, due_date::text AS due_date
     FROM schoolkano_invoices
     WHERE school_id = $1 AND status = 'Unpaid'
     ORDER BY due_date NULLS LAST`,
    [schoolId],
  );
  return rows as {
    title: string | null;
    invoice_number: string;
    amount: string;
    due_date: string | null;
  }[];
}

const share = (part: number, whole: number) => (whole > 0 ? part / whole : 1);

export async function getComplianceStatus(
  schoolId: string,
): Promise<ComplianceStatus | null> {
  const school = await getSchool(schoolId);
  if (!school) return null;
  const fees = await getFeeState(schoolId);

  const certificate =
    fees.paid(CERTIFICATE_FEE_ID) || school.license_status === "Active";
  const steps: [string, boolean, number][] = [
    ["Application Form", fees.paid(APPLICATION_FORM_FEE_ID), 25],
    ["Guideline Booklet", fees.paid(GUIDELINE_FEE_ID), 15],
    ["Registration", fees.paid(REGISTRATION_FEE_ID), 25],
    ["Certificate Issued", certificate, 35],
  ];
  // Each step only counts once the ones before it are done
  let chainIntact = true;
  const onboarding: ScoreItem[] = steps.map(([label, done, points]) => {
    chainIntact = chainIntact && done;
    return {
      label,
      detail: done ? "Done" : "Not yet paid",
      points,
      earned: chainIntact ? points : 0,
      completed: done,
    };
  });
  const onboardingScore = onboarding.reduce((t, s) => t + s.earned, 0);
  const onboardingComplete = onboarding.every((s) => s.completed);

  if (school.approval_status !== "approved") {
    return {
      phase: "onboarding",
      complianceScore: onboardingScore,
      onboarding,
      onboardingComplete,
      annual: [],
    };
  }

  // Annual Renewal
  const renewalOk = !fees.renewalDue;
  const renewal: ScoreItem = {
    label: "Annual Renewal of Registration",
    detail: renewalOk
      ? fees.renewalDueOn
        ? `Next due ${fees.renewalDueOn.toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}`
        : "Not due yet"
      : "Due now",
    points: 25,
    earned: renewalOk ? 25 : 0,
    completed: renewalOk,
  };

  // Single Demand Notice, by amount
  const lines = await getNoticeLines(schoolId);
  const assessed = lines.filter((l) => l.status !== "awaiting_declaration");
  const paidAmount = assessed
    .filter((l) => l.status === "paid")
    .reduce((t, l) => t + Number(l.amount), 0);
  const assessedAmount = assessed.reduce((t, l) => t + Number(l.amount), 0);
  const awaiting = lines.filter((l) => l.status === "awaiting_declaration").length;
  // A notice that's all declarations so far has nothing paid against it yet
  const noticeShare =
    assessedAmount > 0 ? share(paidAmount, assessedAmount) : awaiting > 0 ? 0 : 1;
  const notice: ScoreItem = {
    label: "Single Demand Notice",
    detail:
      lines.length === 0
        ? "No notice issued yet"
        : `${naira(paidAmount)} of ${naira(assessedAmount)} paid` +
          (awaiting > 0
            ? ` · ${awaiting} declaration${awaiting !== 1 ? "s" : ""} pending`
            : ""),
    points: 40,
    earned: Math.round(40 * noticeShare),
    completed: noticeShare === 1 && awaiting === 0,
  };

  // PAYE: months whose filing date has passed
  const today = todayText();
  const payeDue = (await getSchoolPayeMonths(schoolId)).filter(
    (m) => m.filing_due_date < today,
  );
  const inGoodStanding = payeDue.filter(
    (m) =>
      m.status === "paid" ||
      m.status === "waived" ||
      m.status === "pending_review" ||
      m.status === "recommended" ||
      (m.status === "unpaid" && m.payment_due_date >= today),
  ).length;
  const payeShare = share(inGoodStanding, payeDue.length);
  const paye: ScoreItem = {
    label: "Monthly PAYE returns",
    detail:
      payeDue.length === 0
        ? "No returns due yet"
        : `${inGoodStanding} of ${payeDue.length} month${payeDue.length !== 1 ? "s" : ""} up to date`,
    points: 25,
    earned: Math.round(25 * payeShare),
    completed: payeShare === 1,
  };

  // Other Notices
  const overdueInvoices = (await getUnpaidInvoices(schoolId)).filter(
    (i) => i.due_date && i.due_date < today,
  ).length;
  const other: ScoreItem = {
    label: "Other Notices",
    detail:
      overdueInvoices === 0
        ? "None overdue"
        : `${overdueInvoices} overdue`,
    points: 10,
    earned: overdueInvoices === 0 ? 10 : 0,
    completed: overdueInvoices === 0,
  };

  const annual = [renewal, notice, paye, other];
  return {
    phase: "annual",
    complianceScore: annual.reduce((t, s) => t + s.earned, 0),
    onboarding,
    onboardingComplete,
    annual,
  };
}

// Everything the school still has to pay or file, most urgent first
export async function getActionItems(schoolId: string): Promise<ActionItem[]> {
  const school = await getSchool(schoolId);
  if (!school) return [];
  const today = todayText();
  const items: ActionItem[] = [];
  const fees = await getFeeState(schoolId);
  const tier = resolveTier(school.category);
  const feeAmount = (id: number) =>
    FEE_DEFINITIONS.find((f) => f.id === id)?.amounts[tier] ?? null;
  const feeName = (id: number) =>
    FEE_DEFINITIONS.find((f) => f.id === id)?.name ?? "Fee";

  if (school.approval_status !== "approved") {
    // Only the next onboarding step; later ones unlock in turn
    const next = [APPLICATION_FORM_FEE_ID, GUIDELINE_FEE_ID, REGISTRATION_FEE_ID].find(
      (id) => !fees.paid(id),
    );
    if (next) {
      items.push({
        label: feeName(next),
        source: "Fees",
        amount: feeAmount(next),
        dueDate: null,
        overdue: false,
        href: "/fees",
      });
    }
  } else {
    if (fees.renewalDue) {
      items.push({
        label: feeName(RENEWAL_FEE_ID),
        source: "Fees",
        amount: feeAmount(RENEWAL_FEE_ID),
        dueDate: dateText(fees.renewalDueOn),
        overdue: true,
        href: "/fees",
      });
    }
    if (fees.monitoringDue) {
      items.push({
        label: feeName(MONITORING_FEE_ID),
        source: "Fees",
        amount: feeAmount(MONITORING_FEE_ID),
        dueDate: null,
        overdue: false,
        href: "/fees",
      });
    }
  }

  for (const line of await getNoticeLines(schoolId)) {
    if (line.status === "unpaid") {
      items.push({
        label: `${line.subhead_name} ${line.year}`,
        source: "Single Demand Notice",
        amount: Number(line.amount),
        dueDate: line.due_date,
        overdue: !!line.due_date && line.due_date < today,
        href: "/Invoices?tab=single",
      });
    } else if (line.status === "awaiting_declaration" && !line.declared) {
      items.push({
        label: `Declare ${line.subhead_name} ${line.year}`,
        source: "Single Demand Notice",
        amount: null,
        dueDate: null,
        overdue: false,
        href: "/Invoices?tab=single",
      });
    }
  }

  const thisMonth = today.slice(0, 7) + "-01";
  for (const m of await getSchoolPayeMonths(schoolId)) {
    if (m.status === "unpaid") {
      items.push({
        label: `PAYE ${periodLabel(m.period)}`,
        source: "Monthly PAYE",
        amount: Number(m.declared_paye),
        dueDate: m.payment_due_date,
        overdue: !!m.payment_due_date && m.payment_due_date < today,
        href: "/Invoices?tab=paye",
      });
    } else if ((!m.status || m.status === "rejected") && m.period < thisMonth) {
      items.push({
        label: `File PAYE return for ${periodLabel(m.period)}`,
        source: "Monthly PAYE",
        amount: null,
        dueDate: m.filing_due_date,
        overdue: m.filing_due_date < today,
        href: "/Invoices?tab=paye",
      });
    }
  }

  for (const inv of await getUnpaidInvoices(schoolId)) {
    items.push({
      label: inv.title || inv.invoice_number,
      source: "Other Notices",
      amount: Number(inv.amount),
      dueDate: inv.due_date,
      overdue: !!inv.due_date && inv.due_date < today,
      href: "/Invoices?tab=other",
    });
  }

  return items.sort(
    (a, b) =>
      Number(b.overdue) - Number(a.overdue) ||
      (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999"),
  );
}
