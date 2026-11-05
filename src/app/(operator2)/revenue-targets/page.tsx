"use client";

import { useEffect, useState, useCallback } from "react";
import { CheckCircle2, Loader2, RotateCcw, Save } from "lucide-react";
import toast from "react-hot-toast";

type TargetRow = {
  id: number;
  year: number;
  quarter: number;
  target: string;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

// The whole year is edited at once; saved* hold what the server has, so a row
// knows whether it has unsaved changes.
type QuarterRow = {
  quarter: number;
  label: string;
  period: string;
  target: string;
  notes: string;
  savedTarget: string;
  savedNotes: string;
};

const QUARTER_META: Record<number, { label: string; period: string }> = {
  1: { label: "Q1", period: "Jan – Mar" },
  2: { label: "Q2", period: "Apr – Jun" },
  3: { label: "Q3", period: "Jul – Sep" },
  4: { label: "Q4", period: "Oct – Dec" },
};

const naira = (n: number) => `₦${n.toLocaleString()}`;

function emptyRows(): QuarterRow[] {
  return [1, 2, 3, 4].map((q) => ({
    quarter: q,
    label: QUARTER_META[q].label,
    period: QUARTER_META[q].period,
    target: "",
    notes: "",
    savedTarget: "",
    savedNotes: "",
  }));
}

const isDirty = (r: QuarterRow) =>
  r.target !== r.savedTarget || r.notes.trim() !== r.savedNotes;

function rowProblem(r: QuarterRow) {
  if (!isDirty(r)) return null;
  if (r.target === "")
    return r.savedTarget
      ? "A saved target can't be emptied"
      : "Enter an amount";
  const n = Number(r.target);
  if (Number.isNaN(n) || n < 0) return "Enter a valid amount";
  return null;
}

function Status({ row }: { row: QuarterRow }) {
  if (isDirty(row))
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
        Unsaved
      </span>
    );
  if (row.savedTarget)
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-600">
        <CheckCircle2 className="w-3.5 h-3.5" />
        Saved
      </span>
    );
  return <span className="text-xs font-semibold text-gray-400">Not set</span>;
}

const inputClass =
  "w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500";

