"use client";

import { useState, useEffect } from "react";
import {
  Loader2,
  ChevronDown,
  ChevronUp,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  User,
  Building2,
  Calendar,
} from "lucide-react";

type Report = {
  id: string;
  school_id: string;
  school_name: string;
  inspector_name: string;
  inspector_email: string;
  subject: string;
  message: string;
  status: "open" | "acknowledged" | "closed";
  created_at: string;
  acknowledged_at: string | null;
  closed_at: string | null;
};

type StatusFilter = "all" | "open" | "acknowledged" | "closed";

function StatusBadge({ status }: { status: Report["status"] }) {
  const map = {
    open: "bg-yellow-50 text-yellow-700 border-yellow-200",
    acknowledged: "bg-blue-50 text-blue-700 border-blue-200",
    closed: "bg-gray-100 text-gray-500 border-gray-200",
  };
  const icons = {
    open: <Clock className="w-3 h-3" />,
    acknowledged: <CheckCircle2 className="w-3 h-3" />,
    closed: <XCircle className="w-3 h-3" />,
  };
  const labels = { open: "Open", acknowledged: "Acknowledged", closed: "Closed" };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${map[status]}`}
    >
      {icons[status]}
      {labels[status]}
    </span>
  );
}

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function OperatorFieldReportsClient() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState<Record<string, string>>({});

  useEffect(() => {
    loadReports();
  }, []);

  async function loadReports() {
    setLoading(true);
    try {
      const res = await fetch("/api/operator/field-reports");
      if (res.ok) setReports(await res.json());
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(id: string, action: "acknowledge" | "close") {
    setActionLoading(id + action);
    setActionError((prev) => ({ ...prev, [id]: "" }));

    try {
      const res = await fetch(`/api/operator/field-reports/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      if (!res.ok) {
        const err = await res.json();
        setActionError((prev) => ({ ...prev, [id]: err.error || "Action failed" }));
        return;
      }

      const { report: updated } = await res.json();

      setReports((prev) =>
        prev.map((r) =>
          r.id === id
            ? {
                ...r,
                status: updated.status,
                acknowledged_at: updated.acknowledged_at ?? r.acknowledged_at,
                closed_at: updated.closed_at ?? r.closed_at,
              }
            : r
        )
      );
    } catch {
      setActionError((prev) => ({ ...prev, [id]: "Something went wrong." }));
    } finally {
      setActionLoading(null);
    }
  }

  const filtered =
    filter === "all" ? reports : reports.filter((r) => r.status === filter);

  const counts = {
    all: reports.length,
    open: reports.filter((r) => r.status === "open").length,
    acknowledged: reports.filter((r) => r.status === "acknowledged").length,
    closed: reports.filter((r) => r.status === "closed").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Field Reports</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Inspector findings submitted from the field. Closed reports are automatically
          deleted after 30 days.
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {(["all", "open", "acknowledged", "closed"] as StatusFilter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium border transition ${
              filter === f
                ? "bg-[#1a5c2e] text-white border-[#1a5c2e]"
                : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            <span
              className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                filter === f ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
              }`}
            >
              {counts[f]}
            </span>
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-200">
          <FileText className="w-10 h-10 text-gray-200 mb-3" />
          <p className="text-sm font-semibold text-gray-500">No reports found</p>
          <p className="text-xs text-gray-400 mt-1">
            {filter === "all"
              ? "No field reports have been submitted yet."
              : `No ${filter} reports at this time.`}
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {filtered.map((r) => {
            const isExpanded = expandedId === r.id;

            return (
              <li
                key={r.id}
                className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
              >
                {/* Row header — clickable to expand */}
                <button
                  type="button"
                  onClick={() => setExpandedId(isExpanded ? null : r.id)}
                  className="w-full flex items-start gap-4 px-5 py-4 text-left hover:bg-gray-50 transition"
                >
                  <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gray-50 border border-gray-100 shrink-0 mt-0.5">
                    {r.status === "open" && <Clock className="w-4 h-4 text-yellow-500" />}
                    {r.status === "acknowledged" && (
                      <CheckCircle2 className="w-4 h-4 text-blue-500" />
                    )}
                    {r.status === "closed" && (
                      <XCircle className="w-4 h-4 text-gray-400" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold text-gray-800">{r.subject}</p>
                      <StatusBadge status={r.status} />
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-400 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3 h-3" />
                        {r.school_name}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {r.inspector_name}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(r.created_at)}
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0 mt-1">
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                </button>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="border-t border-gray-100 px-5 py-5 space-y-5">
                    {/* Inspector info */}
                    <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-700 text-sm font-bold shrink-0">
                        {r.inspector_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">
                          {r.inspector_name}
                        </p>
                        <p className="text-xs text-gray-400">{r.inspector_email}</p>
                      </div>
                    </div>

                    {/* Message */}
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                        Findings
                      </p>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                        {r.message}
                      </p>
                    </div>

                    {/* Timeline */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-gray-500">
                      <div>
                        <p className="font-bold uppercase tracking-wider text-gray-400 mb-0.5">
                          Submitted
                        </p>
                        <p>{formatDate(r.created_at)}</p>
                      </div>
                      <div>
                        <p className="font-bold uppercase tracking-wider text-gray-400 mb-0.5">
                          Acknowledged
                        </p>
                        <p>{formatDate(r.acknowledged_at)}</p>
                      </div>
                      <div>
                        <p className="font-bold uppercase tracking-wider text-gray-400 mb-0.5">
                          Closed
                        </p>
                        <p>{formatDate(r.closed_at)}</p>
                      </div>
                    </div>

                    {/* Error */}
                    {actionError[r.id] && (
                      <p className="text-xs text-red-500 font-medium">
                        {actionError[r.id]}
                      </p>
                    )}

                    {/* Action buttons */}
                    {r.status !== "closed" && (
                      <div className="flex items-center gap-3 pt-1">
                        {r.status === "open" && (
                          <button
                            onClick={() => handleAction(r.id, "acknowledge")}
                            disabled={actionLoading === r.id + "acknowledge"}
                            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
                          >
                            {actionLoading === r.id + "acknowledge" ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            )}
                            Acknowledge
                          </button>
                        )}
                        <button
                          onClick={() => handleAction(r.id, "close")}
                          disabled={actionLoading === r.id + "close"}
                          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-600 bg-gray-100 border border-gray-200 rounded-xl hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition"
                        >
                          {actionLoading === r.id + "close" ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5" />
                          )}
                          Close Report
                        </button>
                      </div>
                    )}

                    {r.status === "closed" && (
                      <p className="text-xs text-gray-400 italic">
                        This report is closed and will be permanently deleted 30 days after
                        closing.
                      </p>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
