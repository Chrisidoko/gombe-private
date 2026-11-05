"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/Tabs";
import AnnualNoticeCard from "@/components/ui/AnnualNoticeCard";
import InvoiceTable from "@/components/ui/InvoiceTable";
import PayeReturns from "@/components/ui/PayeReturns";
import { PAGE_TAB_TRIGGER as triggerClass } from "@/components/ui/pageTabs";

export type DemandNoticesTab = "single" | "paye" | "other";

type Alerts = Record<DemandNoticesTab, boolean>;

// How often the dots re-check while the page stays open
const ALERT_REFRESH_MS = 30_000;

function AlertDot() {
  return (
    <span className="relative ml-2 inline-flex h-2.5 w-2.5" aria-label="Needs attention">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-600" />
    </span>
  );
}

export default function DemandNoticesTabs({
  schoolId,
  initialTab,
}: {
  schoolId: string;
  initialTab: DemandNoticesTab;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<string>(initialTab);
  const [alerts, setAlerts] = useState<Alerts>({ single: false, paye: false, other: false });

  const loadAlerts = useCallback(async () => {
    try {
      const res = await fetch(`/api/demand-notices/alerts/${schoolId}`);
      if (res.ok) setAlerts(await res.json());
    } catch {
      // The dots are a hint; the tabs still work without them
    }
  }, [schoolId]);

  useEffect(() => {
    loadAlerts();
    // Checkout opens in a new tab, so a payment is usually finished elsewhere
    window.addEventListener("focus", loadAlerts);
    const timer = setInterval(loadAlerts, ALERT_REFRESH_MS);
    return () => {
      window.removeEventListener("focus", loadAlerts);
      clearInterval(timer);
    };
  }, [loadAlerts]);

  // Kept in the address so a refresh, or a return from checkout, lands on the
  // same tab
  function changeTab(next: string) {
    setTab(next);
    loadAlerts();
    router.replace(`/Invoices?tab=${next}`, { scroll: false });
  }

  return (
    <Tabs value={tab} onValueChange={changeTab}>
      <TabsList className="overflow-x-auto">
        <TabsTrigger value="single" className={triggerClass}>
          Single Demand Notice
          {alerts.single && <AlertDot />}
        </TabsTrigger>
        <TabsTrigger value="paye" className={triggerClass}>
          Monthly PAYE
          {alerts.paye && <AlertDot />}
        </TabsTrigger>
        <TabsTrigger value="other" className={triggerClass}>
          Other Notices
          {alerts.other && <AlertDot />}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="single" className="pt-6">
        <AnnualNoticeCard
          schoolId={schoolId}
          showEmpty
          onShowPaye={() => changeTab("paye")}
        />
      </TabsContent>
      <TabsContent value="paye" className="pt-6">
        <PayeReturns schoolId={schoolId} />
      </TabsContent>
      <TabsContent value="other" className="pt-6">
        <InvoiceTable schoolId={schoolId} showTitle={false} />
      </TabsContent>
    </Tabs>
  );
}