export default function RevenueTargetsPage() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [rows, setRows] = useState<QuarterRow[]>(emptyRows());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchTargets = useCallback(async (y: number) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/operator2/revenue-targets?year=${y}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const json: { targets: TargetRow[] } = await res.json();

      setRows(
        emptyRows().map((r) => {
          const existing = json.targets.find((t) => t.quarter === r.quarter);
          if (!existing) return r;
          const target = String(Number(existing.target));
          const notes = existing.notes || "";
          return {
            ...r,
            target,
            notes,
            savedTarget: target,
            savedNotes: notes,
          };
        }),
      );
    } catch {
      setError("Could not load revenue targets.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTargets(year);
  }, [year, fetchTargets]);

  function update(quarter: number, field: "target" | "notes", value: string) {
    setRows((prev) =>
      prev.map((r) => (r.quarter === quarter ? { ...r, [field]: value } : r)),
    );
  }

  function discard() {
    setRows((prev) =>
      prev.map((r) => ({ ...r, target: r.savedTarget, notes: r.savedNotes })),
    );
  }

  const changed = rows.filter(isDirty);
  const problems = rows.filter((r) => rowProblem(r));

  async function saveChanges() {
    setSaving(true);
    let savedCount = 0;
    try {
      // One request per changed quarter, through the existing endpoint
      for (const r of changed) {
        const res = await fetch("/api/operator2/revenue-targets", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            year,
            quarter: r.quarter,
            target: Number(r.target),
            notes: r.notes.trim() || null,
          }),
        });
        if (!res.ok) throw new Error(`${r.label} could not be saved`);
        savedCount++;
        setRows((prev) =>
          prev.map((p) =>
            p.quarter === r.quarter
              ? {
                  ...p,
                  notes: r.notes.trim(),
                  savedTarget: r.target,
                  savedNotes: r.notes.trim(),
                }
              : p,
          ),
        );
      }
      toast.success(
        `${year} target${savedCount !== 1 ? "s" : ""} saved for ${changed.map((r) => r.label).join(", ")}`,
      );
    } catch (err) {
      toast.error(
        `${err instanceof Error ? err.message : "Save failed"}${savedCount ? `. ${savedCount} saved before it.` : ""}`,
      );
    } finally {
      setSaving(false);
    }
  }

  const annualTotal = rows.reduce((sum, r) => {
    const n = Number(r.target);
    return sum + (Number.isNaN(n) ? 0 : n);
  }, 0);
  const emptyQuarters = rows.filter((r) => r.target === "").map((r) => r.label);
  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - 1 + i);

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-2">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Revenue Targets
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Set quarterly revenue collection targets used on the Finance
              performance dashboard.
            </p>
          </div>

          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            disabled={changed.length > 0 || saving}
            title={
              changed.length > 0
                ? "Save or discard your changes first"
                : undefined
            }
            className="px-4 py-2 text-sm font-semibold border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-20">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="bg-green-600 px-6 py-5 flex items-center justify-between gap-4 flex-wrap">
              <div>
                <h2 className="text-base font-bold text-white">
                  {year} Targets
                </h2>
                <p className="text-xs text-green-100 mt-0.5">
                  Edit any quarter, then save your changes together.
                </p>
              </div>
              <div className="sm:text-right">
                <p className="text-xs text-green-100 uppercase tracking-widest">
                  For the year
                </p>
                <p className="text-xl font-black text-white">
                  {naira(annualTotal)}
                </p>
              </div>
            </div>

            {/* Column headings, from tablet width */}
            <div className="hidden sm:grid grid-cols-[150px_180px_1fr_90px] gap-4 px-6 py-2.5 border-b border-gray-100 text-[11px] font-bold uppercase tracking-widest text-gray-400">
              <span>Quarter</span>
              <span>Target (₦)</span>
              <span>Notes</span>
              <span className="text-right">Status</span>
            </div>

            <div className="divide-y divide-gray-100">
              {rows.map((r) => {
                const problem = rowProblem(r);
                return (
                  <div
                    key={r.quarter}
                    className={`px-6 py-4 sm:py-3 grid grid-cols-1 sm:grid-cols-[150px_180px_1fr_90px] gap-3 sm:gap-4 sm:items-center ${
                      isDirty(r) ? "bg-amber-50/40" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between sm:block">
                      <div>
                        <p className="text-sm font-black text-gray-800">
                          {r.label}
                        </p>
                        <p className="text-xs text-gray-400">{r.period}</p>
                      </div>
                      <span className="sm:hidden">
                        <Status row={r} />
                      </span>
                    </div>
                    <div>
                      <label className="sm:hidden text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-1 block">
                        Target (₦)
                      </label>
                      <input
                        type="number"
                        min={0}
                        placeholder="0"
                        value={r.target}
                        onChange={(e) =>
                          update(r.quarter, "target", e.target.value)
                        }
                        className={inputClass}
                      />
                      {problem && (
                        <p className="text-[11px] text-red-500 mt-1">
                          {problem}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="sm:hidden text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-1 block">
                        Notes (optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. basis for this target"
                        value={r.notes}
                        onChange={(e) =>
                          update(r.quarter, "notes", e.target.value)
                        }
                        className={inputClass}
                      />
                    </div>
                    <div className="hidden sm:block text-right">
                      <Status row={r} />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <p className="text-xs text-gray-500">
                {emptyQuarters.length === 0
                  ? "All four quarters set."
                  : `${emptyQuarters.join(", ")} still empty.`}
                {changed.length > 0 &&
                  ` ${changed.length} quarter${changed.length !== 1 ? "s" : ""} with unsaved changes.`}
              </p>
              <div className="flex flex-col-reverse sm:flex-row gap-2">
                {changed.length > 0 && (
                  <button
                    onClick={discard}
                    disabled={saving}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl border border-gray-200 text-gray-600 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Discard changes
                  </button>
                )}
                <button
                  onClick={saveChanges}
                  disabled={
                    changed.length === 0 || problems.length > 0 || saving
                  }
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-bold rounded-xl bg-[#28a745] text-white hover:bg-[#218838] transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {saving ? "Saving" : "Save changes"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
