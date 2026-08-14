"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2, Save, Target, CheckCircle2 } from "lucide-react";
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

type QuarterForm = {
  quarter: number;
  label: string;
  period: string;
  target: string;
  notes: string;
  saved: boolean;
};

const QUARTER_META: Record<number, { label: string; period: string }> = {
  1: { label: "Q1", period: "Jan – Mar" },
  2: { label: "Q2", period: "Apr – Jun" },
  3: { label: "Q3", period: "Jul – Sep" },
  4: { label: "Q4", period: "Oct – Dec" },
};

function emptyForm(): QuarterForm[] {
  return [1, 2, 3, 4].map((q) => ({
    quarter: q,
    label: QUARTER_META[q].label,
    period: QUARTER_META[q].period,
    target: "",
    notes: "",
    saved: false,
  }));
}

export default function RevenueTargetsPage() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [forms, setForms] = useState<QuarterForm[]>(emptyForm());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<number | null>(null);
  const [error, setError] = useState("");

  const fetchTargets = useCallback(async (y: number) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/operator2/revenue-targets?year=${y}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const json: { targets: TargetRow[] } = await res.json();

      setForms(
        emptyForm().map((f) => {
          const existing = json.targets.find((t) => t.quarter === f.quarter);
          return existing
            ? {
                ...f,
                target: String(Number(existing.target)),
                notes: existing.notes || "",
                saved: true,
              }
            : f;
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

  function updateForm(quarter: number, field: "target" | "notes", value: string) {
    setForms((prev) =>
      prev.map((f) =>
        f.quarter === quarter ? { ...f, [field]: value, saved: false } : f,
      ),
    );
  }

  async function handleSave(quarter: number) {
    const form = forms.find((f) => f.quarter === quarter);
    if (!form) return;

    const targetNum = Number(form.target);
    if (!form.target || Number.isNaN(targetNum) || targetNum < 0) {
      toast.error("Enter a valid target amount");
      return;
    }

    setSaving(quarter);
    try {
      const res = await fetch("/api/operator2/revenue-targets", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          year,
          quarter,
          target: targetNum,
          notes: form.notes.trim() || null,
        }),
      });

      if (!res.ok) throw new Error("Save failed");

      setForms((prev) =>
        prev.map((f) => (f.quarter === quarter ? { ...f, saved: true } : f)),
      );
      toast.success(`${QUARTER_META[quarter].label} ${year} target saved`);
    } catch {
      toast.error("Failed to save target");
    } finally {
      setSaving(null);
    }
  }

  const annualTotal = forms.reduce((sum, f) => {
    const n = Number(f.target);
    return sum + (Number.isNaN(n) ? 0 : n);
  }, 0);

  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - 1 + i);

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6">
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
            className="px-4 py-2 text-sm font-semibold border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
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
          <>
            {/* Annual total */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-6 py-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-green-50 border border-green-100 flex items-center justify-center shrink-0">
                <Target className="w-5 h-5 text-[#28a745]" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  Expected Annual Revenue — {year}
                </p>
                <p className="text-xl font-black text-gray-800">
                  ₦{annualTotal.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Quarterly forms */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {forms.map((f) => (
                <div
                  key={f.quarter}
                  className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
                >
                  <div className="flex items-center justify-between px-5 py-4 bg-gray-50 border-b border-gray-100">
                    <div>
                      <p className="text-sm font-black text-gray-800">
                        {f.label} {year}
                      </p>
                      <p className="text-xs text-gray-400">{f.period}</p>
                    </div>
                    {f.saved && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-600">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Saved
                      </span>
                    )}
                  </div>

                  <div className="p-5 space-y-3">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1 block">
                        Target Amount (₦)
                      </label>
                      <input
                        type="number"
                        min={0}
                        placeholder="0.00"
                        value={f.target}
                        onChange={(e) =>
                          updateForm(f.quarter, "target", e.target.value)
                        }
                        className="w-full px-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1 block">
                        Notes (optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. basis for this target"
                        value={f.notes}
                        onChange={(e) =>
                          updateForm(f.quarter, "notes", e.target.value)
                        }
                        className="w-full px-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>

                    <button
                      onClick={() => handleSave(f.quarter)}
                      disabled={saving === f.quarter}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold rounded-xl bg-[#28a745] text-white hover:bg-[#218838] transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {saving === f.quarter ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      {saving === f.quarter ? "Saving" : "Save Target"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
