"use client";

import { useEffect, useState } from "react";
import { Check, ChevronDown, ChevronUp, Loader2, X } from "lucide-react";
import toast from "react-hot-toast";

type Line = {
  school_id: string;
  school_name: string;
  location_type: string | null;
  premises_category: string | null;
  amount: string | null;
  standard_amount: string | null;
  adjustment_reason: string | null;
  adjusted_by: string | null;
  subhead_name: string;
  head_name: string;
};

type Batch = {
  id: number;
  year: number;
  source: string;
  created_by: string | null;
  created_at: string;
  lines: Line[];
};

function formatCurrency(v: string | number) {
  return `₦${Number(v).toLocaleString()}`;
}

function BatchCard({
  batch,
  onDone,
}: {
  batch: Batch;
  onDone: (id: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<"approve" | "reject" | null>(null);
  const [showReject, setShowReject] = useState(false);
  const [reason, setReason] = useState("");

  const schoolIds = Array.from(new Set(batch.lines.map((l) => l.school_id)));
  const total = batch.lines.reduce((s, l) => s + Number(l.amount || 0), 0);
  const adjusted = batch.lines.filter((l) => l.adjustment_reason);

  async function review(action: "approve" | "reject") {
    setBusy(action);
    setShowReject(false);
    try {
      const res = await fetch(
        `/api/operator2/annual-notices/${batch.id}/${action}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: action === "reject" ? JSON.stringify({ reason }) : undefined,
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (action === "reject") {
        toast.success("Returned to Operator 1");
      } else if (data.emails.failed > 0) {
        toast.error(
          `${data.issued} notices issued, but ${data.emails.failed} emails failed. Schools can still see them on the portal.`,
        );
      } else {
        toast.success(`${data.issued} notices issued`);
      }
      onDone(batch.id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-gray-100">
        <div className="min-w-0">
          <p className="font-bold text-gray-900 text-sm">
            {batch.year} Single Demand Notice ·{" "}
            {batch.source === "school_approval"
              ? "newly approved school"
              : `${schoolIds.length} institution${schoolIds.length !== 1 ? "s" : ""}`}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            Prepared by {batch.created_by}. Income Tax is added later from each
            school&apos;s declaration.
          </p>
          {adjusted.length > 0 && (
            <p className="text-xs font-semibold text-amber-700 mt-1.5">
              ⚑ {adjusted.length} amount{adjusted.length !== 1 ? "s" : ""}{" "}
              changed from the standard rate. Check them below.
            </p>
          )}
        </div>
        <span className="text-lg font-black text-green-600 shrink-0">
          {formatCurrency(total)}
        </span>
      </div>

      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-3 text-xs font-semibold text-gray-500 hover:bg-gray-50 border-b border-gray-100"
      >
        View institutions and amounts
        {open ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
      </button>

      {open && (
        <div className="divide-y divide-gray-100 border-b border-gray-100 max-h-96 overflow-y-auto">
          {schoolIds.map((id) => {
            const lines = batch.lines.filter((l) => l.school_id === id);
            return (
              <div key={id} className="px-6 py-4">
                <p className="text-sm font-semibold text-gray-800">
                  {lines[0].school_name}
                </p>
                <p className="text-xs text-gray-400 capitalize mb-2">
                  {lines[0].location_type} · Category{" "}
                  {lines[0].premises_category}
                </p>
                {lines.map((l) => (
                  <div
                    key={l.subhead_name}
                    className={`py-1 text-xs ${l.adjustment_reason ? "-mx-2 px-2 rounded-lg bg-amber-50" : ""}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-gray-600">{l.subhead_name}</span>
                      <span className="font-semibold text-gray-800 shrink-0">
                        {l.adjustment_reason && l.standard_amount !== null && (
                          <span className="mr-2 font-normal text-gray-400 line-through">
                            {formatCurrency(l.standard_amount)}
                          </span>
                        )}
                        {l.amount === null
                          ? "By declaration"
                          : Number(l.amount) === 0
                            ? "Not applicable"
                            : formatCurrency(l.amount)}
                      </span>
                    </div>
                    {l.adjustment_reason && (
                      <p className="text-[11px] text-amber-700 mt-0.5">
                        {l.adjusted_by}: {l.adjustment_reason}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}

      <div className="px-6 py-5 flex gap-3">
        <button
          onClick={() => review("approve")}
          disabled={!!busy}
          className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 rounded-xl text-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {busy === "approve" ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Check className="w-4 h-4" />
          )}
          {busy === "approve" ? "Issuing…" : "Approve & Issue to Schools"}
        </button>
        <button
          onClick={() => setShowReject(true)}
          disabled={!!busy}
          className="flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 font-bold px-4 py-2.5 rounded-xl text-sm transition border border-red-200 disabled:opacity-50"
        >
          {busy === "reject" ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <X className="w-4 h-4" />
          )}
          Return
        </button>
      </div>

      {showReject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-base font-bold text-gray-900 mb-1">
              Return to Operator 1
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              The batch goes back to Operator 1 as a draft to correct and send
              again. Say what needs changing.
            </p>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="What needs correcting..."
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-400 mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowReject(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => review("reject")}
                disabled={!reason.trim()}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm disabled:opacity-50"
              >
                Return Batch
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AnnualNoticeReview() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    fetch("/api/operator2/annual-notices")
      .then((res) => (res.ok ? res.json() : []))
      .then(setBatches)
      .catch(() => toast.error("Could not load annual notices"))
      .finally(() => setFetching(false));
  }, []);

  return (
    <div>
      <div className="space-y-6">
        <div>
          <p className="text-sm text-gray-500">
            Approving issues each school&apos;s Single Demand Notice, notifies
            them, and starts the 30 days.
          </p>
        </div>

        {fetching ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
          </div>
        ) : batches.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-16">
            No annual notices waiting for review.
          </p>
        ) : (
          batches.map((batch) => (
            <BatchCard
              key={batch.id}
              batch={batch}
              onDone={(id) =>
                setBatches((prev) => prev.filter((b) => b.id !== id))
              }
            />
          ))
        )}
      </div>
    </div>
  );
}
