"use client";

import { Navigation } from "@/components/Navigation";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import FormCompletionModal from "@/components/ui/FormCompletionModal";

interface SchoolShellProps {
  children: React.ReactNode;
  institution: string; // passed down from the server component
}

export default function SchoolShell({
  children,
  institution,
}: SchoolShellProps) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/" || pathname === "/signup/";

  const [collapsed, setCollapsed] = useState(false);
  const [showModal, setShowModal] = useState(false);

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

    checkFormStatus();
  }, [isLoginPage, institution]);

  if (isLoginPage) {
    return <div className="bg-white">{children}</div>;
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      {showModal && <FormCompletionModal school_id={institution} />}

      <div className="fixed top-0 right-0 left-0 h-16 z-10 transition-all duration-300">
        {/* TopBar component can go here */}
      </div>

      <div className="flex">
        <Navigation collapsed={collapsed} setCollapsed={setCollapsed} />

        <main
          className={`flex-1 bg-gray-50 transition-all duration-300 ${
            collapsed ? "ml-0 lg:ml-20" : "ml-0 lg:ml-72"
          }`}
        >
          <div className="pt-16 lg:pt-20">
            <div className="mx-auto max-w-7xl py-10 px-4 sm:px-6">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
