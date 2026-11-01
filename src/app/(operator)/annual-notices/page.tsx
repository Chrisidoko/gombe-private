"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  FileText,
  Loader2,
  XCircle,
} from "lucide-react";
import toast from "react-hot-toast";

type School = {
  school_id: string;
  name: string;
  location_type: string | null;
  premises_category: string | null;
};

type Batch = {
  id: number;
  source: string;
  status: string;
  created_by: string | null;
  rejection_reason: string | null;
  created_at: string;
  school_count: string;
};

type Readiness = {
  ready: School[];
  missingDetails: School[];
  batches: Batch[];
};

const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  pending_approval: {
    label: "Awaiting review",
    className: "bg-amber-50 text-amber-700 border-amber-200",
  },
  approved: {
    label: "Issued",
    className: "bg-green-50 text-green-700 border-green-200",
  },
  rejected: {
    label: "Rejected",
    className: "bg-red-50 text-red-600 border-red-200",
  },
};

function formatDate(s: string) {
  return new Date(s).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function AnnualNoticesPage() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [data, setData] = useState<Readiness | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/operator/annual-notices?year=${year}`);
      if (!res.ok) throw new Error();
      setData(await res.json());
    } catch {
      setError("Could not load annual notices.");
    } finally {
      setLoading(false);
    }
  }, [year]);

  useEffect(() => {
    load();
  }, [load]);

  async function handlePrepare() {
    setSubmitting(true);
    try {
      const res = await fetch("/api/operator/annual-notices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      toast.success(
        `${result.total_schools} notices sent for supervisor review`,
      );
      load();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to prepare notices",
      );
    } finally {
      setSubmitting(false);
    }
  }

  const readyCount = data?.ready.length ?? 0;

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Annual Notices</h1>
            <p className="text-sm text-gray-500 mt-1">
              Prepare the yearly Single Demand Notice. Schools only receive it
              after supervisor approval, and the 30 days start then.
            </p>
          </div>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="px-4 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value={currentYear}>{currentYear}</option>
            <option value={currentYear + 1}>{currentYear + 1}</option>
          </select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
          </div>
        ) : error ? (
          <p className="text-sm text-red-400 text-center py-16">{error}</p>
        ) : (
          data && (
            <>
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="bg-[#1a5c2e] px-6 py-5 flex items-center gap-3">
                  <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-white/10">
                    <FileText className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-white">
                      {year} Notices
                    </h2>
                    <p className="text-xs text-green-300 mt-0.5">
                      {readyCount} institution{readyCount !== 1 ? "s" : ""}{" "}
                      ready
                    </p>
                  </div>
                </div>

                <div className="px-6 py-6 space-y-4">
                  {data.missingDetails.length > 0 && (
                    <div className="flex items-start gap-3 bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3">
                      <AlertCircle className="w-4 h-4 text-yellow-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-yellow-800">
                          {data.missingDetails.length} institution
                          {data.missingDetails.length !== 1 ? "s" : ""} left out
                        </p>
                        <p className="text-xs text-yellow-700 mt-0.5">
                          An admin must set location and premises category
                          first: {data.missingDetails
                            .map((s) => s.name)
                            .join(", ")}
                        </p>
                      </div>
                    </div>
                  )}

                  {readyCount > 0 ? (
                    <ul className="divide-y divide-gray-100 border border-gray-100 rounded-xl max-h-64 overflow-y-auto">
                      {data.ready.map((s) => (
                        <li
                          key={s.school_id}
                          className="flex items-center justify-between gap-3 px-4 py-2.5"
                        >
                          <span className="text-sm font-medium text-gray-800 truncate">
                            {s.name}
                          </span>
                          <span className="text-xs text-gray-400 capitalize shrink-0">
                            {s.location_type} · Category {s.premises_category}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                      <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                      <p className="text-sm text-green-800">
                        No institution is waiting for a {year} notice.
                      </p>
                    </div>
                  )}

                  <button
                    onClick={handlePrepare}
                    disabled={readyCount === 0 || submitting}
                    className="w-full flex items-center justify-center gap-2 bg-[#1a5c2e] hover:bg-[#166534] text-white font-bold py-3 rounded-xl text-sm transition disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    Prepare {readyCount} Notice{readyCount !== 1 ? "s" : ""} for
                    Review
                  </button>
                </div>
              </div>

              {data.batches.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100">
                    <h3 className="text-sm font-bold text-gray-800">
                      {year} Batches
                    </h3>
                  </div>
                  <ul className="divide-y divide-gray-100">
                    {data.batches.map((b) => {
                      const style = STATUS_STYLES[b.status];
                      const Icon =
                        b.status === "approved"
                          ? CheckCircle2
                          : b.status === "rejected"
                            ? XCircle
                            : Clock;
                      return (
                        <li key={b.id} className="px-6 py-3">
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-gray-800">
                                {b.school_count} institution
                                {b.school_count !== "1" ? "s" : ""}
                                {b.source === "school_approval" &&
                                  " · new approval"}
                              </p>
                              <p className="text-xs text-gray-400">
                                {b.created_by} · {formatDate(b.created_at)}
                              </p>
                            </div>
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-semibold shrink-0 ${style.className}`}
                            >
                              <Icon className="w-3 h-3" />
                              {style.label}
                            </span>
                          </div>
                          {b.rejection_reason && (
                            <p className="text-xs text-red-500 mt-1.5">
                              {b.rejection_reason}
                            </p>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </>
          )
        )}
      </div>
    </div>
  );
}
