"use client";

import { useCallback, useEffect, useState } from "react";
import { ExternalLink, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

type Declaration = {
  id: number;
  amount: string;
  evidence_url: string | null;
  note: string | null;
  year: number;
  school_name: string;
  subhead_name: string;
};

type OverdueLine = {
  line_id: number;
  year: number;
  due_date: string;
  school_name: string;
  subhead_name: string;
};

const naira = (v: string | number) => `₦${Number(v).toLocaleString()}`;

const inputClass =
  "w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500";

function DeclarationCard({
  declaration,
  onDone,
}: {
  declaration: Declaration;
  onDone: () => void;
}) {
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  async function review(action: "recommend" | "reject") {
    setBusy(true);
    try {
      const res = await fetch(`/api/operator/tax-declarations/${declaration.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(
        action === "recommend" ? "Sent to supervisor" : "Returned to school",
      );
      onDone();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-bold text-gray-900">
            {declaration.school_name}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            {declaration.subhead_name} · {declaration.year}
          </p>
        </div>
        <span className="text-lg font-black text-green-600 shrink-0">
          {naira(declaration.amount)}
        </span>
      </div>
      {declaration.note && (
        <p className="text-sm text-gray-700">{declaration.note}</p>
      )}
      {declaration.evidence_url && (
        <a
          href={declaration.evidence_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-700"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          View evidence
        </a>
      )}
      <input
        placeholder="Reason, if returning to the school"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        className={inputClass}
      />
      <div className="flex gap-3">
        <button
          onClick={() => review("recommend")}
          disabled={busy}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 rounded-xl text-sm disabled:opacity-50"
        >
          Recommend
        </button>
        <button
          onClick={() => review("reject")}
          disabled={busy || !reason.trim()}
          className="px-4 bg-red-50 hover:bg-red-100 text-red-600 font-bold py-2.5 rounded-xl text-sm border border-red-200 disabled:opacity-50"
        >
          Return to School
        </button>
      </div>
    </div>
  );
}

function EstimateCard({
  line,
  onDone,
}: {
  line: OverdueLine;
  onDone: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    try {
      const res = await fetch("/api/operator/tax-declarations/estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ line_id: line.line_id, amount, note }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Estimate sent to supervisor");
      onDone();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-3">
      <div>
        <p className="text-sm font-bold text-gray-900">{line.school_name}</p>
        <p className="text-xs text-gray-400 mt-0.5">
          {line.subhead_name} · {line.year} · No declaration received
        </p>
      </div>
      <input
        type="number"
        min="0"
        placeholder="Estimated amount (₦)"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className={inputClass}
      />
      <input
        placeholder="How was this estimate reached?"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        className={inputClass}
      />
      <button
        onClick={submit}
        disabled={busy || !amount || !note.trim()}
        className="w-full bg-[#1a5c2e] hover:bg-[#166534] text-white font-bold py-2.5 rounded-xl text-sm disabled:opacity-40"
      >
        Send Estimate for Review
      </button>
    </div>
  );
}

export default function TaxDeclarationsPage() {
  const [declarations, setDeclarations] = useState<Declaration[]>([]);
  const [overdue, setOverdue] = useState<OverdueLine[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/operator/tax-declarations");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setDeclarations(data.declarations);
      setOverdue(data.overdue);
    } catch {
      toast.error("Could not load tax declarations");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tax Declarations</h1>
          <p className="text-sm text-gray-500 mt-1">
            Review what schools declared for Income Tax and PAYE, and estimate
            for schools that didn&apos;t declare by their due date.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
          </div>
        ) : declarations.length === 0 && overdue.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-16">
            Nothing to review.
          </p>
        ) : (
          <>
            {declarations.map((d) => (
              <DeclarationCard key={d.id} declaration={d} onDone={load} />
            ))}
            {overdue.length > 0 && (
              <h2 className="text-sm font-bold text-gray-700 pt-2">
                Needs an estimate
              </h2>
            )}
            {overdue.map((line) => (
              <EstimateCard key={line.line_id} line={line} onDone={load} />
            ))}
          </>
        )}
      </div>
    </div>
  );
}
