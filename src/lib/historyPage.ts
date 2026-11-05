// lib/historyPage.ts
// Paging for the operator's history lists (Submitted Notices, Assessment
// History): one page at a time, filtered by status tab and a search term,
// with a count per tab.
export const HISTORY_PAGE_SIZE = 10;

export const HISTORY_TABS = ["all", "pending", "approved", "rejected"] as const;
export type HistoryTab = (typeof HISTORY_TABS)[number];
export type HistoryCounts = Record<HistoryTab, number>;

// The status values each tab covers. A bulk assessment can also be "sent".
export const TAB_STATUSES: Record<Exclude<HistoryTab, "all">, string[]> = {
  pending: ["pending_approval"],
  approved: ["approved", "sent"],
  rejected: ["rejected"],
};

export function readHistoryParams(req: Request) {
  const params = new URL(req.url).searchParams;
  const tab = HISTORY_TABS.find((t) => t === params.get("status")) ?? "all";
  const page = Math.max(1, parseInt(params.get("page") ?? "1", 10) || 1);
  const q = (params.get("q") ?? "").trim().slice(0, 100);
  return {
    tab,
    page,
    offset: (page - 1) * HISTORY_PAGE_SIZE,
    // ILIKE pattern, with the user's own % and _ taken literally
    search: q ? `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%` : "",
    // null means every status
    statuses: tab === "all" ? null : TAB_STATUSES[tab],
  };
}

// SQL for the per-tab counts, over rows already narrowed by the search
export const COUNTS_SQL = `
  COUNT(*)::int AS "all",
  COUNT(*) FILTER (WHERE status = ANY('{${TAB_STATUSES.pending.join(",")}}'))::int AS pending,
  COUNT(*) FILTER (WHERE status = ANY('{${TAB_STATUSES.approved.join(",")}}'))::int AS approved,
  COUNT(*) FILTER (WHERE status = ANY('{${TAB_STATUSES.rejected.join(",")}}'))::int AS rejected`;
