"use client";

import { Navigation } from "@/components/OpsNav";
import { usePathname } from "next/navigation";
import { useState } from "react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/" || pathname === "/signup/";

  const [collapsed, setCollapsed] = useState(false); // Sidebar collapsed state

  if (isLoginPage) {
    return <div className="bg-white">{children}</div>;
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Top Bar - adjusts with sidebar */}
      <div
        className={`fixed top-0 right-0 left-0 h-16 z-10 transition-all duration-300`}
      >
        {/* TopBar component can go here if you have one */}
      </div>

      {/* Main Layout */}
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
