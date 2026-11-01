"use client";

import { useCallback, useEffect, useState } from "react";
import { CreditCard, Download, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

type Line = {
  id: number;
  notice_id: number;
  year: number;
  notice_number: string;
  notice_due_date: string;
  amount: string | null;
  status: "awaiting_declaration" | "unpaid" | "paid" | "waived";
  due_date: string | null;
  charge_type: string;
  subhead_name: string;
  head_name: string;
  declaration_status: string | null;
  declaration_rejection: string | null;
  objection_status: string | null;
  objection_note: string | null;
};

type Modal = { type: "declare" | "object"; line: Line } | null;

const naira = (v: string | number) => `₦${Number(v).toLocaleString()}`;

const formatDate = (s: string) =>
  new Date(s).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const startOfToday = () => new Date(new Date().setHours(0, 0, 0, 0));

function statusBadge(line: Line) {
  if (line.status === "paid")
    return { label: "Paid", className: "bg-green-100 text-green-700" };
  if (line.status === "waived")
    return { label: "Nothing due", className: "bg-gray-100 text-gray-600" };
  if (line.objection_status === "pending")
    return { label: "Objection under review", className: "bg-amber-100 text-amber-700" };
  if (line.status === "awaiting_declaration") {
    if (line.declaration_status === "rejected")
      return { label: "Returned", className: "bg-red-50 text-red-600" };
    if (line.declaration_status)
      return { label: "Declaration under review", className: "bg-amber-100 text-amber-700" };
    return { label: "Declaration needed", className: "bg-red-50 text-red-600" };
  }
  return { label: "Unpaid", className: "bg-red-50 text-red-600" };
}

export default function AnnualNoticeCard({ schoolId }: { schoolId: string }) {
  const [lines, setLines] = useState<Line[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyLine, setBusyLine] = useState<number | null>(null);
  const [modal, setModal] = useState<Modal>(null);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/annual-notices/${schoolId}`);
      if (res.ok) setLines((await res.json()).lines);
    } finally {
      setLoading(false);
    }
  }, [schoolId]);

  useEffect(() => {
    load();
    // Checkout opens in a new tab, so re-check when this one regains focus —
    // same pattern as FeeTable and InvoiceTable.
    window.addEventListener("focus", load);
    return () => window.removeEventListener("focus", load);
  }, [load]);

  function openModal(next: Modal) {
    setAmount("");
    setNote("");
    setFile(null);
    setModal(next);
  }

  async function handlePay(line: Line) {
    setBusyLine(line.id);
    try {
      const res = await fetch(`/api/annual-notices/lines/${line.id}/pay`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const link = document.createElement("a");
      link.href = data.checkoutUrl;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to start payment");
    } finally {
      setBusyLine(null);
    }
  }

  async function submitModal() {
    if (!modal) return;
    setSubmitting(true);
    try {
      let res: Response;
      if (modal.type === "declare") {
        const payload = new FormData();
        payload.append("file", file as File);
        payload.append("type", "tax_declaration");
        payload.append("school_id", schoolId);
        const upload = await fetch("/api/upload", { method: "POST", body: payload });
        const uploaded = await upload.json();
        if (!upload.ok) throw new Error(uploaded.message || uploaded.error);

        res = await fetch(`/api/annual-notices/lines/${modal.line.id}/declaration`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount, evidence_url: uploaded.url, note }),
        });
      } else {
        res = await fetch(`/api/annual-notices/lines/${modal.line.id}/objection`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ grounds: note }),
        });
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(
        modal.type === "declare" ? "Declaration submitted" : "Objection submitted",
      );
      setModal(null);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading || lines.length === 0) return null;

  const years = Array.from(new Set(lines.map((l) => l.year))).sort((a, b) => b - a);
  const latestYear = years[0];
  const latest = lines.find((l) => l.year === latestYear) as Line;
  const outstanding = lines
    .filter((l) => l.status === "unpaid")
    .reduce((sum, l) => sum + Number(l.amount), 0);

  // Earlier years only appear while something on them is still unpaid
  const visibleYears = years.filter(
    (y) =>
      y === latestYear ||
      lines.some((l) => l.year === y && l.status === "unpaid"),
  );

  const canSubmit =
    modal?.type === "declare" ? amount !== "" && !!file : !!note.trim();

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="bg-green-600 px-6 py-5 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h3 className="text-base font-bold text-white">
            {latestYear} Single Demand Notice
          </h3>
          <p className="text-xs text-green-100 mt-0.5">
            {latest.notice_number} · Gombe State Internal Revenue Service
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-green-100 uppercase tracking-widest">
            Outstanding
          </p>
          <p className="text-xl font-black text-white">{naira(outstanding)}</p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap bg-gray-50 border-b border-gray-100 px-6 py-3">
        <p className="text-xs text-gray-600">
          Due {formatDate(latest.notice_due_date)}. Each item is paid
          separately. Cash payment is prohibited.
        </p>
        <a
          href={`/api/annual-notices/notices/${latest.notice_id}/pdf`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-700 hover:text-green-800"
        >
          <Download className="w-3.5 h-3.5" />
          Download Notice
        </a>
      </div>

      {visibleYears.map((year) => (
        <div key={year}>
          {year !== latestYear && (
            <p className="px-6 py-2 bg-red-50 text-xs font-bold uppercase tracking-widest text-red-600">
              Arrears from {year}
            </p>
          )}
          <div className="divide-y divide-gray-100">
            {lines
              .filter(
                (l) =>
                  l.year === year && (year === latestYear || l.status === "unpaid"),
              )
              .map((line) => {
                const badge = statusBadge(line);
                const objectionPending = line.objection_status === "pending";
                const canDeclare =
                  line.status === "awaiting_declaration" &&
                  (!line.declaration_status ||
                    line.declaration_status === "rejected");
                const canObject =
                  line.status === "unpaid" &&
                  !objectionPending &&
                  !!line.due_date &&
                  new Date(line.due_date) >= startOfToday();

                return (
                  <div
                    key={line.id}
                    className="flex items-start justify-between gap-4 px-6 py-4 flex-wrap"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800">
                        {line.subhead_name}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {line.head_name}
                        {line.due_date && line.status === "unpaid"
                          ? ` · Due ${formatDate(line.due_date)}`
                          : ""}
                      </p>
                      {line.declaration_status === "rejected" &&
                        line.status === "awaiting_declaration" && (
                          <p className="text-xs text-red-500 mt-1">
                            {line.declaration_rejection}
                          </p>
                        )}
                      {line.objection_status === "dismissed" && (
                        <p className="text-xs text-gray-500 mt-1">
                          Objection not upheld: {line.objection_note}
                        </p>
                      )}
                    </div>

                    <div className="text-right space-y-1.5 shrink-0">
                      <p className="text-sm font-bold text-gray-800">
                        {line.amount === null ? "By declaration" : naira(line.amount)}
                      </p>
                      <span
                        className={`inline-block text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full ${badge.className}`}
                      >
                        {badge.label}
                      </span>
                      <div className="flex items-center justify-end gap-3">
                        {canObject && (
                          <button
                            onClick={() => openModal({ type: "object", line })}
                            className="text-xs font-semibold text-gray-500 hover:text-gray-700"
                          >
                            Object
                          </button>
                        )}
                        {line.status === "unpaid" && !objectionPending && (
                          <button
                            onClick={() => handlePay(line)}
                            disabled={busyLine === line.id}
                            className="flex items-center gap-1.5 text-xs font-semibold text-white bg-green-600 hover:bg-green-700 px-3 py-1.5 rounded-lg transition disabled:opacity-50"
                          >
                            {busyLine === line.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <CreditCard className="w-3.5 h-3.5" />
                            )}
                            Pay
                          </button>
                        )}
                        {canDeclare && (
                          <button
                            onClick={() => openModal({ type: "declare", line })}
                            className="text-xs font-semibold text-white bg-green-600 hover:bg-green-700 px-3 py-1.5 rounded-lg transition"
                          >
                            Declare
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      ))}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <div>
              <h3 className="text-base font-bold text-gray-900">
                {modal.type === "declare"
                  ? `Declare ${modal.line.subhead_name}`
                  : `Object to ${modal.line.subhead_name}`}
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                {modal.type === "declare"
                  ? `State the full amount for ${modal.line.year}. It is reviewed before it is added to your notice.`
                  : "State your grounds, as provided by section 90(1) of the Gombe Revenue Law 2021. This item can't be paid while your objection is reviewed."}
              </p>
            </div>

            {modal.type === "declare" && (
              <>
                <input
                  type="number"
                  min="0"
                  placeholder="Amount (₦)"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">
                    Supporting evidence (PDF, JPG or PNG under 10MB)
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                    className="w-full text-sm text-gray-600"
                  />
                </div>
              </>
            )}

            <textarea
              rows={3}
              placeholder={
                modal.type === "declare" ? "Note (optional)" : "Grounds of objection"
              }
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-500"
            />

            <div className="flex gap-3">
              <button
                onClick={() => setModal(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={submitModal}
                disabled={!canSubmit || submitting}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
