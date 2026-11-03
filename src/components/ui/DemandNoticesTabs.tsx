"use client";

import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/Tabs";
import AnnualNoticeCard from "@/components/ui/AnnualNoticeCard";
import InvoiceTable from "@/components/ui/InvoiceTable";

export type DemandNoticesTab = "single" | "other";

const triggerClass =
  "px-4 text-base font-semibold data-[state=active]:border-green-700 data-[state=active]:text-green-700";

export default function DemandNoticesTabs({
  schoolId,
  initialTab,
}: {
  schoolId: string;
  initialTab: DemandNoticesTab;
}) {
  const router = useRouter();

  return (
    <Tabs
      defaultValue={initialTab}
      // Kept in the address so a refresh, or a return from checkout, lands
      // on the same tab
      onValueChange={(tab) =>
        router.replace(`/Invoices?tab=${tab}`, { scroll: false })
      }
    >
      <TabsList>
        <TabsTrigger value="single" className={triggerClass}>
          Single Demand Notice
        </TabsTrigger>
        <TabsTrigger value="other" className={triggerClass}>
          Other Notices
        </TabsTrigger>
      </TabsList>

      <TabsContent value="single" className="pt-6">
        <AnnualNoticeCard schoolId={schoolId} showEmpty />
      </TabsContent>
      <TabsContent value="other" className="pt-6">
        <InvoiceTable schoolId={schoolId} showTitle={false} />
      </TabsContent>
    </Tabs>
  );
}
