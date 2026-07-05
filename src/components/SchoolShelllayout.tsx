"use client";

import { Navigation } from "@/components/Navigation";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Clock } from "lucide-react";
import FormCompletionModal from "@/components/ui/FormCompletionModal";

interface SchoolShellProps {
  children: React.ReactNode;
  institution: string;
}

export default function SchoolShell({
  children,
  institution,
}: SchoolShellProps) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/" || pathname === "/signup/";

  const [collapsed, setCollapsed] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [approvalStatus, setApprovalStatus] = useState<string | null>(null);

  useEffect(() => {
    if (isLoginPage) return;

    async function checkFormStatus() {
      try {
        const res = await fetch(
          `/api/schools/form-status?school_id=${encodeURIComponent(institution)}`,
        );
        const data = await res.json();
        if (data.email_updated !== true) {
          setShowModal(true);
        }
      } catch (err) {
        console.error("Could not check form status:", err);
      }
    }

    async function fetchApprovalStatus() {
      try {
        const res = await fetch(`/api/schools/${encodeURIComponent(institution)}`);
        if (res.ok) {
          const data = await res.json();
          setApprovalStatus(data.approval_status ?? "pending");
        }
      } catch {
        // silently skip — banner just won't show
      }
    }

    checkFormStatus();
    fetchApprovalStatus();
  }, [isLoginPage, institution]);

  if (isLoginPage) {
    return <div className="bg-white">{children}</div>;
  }

  const isApproved = approvalStatus === null || approvalStatus === "approved";
  const showBanner = approvalStatus !== null && !isApproved;

  return (
    <div className="bg-gray-50 min-h-screen">
      {showModal && <FormCompletionModal school_id={institution} />}

      <div className="fixed top-0 right-0 left-0 h-16 z-10 transition-all duration-300">
        {/* TopBar placeholder */}
      </div>

      <div className="flex">
        <Navigation
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          isApproved={isApproved}
        />

        <main
          className={`flex-1 bg-gray-50 transition-all duration-300 ${
            collapsed ? "ml-0 lg:ml-20" : "ml-0 lg:ml-72"
          }`}
        >
          {/* Approval pending banner */}
          {showBanner && (
            <div
              className={`fixed z-20 right-0 transition-all duration-300 ${
                collapsed ? "left-0 lg:left-20" : "left-0 lg:left-72"
              }`}
              style={{ top: "64px" }}
            >
              <div className="flex items-center gap-3 px-5 py-2.5 bg-amber-50 border-b border-amber-200">
                <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                <p className="text-xs font-semibold text-amber-800">
                  Your institution is awaiting admin approval. Some features are
                  restricted until approval is granted.
                </p>
              </div>
            </div>
          )}

          <div className={`${showBanner ? "pt-28 lg:pt-32" : "pt-16 lg:pt-20"}`}>
            <div className="mx-auto max-w-7xl py-10 px-4 sm:px-6">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
