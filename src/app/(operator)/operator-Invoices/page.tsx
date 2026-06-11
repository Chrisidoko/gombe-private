"use client";

import { useEffect, useState, useCallback } from "react";
import {
  SquareChevronDown,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  TrendingUp,
  RefreshCw,
} from "lucide-react";

type Invoice = {
  id: number;
  invoice_number: string;
  title: string | null;
  school_id: string;
  school_name: string;
  school_email: string;
  lga: string;
  amount: number;
  status: "Paid" | "Unpaid";
  issue_date: string;
  due_date: string | null;
  bill_reference: string | null;
  isOverdue: boolean;
};

type Summary = {
  today: { count: number; total: number };
  week: { count: number; total: number };
  month: { count: number; total: number };
  pending: { count: number; value: number };
  paid: { count: number };
};

// ── Countdown timer hook ──────────────────────────────────────────────────────
function useCountdown(dueDate: string | null) {
  const [timeLeft, setTimeLeft] = useState("");
  const [isRed, setIsRed] = useState(false);

  useEffect(() => {
    if (!dueDate) return;

    function update() {
      const diff = new Date(dueDate!).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft("Overdue");
        setIsRed(true);
        return;
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hrs = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);

      setIsRed(days === 0); // red when less than 1 day left
      setTimeLeft(
        days > 0 ? `${days}d ${hrs}h ${mins}m` : `${hrs}h ${mins}m ${secs}s`,
      );
    }

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [dueDate]);

  return { timeLeft, isRed };
}

// ── Invoice progress card ────────────────────────────────────────────────────
function InvoiceProgressCard({ invoice }: { invoice: Invoice }) {
  const { timeLeft, isRed } = useCountdown(
    invoice.status === "Unpaid" ? invoice.due_date : null,
  );

  // Progress steps: Created → Sent → Paid
  const step = invoice.status === "Paid" ? 3 : 2; // assume "sent" once created

  const steps = [
    { label: "Created", done: step >= 1 },
    { label: "Sent to Institution", done: step >= 2 },
    { label: "Paid", done: step >= 3 },
  ];

  return (
    <div
      className={`bg-white rounded-2xl border shadow-xs p-5 transition-all ${
        invoice.isOverdue
          ? "border-red-200 shadow-red-50"
          : invoice.status === "Paid"
            ? "border-green-200"
            : "border-gray-200"
      }`}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-bold text-gray-800 truncate">
              {invoice.school_name || invoice.school_id}
            </p>
            {invoice.status === "Paid" ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-green-700 bg-green-100 border border-green-200 px-2 py-0.5 rounded-full">
                <CheckCircle2 className="w-3 h-3" /> Paid
              </span>
            ) : invoice.isOverdue ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                <AlertTriangle className="w-3 h-3" /> Overdue
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-yellow-700 bg-yellow-50 border border-yellow-200 px-2 py-0.5 rounded-full">
                <Clock className="w-3 h-3" /> Pending
              </span>
            )}
          </div>
          {invoice.title && (
            <p className="text-xs font-semibold text-gray-500 mt-0.5">
              {invoice.title}
            </p>
          )}
          <p className="text-xs text-gray-400 mt-0.5 font-mono">
            {invoice.invoice_number}
          </p>
          {invoice.lga && (
            <p className="text-xs text-gray-400">{invoice.lga}</p>
          )}
        </div>
        <div className="text-right shrink-0">
          <p className="text-lg font-black text-gray-800">
            ₦{invoice.amount.toLocaleString()}
          </p>
          <p className="text-[10px] text-gray-400">
            {new Date(invoice.issue_date).toLocaleDateString("en-NG", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-3">
        <div className="flex items-center gap-0">
          {steps.map((s, i) => (
            <div key={s.label} className="flex items-center flex-1">
              {/* Node */}
              <div className="flex flex-col items-center">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black border-2 transition-all ${
                    s.done
                      ? invoice.status === "Paid" && i === 2
                        ? "bg-green-500 border-green-500 text-white"
                        : "bg-green-500 border-green-500 text-white"
                      : "bg-white border-gray-200 text-gray-400"
                  }`}
                >
                  {s.done ? "✓" : i + 1}
                </div>
                <p className="text-[9px] text-gray-400 mt-1 text-center whitespace-nowrap">
                  {s.label}
                </p>
              </div>

              {/* Connector line — not after last */}
              {i < steps.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mb-3 mx-1 transition-all ${
                    steps[i + 1].done ? "bg-green-400" : "bg-gray-100"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Countdown — only for unpaid */}
      {invoice.status === "Unpaid" && invoice.due_date && (
        <div
          className={`flex items-center justify-between mt-2 px-3 py-2 rounded-xl border ${
            isRed ? "bg-red-50 border-red-200" : "bg-gray-50 border-gray-100"
          }`}
        >
          <p
            className={`text-xs font-semibold ${isRed ? "text-red-600" : "text-gray-500"}`}
          >
            {isRed ? "⚠ Due date reached" : "Time remaining"}
          </p>
          <p
            className={`text-xs font-black tabular-nums ${isRed ? "text-red-600" : "text-gray-700"}`}
          >
            {timeLeft}
          </p>
        </div>
      )}
    </div>
  );
}

// ── Summary box ───────────────────────────────────────────────────────────────
function SummaryBox({
  label,
  count,
  total,
  icon: Icon,
  color,
}: {
  label: string;
  count: number;
  total?: number;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-xs px-5 py-4">
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs font-bold uppercase text-gray-400">{label}</p>
        <div
          className={`flex items-center justify-center w-8 h-8 rounded-lg ${color}`}
        >
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className="text-2xl font-black text-gray-800">{count}</p>
      {total !== undefined && (
        <p className="text-xs text-gray-400 mt-0.5">
          ₦{total.toLocaleString()}
        </p>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function OperatorInvoiceDashboard() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/operator/invoices");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setSummary(data.summary);
      setInvoices(data.invoices);
    } catch {
      setError("Could not load invoice data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    // Auto-refresh every 60 seconds
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [fetchData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-sm text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-2 py-3">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Invoice Dashboard
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Live overview of institution invoices and payment progress
            </p>
          </div>
          <button
            onClick={fetchData}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-700 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>

        {/* Summary boxes */}
        {summary && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <SummaryBox
              label="Today"
              count={summary.today.count}
              total={summary.today.total}
              icon={SquareChevronDown}
              color="bg-blue-50 text-blue-600"
            />
            <SummaryBox
              label="This Week"
              count={summary.week.count}
              total={summary.week.total}
              icon={TrendingUp}
              color="bg-green-50 text-green-600"
            />
            <SummaryBox
              label="Pending"
              count={summary.pending.count}
              total={summary.pending.value}
              icon={Clock}
              color="bg-yellow-50 text-yellow-600"
            />
            <SummaryBox
              label="Paid"
              count={summary.paid.count}
              icon={CheckCircle2}
              color="bg-green-50 text-green-600"
            />
          </div>
        )}

        {/* Invoice progress list */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-widest">
              Active Invoices
            </h2>
            <p className="text-xs text-gray-400">
              Pending + paid within 24hrs · max 20
            </p>
          </div>

          {invoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-gray-200">
              <CheckCircle2 className="w-10 h-10 text-green-200 mb-3" />
              <p className="text-sm font-semibold text-gray-500">
                No active invoices
              </p>
              <p className="text-xs text-gray-400 mt-1">
                All invoices are settled
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {invoices.map((inv) => (
                <InvoiceProgressCard key={inv.id} invoice={inv} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
