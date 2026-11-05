"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Copy,
  CreditCard,
  Download,
  Loader2,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";
import { periodLabel, sameName, type StaffGroup } from "@/lib/payeShared";
import PayeStaffTable from "@/components/ui/PayeStaffTable";

type Month = {
  period: string;
  filing_due_date: string;
  id: number | null;
  status:
    | "pending_review"
    | "recommended"
    | "rejected"
    | "unpaid"
    | "paid"
    | "waived"
    | null;
  source: "school" | "operator_estimate" | null;
  declared_paye: string | null;
  staff_count: number | null;
  total_gross: string | null;
  payment_due_date: string | null;
  rejection_reason: string | null;
};

type Person = { name: string; staff_group: StaffGroup; role: string | null };

type StaffRow = {
  staff_name: string;
  staff_group: StaffGroup | "";
  role: string;
  gross_pay: string;
  paye_deducted: string;
};

type SavedStaffRow = {
  staff_name: string;
  staff_group: StaffGroup;
  role: string | null;
  gross_pay: string;
  paye_deducted: string;
};

const TEMPLATE_HEADERS = [
  "Name",
  "Group (Academic / Non-academic)",
  "Role or qualification",
  "Gross monthly pay (NGN)",
  "PAYE deducted (NGN)",
];

const GROUP_LABELS: Record<StaffGroup, string> = {
  academic: "Academic",
  non_academic: "Non-academic",
};

const naira = (v: string | number) => `₦${Number(v).toLocaleString()}`;

const formatDate = (s: string) =>
  new Date(s).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });

const todayText = () => new Date().toLocaleDateString("en-CA");

const inputClass =
  "w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500";

function parseGroup(value: unknown): StaffGroup | "" {
  const text = String(value ?? "").toLowerCase();
  if (text.includes("non")) return "non_academic";
  if (text.includes("acad")) return "academic";
  return "";
}

function parseMoney(value: unknown) {
  if (typeof value === "number") return String(value);
  return String(value ?? "").replace(/[₦,\s]|NGN/gi, "");
}

function statusBadge(m: Month) {
  if (!m.status || m.status === "rejected") {
    if (m.status === "rejected")
      return { label: "Returned", className: "bg-red-50 text-red-600" };
    return m.filing_due_date < todayText()
      ? { label: "Overdue · not filed", className: "bg-red-50 text-red-600" }
      : { label: "Not filed", className: "bg-amber-100 text-amber-700" };
  }
  if (m.status === "pending_review" || m.status === "recommended")
    return { label: "Under review", className: "bg-amber-100 text-amber-700" };
  if (m.status === "paid")
    return { label: "Paid", className: "bg-green-100 text-green-700" };
  if (m.status === "waived")
    return { label: "Nothing due", className: "bg-gray-100 text-gray-600" };
  return { label: "Unpaid", className: "bg-red-50 text-red-600" };
}

