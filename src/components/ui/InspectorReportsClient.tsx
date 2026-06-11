"use client";

import { useState, useEffect, useRef } from "react";
import {
  Search,
  Building2,
  ChevronRight,
  Loader2,
  X,
  Send,
  FileText,
  CheckCircle2,
  Clock,
  XCircle,
} from "lucide-react";

type School = {
  school_id: string;
  name: string;
  lga: string;
  state: string;
};

type Report = {
  id: string;
  school_name: string;
  subject: string;
  message: string;
  status: "open" | "acknowledged" | "closed";
  created_at: string;
  acknowledged_at: string | null;
  closed_at: string | null;
};

function StatusBadge({ status }: { status: Report["status"] }) {
  const map = {
    open: "bg-yellow-50 text-yellow-700 border-yellow-200",
    acknowledged: "bg-blue-50 text-blue-700 border-blue-200",
    closed: "bg-gray-100 text-gray-500 border-gray-200",
  };
  const labels = {
    open: "Open",
    acknowledged: "Acknowledged",
    closed: "Closed",
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${map[status]}`}
    >
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

export default function InspectorReportsClient() {
  // --- School search state ---
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<School[]>([]);
  const [searching, setSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selected, setSelected] = useState<School | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // --- Compose form state ---
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // --- Past reports state ---
  const [reports, setReports] = useState<Report[]>([]);
  const [loadingReports, setLoadingReports] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Debounced school search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `/api/inspector/search?q=${encodeURIComponent(query)}`,
        );
        if (!res.ok) throw new Error();
        const data = await res.json();
        setSearchResults(data);
        setShowDropdown(true);
      } catch {
        // silently ignore search errors
      } finally {
        setSearching(false);
      }
    }, 400);
  }, [query]);

  // Load past reports on mount
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/inspector/field-reports");
        if (res.ok) setReports(await res.json());
      } finally {
        setLoadingReports(false);
      }
    }
    load();
  }, []);

  function handleSelect(school: School) {
    setSelected(school);
    setQuery(school.name);
    setShowDropdown(false);
    setSubmitSuccess(false);
    setSubmitError("");
  }

  function handleClear() {
    setSelected(null);
    setQuery("");
    setSearchResults([]);
    setSubject("");
    setMessage("");
    setSubmitSuccess(false);
    setSubmitError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;

    setSubmitting(true);
    setSubmitError("");

    try {
      const res = await fetch("/api/inspector/field-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          school_id: selected.school_id,
          school_name: selected.name,
          subject: subject.trim(),
          message: message.trim(),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        setSubmitError(err.error || "Failed to submit report");
        return;
      }

      const { report } = await res.json();
      setSubmitSuccess(true);
      setSubject("");
      setMessage("");
      setSelected(null);
      setQuery("");

      // Prepend the new report to the list
      setReports((prev) => [
        {
          id: report.id,
          school_name: selected.name,
          subject: subject.trim(),
          message: message.trim(),
          status: "open",
          created_at: report.created_at,
          acknowledged_at: null,
          closed_at: null,
        },
        ...prev,
      ]);
    } catch {
      setSubmitError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Field Reports</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Search for an institution, then write and submit your field
            findings.
          </p>
        </div>

        {/* Compose card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
          <div className="bg-[#1a5c2e] px-6 py-4 flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/10">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              New Report
            </h2>
          </div>

          <div className="px-6 py-6 space-y-5">
            {/* School search */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                Institution
              </label>
              <div ref={wrapperRef} className="relative">
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      if (selected) setSelected(null);
                    }}
                    placeholder="Search institution by name..."
                    className="w-full pl-10 pr-9 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {searching ? (
                      <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                    ) : query ? (
                      <button type="button" onClick={handleClear}>
                        <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                      </button>
                    ) : null}
                  </div>
                </div>

                {showDropdown && !selected && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-gray-200 shadow-xl z-50 overflow-hidden">
                    {searchResults.length === 0 ? (
                      <div className="px-5 py-4 text-sm text-gray-400 text-center">
                        No institutions found for &quot;{query}&quot;
                      </div>
                    ) : (
                      <ul className="divide-y divide-gray-100 max-h-60 overflow-y-auto">
                        {searchResults.map((school) => (
                          <li key={school.school_id}>
                            <button
                              type="button"
                              onClick={() => handleSelect(school)}
                              className="w-full flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition text-left"
                            >
                              <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-green-50 border border-green-100 shrink-0">
                                <Building2 className="w-3.5 h-3.5 text-green-600" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-gray-800 truncate">
                                  {school.name}
                                </p>
                                <p className="text-xs text-gray-400">
                                  {school.lga}, {school.state}
                                </p>
                              </div>
                              <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Compose form — only shown when a school is selected */}
            {selected && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                    Subject
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Brief summary of your findings"
                    maxLength={255}
                    required
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                    Message
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Describe your findings in detail..."
                    rows={6}
                    required
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition resize-none"
                  />
                </div>

                {submitError && (
                  <p className="text-xs text-red-500 font-medium">
                    {submitError}
                  </p>
                )}

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={submitting || !subject.trim() || !message.trim()}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1a5c2e] text-white text-sm font-semibold rounded-xl hover:bg-[#154a26] disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    {submitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    {submitting ? "Submitting..." : "Submit Report"}
                  </button>
                </div>
              </form>
            )}

            {/* Empty prompt when no school selected */}
            {!selected && !query && (
              <p className="text-sm text-gray-400 text-center py-4">
                Search and select an institution above to write your report.
              </p>
            )}
          </div>
        </div>

        {/* Success banner */}
        {submitSuccess && (
          <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-5 py-3.5">
            <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
            <p className="text-sm font-medium text-green-700">
              Report submitted successfully. The operator will review it
              shortly.
            </p>
            <button onClick={() => setSubmitSuccess(false)} className="ml-auto">
              <X className="w-4 h-4 text-green-500 hover:text-green-700" />
            </button>
          </div>
        )}

        {/* Past reports */}
        <div>
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-3">
            Your Submitted Reports
          </h2>

          {loadingReports ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
            </div>
          ) : reports.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center bg-white rounded-2xl border border-gray-200">
              <FileText className="w-8 h-8 text-gray-300 mb-2" />
              <p className="text-sm text-gray-400">No reports submitted yet.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {reports.map((r) => (
                <li
                  key={r.id}
                  className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedId(expandedId === r.id ? null : r.id)
                    }
                    className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-gray-50 transition"
                  >
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 shrink-0">
                      {r.status === "open" && (
                        <Clock className="w-4 h-4 text-yellow-500" />
                      )}
                      {r.status === "acknowledged" && (
                        <CheckCircle2 className="w-4 h-4 text-blue-500" />
                      )}
                      {r.status === "closed" && (
                        <XCircle className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-800 truncate">
                        {r.subject}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {r.school_name} · {formatDate(r.created_at)}
                      </p>
                    </div>
                    <StatusBadge status={r.status} />
                  </button>

                  {expandedId === r.id && (
                    <div className="px-5 pb-5 border-t border-gray-100">
                      <p className="text-sm text-gray-700 mt-4 whitespace-pre-wrap leading-relaxed">
                        {r.message}
                      </p>
                      {r.acknowledged_at && (
                        <p className="text-xs text-gray-400 mt-3">
                          Acknowledged: {formatDate(r.acknowledged_at)}
                        </p>
                      )}
                      {r.closed_at && (
                        <p className="text-xs text-gray-400 mt-1">
                          Closed: {formatDate(r.closed_at)}
                        </p>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
