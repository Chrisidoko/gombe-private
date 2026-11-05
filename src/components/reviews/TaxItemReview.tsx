"use client";

import { useCallback, useEffect, useState } from "react";
import { ExternalLink, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import PitBreakdown from "@/components/ui/PitBreakdown";
import PayeStaffTable from "@/components/ui/PayeStaffTable";
import { periodLabel } from "@/lib/payeShared";

type Declaration = {
  id: number;
  amount: string;
  declared_income: string | null;
  evidence_url: string | null;
  note: string | null;
  source: string;
  recommended_by: string | null;
  year: number;
  school_name: string;
  subhead_name: string;
};

type Objection = {
  id: number;
  grounds: string;
  amount: string;
  year: number;
  notice_number: string;
  school_name: string;
  subhead_name: string;
};

type PayeReturn = {
  id: number;
  period: string;
  declared_paye: string;
  expected_paye: string | null;
  total_gross: string | null;
  staff_count: number | null;
  note: string | null;
  source: string;
  recommended_by: string | null;
  school_name: string;
};

const naira = (v: string | number) => `₦${Number(v).toLocaleString()}`;

const inputClass =
  "w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500";

async function send(url: string, body: object) {
  const res = await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);
}

function DeclarationCard({
  declaration,
  onDone,
}: {
  declaration: Declaration;
  onDone: () => void;
}) {
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  async function decide(action: "approve" | "reject") {
    setBusy(true);
    try {
      await send(`/api/operator2/tax-declarations/${declaration.id}`, {
        action,
        reason,
      });
      toast.success(action === "approve" ? "Added to the notice" : "Returned");
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
            {declaration.subhead_name} · {declaration.year} ·{" "}
            {declaration.source === "operator_estimate"
              ? "Operator estimate"
              : `Recommended by ${declaration.recommended_by}`}
          </p>
        </div>
        <span className="text-lg font-black text-green-600 shrink-0">
          {naira(declaration.amount)}
        </span>
      </div>
      {declaration.declared_income !== null && (
        <PitBreakdown
          income={Number(declaration.declared_income)}
          year={declaration.year}
        />
      )}
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
        placeholder="Reason, if returning"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        className={inputClass}
      />
      <div className="flex gap-3">
        <button
          onClick={() => decide("approve")}
          disabled={busy}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 rounded-xl text-sm disabled:opacity-50"
        >
          Approve
        </button>
        <button
          onClick={() => decide("reject")}
          disabled={busy || !reason.trim()}
          className="px-4 bg-red-50 hover:bg-red-100 text-red-600 font-bold py-2.5 rounded-xl text-sm border border-red-200 disabled:opacity-50"
        >
          Return
        </button>
      </div>
    </div>
  );
}

function PayeReturnCard({
  ret,
  onDone,
}: {
  ret: PayeReturn;
  onDone: () => void;
}) {
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [showStaff, setShowStaff] = useState(false);
  const fromSchool = ret.source === "school";

  async function decide(action: "approve" | "reject") {
    setBusy(true);
    try {
      await send(`/api/operator2/paye-returns/${ret.id}`, { action, reason });
      toast.success(action === "approve" ? "Approved for payment" : "Returned");
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
          <p className="text-sm font-bold text-gray-900">{ret.school_name}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            PAYE · {periodLabel(ret.period)} ·{" "}
            {fromSchool
              ? `${ret.staff_count} staff · Recommended by ${ret.recommended_by}`
              : "Operator estimate"}
          </p>
        </div>
        <span className="text-lg font-black text-green-600 shrink-0">
          {naira(ret.declared_paye)}
        </span>
      </div>
      {fromSchool && (
        <>
          <p className="text-sm text-gray-600">
            Gross pay {naira(ret.total_gross ?? 0)} · expected PAYE from the
            bands {naira(ret.expected_paye ?? 0)}
          </p>
          <button
            onClick={() => setShowStaff((v) => !v)}
            className="text-xs font-semibold text-green-700"
          >
            {showStaff ? "Hide staff" : "View staff"}
          </button>
          {showStaff && (
            <div className="rounded-xl border border-gray-100 px-4 py-2">
              <PayeStaffTable returnId={ret.id} showExpected />
            </div>
          )}
        </>
      )}
      {ret.note && <p className="text-sm text-gray-700">{ret.note}</p>}
      <input
        placeholder="Reason, if returning"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        className={inputClass}
      />
      <div className="flex gap-3">
        <button
          onClick={() => decide("approve")}
          disabled={busy}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 rounded-xl text-sm disabled:opacity-50"
        >
          Approve
        </button>
        <button
          onClick={() => decide("reject")}
          disabled={busy || !reason.trim()}
          className="px-4 bg-red-50 hover:bg-red-100 text-red-600 font-bold py-2.5 rounded-xl text-sm border border-red-200 disabled:opacity-50"
        >
          Return
        </button>
      </div>
    </div>
  );
}

function ObjectionCard({
  objection,
  onDone,
}: {
  objection: Objection;
  onDone: () => void;
}) {
  const [revised, setRevised] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  async function decide(action: "uphold" | "dismiss") {
    setBusy(true);
    try {
      await send(`/api/operator2/objections/${objection.id}`, {
        action,
        revised_amount: revised,
        note,
      });
      toast.success(
        action === "uphold" ? "Objection upheld" : "Objection dismissed",
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
            {objection.school_name}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            {objection.subhead_name} · {objection.notice_number}
          </p>
        </div>
        <span className="text-lg font-black text-gray-800 shrink-0">
          {naira(objection.amount)}
        </span>
      </div>
      <p className="text-sm text-gray-700">{objection.grounds}</p>
      <input
        type="number"
        min="0"
        placeholder="Revised amount, if upholding (₦)"
        value={revised}
        onChange={(e) => setRevised(e.target.value)}
        className={inputClass}
      />
      <input
        placeholder="Decision, sent to the school"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        className={inputClass}
      />
      <div className="flex gap-3">
        <button
          onClick={() => decide("uphold")}
          disabled={busy || revised === "" || !note.trim()}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 rounded-xl text-sm disabled:opacity-50"
        >
          Uphold
        </button>
        <button
          onClick={() => decide("dismiss")}
          disabled={busy || !note.trim()}
          className="px-4 bg-red-50 hover:bg-red-100 text-red-600 font-bold py-2.5 rounded-xl text-sm border border-red-200 disabled:opacity-50"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}

export default function TaxItemReview() {
  const [declarations, setDeclarations] = useState<Declaration[]>([]);
  const [objections, setObjections] = useState<Objection[]>([]);
  const [payeReturns, setPayeReturns] = useState<PayeReturn[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/operator2/tax-items");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setDeclarations(data.declarations);
      setObjections(data.objections);
      setPayeReturns(data.payeReturns);
    } catch {
      toast.error("Could not load tax items");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <div className="space-y-6">
        <div>
          <p className="text-sm text-gray-500">
            Approve declarations onto each school&apos;s notice, approve monthly
            PAYE returns, and decide objections.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
          </div>
        ) : declarations.length === 0 &&
          objections.length === 0 &&
          payeReturns.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-16">
            Nothing to review.
          </p>
        ) : (
          <>
            {declarations.length > 0 && (
              <h2 className="text-sm font-bold text-gray-700">Declarations</h2>
            )}
            {declarations.map((d) => (
              <DeclarationCard key={d.id} declaration={d} onDone={load} />
            ))}
            {payeReturns.length > 0 && (
              <h2 className="text-sm font-bold text-gray-700 pt-2">
                Monthly PAYE returns
              </h2>
            )}
            {payeReturns.map((r) => (
              <PayeReturnCard key={r.id} ret={r} onDone={load} />
            ))}
            {objections.length > 0 && (
              <h2 className="text-sm font-bold text-gray-700 pt-2">
                Objections
              </h2>
            )}
            {objections.map((o) => (
              <ObjectionCard key={o.id} objection={o} onDone={load} />
            ))}
          </>
        )}
      </div>
    </div>
  );
}
