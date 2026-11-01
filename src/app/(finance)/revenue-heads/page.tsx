"use client";

import { Fragment, useEffect, useState } from "react";
import { ChevronDown, ChevronRight, Download, Loader2 } from "lucide-react";
import * as XLSX from "xlsx";

type Row = { id: number; name: string; months: number[]; total: number };
type Head = Row & { subheads: Row[] };
type Report = {
  year: number;
  heads: Head[];
  unmapped: { months: number[]; total: number };
  months: number[];
  grandTotal: number;
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const cell = (v: number) => (v ? v.toLocaleString() : "—");

export default function RevenueByHeadPage() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState("");
  const [open, setOpen] = useState<number[]>([]);

  useEffect(() => {
    setReport(null);
    setError("");
    fetch(`/api/reports/revenue-heads?year=${year}`)
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(setReport)
      .catch(() => setError("Could not load the report."));
  }, [year]);

  function handleExport() {
    if (!report) return;
    const rows: (string | number)[][] = [["Head", "Sub-Head", ...MONTHS, "Total"]];
    for (const head of report.heads) {
      rows.push([head.name, "All", ...head.months, head.total]);
      for (const s of head.subheads) {
        rows.push([head.name, s.name, ...s.months, s.total]);
      }
    }
    if (report.unmapped.total > 0) {
      rows.push(["Unmapped", "", ...report.unmapped.months, report.unmapped.total]);
    }
    rows.push(["Total", "", ...report.months, report.grandTotal]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.aoa_to_sheet(rows),
      `Revenue ${report.year}`,
    );
    XLSX.writeFile(workbook, `revenue_by_head_${report.year}.xlsx`);
  }

  const toggle = (id: number) =>
    setOpen((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Revenue by Head</h1>
            <p className="text-sm text-gray-500 mt-1">
              Confirmed collections per Head and Sub-Head, by month.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="px-4 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              {[0, 1, 2, 3].map((offset) => (
                <option key={offset} value={currentYear - offset}>
                  {currentYear - offset}
                </option>
              ))}
            </select>
            <button
              onClick={handleExport}
              disabled={!report}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 px-4 py-2 rounded-xl disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>

        {error ? (
          <p className="text-sm text-red-400 text-center py-16">{error}</p>
        ) : !report ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="bg-white rounded-xl border border-gray-200 px-4 py-3">
                <p className="text-xs text-gray-400">{year} Total</p>
                <p className="text-xl font-black text-green-700">
                  ₦{report.grandTotal.toLocaleString()}
                </p>
              </div>
              {report.heads
                .filter((h) => h.total > 0)
                .sort((a, b) => b.total - a.total)
                .slice(0, 3)
                .map((h) => (
                  <div
                    key={h.id}
                    className="bg-white rounded-xl border border-gray-200 px-4 py-3 min-w-0"
                  >
                    <p className="text-xs text-gray-400 truncate">{h.name}</p>
                    <p className="text-xl font-black text-gray-900">
                      ₦{h.total.toLocaleString()}
                    </p>
                  </div>
                ))}
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 border-b border-gray-200">
                    <th className="text-left font-semibold px-4 py-3 min-w-[260px]">
                      Head / Sub-Head
                    </th>
                    {MONTHS.map((m) => (
                      <th key={m} className="text-right font-semibold px-3 py-3">
                        {m}
                      </th>
                    ))}
                    <th className="text-right font-semibold px-4 py-3">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {report.heads.map((head) => (
                    <Fragment key={head.id}>
                      <tr
                        onClick={() => toggle(head.id)}
                        className="cursor-pointer hover:bg-gray-50 font-semibold text-gray-800"
                      >
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1.5">
                            {open.includes(head.id) ? (
                              <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                            )}
                            {head.name}
                          </span>
                        </td>
                        {head.months.map((v, i) => (
                          <td key={i} className="text-right px-3 py-3">
                            {cell(v)}
                          </td>
                        ))}
                        <td className="text-right px-4 py-3 font-bold">
                          {cell(head.total)}
                        </td>
                      </tr>
                      {open.includes(head.id) &&
                        head.subheads.map((s) => (
                          <tr key={s.id} className="text-gray-600 bg-gray-50/50">
                            <td className="pl-10 pr-4 py-2">{s.name}</td>
                            {s.months.map((v, i) => (
                              <td key={i} className="text-right px-3 py-2">
                                {cell(v)}
                              </td>
                            ))}
                            <td className="text-right px-4 py-2 font-semibold">
                              {cell(s.total)}
                            </td>
                          </tr>
                        ))}
                    </Fragment>
                  ))}
                  {report.unmapped.total > 0 && (
                    <tr className="text-amber-700">
                      <td className="px-4 py-3 font-semibold">
                        Unmapped (paid before Heads existed)
                      </td>
                      {report.unmapped.months.map((v, i) => (
                        <td key={i} className="text-right px-3 py-3">
                          {cell(v)}
                        </td>
                      ))}
                      <td className="text-right px-4 py-3 font-bold">
                        {cell(report.unmapped.total)}
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50 border-t-2 border-gray-200 font-bold text-gray-900">
                    <td className="px-4 py-3">Total</td>
                    {report.months.map((v, i) => (
                      <td key={i} className="text-right px-3 py-3">
                        {cell(v)}
                      </td>
                    ))}
                    <td className="text-right px-4 py-3 text-green-700">
                      {cell(report.grandTotal)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
