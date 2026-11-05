"use client";

// Status tabs, search and Prev/Next for the operator's history lists, backed
// by an API that pages with lib/historyPage.ts.
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import type { HistoryCounts, HistoryTab } from "@/lib/historyPage";

const TAB_LABELS: Record<HistoryTab, string> = {
  all: "All",
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
};

const SEARCH_DELAY_MS = 300;

type PageResponse<T> = {
  items: T[];
  counts: HistoryCounts;
  total: number;
  page: number;
  pageSize: number;
};

// Opens on Pending so what's still waiting comes first, unless nothing is
export function useHistoryPage<T>(url: string) {
  const [tab, setTabState] = useState<HistoryTab>("pending");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<PageResponse<T> | null>(null);
  const [loading, setLoading] = useState(true);
  const firstLoad = useRef(true);

  // Search waits for typing to pause, and starts again from page 1
  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery(search.trim());
      setPage(1);
    }, SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [search]);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ status: tab, page: String(page) });
      if (query) params.set("q", query);
      const res = await fetch(`${url}?${params}`);
      if (!res.ok) return;
      const json: PageResponse<T> = await res.json();
      if (firstLoad.current) {
        firstLoad.current = false;
        if (tab === "pending" && json.counts.pending === 0 && json.counts.all > 0) {
          setTabState("all");
          return;
        }
      }
      setData(json);
    } finally {
      setLoading(false);
    }
  }, [url, tab, page, query]);

  useEffect(() => {
    reload();
  }, [reload]);

  const setTab = (next: HistoryTab) => {
    setTabState(next);
    setPage(1);
  };

  return {
    items: data?.items ?? [],
    counts: data?.counts ?? null,
    total: data?.total ?? 0,
    pageSize: data?.pageSize ?? 10,
    page,
    setPage,
    tab,
    setTab,
    search,
    setSearch,
    loading,
    reload,
    // Nothing on record at all, before any search
    isEmpty: !!data && data.counts.all === 0 && !query,
  };
}

export function HistoryToolbar({
  tab,
  setTab,
  counts,
  search,
  setSearch,
  placeholder,
}: {
  tab: HistoryTab;
  setTab: (tab: HistoryTab) => void;
  counts: HistoryCounts | null;
  search: string;
  setSearch: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div className="px-6 py-3 border-b border-gray-100 flex items-center justify-between gap-3 flex-wrap">
      <div className="flex items-center gap-1 overflow-x-auto">
        {(Object.keys(TAB_LABELS) as HistoryTab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              tab === t
                ? "bg-green-600 text-white"
                : "text-gray-500 hover:bg-gray-100"
            }`}
          >
            {TAB_LABELS[t]}
            {counts && (
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  tab === t ? "bg-white/20" : "bg-gray-100 text-gray-500"
                }`}
              >
                {counts[t]}
              </span>
            )}
          </button>
        ))}
      </div>
      <div className="relative w-full sm:w-64">
        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>
    </div>
  );
}

export function HistoryPager({
  page,
  pageSize,
  total,
  setPage,
}: {
  page: number;
  pageSize: number;
  total: number;
  setPage: (page: number) => void;
}) {
  if (total === 0) return null;
  const first = (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, total);
  const lastPage = Math.ceil(total / pageSize);

  return (
    <div className="px-6 py-3 border-t border-gray-100 flex items-center justify-between gap-3">
      <p className="text-xs text-gray-500">
        Showing {first}–{last} of {total}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setPage(page - 1)}
          disabled={page <= 1}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          Prev
        </button>
        <button
          type="button"
          onClick={() => setPage(page + 1)}
          disabled={page >= lastPage}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Next
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
