"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  FileText,
  Loader2,
  Pencil,
  Send,
  Trash2,
  XCircle,
} from "lucide-react";
import toast from "react-hot-toast";

type School = {
  school_id: string;
  name: string;
  location_type: string | null;
  premises_category: string | null;
};

type Line = {
  id: number;
  school_id: string;
  school_name: string;
  location_type: string | null;
  premises_category: string | null;
  amount: string | null;
  standard_amount: string | null;
  adjustment_reason: string | null;
  adjusted_by: string | null;
  subhead_name: string;
  charge_type: string;
};

type Batch = {
  id: number;
  source: string;
  status: "draft" | "pending_approval" | "approved" | "rejected";
  created_by: string | null;
  rejection_reason: string | null;
  created_at: string;
  school_count: string;
  lines: Line[];
};

type Readiness = {
  ready: School[];
  missingDetails: School[];
  batches: Batch[];
};

const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  draft: {
    label: "Draft",
    className: "bg-gray-50 text-gray-600 border-gray-200",
  },
  pending_approval: {
    label: "Awaiting review",
    className: "bg-amber-50 text-amber-700 border-amber-200",
  },
  approved: {
    label: "Issued",
    className: "bg-green-50 text-green-700 border-green-200",
  },
  rejected: {
    label: "Rejected",
    className: "bg-red-50 text-red-600 border-red-200",
  },
};

const EDITABLE_CHARGE_TYPES = ["annual_fixed", "annual_premises"];

const naira = (v: string | number) => `₦${Number(v).toLocaleString()}`;