function FilingModal({
  schoolId,
  month,
  people,
  lastStaff,
  onClose,
  onFiled,
}: {
  schoolId: string;
  month: Month;
  people: Person[];
  lastStaff: SavedStaffRow[];
  onClose: () => void;
  onFiled: () => void;
}) {
  const [rows, setRows] = useState<StaffRow[]>([]);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const label = periodLabel(month.period);
  const inPeople = (name: string) => people.some((p) => sameName(p.name, name));
  const groupFromPeople = (name: string) =>
    people.find((p) => sameName(p.name, name))?.staff_group ?? "";

  function update(index: number, patch: Partial<StaffRow>) {
    setRows((current) => current.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }

  function downloadTemplate() {
    const sheet = XLSX.utils.aoa_to_sheet([
      TEMPLATE_HEADERS,
      ...people.map((p) => [p.name, GROUP_LABELS[p.staff_group], p.role ?? "", "", ""]),
    ]);
    sheet["!cols"] = [{ wch: 30 }, { wch: 30 }, { wch: 24 }, { wch: 24 }, { wch: 22 }];
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, sheet, "PAYE");
    XLSX.writeFile(book, `PAYE_${month.period.slice(0, 7)}.xlsx`);
  }

  async function readUpload(file: File) {
    try {
      const book = XLSX.read(await file.arrayBuffer());
      const sheet = book.Sheets[book.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, blankrows: false });
      const parsed = data
        .slice(1)
        .filter((r) => String(r[0] ?? "").trim())
        .map((r): StaffRow => {
          const name = String(r[0]).trim();
          return {
            staff_name: name,
            staff_group: parseGroup(r[1]) || groupFromPeople(name),
            role: String(r[2] ?? "").trim(),
            gross_pay: parseMoney(r[3]),
            paye_deducted: parseMoney(r[4]),
          };
        });
      if (parsed.length === 0) {
        toast.error("No staff rows found under the header row");
        return;
      }
      setRows(parsed);
      toast.success(`${parsed.length} staff loaded. Check them before submitting.`);
    } catch {
      toast.error("Could not read that file. Use the template, saved as .xlsx or .csv.");
    } finally {
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  function copyLastMonth() {
    setRows(
      lastStaff.map((s) => ({
        staff_name: s.staff_name,
        staff_group: s.staff_group,
        role: s.role ?? "",
        gross_pay: String(Number(s.gross_pay)),
        paye_deducted: String(Number(s.paye_deducted)),
      })),
    );
  }

  function startFromPeople() {
    setRows(
      people.map((p) => ({
        staff_name: p.name,
        staff_group: p.staff_group,
        role: p.role ?? "",
        gross_pay: "",
        paye_deducted: "",
      })),
    );
  }

  const rowProblem = (r: StaffRow) => {
    if (!r.staff_name.trim()) return "Name missing";
    if (!r.staff_group) return "Choose a group";
    if (r.gross_pay === "" || isNaN(Number(r.gross_pay))) return "Gross pay missing";
    if (r.paye_deducted === "" || isNaN(Number(r.paye_deducted))) return "PAYE missing";
    if (Number(r.paye_deducted) > Number(r.gross_pay)) return "PAYE above gross pay";
    return null;
  };
  const problems = rows.filter((r) => rowProblem(r)).length;
  const newToPeople = rows.filter((r) => r.staff_name.trim() && !inPeople(r.staff_name)).length;
  const totalGross = rows.reduce((t, r) => t + (Number(r.gross_pay) || 0), 0);
  const totalPaye = rows.reduce((t, r) => t + (Number(r.paye_deducted) || 0), 0);

  async function submit() {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/paye-returns/school/${schoolId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ period: month.period, rows, note }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(
        data.addedToPeople > 0
          ? `PAYE return submitted. ${data.addedToPeople} new staff added to People.`
          : "PAYE return submitted",
      );
      onFiled();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-full flex flex-col">
        <div className="px-6 pt-6 pb-4 border-b border-gray-100 space-y-4">
          <div>
            <h3 className="text-base font-bold text-gray-900">PAYE return for {label}</h3>
            <p className="text-xs text-gray-500 mt-1">
              List every staff member paid in {label}, with their gross pay and
              the PAYE you deducted. Download the template with your staff
              already listed, fill in the two amount columns from your payroll,
              and upload it. Due by {formatDate(month.filing_due_date)}.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={downloadTemplate}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-700 border border-green-200 hover:bg-green-50 px-3 py-1.5 rounded-lg"
            >
              <Download className="w-3.5 h-3.5" />
              Download template
            </button>
            <button
              onClick={() => fileInput.current?.click()}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-700 border border-green-200 hover:bg-green-50 px-3 py-1.5 rounded-lg"
            >
              <Upload className="w-3.5 h-3.5" />
              Upload filled template
            </button>
            <input
              ref={fileInput}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && readUpload(e.target.files[0])}
            />
            {lastStaff.length > 0 && (
              <button
                onClick={copyLastMonth}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 px-3 py-1.5 rounded-lg"
              >
                <Copy className="w-3.5 h-3.5" />
                Copy last return
              </button>
            )}
            {people.length > 0 && rows.length === 0 && (
              <button
                onClick={startFromPeople}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 px-3 py-1.5 rounded-lg"
              >
                Fill in on screen
              </button>
            )}
            <button
              onClick={() =>
                setRows((r) => [
                  ...r,
                  { staff_name: "", staff_group: "", role: "", gross_pay: "", paye_deducted: "" },
                ])
              }
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 px-3 py-1.5 rounded-lg"
            >
              <Plus className="w-3.5 h-3.5" />
              Add staff
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto px-6 py-4">
          {rows.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-12">
              Upload your filled template
              {lastStaff.length > 0 ? ", copy your last return," : ""} or add
              staff to start.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-400">
                  <th className="pb-2 font-medium">Name</th>
                  <th className="pb-2 font-medium w-44">Group</th>
                  <th className="pb-2 font-medium w-40">Role</th>
                  <th className="pb-2 font-medium w-36">Gross pay (₦)</th>
                  <th className="pb-2 font-medium w-36">PAYE deducted (₦)</th>
                  <th className="pb-2 w-8" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {rows.map((r, i) => {
                  const problem = rowProblem(r);
                  return (
                    <tr key={i} className="align-top">
                      <td className="py-1.5 pr-2">
                        <input
                          value={r.staff_name}
                          onChange={(e) => update(i, { staff_name: e.target.value })}
                          className={inputClass}
                        />
                        {r.staff_name.trim() && !inPeople(r.staff_name) && (
                          <p className="text-[10px] text-blue-600 mt-0.5">
                            New, will be added to People
                          </p>
                        )}
                        {problem && (
                          <p className="text-[10px] text-red-500 mt-0.5">{problem}</p>
                        )}
                      </td>
                      <td className="py-1.5 pr-2">
                        <select
                          value={r.staff_group}
                          onChange={(e) =>
                            update(i, { staff_group: e.target.value as StaffGroup })
                          }
                          className={inputClass}
                        >
                          <option value="">Choose</option>
                          <option value="academic">Academic</option>
                          <option value="non_academic">Non-academic</option>
                        </select>
                      </td>
                      <td className="py-1.5 pr-2">
                        <input
                          value={r.role}
                          onChange={(e) => update(i, { role: e.target.value })}
                          className={inputClass}
                        />
                      </td>
                      <td className="py-1.5 pr-2">
                        <input
                          type="number"
                          min="0"
                          value={r.gross_pay}
                          onChange={(e) => update(i, { gross_pay: e.target.value })}
                          className={inputClass}
                        />
                      </td>
                      <td className="py-1.5 pr-2">
                        <input
                          type="number"
                          min="0"
                          value={r.paye_deducted}
                          onChange={(e) => update(i, { paye_deducted: e.target.value })}
                          className={inputClass}
                        />
                      </td>
                      <td className="py-1.5">
                        <button
                          onClick={() => setRows((rs) => rs.filter((_, j) => j !== i))}
                          aria-label="Remove"
                          className="p-1.5 text-gray-300 hover:text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 space-y-3">
          {rows.length > 0 && (
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
              <span className="text-gray-500">
                Staff <b className="text-gray-900">{rows.length}</b>
              </span>
              <span className="text-gray-500">
                Total gross pay <b className="text-gray-900">{naira(totalGross)}</b>
              </span>
              <span className="text-gray-500">
                PAYE to remit <b className="text-green-700">{naira(totalPaye)}</b>
              </span>
              {newToPeople > 0 && (
                <span className="text-blue-600">{newToPeople} new to People</span>
              )}
              {problems > 0 && (
                <span className="text-red-500">
                  {problems} row{problems !== 1 ? "s" : ""} to fix
                </span>
              )}
            </div>
          )}
          <input
            placeholder="Note (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={submit}
              disabled={rows.length === 0 || problems > 0 || submitting}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Submit Return
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PayeReturns({ schoolId }: { schoolId: string }) {
  const [months, setMonths] = useState<Month[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [lastStaff, setLastStaff] = useState<SavedStaffRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filing, setFiling] = useState<Month | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [busy, setBusy] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/paye-returns/school/${schoolId}`);
      if (!res.ok) return;
      const data = await res.json();
      setMonths(data.months);
      setPeople(data.people);
      setLastStaff(data.lastStaff);
    } finally {
      setLoading(false);
    }
  }, [schoolId]);

  useEffect(() => {
    load();
    // Checkout opens in a new tab, so re-check when this one regains focus
    window.addEventListener("focus", load);
    return () => window.removeEventListener("focus", load);
  }, [load]);

  async function handlePay(month: Month) {
    setBusy(month.id);
    try {
      const res = await fetch(`/api/paye-returns/${month.id}/pay`, { method: "POST" });
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
      setBusy(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
      </div>
    );
  }

  if (months.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-6 py-12 text-center">
        <p className="text-sm font-semibold text-gray-700">No PAYE returns yet</p>
        <p className="text-xs text-gray-500 mt-1">
          Monthly PAYE returns start once your institution has its first Single
          Demand Notice.
        </p>
      </div>
    );
  }

  const outstanding = months
    .filter((m) => m.status === "unpaid")
    .reduce((t, m) => t + Number(m.declared_paye), 0);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="bg-green-600 px-6 py-5 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h3 className="text-base font-bold text-white">Monthly PAYE Returns</h3>
          <p className="text-xs text-green-100 mt-0.5">
            Gombe State Internal Revenue Service · Due by the 10th of the following month
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-green-100 uppercase tracking-widest">Outstanding</p>
          <p className="text-xl font-black text-white">{naira(outstanding)}</p>
        </div>
      </div>

      <div className="divide-y divide-gray-100">
        {months.map((m) => {
          const badge = statusBadge(m);
          const canFile = !m.status || m.status === "rejected";
          const isOpen = expanded === m.id;
          return (
            <div key={m.period} className="px-6 py-4">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-800">
                    {periodLabel(m.period)}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {m.status === "unpaid" && m.payment_due_date
                      ? `Pay by ${formatDate(m.payment_due_date)}`
                      : `File by ${formatDate(m.filing_due_date)}`}
                    {m.staff_count !== null && m.source === "school"
                      ? ` · ${m.staff_count} staff`
                      : ""}
                    {m.source === "operator_estimate" ? " · Estimated by GIRS" : ""}
                  </p>
                  {m.status === "rejected" && m.rejection_reason && (
                    <p className="text-xs text-red-500 mt-1">{m.rejection_reason}</p>
                  )}
                  {m.id && m.source === "school" && m.status !== "rejected" && (
                    <button
                      onClick={() => setExpanded(isOpen ? null : m.id)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-gray-700 mt-1"
                    >
                      {isOpen ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                      {isOpen ? "Hide staff" : "View staff"}
                    </button>
                  )}
                </div>

                <div className="text-right space-y-1.5 shrink-0">
                  <p className="text-sm font-bold text-gray-800">
                    {m.declared_paye !== null && m.status !== "rejected"
                      ? naira(m.declared_paye)
                      : "-"}
                  </p>
                  <span
                    className={`inline-block text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full ${badge.className}`}
                  >
                    {badge.label}
                  </span>
                  <div className="flex items-center justify-end gap-3">
                    {canFile && (
                      <button
                        onClick={() => setFiling(m)}
                        className="text-xs font-semibold text-white bg-green-600 hover:bg-green-700 px-3 py-1.5 rounded-lg transition"
                      >
                        {m.status === "rejected" ? "File again" : "File return"}
                      </button>
                    )}
                    {m.status === "unpaid" && (
                      <button
                        onClick={() => handlePay(m)}
                        disabled={busy === m.id}
                        className="flex items-center gap-1.5 text-xs font-semibold text-white bg-green-600 hover:bg-green-700 px-3 py-1.5 rounded-lg transition disabled:opacity-50"
                      >
                        {busy === m.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <CreditCard className="w-3.5 h-3.5" />
                        )}
                        Pay
                      </button>
                    )}
                  </div>
                </div>
              </div>
              {isOpen && m.id && (
                <div className="mt-3 rounded-xl border border-gray-100 bg-gray-50 px-4 py-2">
                  <PayeStaffTable returnId={m.id} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filing && (
        <FilingModal
          schoolId={schoolId}
          month={filing}
          people={people}
          lastStaff={lastStaff}
          onClose={() => setFiling(null)}
          onFiled={() => {
            setFiling(null);
            load();
          }}
        />
      )}
    </div>
  );
}
