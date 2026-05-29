"use client";

import { useEffect, useState, useCallback } from "react";
import {
  //   Receipt,
  //   Building2,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  //   ChevronRight,
  Send,
  Eye,
  X,
  Settings2,
} from "lucide-react";
import toast from "react-hot-toast";

type TierSummary = {
  tier1: { count: number };
  tier2: { count: number };
  tier3: { count: number };
  unassigned: { count: number };
};

type Assessment = {
  id: number;
  title: string;
  description: string | null;
  created_at: string;
  tier_1_fee: number | null;
  tier_2_fee: number | null;
  tier_3_fee: number | null;
  total_schools: number;
  status: string;
  invoice_count: number;
  paid_count: number;
  unpaid_count: number;
};

const TIER_CONFIG = {
  1: {
    label: "Category A",
    desc: "Small-Scale institutions",
    color: "border-blue-200   bg-blue-50",
    badge: "bg-blue-100   text-blue-700",
  },
  2: {
    label: "Category B",
    desc: "Medium-Scale institutions",
    color: "border-green-200  bg-green-50",
    badge: "bg-green-100  text-green-700",
  },
  3: {
    label: "Category C",
    desc: "Large-Scale institutions",
    color: "border-purple-200 bg-purple-50",
    badge: "bg-purple-100 text-purple-700",
  },
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function fmt(n: number | null) {
  if (!n) return "—";
  return `₦${Number(n).toLocaleString()}`;
}

export default function AssessmentPage() {
  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [tier1Fee, setTier1Fee] = useState("");
  const [tier2Fee, setTier2Fee] = useState("");
  const [tier3Fee, setTier3Fee] = useState("");

  // UI state
  const [tierSummary, setTierSummary] = useState<TierSummary | null>(null);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [successCount, setSuccessCount] = useState<number | null>(null);

  // Fetch tier counts + assessment history
  const fetchData = useCallback(async () => {
    try {
      const [tiersRes, assessmentsRes] = await Promise.all([
        fetch("/api/operator/tiers"),
        fetch("/api/operator/bulk"),
      ]);
      if (tiersRes.ok) {
        const t = await tiersRes.json();
        setTierSummary({
          tier1: { count: t.tier1.length },
          tier2: { count: t.tier2.length },
          tier3: { count: t.tier3.length },
          unassigned: { count: t.unassigned.length },
        });
      }
      if (assessmentsRes.ok) {
        setAssessments(await assessmentsRes.json());
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Total schools that will receive invoices
  const previewTotal =
    (tier1Fee && tierSummary ? tierSummary.tier1.count : 0) +
    (tier2Fee && tierSummary ? tierSummary.tier2.count : 0) +
    (tier3Fee && tierSummary ? tierSummary.tier3.count : 0);

  // Total invoice value
  const previewValue =
    (tier1Fee && tierSummary ? Number(tier1Fee) * tierSummary.tier1.count : 0) +
    (tier2Fee && tierSummary ? Number(tier2Fee) * tierSummary.tier2.count : 0) +
    (tier3Fee && tierSummary ? Number(tier3Fee) * tierSummary.tier3.count : 0);

  const isFormReady =
    !!title && (!!tier1Fee || !!tier2Fee || !!tier3Fee) && previewTotal > 0;

  async function handleSubmit() {
    setSubmitting(true);
    try {
      const res = await fetch("/api/operator/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          tier_1_fee: tier1Fee || null,
          tier_2_fee: tier2Fee || null,
          tier_3_fee: tier3Fee || null,
          due_date: dueDate || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSuccessCount(data.total_invoices);
      setShowConfirm(false);

      // Reset form
      setTitle("");
      setDescription("");
      setDueDate("");
      setTier1Fee("");
      setTier2Fee("");
      setTier3Fee("");

      // Refresh history
      fetchData();
      toast.success(
        `Assessment sent — ${data.total_invoices} invoices created`,
      );
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to create assessment",
      );
    } finally {
      setSubmitting(false);
    }
  }

  const currentYear = new Date().getFullYear();

  const assessmentOptions = [
    `${currentYear - 1} Annual Tax Assessment`,
    `${currentYear} Annual Tax Assessment`,
    `${currentYear + 1} Annual Tax Assessment`,
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Ministry Assessment
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Set fees per type category and send demand notices to all
            institutions at once.
          </p>
        </div>

        {/* Success banner */}
        {successCount !== null && (
          <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-5 py-4">
            <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
            <div>
              <p className="text-sm font-bold text-green-800">
                Assessment sent successfully
              </p>
              <p className="text-xs text-green-700 mt-0.5">
                {successCount} invoices have been created and are now visible to
                institutions.
              </p>
            </div>
            <button onClick={() => setSuccessCount(null)} className="ml-auto">
              <X className="w-4 h-4 text-green-400" />
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── Left — Form ─────────────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-5">
            {/* Assessment details */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="bg-[#1a5c2e] px-6 py-4 flex items-center gap-3">
                <Settings2 className="w-4 h-4 text-white" />
                <h2 className="text-sm font-bold text-white">
                  Assessment Details
                </h2>
              </div>
              <div className="px-6 py-5 space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-1.5">
                    Assessment Title <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Select Assessment Type</option>

                    {assessmentOptions.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                  {/* <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. 2026 Annual Tax Assessment"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  /> */}
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-1.5">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide context for this assessment..."
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-1.5">
                    Payment Due Date
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
            </div>

            {/* Tier fees */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                <h2 className="text-sm font-bold text-gray-700">
                  Fee per Category
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Leave a type blank to exclude it from this assessment
                </p>
              </div>
              <div className="px-6 py-5 space-y-4">
                {[
                  { tier: 1 as const, fee: tier1Fee, setFee: setTier1Fee },
                  { tier: 2 as const, fee: tier2Fee, setFee: setTier2Fee },
                  { tier: 3 as const, fee: tier3Fee, setFee: setTier3Fee },
                ].map(({ tier, fee, setFee }) => {
                  const config = TIER_CONFIG[tier];
                  const count = tierSummary
                    ? tier === 1
                      ? tierSummary.tier1.count
                      : tier === 2
                        ? tierSummary.tier2.count
                        : tierSummary.tier3.count
                    : 0;

                  return (
                    <div
                      key={tier}
                      className={`rounded-xl border-2 p-4 ${config.color}`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="text-sm font-bold text-gray-800">
                            {config.label}
                          </p>
                          <p className="text-xs text-gray-500">{config.desc}</p>
                        </div>
                        <span
                          className={`text-xs font-bold px-2.5 py-1 rounded-full ${config.badge}`}
                        >
                          {count} school{count !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-semibold">
                          ₦
                        </span>
                        <input
                          type="number"
                          placeholder="0.00"
                          value={fee}
                          min="0"
                          onChange={(e) => {
                            const value = e.target.value;

                            // Prevent negative values
                            if (Number(value) >= 0 || value === "") {
                              setFee(value);
                            }
                          }}
                          onWheel={(e) => e.currentTarget.blur()} // Prevent scroll wheel changing value
                          className="w-full pl-8 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 appearance-none"
                        />

                        {/* <select
                          value={fee}
                          onChange={(e) => setFee(e.target.value)}
                          className="w-full pl-4 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                          <option value="">Select Amount</option>

                          {Array.from({ length: 20 }, (_, i) => {
                            const amount = (i + 1) * 50000;

                            return (
                              <option key={amount} value={amount}>
                                ₦{amount.toLocaleString()}
                              </option>
                            );
                          })}
                        </select> */}
                      </div>
                      {fee && count > 0 && (
                        <p className="text-xs text-gray-500 mt-1.5">
                          Subtotal:{" "}
                          <span className="font-bold text-gray-700">
                            ₦{(Number(fee) * count).toLocaleString()}
                          </span>
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── Right — Preview + Send ───────────────────────────────────── */}
          <div className="space-y-4">
            {/* Preview card */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden sticky top-6">
              <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-gray-500" />
                  <h3 className="text-sm font-bold text-gray-700">Preview</h3>
                </div>
              </div>
              <div className="px-5 py-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Institutions</span>
                  <span className="font-black text-gray-800">
                    {previewTotal}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Total Invoice Value</span>
                  <span className="font-black text-green-600">
                    ₦{previewValue.toLocaleString()}
                  </span>
                </div>

                {/* Per-tier breakdown */}
                {tierSummary && (
                  <div className="pt-3 border-t border-gray-100 space-y-2">
                    {[
                      {
                        tier: 1 as const,
                        fee: tier1Fee,
                        count: tierSummary.tier1.count,
                      },
                      {
                        tier: 2 as const,
                        fee: tier2Fee,
                        count: tierSummary.tier2.count,
                      },
                      {
                        tier: 3 as const,
                        fee: tier3Fee,
                        count: tierSummary.tier3.count,
                      },
                    ].map(({ tier, fee, count }) => (
                      <div
                        key={tier}
                        className="flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              tier === 1
                                ? "bg-blue-400"
                                : tier === 2
                                  ? "bg-green-400"
                                  : "bg-purple-400"
                            }`}
                          />
                          <span className="text-gray-500">
                            {TIER_CONFIG[tier].label} ({count})
                          </span>
                        </div>
                        <span
                          className={`font-semibold ${fee ? "text-gray-700" : "text-gray-300"}`}
                        >
                          {fee ? fmt(Number(fee)) : "excluded"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Unassigned warning */}
                {tierSummary && tierSummary.unassigned.count > 0 && (
                  <div className="flex items-start gap-2 bg-yellow-50 border border-yellow-100 rounded-xl px-3 py-2.5 mt-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-yellow-600 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-yellow-700 leading-relaxed">
                      {tierSummary.unassigned.count} school
                      {tierSummary.unassigned.count !== 1 ? "s" : ""} unassigned
                      — they will not receive an invoice.
                    </p>
                  </div>
                )}

                {/* Send button */}
                <button
                  onClick={() => setShowConfirm(true)}
                  disabled={!isFormReady}
                  className="w-full flex items-center justify-center gap-2 bg-[#1a5c2e] hover:bg-[#166534] text-white font-bold py-3 rounded-xl text-sm transition disabled:opacity-40 disabled:cursor-not-allowed mt-2"
                >
                  <Send className="w-4 h-4" />
                  Send Assessment
                </button>
                {!isFormReady && (
                  <p className="text-[10px] text-gray-400 text-center">
                    Add a title and at least one tier fee to continue
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Assessment History ─────────────────────────────────────────── */}
        {assessments.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
              <h2 className="text-sm font-bold text-gray-700 uppercase tracking-widest">
                Assessment History
              </h2>
              <span className="text-xs text-gray-400">
                {assessments.length} total
              </span>
            </div>
            <div className="divide-y divide-gray-100">
              {assessments.map((a) => {
                const paidPct =
                  a.invoice_count > 0
                    ? Math.round((a.paid_count / a.invoice_count) * 100)
                    : 0;

                return (
                  <div
                    key={a.id}
                    className="px-6 py-4 hover:bg-gray-50 transition"
                  >
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-bold text-gray-800">
                            {a.title}
                          </p>
                          <span className="text-[10px] font-bold text-green-700 bg-green-100 border border-green-200 px-2 py-0.5 rounded-full uppercase">
                            {a.status}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {formatDate(a.created_at)} · {a.total_schools} schools
                        </p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                          {a.tier_1_fee && <span>T1: {fmt(a.tier_1_fee)}</span>}
                          {a.tier_2_fee && <span>T2: {fmt(a.tier_2_fee)}</span>}
                          {a.tier_3_fee && <span>T3: {fmt(a.tier_3_fee)}</span>}
                        </div>
                      </div>

                      {/* Payment progress */}
                      <div className="min-w-[140px]">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-gray-400">
                            {a.paid_count}/{a.invoice_count} paid
                          </span>
                          <span className="font-bold text-green-600">
                            {paidPct}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5">
                          <div
                            className="h-1.5 rounded-full bg-green-500"
                            style={{ width: `${paidPct}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-gray-400 mt-1">
                          {a.unpaid_count} outstanding
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Confirmation Modal ─────────────────────────────────────────────── */}
      {showConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
          onClick={() => !submitting && setShowConfirm(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-yellow-100">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  Confirm Assessment
                </h3>
                <p className="text-xs text-gray-500">
                  This will create invoices for {previewTotal} institutions
                </p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl px-4 py-3 space-y-2 mb-5">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Title</span>
                <span className="font-semibold text-gray-800 text-right max-w-[200px] truncate">
                  {title}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total Schools</span>
                <span className="font-bold text-gray-800">{previewTotal}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total Invoice Value</span>
                <span className="font-black text-green-600">
                  ₦{previewValue.toLocaleString()}
                </span>
              </div>
              {dueDate && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Due Date</span>
                  <span className="font-semibold text-gray-800">
                    {formatDate(dueDate)}
                  </span>
                </div>
              )}
            </div>

            <p className="text-xs text-gray-400 mb-5 leading-relaxed">
              Invoices will be immediately visible to institutions on their
              dashboard. Bill references will be created when each school
              initiates payment. This action cannot be undone.
            </p>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                disabled={submitting}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#1a5c2e] hover:bg-[#166534] text-white text-sm font-bold rounded-xl transition disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" /> Confirm & Send
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
