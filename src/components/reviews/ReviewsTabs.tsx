"use client";

// Operator 2's review queues in one place, a tab each. The tab is kept in the
// address so links from the dashboard and old bookmarks open the right one.
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/Tabs";
import { PAGE_TAB_TRIGGER } from "@/components/ui/pageTabs";
import BulkAssessmentReview from "@/components/reviews/BulkAssessmentReview";
import SelfAssessmentReview from "@/components/reviews/SelfAssessmentReview";
import DemandNoticeReview from "@/components/reviews/DemandNoticeReview";
import AnnualNoticeReview from "@/components/reviews/AnnualNoticeReview";
import TaxItemReview from "@/components/reviews/TaxItemReview";
import { REVIEW_TABS, type ReviewTab } from "@/components/reviews/reviewTabs";

const PANELS: Record<ReviewTab, () => React.JSX.Element> = {
  bulk: BulkAssessmentReview,
  self: SelfAssessmentReview,
  demand: DemandNoticeReview,
  annual: AnnualNoticeReview,
  tax: TaxItemReview,
};

type Counts = Record<ReviewTab, number> & { total: number };

export default function ReviewsTabs({ initialTab }: { initialTab: ReviewTab | null }) {
  const router = useRouter();
  const [tab, setTab] = useState<ReviewTab | null>(initialTab);
  const [counts, setCounts] = useState<Counts | null>(null);

  const loadCounts = useCallback(async () => {
    try {
      const res = await fetch("/api/operator2/review-counts");
      if (!res.ok) return;
      const data: Counts = await res.json();
      setCounts(data);
      // With no tab in the address, open the first one that has work waiting
      setTab(
        (current) =>
          current ?? REVIEW_TABS.find((t) => data[t.id] > 0)?.id ?? "bulk",
      );
    } catch {
      setTab((current) => current ?? "bulk");
    }
  }, []);

  useEffect(() => {
    loadCounts();
  }, [loadCounts]);

  function changeTab(next: string) {
    setTab(next as ReviewTab);
    router.replace(`/reviews?tab=${next}`, { scroll: false });
    // A decision on the last tab changes its count
    loadCounts();
  }

  if (!tab) return null;

  return (
    <Tabs value={tab} onValueChange={changeTab}>
      <TabsList className="overflow-x-auto">
        {REVIEW_TABS.map((t) => (
          <TabsTrigger key={t.id} value={t.id} className={PAGE_TAB_TRIGGER}>
            {t.label}
            {!!counts?.[t.id] && (
              <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-700">
                {counts[t.id]}
              </span>
            )}
          </TabsTrigger>
        ))}
      </TabsList>
      {REVIEW_TABS.map((t) => {
        const Panel = PANELS[t.id];
        return (
          <TabsContent key={t.id} value={t.id} className="pt-6">
            <Panel />
          </TabsContent>
        );
      })}
    </Tabs>
  );
}
