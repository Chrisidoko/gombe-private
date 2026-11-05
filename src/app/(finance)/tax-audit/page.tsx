"use client";

import { Fragment, useEffect, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Download,
  ExternalLink,
  Loader2,
} from "lucide-react";
import * as XLSX from "xlsx";
import type { Liability } from "@/lib/taxAudit";

type School = {
  school_id: string;
  name: string;
  tin: string | null;
  lga: string | null;
  assessed: number;
  paid: number;
  outstanding: number;
  overdue: number;
  awaiting_declarations: number;
  open_objections: number;
  lines: Liability[];
};

const naira = (v: number) => `₦${v.toLocaleString()}`;

const STATUS_LABELS: Record<string, string> = {
  awaiting_declaration: "Awaiting declaration",
  unpaid: "Unpaid",
  paid: "Paid",
  waived: "Nothing due",
};

function lineStatus(line: Liability) {
  if (line.objection_pending) return "Objection open";
  if (line.overdue) return "Overdue";
  return STATUS_LABELS[line.status] ?? line.status;
}

export default function TaxAuditPage() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState<string>(String(currentYear));
  const [schools, setSchools] = useState<School[] | null>(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    setSchools(null);
    setError("");
    fetch(`/api/reports/tax-audit?year=${year}`)
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => setSchools(data.schools))
      .catch(() => setError("Could not load the audit."));
  }, [year]);

  const visible = (schools ?? []).filter(
    (s) =>
      s.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.tin?.includes(search),
  );

  const totals = visible.reduce(
    (t, s) => ({
      assessed: t.assessed + s.assessed,
      paid: t.paid + s.paid,
      outstanding: t.outstanding + s.outstanding,
      overdue: t.overdue + s.overdue,
    }),
    { assessed: 0, paid: 0, outstanding: 0, overdue: 0 },
  );

  function handleExport() {
    const rows = visible.flatMap((s) =>
      s.lines.map((l) => ({
        Institution: s.name,
        TIN: s.tin ?? "",
        LGA: s.lga ?? "",
        Source: l.source,
        Head: l.head,
        "Sub-Head": l.subhead,
        Year: l.year,
        Assessed: l.assessed ?? "",
        Paid: l.paid,
        Outstanding: l.outstanding,
        Status: lineStatus(l),
        "Due Date": l.due_date ? new Date(l.due_date).toLocaleDateString("en-GB") : "",
        Reference: l.reference ?? "",
        "Standard Amount": l.standard_amount ?? "",
        "Adjustment Reason": l.adjustment_reason ?? "",
      })),
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet(rows),
      "Tax Audit",
    );
    XLSX.writeFile(workbook, `tax_audit_${year}.xlsx`);
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tax Audit</h1>
            <p className="text-sm text-gray-500 mt-1">
              Every institution&apos;s liabilities across all Heads.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="px-4 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="all">All years</option>
              {[1, 0, -1, -2].map((offset) => (
                <option key={offset} value={currentYear + offset}>
                  {currentYear + offset}
                </option>
              ))}
            </select>
            <button
              onClick={handleExport}
              disabled={!schools || visible.length === 0}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 px-4 py-2 rounded-xl disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>

        {error ? (
          <p className="text-sm text-red-400 text-center py-16">{error}</p>
        ) : !schools ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { label: "Assessed", value: totals.assessed, color: "text-gray-900" },
                { label: "Paid", value: totals.paid, color: "text-green-700" },
                { label: "Outstanding", value: totals.outstanding, color: "text-red-600" },
                { label: "Overdue", value: totals.overdue, color: "text-red-700" },
              ].map((tile) => (
                <div
                  key={tile.label}
                  className="bg-white rounded-xl border border-gray-200 px-4 py-3"
                >
                  <p className="text-xs text-gray-400">{tile.label}</p>
                  <p className={`text-xl font-black ${tile.color}`}>
                    {naira(tile.value)}
                  </p>
                </div>
              ))}
            </div>

            <input
              type="text"
              placeholder="Search by institution or TIN..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:w-80 px-4 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
            />

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-xs text-gray-500 border-b border-gray-200">
                    <th className="text-left font-semibold px-4 py-3">Institution</th>
                    <th className="text-right font-semibold px-4 py-3">Assessed</th>
                    <th className="text-right font-semibold px-4 py-3">Paid</th>
                    <th className="text-right font-semibold px-4 py-3">Outstanding</th>
                    <th className="text-left font-semibold px-4 py-3">Open items</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {visible.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center text-gray-400 py-12">
                        No liabilities found.
                      </td>
                    </tr>
                  )}
                  {visible.map((school) => (
                    <Fragment key={school.school_id}>
                      <tr
                        onClick={() =>
                          setOpenId(
                            openId === school.school_id ? null : school.school_id,
                          )
                        }
                        className="cursor-pointer hover:bg-gray-50"
                      >
                        <td className="px-4 py-3">
                          <span className="inline-flex items-start gap-1.5">
                            {openId === school.school_id ? (
                              <ChevronDown className="w-4 h-4 text-gray-400 mt-0.5" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-gray-400 mt-0.5" />
                            )}
                            <span>
                              <span className="block font-semibold text-gray-800">
                                {school.name}
                              </span>
                              <span className="block text-xs text-gray-400">
                                {school.tin ? `TIN ${school.tin}` : "No TIN"}
                                {school.lga ? ` · ${school.lga}` : ""}
                              </span>
                            </span>
                          </span>
                        </td>
                        <td className="text-right px-4 py-3">{naira(school.assessed)}</td>
                        <td className="text-right px-4 py-3 text-green-700">
                          {naira(school.paid)}
                        </td>
                        <td className="text-right px-4 py-3 font-bold text-red-600">
                          {naira(school.outstanding)}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500">
                          {[
                            school.overdue > 0 && `${naira(school.overdue)} overdue`,
                            school.awaiting_declarations > 0 &&
                              `${school.awaiting_declarations} declaration${school.awaiting_declarations !== 1 ? "s" : ""} awaited`,
                            school.open_objections > 0 &&
                              `${school.open_objections} objection${school.open_objections !== 1 ? "s" : ""}`,
                          ]
                            .filter(Boolean)
                            .join(" · ") || "—"}
                        </td>
                      </tr>
                      {openId === school.school_id && (
                        <tr>
                          <td colSpan={5} className="bg-gray-50 px-4 py-3">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="text-gray-400">
                                  <th className="text-left font-semibold py-1.5">Head / Sub-Head</th>
                                  <th className="text-left font-semibold py-1.5">Year</th>
                                  <th className="text-right font-semibold py-1.5">Assessed</th>
                                  <th className="text-right font-semibold py-1.5">Paid</th>
                                  <th className="text-left font-semibold py-1.5 pl-6">Status</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200">
                                {school.lines.map((line, i) => (
                                  <tr key={i} className="text-gray-700">
                                    <td className="py-2">
                                      <span className="block font-medium">{line.subhead}</span>
                                      <span className="block text-gray-400">
                                        {line.head} · {line.source}
                                      </span>
                                    </td>
                                    <td className="py-2">{line.year}</td>
                                    <td className="text-right py-2">
                                      {line.assessed === null ? "—" : naira(line.assessed)}
                                    </td>
                                    <td className="text-right py-2">{naira(line.paid)}</td>
                                    <td className="py-2 pl-6">
                                      {lineStatus(line)}
                                      {line.declaration_source === "operator_estimate" &&
                                        " · Operator estimate"}
                                      {line.adjustment_reason && (
                                        <span className="block text-amber-700">
                                          ⚑ Adjusted from{" "}
                                          {naira(line.standard_amount ?? 0)}:{" "}
                                          {line.adjustment_reason}
                                        </span>
                                      )}
                                      {line.evidence_url && (
                                        <a
                                          href={line.evidence_url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="ml-2 inline-flex items-center gap-1 text-green-700"
                                        >
                                          <ExternalLink className="w-3 h-3" />
                                          Evidence
                                        </a>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
