"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import { Loader2, Lock, RotateCcw, Save } from "lucide-react";
import toast from "react-hot-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/Tabs";
import { PAGE_TAB_TRIGGER } from "@/components/ui/pageTabs";

type Rate = {
  subhead_id: number;
  premises_category: string | null;
  location_type: string | null;
  amount: number;
  from_year: number;
};

type Subhead = {
  id: number;
  code: string;
  name: string;
  charge_type: "annual_fixed" | "annual_premises";
  head_name: string;
  rates: Rate[];
};

type Change = {
  year: number;
  premises_category: string | null;
  location_type: string | null;
  old_amount: string | null;
  new_amount: string;
  note: string | null;
  changed_by: string;
  changed_at: string;
  subhead_name: string;
};

const LOCATIONS = ["urban", "rural"] as const;
const CATEGORIES = ["A", "B", "C"] as const;

const naira = (v: number | string) => `₦${Number(v).toLocaleString()}`;
const cellKey = (id: number, loc: string | null, cat: string | null) =>
  `${id}|${loc ?? ""}|${cat ?? ""}`;

const inputClass =
  "w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-50 disabled:text-gray-500";

export default function RatesPage() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [subheads, setSubheads] = useState<Subhead[]>([]);
  const [history, setHistory] = useState<Change[]>([]);
  // What's on the server, and what's being typed, per rate cell
  const [saved, setSaved] = useState<Record<string, string>>({});
  const [values, setValues] = useState<Record<string, string>>({});
  const [note, setNote] = useState("");
  const [view, setView] = useState("rates");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Earlier years are read-only: their notices have gone out
  const editable = year >= currentYear;

  const load = useCallback(async (y: number) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/operator2/rates?year=${y}`);
      if (!res.ok) throw new Error();
      const data: { subheads: Subhead[]; history: Change[] } = await res.json();
      const map: Record<string, string> = {};
      for (const s of data.subheads) {
        for (const r of s.rates) {
          map[cellKey(s.id, r.location_type, r.premises_category)] = String(
            r.amount,
          );
        }
      }
      setSubheads(data.subheads);
      setHistory(data.history);
      setSaved(map);
      setValues(map);
      setNote("");
    } catch {
      setError("Could not load rates.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(year);
  }, [year, load]);

  const changedKeys = Object.keys(values).filter(
    (k) => (values[k] ?? "") !== (saved[k] ?? ""),
  );
  const invalid = changedKeys.filter((k) => {
    const v = values[k];
    return v === "" || Number.isNaN(Number(v)) || Number(v) < 0;
  });

  function rateFor(s: Subhead, loc: string | null, cat: string | null) {
    return s.rates.find(
      (r) => r.location_type === loc && r.premises_category === cat,
    );
  }

  async function save() {
    setSaving(true);
    try {
      const changes = changedKeys.map((k) => {
        const [id, loc, cat] = k.split("|");
        return {
          subhead_id: Number(id),
          location_type: loc || null,
          premises_category: cat || null,
          amount: Number(values[k]),
        };
      });
      const res = await fetch("/api/operator2/rates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year, changes, note }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(
        `${data.saved} ${year} rate${data.saved !== 1 ? "s" : ""} updated. New notices will use them.`,
      );
      load(year);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save rates");
    } finally {
      setSaving(false);
    }
  }

  function input(s: Subhead, loc: string | null, cat: string | null) {
    const key = cellKey(s.id, loc, cat);
    const value = values[key] ?? "";
    const dirty = value !== (saved[key] ?? "");
    return (
      <input
        type="number"
        min={0}
        value={value}
        disabled={!editable}
        placeholder="Not set"
        onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))}
        className={`${inputClass} ${dirty ? "border-amber-300 bg-amber-50/60" : ""}`}
      />
    );
  }

  // Shown when a rate was set for an earlier year and carries forward
  function inherited(s: Subhead, loc: string | null, cat: string | null) {
    const r = rateFor(s, loc, cat);
    return r && r.from_year < year ? (
      <span className="text-[11px] text-gray-400">from {r.from_year}</span>
    ) : null;
  }

  const heads = Array.from(new Set(subheads.map((s) => s.head_name)));
  const fixed = subheads.filter((s) => s.charge_type === "annual_fixed");
  const premises = subheads.filter((s) => s.charge_type === "annual_premises");

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-2">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Rates</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              The amounts each Single Demand Notice charges. A rate applies from
              its year onward until it&apos;s changed.
            </p>
          </div>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            disabled={changedKeys.length > 0 || saving}
            title={
              changedKeys.length > 0
                ? "Save or discard your changes first"
                : undefined
            }
            className="px-4 py-2 text-sm font-semibold border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
          >
            {[currentYear - 1, currentYear, currentYear + 1].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
          </div>
        ) : error ? (
          <p className="text-sm text-red-400 text-center py-20">{error}</p>
        ) : (
          <Tabs value={view} onValueChange={setView}>
            <TabsList className="overflow-x-auto">
              <TabsTrigger value="rates" className={PAGE_TAB_TRIGGER}>
                Rates
                {changedKeys.length > 0 && (
                  <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-700">
                    {changedKeys.length} unsaved
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="history" className={PAGE_TAB_TRIGGER}>
                Change History
              </TabsTrigger>
            </TabsList>

            <TabsContent value="rates" className="pt-6">
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="bg-green-600 px-6 py-5">
                  <h2 className="text-base font-bold text-white">
                    {year} Notice Rates
                  </h2>
                  <p className="text-xs text-green-100 mt-0.5">
                    {editable
                      ? "Changes apply to notices prepared after you save. Notices already prepared or issued keep their amounts. A rate of 0 leaves the item off notices."
                      : "Notices for this year have gone out, so its rates can't be changed."}
                  </p>
                </div>

                {!editable && (
                  <div className="flex items-center gap-2 px-6 py-3 bg-gray-50 border-b border-gray-100 text-xs text-gray-500">
                    <Lock className="w-3.5 h-3.5" />
                    Read only
                  </div>
                )}

                {/* Flat rates, grouped by Head */}
                <div className="divide-y divide-gray-100">
                  {heads
                    .filter((h) => fixed.some((s) => s.head_name === h))
                    .map((h) => (
                      <div key={h} className="px-6 py-4">
                        <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                          {h}
                        </p>
                        <div className="space-y-2">
                          {fixed
                            .filter((s) => s.head_name === h)
                            .map((s) => (
                              <div
                                key={s.id}
                                className="grid grid-cols-1 sm:grid-cols-[1fr_200px] gap-2 sm:gap-4 sm:items-center"
                              >
                                <span className="text-sm font-medium text-gray-800">
                                  {s.name}
                                </span>
                                <div>
                                  {input(s, null, null)}
                                  {inherited(s, null, null)}
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    ))}

                  {/* Business Premises: by location and category */}
                  {premises.length > 0 && (
                    <div className="px-6 py-4">
                      <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-1">
                        {premises[0].head_name}
                      </p>
                      <p className="text-xs text-gray-400 mb-3">
                        Registration in a school&apos;s first year, Renewal
                        after that. Each depends on the school&apos;s location
                        and premises category.
                      </p>
                      <div className="space-y-5">
                        {premises.map((s) => (
                          <div key={s.id}>
                            <p className="text-sm font-medium text-gray-800 mb-2">
                              {s.name}
                            </p>
                            <div className="overflow-x-auto">
                              <div className="grid grid-cols-[80px_repeat(3,minmax(110px,1fr))] gap-2 items-center min-w-[420px]">
                                <span />
                                {CATEGORIES.map((c) => (
                                  <span
                                    key={c}
                                    className="text-[11px] font-bold uppercase tracking-widest text-gray-400"
                                  >
                                    Category {c}
                                  </span>
                                ))}
                                {LOCATIONS.map((loc) => (
                                  <Fragment key={loc}>
                                    <span className="text-xs font-semibold text-gray-600 capitalize">
                                      {loc}
                                    </span>
                                    {CATEGORIES.map((c) => (
                                      <div key={c}>
                                        {input(s, loc, c)}
                                        {inherited(s, loc, c)}
                                      </div>
                                    ))}
                                  </Fragment>
                                ))}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {editable && (
                  <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 space-y-3">
                    <input
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Reason for the change (optional), e.g. Ministry circular 2027/04"
                      className={inputClass}
                    />
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <p className="text-xs text-gray-500">
                        {changedKeys.length === 0
                          ? "No changes."
                          : `${changedKeys.length} rate${changedKeys.length !== 1 ? "s" : ""} changed.`}
                        {invalid.length > 0 && (
                          <span className="text-red-500">
                            {" "}
                            Fill in every changed rate with 0 or more.
                          </span>
                        )}
                      </p>
                      <div className="flex flex-col-reverse sm:flex-row gap-2">
                        {changedKeys.length > 0 && (
                          <button
                            onClick={() => {
                              setValues(saved);
                              setNote("");
                            }}
                            disabled={saving}
                            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl border border-gray-200 text-gray-600 bg-white hover:bg-gray-50 disabled:opacity-50"
                          >
                            <RotateCcw className="w-4 h-4" />
                            Discard changes
                          </button>
                        )}
                        <button
                          onClick={save}
                          disabled={
                            changedKeys.length === 0 ||
                            invalid.length > 0 ||
                            saving
                          }
                          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-bold rounded-xl bg-[#28a745] text-white hover:bg-[#218838] transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {saving ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Save className="w-4 h-4" />
                          )}
                          {saving ? "Saving" : "Save rates"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="history" className="pt-6">
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="bg-green-600 px-6 py-5">
                  <h2 className="text-base font-bold text-white">
                    Change History
                  </h2>
                  <p className="text-xs text-green-100 mt-0.5">
                    The last 20 rate changes across all years, newest first.
                  </p>
                </div>
                {history.length === 0 ? (
                  <p className="px-6 py-8 text-center text-sm text-gray-400">
                    No rate has been changed here yet.
                  </p>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {history.map((c, i) => (
                      <div
                        key={i}
                        className="px-6 py-3 flex items-start justify-between gap-4"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-800">
                            {c.subhead_name}
                            {c.location_type &&
                              ` · ${c.location_type === "urban" ? "Urban" : "Rural"} Category ${c.premises_category}`}{" "}
                            <span className="text-gray-400 font-normal">
                              ({c.year})
                            </span>
                          </p>
                          <p className="text-xs text-gray-400">
                            {c.changed_by} ·{" "}
                            {new Date(c.changed_at).toLocaleDateString(
                              "en-NG",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              },
                            )}
                            {c.note && ` · ${c.note}`}
                          </p>
                        </div>
                        <p className="text-sm shrink-0">
                          {c.old_amount !== null && (
                            <span className="text-gray-400 line-through mr-2">
                              {naira(c.old_amount)}
                            </span>
                          )}
                          <span className="font-bold text-gray-800">
                            {naira(c.new_amount)}
                          </span>
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