function formatDate(s: string) {
  return new Date(s).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function LineRow({
  line,
  editable,
  onSaved,
}: {
  line: Line;
  editable: boolean;
  onSaved: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  const canEdit = editable && EDITABLE_CHARGE_TYPES.includes(line.charge_type);
  const isStandard =
    amount !== "" && Number(amount) === Number(line.standard_amount);

  function startEdit() {
    setAmount(line.amount ?? "");
    setReason(line.adjustment_reason ?? "");
    setEditing(true);
  }

  async function save(nextAmount: string, nextReason: string) {
    setSaving(true);
    try {
      const res = await fetch(`/api/operator/annual-notices/lines/${line.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: nextAmount, reason: nextReason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setEditing(false);
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save");
    } finally {
      setSaving(false);
    }
  }

  if (editing) {
    return (
      <div className="py-2 px-2 -mx-2 rounded-lg bg-gray-50 space-y-2">
        <div className="flex items-center justify-between gap-3 text-xs">
          <span className="text-gray-700 font-medium">{line.subhead_name}</span>
          <span className="text-gray-400">
            Standard {naira(line.standard_amount ?? 0)}
          </span>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="number"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Amount (₦), 0 if it doesn't apply"
            className="sm:w-48 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            disabled={isStandard}
            placeholder={
              isStandard ? "No reason needed at the standard rate" : "Reason for the change"
            }
            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
          />
        </div>
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => setEditing(false)}
            className="px-3 py-1.5 text-xs font-semibold text-gray-500 hover:text-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={() => save(amount, reason)}
            disabled={saving || amount === "" || (!isStandard && !reason.trim())}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-bold disabled:opacity-50"
          >
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Save
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`py-1.5 text-xs ${line.adjustment_reason ? "-mx-2 px-2 rounded-lg bg-amber-50" : ""}`}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-gray-600">{line.subhead_name}</span>
        <span className="flex items-center gap-2 shrink-0">
          {line.adjustment_reason && line.standard_amount !== null && (
            <span className="text-gray-400 line-through">
              {naira(line.standard_amount)}
            </span>
          )}
          <span className="font-semibold text-gray-800">
            {line.amount === null
              ? "By declaration"
              : Number(line.amount) === 0
                ? "Not applicable"
                : naira(line.amount)}
          </span>
          {canEdit && (
            <button
              onClick={startEdit}
              aria-label={`Change ${line.subhead_name}`}
              className="p-1 rounded text-gray-400 hover:text-green-700 hover:bg-green-50"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          )}
        </span>
      </div>
      {line.adjustment_reason && (
        <div className="flex items-center justify-between gap-3 mt-0.5">
          <p className="text-[11px] text-amber-700">
            {line.adjusted_by}: {line.adjustment_reason}
          </p>
          {canEdit && (
            <button
              onClick={() => save(String(Number(line.standard_amount)), "")}
              disabled={saving}
              className="text-[11px] font-semibold text-gray-500 hover:text-gray-700 shrink-0"
            >
              Reset to standard
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function BatchBreakdown({
  batch,
  editable,
  onChanged,
}: {
  batch: Batch;
  editable: boolean;
  onChanged: () => void;
}) {
  const [open, setOpen] = useState<string | null>(null);
  const schoolIds = Array.from(new Set(batch.lines.map((l) => l.school_id)));

  return (
    <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl">
      {schoolIds.map((id) => {
        const lines = batch.lines.filter((l) => l.school_id === id);
        const total = lines.reduce((t, l) => t + Number(l.amount || 0), 0);
        const adjusted = lines.filter((l) => l.adjustment_reason).length;
        const isOpen = open === id;
        return (
          <div key={id}>
            <button
              onClick={() => setOpen(isOpen ? null : id)}
              className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-gray-50"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">
                  {lines[0].school_name}
                </p>
                <p className="text-xs text-gray-400 capitalize">
                  {lines[0].location_type} · Category {lines[0].premises_category}
                  {adjusted > 0 && (
                    <span className="normal-case text-amber-700 font-semibold">
                      {" "}
                      · ⚑ {adjusted} adjusted
                    </span>
                  )}
                </p>
              </div>
              <span className="flex items-center gap-2 shrink-0">
                <span className="text-sm font-bold text-gray-800">{naira(total)}</span>
                {isOpen ? (
                  <ChevronUp className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                )}
              </span>
            </button>
            {isOpen && (
              <div className="px-4 pb-3">
                {lines.map((l) => (
                  <LineRow
                    key={l.id}
                    line={l}
                    editable={editable}
                    onSaved={onChanged}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function AnnualNoticesPage() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [data, setData] = useState<Readiness | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<"prepare" | "send" | "discard" | null>(null);
  const [viewing, setViewing] = useState<number | null>(null);
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  const load = useCallback(
    async (quiet = false) => {
      if (!quiet) setLoading(true);
      setError("");
      try {
        const res = await fetch(`/api/operator/annual-notices?year=${year}`);
        if (!res.ok) throw new Error();
        setData(await res.json());
      } catch {
        setError("Could not load annual notices.");
      } finally {
        setLoading(false);
      }
    },
    [year],
  );

  useEffect(() => {
    load();
  }, [load]);

  async function call(
    action: "prepare" | "send" | "discard",
    url: string,
    method: string,
    body?: object,
  ) {
    setBusy(action);
    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      toast.success(
        action === "prepare"
          ? `Draft ready for ${result.total_schools} institution${result.total_schools !== 1 ? "s" : ""}. Check the amounts, then send.`
          : action === "send"
            ? "Sent to your supervisor for approval"
            : "Draft discarded",
      );
      load(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(null);
    }
  }

  const readyCount = data?.ready.length ?? 0;
  const draft = data?.batches.find((b) => b.status === "draft");
  const draftSchools = draft
    ? new Set(draft.lines.map((l) => l.school_id)).size
    : 0;
  const draftTotal = draft
    ? draft.lines.reduce((t, l) => t + Number(l.amount || 0), 0)
    : 0;
  const draftAdjusted = draft
    ? draft.lines.filter((l) => l.adjustment_reason).length
    : 0;

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Annual Notices</h1>
            <p className="text-sm text-gray-500 mt-1">
              Prepare the yearly Single Demand Notice as a draft, check each
              school&apos;s amounts, then send it for supervisor approval.
              Schools only receive it once approved, and the 30 days start then.
            </p>
          </div>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="px-4 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value={currentYear}>{currentYear}</option>
            <option value={currentYear + 1}>{currentYear + 1}</option>
          </select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
          </div>
        ) : error ? (
          <p className="text-sm text-red-400 text-center py-16">{error}</p>
        ) : (
          data && (
            <>
              {/* Draft being checked */}
              {draft && (
                <div className="bg-white rounded-2xl border-2 border-green-600 shadow-sm overflow-hidden">
                  <div className="px-6 py-5 border-b border-gray-100 flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <h2 className="text-base font-bold text-gray-900">
                        {year} Draft · {draftSchools} institution
                        {draftSchools !== 1 ? "s" : ""}
                      </h2>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Open a school to see its lines. Use the pencil to change
                        an amount for that school only; a reason is required.
                      </p>
                      {draftAdjusted > 0 && (
                        <p className="text-xs font-semibold text-amber-700 mt-1">
                          ⚑ {draftAdjusted} amount{draftAdjusted !== 1 ? "s" : ""}{" "}
                          changed from the standard rate
                        </p>
                      )}
                    </div>
                    <span className="text-xl font-black text-green-700">
                      {naira(draftTotal)}
                    </span>
                  </div>

                  <div className="px-6 py-5 space-y-4">
                    {draft.rejection_reason && (
                      <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                        <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-semibold text-red-700">
                            Returned by your supervisor
                          </p>
                          <p className="text-xs text-red-600 mt-0.5">
                            {draft.rejection_reason}
                          </p>
                        </div>
                      </div>
                    )}

                    <BatchBreakdown
                      batch={draft}
                      editable
                      onChanged={() => load(true)}
                    />

                    <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
                      <button
                        onClick={() => setConfirmDiscard(true)}
                        disabled={!!busy}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" />
                        Discard draft
                      </button>
                      <button
                        onClick={() =>
                          call(
                            "send",
                            `/api/operator/annual-notices/batches/${draft.id}/submit`,
                            "POST",
                          )
                        }
                        disabled={!!busy}
                        className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-bold disabled:opacity-50"
                      >
                        {busy === "send" ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                        Send {draftSchools} notice{draftSchools !== 1 ? "s" : ""} for
                        approval
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Schools waiting for a notice */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="bg-[#1a5c2e] px-6 py-5 flex items-center gap-3">
                  <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-white/10">
                    <FileText className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-white">
                      {year} Notices
                    </h2>
                    <p className="text-xs text-green-300 mt-0.5">
                      {readyCount} institution{readyCount !== 1 ? "s" : ""}{" "}
                      waiting for a notice
                    </p>
                  </div>
                </div>

                <div className="px-6 py-6 space-y-4">
                  {data.missingDetails.length > 0 && (
                    <div className="flex items-start gap-3 bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3">
                      <AlertCircle className="w-4 h-4 text-yellow-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-yellow-800">
                          {data.missingDetails.length} institution
                          {data.missingDetails.length !== 1 ? "s" : ""} left out
                        </p>
                        <p className="text-xs text-yellow-700 mt-0.5">
                          An admin must set location and premises category
                          first: {data.missingDetails
                            .map((s) => s.name)
                            .join(", ")}
                        </p>
                      </div>
                    </div>
                  )}

                  {readyCount > 0 ? (
                    <ul className="divide-y divide-gray-100 border border-gray-100 rounded-xl max-h-64 overflow-y-auto">
                      {data.ready.map((s) => (
                        <li
                          key={s.school_id}
                          className="flex items-center justify-between gap-3 px-4 py-2.5"
                        >
                          <span className="text-sm font-medium text-gray-800 truncate">
                            {s.name}
                          </span>
                          <span className="text-xs text-gray-400 capitalize shrink-0">
                            {s.location_type} · Category {s.premises_category}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                      <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                      <p className="text-sm text-green-800">
                        No institution is waiting for a {year} notice.
                      </p>
                    </div>
                  )}

                  <button
                    onClick={() =>
                      call("prepare", "/api/operator/annual-notices", "POST", { year })
                    }
                    disabled={readyCount === 0 || !!busy || !!draft}
                    className="w-full flex items-center justify-center gap-2 bg-[#1a5c2e] hover:bg-[#166534] text-white font-bold py-3 rounded-xl text-sm transition disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {busy === "prepare" && <Loader2 className="w-4 h-4 animate-spin" />}
                    Prepare Draft for {readyCount} Institution
                    {readyCount !== 1 ? "s" : ""}
                  </button>
                  {draft && readyCount > 0 && (
                    <p className="text-xs text-gray-400 text-center">
                      Send or discard the current draft first.
                    </p>
                  )}
                </div>
              </div>

              {/* Earlier batches */}
              {data.batches.some((b) => b.status !== "draft") && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100">
                    <h3 className="text-sm font-bold text-gray-800">
                      {year} Batches
                    </h3>
                  </div>
                  <ul className="divide-y divide-gray-100">
                    {data.batches
                      .filter((b) => b.status !== "draft")
                      .map((b) => {
                        const style = STATUS_STYLES[b.status];
                        const Icon =
                          b.status === "approved"
                            ? CheckCircle2
                            : b.status === "rejected"
                              ? XCircle
                              : Clock;
                        const canView = b.lines.length > 0;
                        return (
                          <li key={b.id} className="px-6 py-3">
                            <div className="flex items-center justify-between gap-3">
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-gray-800">
                                  {b.school_count} institution
                                  {b.school_count !== "1" ? "s" : ""}
                                  {b.source === "school_approval" &&
                                    " · new approval"}
                                </p>
                                <p className="text-xs text-gray-400">
                                  {b.created_by} · {formatDate(b.created_at)}
                                </p>
                              </div>
                              <div className="flex items-center gap-3 shrink-0">
                                {canView && (
                                  <button
                                    onClick={() =>
                                      setViewing(viewing === b.id ? null : b.id)
                                    }
                                    className="text-xs font-semibold text-green-700 hover:text-green-800"
                                  >
                                    {viewing === b.id ? "Hide" : "View"}
                                  </button>
                                )}
                                <span
                                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-semibold ${style.className}`}
                                >
                                  <Icon className="w-3 h-3" />
                                  {style.label}
                                </span>
                              </div>
                            </div>
                            {b.rejection_reason && b.status === "rejected" && (
                              <p className="text-xs text-red-500 mt-1.5">
                                {b.rejection_reason}
                              </p>
                            )}
                            {viewing === b.id && (
                              <div className="mt-3">
                                <BatchBreakdown
                                  batch={b}
                                  editable={false}
                                  onChanged={() => load(true)}
                                />
                              </div>
                            )}
                          </li>
                        );
                      })}
                  </ul>
                </div>
              )}
            </>
          )
        )}
      </div>

      {confirmDiscard && draft && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={() => busy !== "discard" && setConfirmDiscard(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-50 shrink-0">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  Discard this draft?
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  The {year} draft for {draftSchools} institution
                  {draftSchools !== 1 ? "s" : ""}
                  {draftAdjusted > 0
                    ? `, including ${draftAdjusted} adjusted amount${draftAdjusted !== 1 ? "s" : ""},`
                    : ""}{" "}
                  will be deleted. Nothing has been sent to your supervisor or
                  the schools, and you can prepare a new draft afterwards.
                </p>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setConfirmDiscard(false)}
                disabled={busy === "discard"}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
              >
                Keep draft
              </button>
              <button
                onClick={async () => {
                  await call(
                    "discard",
                    `/api/operator/annual-notices/batches/${draft.id}`,
                    "DELETE",
                  );
                  setConfirmDiscard(false);
                }}
                disabled={busy === "discard"}
                className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold disabled:opacity-50"
              >
                {busy === "discard" && <Loader2 className="w-4 h-4 animate-spin" />}
                Discard draft
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
