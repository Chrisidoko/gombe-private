"use client";

import { useCallback, useEffect, useState } from "react";
import { ExternalLink, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import PitBreakdown from "@/components/ui/PitBreakdown";
import { PIT_SUBHEAD_CODE } from "@/lib/pitBands";
import { periodLabel } from "@/lib/payeShared";
import PayeStaffTable from "@/components/ui/PayeStaffTable";

type Declaration = {
  id: number;
  amount: string;
  declared_income: string | null;
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
  code: string;
};

type PayeReturn = {
  id: number;
  period: string;
  filing_due_date: string;
  declared_paye: string;
  expected_paye: string;
  total_gross: string;
  staff_count: number;
  note: string | null;
  school_name: string;
};

type UnfiledMonth = {
  school_id: string;
  period: string;
  filing_due_date: string;
  school_name: string;
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
  const isPit = line.code === PIT_SUBHEAD_CODE;

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
        placeholder={isPit ? "Estimated total income (₦)" : "Estimated amount (₦)"}
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className={inputClass}
      />
      {isPit && Number(amount) > 0 && (
        <PitBreakdown income={Number(amount)} year={line.year} />
      )}
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

  const declared = Number(ret.declared_paye);
  const expected = Number(ret.expected_paye);
  const gap = expected - declared;
  const gapShare = expected > 0 ? gap / expected : 0;

  async function review(action: "recommend" | "reject") {
    setBusy(true);
    try {
      const res = await fetch(`/api/operator/paye-returns/${ret.id}`, {
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
          <p className="text-sm font-bold text-gray-900">{ret.school_name}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            PAYE · {periodLabel(ret.period)} · {ret.staff_count} staff · gross pay{" "}
            {naira(ret.total_gross)}
          </p>
        </div>
        <span className="text-lg font-black text-green-600 shrink-0">
          {naira(declared)}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3 rounded-xl border border-gray-100 bg-gray-50 p-4 text-sm">
        <div>
          <p className="text-xs text-gray-500">Declared</p>
          <p className="font-bold text-gray-900">{naira(declared)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Expected from bands</p>
          <p className="font-bold text-gray-900">{naira(expected)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Gap</p>
          <p
            className={`font-bold ${gapShare > 0.1 ? "text-red-600" : gap > 0 ? "text-amber-600" : "text-green-700"}`}
          >
            {gap > 0 ? `${naira(gap)} short` : gap < 0 ? `${naira(-gap)} over` : "None"}
          </p>
        </div>
        <p className="col-span-3 text-[11px] text-gray-400">
          Expected PAYE takes no reliefs off (pension, NHF, rent), so a small
          shortfall is normal.
        </p>
      </div>

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

      {ret.note && <p className="text-sm text-gray-700">{ret.note}</p>}
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

function PayeEstimateCard({
  month,
  onDone,
}: {
  month: UnfiledMonth;
  onDone: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    try {
      const res = await fetch("/api/operator/paye-returns/estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          school_id: month.school_id,
          period: month.period,
          amount,
          note,
        }),
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
        <p className="text-sm font-bold text-gray-900">{month.school_name}</p>
        <p className="text-xs text-gray-400 mt-0.5">
          PAYE · {periodLabel(month.period)} · No return received
        </p>
      </div>
      <input
        type="number"
        min="0"
        placeholder="Estimated PAYE for the month (₦)"
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
  const [payeReturns, setPayeReturns] = useState<PayeReturn[]>([]);
  const [unfiledPaye, setUnfiledPaye] = useState<UnfiledMonth[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [res, payeRes] = await Promise.all([
        fetch("/api/operator/tax-declarations"),
        fetch("/api/operator/paye-returns"),
      ]);
      if (!res.ok || !payeRes.ok) throw new Error();
      const data = await res.json();
      setDeclarations(data.declarations);
      setOverdue(data.overdue);
      const paye = await payeRes.json();
      setPayeReturns(paye.returns);
      setUnfiledPaye(paye.unfiled);
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
            Review Income Tax declarations and monthly PAYE returns, and
            estimate for schools that didn&apos;t file by their due date.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
          </div>
        ) : declarations.length === 0 &&
          overdue.length === 0 &&
          payeReturns.length === 0 &&
          unfiledPaye.length === 0 ? (
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
            {payeReturns.length > 0 && (
              <h2 className="text-sm font-bold text-gray-700 pt-2">
                Monthly PAYE returns
              </h2>
            )}
            {payeReturns.map((r) => (
              <PayeReturnCard key={r.id} ret={r} onDone={load} />
            ))}
            {unfiledPaye.length > 0 && (
              <h2 className="text-sm font-bold text-gray-700 pt-2">
                PAYE months with no return
              </h2>
            )}
            {unfiledPaye.map((m) => (
              <PayeEstimateCard
                key={`${m.school_id}-${m.period}`}
                month={m}
                onDone={load}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
}
