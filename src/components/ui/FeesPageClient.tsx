"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/Tabs";
import { PAGE_TAB_TRIGGER } from "@/components/ui/pageTabs";
import FeeTable from "@/components/ui/feestable";
import ComplianceDocs from "@/components/ui/ComplianceDocs";

type School = {
  school_id: string;
  license_status: string;
  approval_status: string;
  license_number: string;
};

type Tab = "fees" | "documents";

export default function FeesPageClient({ school }: { school: School }) {
  const [activeTab, setActiveTab] = useState<Tab>("fees");

  const tabs = [
    { id: "fees", label: "Payment Schedule", disabled: false },
    { id: "documents", label: "Compliance Docs", disabled: true },
  ];

  return (
    <div className="space-y-6">
      {/* Tab switcher */}
      <Tabs value={activeTab} onValueChange={(tab) => setActiveTab(tab as Tab)}>
        <TabsList className="overflow-x-auto">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              disabled={tab.disabled}
              className={PAGE_TAB_TRIGGER}
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Tab content */}
      {activeTab === "fees" && (
        <FeeTable
          school_id={school.school_id}
          license_status={school.license_status}
          approval_status={school.approval_status}
        />
      )}

      {activeTab === "documents" && (
        <ComplianceDocs
          school_id={school.school_id}
          license_number={school.license_number}
        />
      )}
    </div>
  );
}
