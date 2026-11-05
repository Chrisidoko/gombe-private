"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Loader2, Target } from "lucide-react";
import type { ReviewTab } from "@/components/reviews/reviewTabs";

type Counts = Record<ReviewTab, number> & { total: number };

type WaitingItem = {
  tab: ReviewTab;
  kind: string;
  id: number;
  title: string | null;
  detail: string | null;
  amount: number | null;
  waiting_since: string | null;
};

type TargetRow = { id: number; quarter: number; target: string };

// Shown oldest first; anything waiting longer than these stands out
const AMBER_AFTER_DAYS = 3;
const RED_AFTER_DAYS = 7;

// The color tags each item's kind in the waiting list
const QUEUES: { tab: ReviewTab; label: string; color: string }[] = [
  { tab: "bulk", label: "Ministry Assessments", color: "#d97706" },
  { tab: "self", label: "Self Assessments", color: "#7c3aed" },
  { tab: "demand", label: "Demand Notices", color: "#2563eb" },
  { tab: "annual", label: "Annual Notices", color: "#0d9488" },
  { tab: "tax", label: "Tax Items", color: "#e11d48" },
];

const naira = (v: number) => `₦${Math.round(v).toLocaleString()}`;

function daysWaiting(since: string | null) {
  if (!since) return null;
  const start = new Date(since);
  start.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.max(0, Math.round((today.getTime() - start.getTime()) / 86_400_000));
}

function WaitingAge({ since }: { since: string | null }) {
  const days = daysWaiting(since);
  if (days === null) return null;
  const tone =
    days >= RED_AFTER_DAYS
      ? "text-red-600"
      : days >= AMBER_AFTER_DAYS
        ? "text-amber-600"
        : "text-gray-400";
  const dot =
    days >= RED_AFTER_DAYS
      ? "bg-red-500"
      : days >= AMBER_AFTER_DAYS
        ? "bg-amber-500"
        : "bg-gray-300";
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${tone}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {days === 0 ? "today" : `${days} day${days !== 1 ? "s" : ""}`}
    </span>
  );
}

export default function ReviewDashboard({ userName }: { userName: string }) {
  const [counts, setCounts] = useState<Counts | null>(null);
  const [items, setItems] = useState<WaitingItem[]>([]);
  const [targets, setTargets] = useState<TargetRow[]>([]);
  const [loading, setLoading] = useState(true);

  const currentYear = new Date().getFullYear();

  useEffect(() => {
    async function load() {
      const [countRes, itemRes, targetRes] = await Promise.allSettled([
        fetch("/api/operator2/review-counts").then((r) => (r.ok ? r.json() : null)),
        fetch("/api/operator2/waiting").then((r) => (r.ok ? r.json() : [])),
        fetch(`/api/operator2/revenue-targets?year=${currentYear}`).then((r) =>
          r.ok ? r.json() : { targets: [] },
        ),
      ]);
      if (countRes.status === "fulfilled") setCounts(countRes.value);
      if (itemRes.status === "fulfilled") setItems(itemRes.value ?? []);
      if (targetRes.status === "fulfilled") setTargets(targetRes.value?.targets ?? []);
      setLoading(false);
    }
    load();
  }, [currentYear]);

  const totalValue = items.reduce((t, i) => t + (i.amount ?? 0), 0);
  const quartersSet = new Set(targets.map((t) => t.quarter));
  const annualTarget = targets.reduce((t, r) => t + Number(r.target || 0), 0);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {userName}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {loading
            ? "Loading what's waiting for you…"
            : items.length === 0
              ? "Nothing is waiting for your decision."
              : `${items.length} item${items.length !== 1 ? "s" : ""} waiting for your decision · ${naira(totalValue)} in value`}
        </p>
      </div>

      {/* One count per Reviews tab */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {QUEUES.map((q) => {
          const count = counts?.[q.tab] ?? 0;
          return (
            <div
              key={q.tab}
              className="bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-3.5"
            >
              <p
                className={`text-2xl font-black ${count > 0 ? "text-gray-900" : "text-gray-300"}`}
              >
                {loading ? "—" : count}
              </p>
              <p className="text-xs font-medium text-gray-500 truncate">{q.label}</p>
            </div>
          );
        })}
      </div>

      {/* The items themselves, oldest first */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-green-600 px-6 py-5 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-white">
              Waiting for your decision
            </h2>
            <p className="text-xs text-green-100 mt-0.5">
              Oldest first · amber after {AMBER_AFTER_DAYS} days, red after{" "}
              {RED_AFTER_DAYS}
            </p>
          </div>
          {!loading && items.length > 0 && (
            <span className="text-xl font-black text-white">{items.length}</span>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-14">
            <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
          </div>
        ) : items.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <CheckCircle2 className="w-9 h-9 text-green-500 mx-auto" />
            <p className="mt-2 text-sm font-semibold text-gray-700">
              Nothing waiting for you
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              New items from Operator 1 will appear here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {items.map((item) => {
              const queue = QUEUES.find((q) => q.tab === item.tab)!;
              return (
                <Link
                  key={`${item.kind}-${item.id}`}
                  href={`/reviews?tab=${item.tab}`}
                  className="group flex items-center gap-4 px-6 py-3.5 hover:bg-gray-50 transition-colors"
                >
                  <span
                    className="hidden sm:inline-flex shrink-0 w-36 text-[11px] font-bold uppercase tracking-wide"
                    style={{ color: queue.color }}
                  >
                    {item.kind}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p
                      className="sm:hidden text-[10px] font-bold uppercase tracking-wide"
                      style={{ color: queue.color }}
                    >
                      {item.kind}
                    </p>
                    <p className="text-sm font-semibold text-gray-800 truncate">
                      {item.title ?? "—"}
                    </p>
                    {item.detail && (
                      <p className="text-xs text-gray-400 truncate">{item.detail}</p>
                    )}
                  </div>
                  <span className="hidden sm:block text-sm font-bold text-gray-800 shrink-0 w-28 text-right">
                    {item.amount !== null ? naira(item.amount) : "—"}
                  </span>
                  <span className="shrink-0 w-16 text-right">
                    <WaitingAge since={item.waiting_since} />
                  </span>
                  <span className="hidden md:inline-flex items-center gap-1 shrink-0 text-xs font-semibold text-green-700 group-hover:text-green-800">
                    Review
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Revenue targets, one line */}
      <Link
        href="/revenue-targets"
        className="group flex items-center justify-between gap-4 flex-wrap bg-white rounded-2xl border border-gray-200 shadow-sm px-6 py-4 hover:shadow-md transition-all"
      >
        <div className="flex items-center gap-3">
          <Target className="w-5 h-5 text-gray-400" />
          <div>
            <p className="text-sm font-bold text-gray-900">
              {currentYear} Revenue Target
            </p>
            <p className="text-xs text-gray-500">
              {annualTarget > 0 ? `${naira(annualTarget)} for the year` : "Not set yet"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4].map((q) => (
            <span
              key={q}
              className={`text-xs font-bold px-2 py-1 rounded-md ${
                quartersSet.has(q)
                  ? "bg-green-50 text-green-700"
                  : "bg-gray-100 text-gray-400"
              }`}
            >
              Q{q} {quartersSet.has(q) ? "✓" : "–"}
            </span>
          ))}
          <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 ml-1" />
        </div>
      </Link>
    </div>
  );
}
