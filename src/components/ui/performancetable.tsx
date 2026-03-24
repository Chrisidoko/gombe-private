// app/(finance)/finance/page.tsx
import { AlertTriangle } from "lucide-react";

const YEAR = new Date().getFullYear();

type Quarter = {
  quarter: number;
  label: string;
  period: string;
  expected: number;
  actual: number;
};

type PerformanceData = {
  year: number;
  targetsSet: boolean;
  expectedAnnual: number;
  quarters: Quarter[];
  summary: {
    cumulativeExpected: number;
    cumulativeActual: number;
    variance: number;
    performancePct: number | null;
  };
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt(n: number) {
  if (n === 0) return "—";
  return `₦${n.toLocaleString()}`;
}

function perf(actual: number, expected: number) {
  if (expected === 0 || actual === 0) return null;
  return ((actual / expected) * 100).toFixed(1);
}

function PerfBadge({ actual, expected }: { actual: number; expected: number }) {
  const p = perf(actual, expected);
  if (!p) return <span className="text-gray-300 text-xs">—</span>;
  const num = parseFloat(p);
  const color =
    num >= 100
      ? "bg-green-100 text-green-700"
      : num >= 75
        ? "bg-yellow-100 text-yellow-700"
        : "bg-red-50 text-red-600";
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${color}`}
    >
      {p}%
    </span>
  );
}

function ProgressBar({
  actual,
  expected,
}: {
  actual: number;
  expected: number;
}) {
  const pct = expected > 0 ? Math.min((actual / expected) * 100, 100) : 0;
  const color =
    pct >= 100 ? "bg-green-500" : pct >= 75 ? "bg-yellow-400" : "bg-red-400";
  return (
    <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1">
      <div
        className={`h-1.5 rounded-full ${color}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

async function getPerformanceData(): Promise<PerformanceData | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const res = await fetch(
      `${baseUrl}/api/dashboard/revenue-performance?year=${YEAR}`,
      { cache: "no-store" },
    );
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function RevenuePerformancePage() {
  const data = await getPerformanceData();

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-6 flex items-center justify-center">
        <p className="text-sm text-red-400">Failed to load revenue data.</p>
      </div>
    );
  }

  const { quarters, summary, expectedAnnual, targetsSet } = data;

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6 space-y-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Page header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Revenue Performance
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Kaduna State Ministry of Education — Private Tertiary Institutions ·{" "}
            {YEAR}
          </p>
        </div>

        {/* No targets warning */}
        {!targetsSet && (
          <div className="flex items-start gap-3 bg-yellow-50 border border-yellow-200 rounded-xl px-5 py-4">
            <AlertTriangle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-yellow-800">
                Revenue targets for {YEAR} have not been set
              </p>
              <p className="text-xs text-yellow-700 mt-0.5">
                Performance percentages cannot be calculated until an
                administrator sets the quarterly targets.
              </p>
            </div>
          </div>
        )}

        {/* ── Table 1 — Quarterly Breakdown ─────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="bg-[#1a5c2e] px-6 py-5">
            <h2 className="text-sm font-bold text-white uppercase tracking-widest">
              Quarterly Revenue Performance — {YEAR}
            </h2>
            <p className="text-xs text-green-300 mt-0.5">
              Expected Annual Revenue:{" "}
              <span className="font-bold text-white">
                {fmt(expectedAnnual)}
              </span>
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-400 w-28">
                    Quarter
                  </th>
                  <th className="text-right px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    Expected Collection
                  </th>
                  <th className="text-right px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    Total Collection
                  </th>
                  <th className="text-center px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    % Perf.
                  </th>
                  <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-400 w-40">
                    Progress
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {quarters.map((q) => (
                  <tr
                    key={q.quarter}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-green-50 border border-green-100 text-xs font-black text-green-700">
                          {q.label}
                        </span>
                        <span className="text-xs text-gray-400">
                          {q.period}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <p className="text-sm font-semibold text-gray-700">
                        {fmt(q.expected)}
                      </p>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <p
                        className={`text-sm font-bold ${
                          q.actual === 0
                            ? "text-gray-300"
                            : q.actual >= q.expected
                              ? "text-green-600"
                              : "text-gray-800"
                        }`}
                      >
                        {fmt(q.actual)}
                      </p>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <PerfBadge actual={q.actual} expected={q.expected} />
                    </td>
                    <td className="px-6 py-4">
                      <ProgressBar actual={q.actual} expected={q.expected} />
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50 border-t-2 border-gray-200">
                  <td className="px-6 py-4">
                    <span className="text-xs font-black text-gray-700 uppercase tracking-wide">
                      Annual Total
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <p className="text-sm font-black text-gray-800">
                      {fmt(expectedAnnual)}
                    </p>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <p className="text-sm font-black text-green-600">
                      {fmt(summary.cumulativeActual)}
                    </p>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <PerfBadge
                      actual={summary.cumulativeActual}
                      expected={expectedAnnual}
                    />
                  </td>
                  <td className="px-6 py-4">
                    <ProgressBar
                      actual={summary.cumulativeActual}
                      expected={expectedAnnual}
                    />
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* ── Table 2 — Cumulative Performance Summary ──────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="bg-[#1a5c2e] px-6 py-5">
            <h2 className="text-sm font-bold text-white uppercase tracking-widest">
              Cumulative Performance Summary — {YEAR}
            </h2>
            <p className="text-xs text-green-300 mt-0.5">
              Q1 – Q4 consolidated view
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-gray-100">
            <div className="bg-white px-6 py-5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">
                Expected Annual Revenue
              </p>
              <p className="text-xl font-black text-gray-800">
                {fmt(expectedAnnual)}
              </p>
            </div>
            <div className="bg-white px-6 py-5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">
                Q1–Q4 Cumulative Expected
              </p>
              <p className="text-xl font-black text-gray-800">
                {fmt(summary.cumulativeExpected)}
              </p>
            </div>
            <div className="bg-white px-6 py-5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">
                Q1–Q4 Total Collection
              </p>
              <p className="text-xl font-black text-green-600">
                {fmt(summary.cumulativeActual)}
              </p>
            </div>
            <div className="bg-white px-6 py-5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">
                % Performance
              </p>
              <p className="text-xl font-black text-gray-800">
                {summary.performancePct !== null
                  ? `${summary.performancePct}%`
                  : "—"}
              </p>
            </div>
          </div>

          {/* Variance */}
          <div className="px-6 py-5 border-t border-gray-100 flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">
                Variance (Collection vs Expected)
              </p>
              <p
                className={`text-2xl font-black ${
                  summary.variance >= 0 ? "text-green-600" : "text-red-500"
                }`}
              >
                {summary.variance >= 0 ? "+" : ""}
                {fmt(Math.abs(summary.variance))}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {summary.variance >= 0
                  ? "Exceeding target — good performance"
                  : "Below target — review required"}
              </p>
            </div>

            <div className="min-w-[200px] flex-1 max-w-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-500">Overall Progress</span>
                <span className="text-xs font-bold text-gray-700">
                  {summary.performancePct !== null
                    ? `${summary.performancePct}%`
                    : "—"}
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className="h-2 rounded-full bg-green-500"
                  style={{
                    width: `${Math.min(
                      expectedAnnual > 0
                        ? (summary.cumulativeActual / expectedAnnual) * 100
                        : 0,
                      100,
                    )}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        <p className="text-xs text-gray-400 text-center pb-4">
          * Figures reflect confirmed paid transactions only.
        </p>
      </div>
    </div>
  );
}
