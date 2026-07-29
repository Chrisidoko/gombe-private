"use client";

import { useState } from "react";
import { ListChecks, FileDown } from "lucide-react";
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
    { id: "fees", label: "Payment Schedule", icon: ListChecks },
    { id: "documents", label: "Compliance Docs", icon: FileDown },
  ];

  return (
    <div className="space-y-4">
      {/* Tab switcher */}
      <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as Tab)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === tab.id
                ? "bg-white text-green-700 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

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
          license_status={school.license_status}
          license_number={school.license_number}
        />
      )}
    </div>
  );
}
