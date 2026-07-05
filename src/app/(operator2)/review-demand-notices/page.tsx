"use client";

import { useEffect, useState } from "react";
import {
  Receipt, Loader2, Check, X, PackageOpen, Building2,
} from "lucide-react";
import toast from "react-hot-toast";

type PendingNotice = {
  id: number;
  school_id: string;
  school_name: string;
  school_email: string;
  title: string;
  amount: string;
  narration: string | null;
  submitted_by: string;
  created_at: string;
  status: string;
};

function formatCurrency(v: string | number) {
  return `₦${Number(v).toLocaleString()}`;
}

function formatDate(s: string) {
  return new Date(s).toLocaleString("en-US", {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function NoticeCard({
  notice,
  onApprove,
  onReject,
  loading,
}: {
  notice: PendingNotice;
  onApprove: () => void;
  onReject: (reason: string) => void;
  loading: { id: number | null; action: string | null };
}) {
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [reason, setReason] = useState("");

  const busy = loading.id === notice.id;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-gray-100">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 shrink-0">
            <Receipt className="w-4 h-4 text-amber-600" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-gray-900 text-sm truncate">{notice.title}</p>
            <p className="text-xs text-gray-400 mt-0.5">Submitted {formatDate(notice.created_at)}</p>
          </div>
        </div>
        <span className="text-lg font-black text-green-600 shrink-0">{formatCurrency(notice.amount)}</span>
      </div>

      {/* School info */}
      <div className="px-6 py-4 flex items-center gap-3 border-b border-gray-100 bg-gray-50">
        <Building2 className="w-4 h-4 text-gray-400 shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-800 truncate">{notice.school_name}</p>
          <p className="text-xs text-gray-400">{notice.school_email}</p>
        </div>
      </div>

      {/* Narration */}
      {notice.narration && (
        <div className="px-6 py-3 border-b border-gray-100">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-widest mb-1">Narration</p>
          <p className="text-sm text-gray-700">{notice.narration}</p>
        </div>
      )}

      {/* Actions */}
      <div className="px-6 py-5 flex gap-3">
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
          {busy && loading.action === "approve" ? "Sending…" : "Approve & Send to School"}
        </button>
        <button
          onClick={() => setShowRejectModal(true)}
          disabled={busy}
          className="flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 font-bold px-4 py-2.5 rounded-xl text-sm transition border border-red-200 disabled:opacity-50"
        >
          {busy && loading.action === "reject" ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <X className="w-4 h-4" />
          )}
          Reject
        </button>
      </div>

      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-base font-bold text-gray-900 mb-1">Reject Demand Notice</h3>
            <p className="text-xs text-gray-500 mb-4">Provide a reason for Operator 1.</p>
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
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => { setShowRejectModal(false); onReject(reason); }}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm"
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

export default function ReviewDemandNoticesPage() {
  const [notices, setNotices] = useState<PendingNotice[]>([]);
  const [fetching, setFetching] = useState(true);
  const [loading, setLoading] = useState<{ id: number | null; action: string | null }>({
    id: null, action: null,
  });

  async function load() {
    setFetching(true);
    try {
      const res = await fetch("/api/operator2/demand-notices");
      if (res.ok) {
        const data = await res.json();
        setNotices(data);
      }
    } finally {
      setFetching(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleApprove(id: number) {
    setLoading({ id, action: "approve" });
    try {
      const res = await fetch(`/api/operator2/demand-notices/${id}/approve`, { method: "PATCH" });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Approval failed"); return; }
      toast.success("Notice approved — invoice sent to school");
      setNotices((prev) => prev.filter((n) => n.id !== id));
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading({ id: null, action: null });
    }
  }

  async function handleReject(id: number, reason: string) {
    setLoading({ id, action: "reject" });
    try {
      const res = await fetch(`/api/operator2/demand-notices/${id}/reject`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Rejection failed"); return; }
      toast.success("Notice rejected");
      setNotices((prev) => prev.filter((n) => n.id !== id));
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading({ id: null, action: null });
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Review Demand Notices</h1>
          <p className="text-sm text-gray-500 mt-1">
            Flat fee demand notices submitted by Operator 1. Approving will generate a live invoice and notify the school.
          </p>
        </div>

        {fetching ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
          </div>
        ) : notices.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
              <PackageOpen className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">No notices pending review</p>
            <p className="text-xs text-gray-400 mt-1">Demand notices submitted by Operator 1 will appear here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notices.map((n) => (
              <NoticeCard
                key={n.id}
                notice={n}
                onApprove={() => handleApprove(n.id)}
                onReject={(r) => handleReject(n.id, r)}
                loading={loading}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
