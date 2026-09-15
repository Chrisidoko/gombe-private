"use client";

import { useEffect, useState } from "react";
import {
  ChartNoAxesGantt,
  Loader2,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  PackageOpen,
  Users,
  Search,
} from "lucide-react";
import toast from "react-hot-toast";

type BulkAssessment = {
  id: number;
  title: string;
  description: string | null;
  tier_1_fee: string | null;
  tier_2_fee: string | null;
  tier_3_fee: string | null;
  total_schools: number;
  created_by: string;
  created_at: string;
  status: string;
};

function formatCurrency(v: string | number | null) {
  if (!v) return "—";
  return `₦${Number(v).toLocaleString()}`;
}

function formatDate(s: string) {
  return new Date(s).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

type CategorySchools = {
  tier: number;
  label: string;
  fee: string | null;
  schools: { school_id: string; name: string; lga: string | null }[];
};

function SchoolsModal({
  title,
  categories,
  onClose,
}: {
  title: string;
  categories: CategorySchools[];
  onClose: () => void;
}) {
  const [activeTab, setActiveTab] = useState<number | "all">("all");
  const [search, setSearch] = useState("");

  const allSchools = categories.flatMap((c) =>
    c.schools.map((s) => ({ ...s, tier: c.tier, label: c.label })),
  );

  const q = search.trim().toLowerCase();
  const filtered = allSchools.filter((s) => {
    const matchesTab = activeTab === "all" || s.tier === activeTab;
    const matchesSearch =
      !q ||
      s.name.toLowerCase().includes(q) ||
      (s.lga || "").toLowerCase().includes(q);
    return matchesTab && matchesSearch;
  });

  const tabs = [
    { id: "all" as const, label: "All", count: allSchools.length },
    ...categories.map((c) => ({
      id: c.tier,
      label: c.label,
      count: c.schools.length,
    })),
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[80vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-start justify-between shrink-0">
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-gray-900">
              Affected Schools
            </h3>
            <p className="text-xs text-gray-400 mt-0.5 truncate">{title}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="px-6 pt-4 shrink-0 relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-9 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            autoFocus
            placeholder="Search by school name or LGA..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#28a745]"
          />
        </div>

        {/* Category tabs */}
        <div className="px-6 pt-3 shrink-0">
          <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 overflow-x-auto">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex-1 min-w-[84px] px-3 py-2 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                  activeTab === t.id
                    ? "bg-white text-[#28a745] shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {t.label}{" "}
                <span className="text-gray-400 font-medium">({t.count})</span>
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-6 py-3">
          {filtered.length === 0 ? (
            <p className="text-center text-sm text-gray-400 py-10">
              No schools match.
            </p>
          ) : (
            <div className="divide-y divide-gray-100">
              {filtered.map((s) => (
                <div
                  key={s.school_id}
                  className="flex items-center justify-between gap-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {s.name}
                    </p>
                    <p className="text-xs text-gray-400">{s.lga || "—"}</p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-50 text-[#28a745] border border-green-200 shrink-0">
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-100 shrink-0 text-xs text-gray-400">
          {filtered.length} of {allSchools.length} schools shown
        </div>
      </div>
    </div>
  );
}

function AssessmentCard({
  assessment,
  onApprove,
  onReject,
  loading,
}: {
  assessment: BulkAssessment;
  onApprove: () => void;
  onReject: (reason: string) => void;
  loading: { id: number | null; action: string | null };
}) {
  const [expanded, setExpanded] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showSchoolsModal, setShowSchoolsModal] = useState(false);
  const [reason, setReason] = useState("");
  const [categories, setCategories] = useState<CategorySchools[] | null>(null);
  const [loadingSchools, setLoadingSchools] = useState(false);

  const busy = loading.id === assessment.id;

  useEffect(() => {
    if (!expanded || categories) return;
    setLoadingSchools(true);
    fetch(`/api/operator2/bulk/${assessment.id}/schools`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => data && setCategories(data.categories))
      .catch(() => {})
      .finally(() => setLoadingSchools(false));
  }, [expanded, categories, assessment.id]);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-gray-100">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 shrink-0">
            <ChartNoAxesGantt className="w-4 h-4 text-amber-600" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-gray-900 text-sm truncate">
              {assessment.title}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              {assessment.total_schools} schools · Submitted by{" "}
              {assessment.created_by} · {formatDate(assessment.created_at)}
            </p>
          </div>
        </div>
        <button
          onClick={() => setExpanded((v) => !v)}
          className="text-gray-400 hover:text-gray-600 shrink-0 mt-0.5"
        >
          {expanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Tier fees summary */}
      <div className="px-6 py-4 grid grid-cols-3 gap-3">
        {[
          { label: "Category A", fee: assessment.tier_1_fee },
          { label: "Category B", fee: assessment.tier_2_fee },
          { label: "Category C", fee: assessment.tier_3_fee },
        ].map((t) => (
          <div
            key={t.label}
            className="text-center bg-gray-50 rounded-xl py-3 px-2 border border-gray-100"
          >
            <p className="text-xs text-gray-400 font-medium">{t.label}</p>
            <p className="text-sm font-black text-gray-800 mt-1">
              {formatCurrency(t.fee)}
            </p>
          </div>
        ))}
      </div>

      {/* Expanded: description + affected schools */}
      {expanded && (
        <div className="px-6 pb-4 space-y-4">
          {assessment.description && (
            <p className="text-xs text-gray-500 bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
              {assessment.description}
            </p>
          )}

          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
                Affected Schools by Category
              </p>
              {categories && (
                <button
                  onClick={() => setShowSchoolsModal(true)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#28a745] hover:text-[#218838] transition"
                >
                  <Users className="w-3.5 h-3.5" />
                  View Full List (
                  {categories.reduce((sum, c) => sum + c.schools.length, 0)})
                </button>
              )}
            </div>

            {loadingSchools ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="w-4 h-4 animate-spin text-gray-300" />
              </div>
            ) : categories ? (
              <div className="grid grid-cols-3 gap-3">
                {categories.map((c) => (
                  <div
                    key={c.tier}
                    className="text-center bg-gray-50 rounded-xl border border-gray-100 py-3 px-2"
                  >
                    <p className="text-xs font-bold text-gray-700">{c.label}</p>
                    <p className="text-lg font-black text-gray-800 mt-1">
                      {c.schools.length}
                    </p>
                    <p className="text-[10px] text-gray-400">
                      school{c.schools.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400">
                Could not load affected schools.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Affected schools modal */}
      {showSchoolsModal && categories && (
        <SchoolsModal
          title={assessment.title}
          categories={categories}
          onClose={() => setShowSchoolsModal(false)}
        />
      )}

      {/* Actions */}
      <div className="px-6 pb-5 flex gap-3">
        <button
          onClick={onApprove}
          disabled={busy}
          className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 rounded-xl text-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {busy && loading.action === "approve" ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Check className="w-4 h-4" />
          )}
          {busy && loading.action === "approve"
            ? "Approving…"
            : "Approve & Send Invoices"}
        </button>
        <button
          onClick={() => setShowRejectModal(true)}
          disabled={busy}
          className="flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 font-bold px-4 py-2.5 rounded-xl text-sm transition border border-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {busy && loading.action === "reject" ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <X className="w-4 h-4" />
          )}
          Reject
        </button>
      </div>

      {/* Reject modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-base font-bold text-gray-900 mb-1">
              Reject Assessment
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Provide a reason so Operator 1 can revise and resubmit.
            </p>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reason for rejection..."
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-400 mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowRejectModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  onReject(reason);
                }}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm transition"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ReviewBulkPage() {
  const [assessments, setAssessments] = useState<BulkAssessment[]>([]);
  const [fetching, setFetching] = useState(true);
  const [loading, setLoading] = useState<{
    id: number | null;
    action: string | null;
  }>({
    id: null,
    action: null,
  });

  async function load() {
    setFetching(true);
    try {
      const res = await fetch("/api/operator2/bulk");
      if (res.ok) {
        const data = await res.json();
        setAssessments(data);
      }
    } finally {
      setFetching(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleApprove(id: number) {
    setLoading({ id, action: "approve" });
    try {
      const res = await fetch(`/api/operator2/bulk/${id}/approve`, {
        method: "PATCH",
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Approval failed");
        return;
      }
      toast.success(data.message || "Approved — invoices sent to schools");
      setAssessments((prev) => prev.filter((a) => a.id !== id));
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading({ id: null, action: null });
    }
  }

  async function handleReject(id: number, reason: string) {
    setLoading({ id, action: "reject" });
    try {
      const res = await fetch(`/api/operator2/bulk/${id}/reject`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Rejection failed");
        return;
      }
      toast.success("Assessment rejected");
      setAssessments((prev) => prev.filter((a) => a.id !== id));
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading({ id: null, action: null });
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Review Ministry Assessments
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Ministry assessments submitted by Operator 1 awaiting your approval
              before invoices are sent to schools.
            </p>
          </div>
          {!fetching && assessments.length > 0 && (
            <span className="inline-flex items-center gap-1.5 self-start sm:self-auto px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-xs font-bold text-amber-700">
              {assessments.length} pending
            </span>
          )}
        </div>

        {!fetching && assessments.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bg-white rounded-xl border border-gray-200 py-3 px-4 text-center">
              <p className="text-xs text-gray-400 font-medium">Pending</p>
              <p className="text-xl font-black text-gray-900 mt-0.5">{assessments.length}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 py-3 px-4 text-center">
              <p className="text-xs text-gray-400 font-medium">Schools Affected</p>
              <p className="text-xl font-black text-gray-900 mt-0.5">
                {assessments.reduce((s, a) => s + a.total_schools, 0)}
              </p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 py-3 px-4 text-center col-span-2 sm:col-span-1">
              <p className="text-xs text-gray-400 font-medium">Oldest Submission</p>
              <p className="text-sm font-bold text-gray-900 mt-1.5">
                {formatDate(
                  assessments.reduce(
                    (oldest, a) => (new Date(a.created_at) < new Date(oldest) ? a.created_at : oldest),
                    assessments[0].created_at,
                  ),
                )}
              </p>
            </div>
          </div>
        )}

        {fetching ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
          </div>
        ) : assessments.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
              <PackageOpen className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">
              No assessments pending review
            </p>
            <p className="text-xs text-gray-400 mt-1">
              New submissions from Operator 1 will appear here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {assessments.map((a) => (
              <AssessmentCard
                key={a.id}
                assessment={a}
                onApprove={() => handleApprove(a.id)}
                onReject={(reason) => handleReject(a.id, reason)}
                loading={loading}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
