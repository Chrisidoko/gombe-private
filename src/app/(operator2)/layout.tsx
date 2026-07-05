"use client";

import { Ops2Navigation } from "@/components/Ops2Nav";
import { useState } from "react";

export default function Operator2Layout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="flex">
        <Ops2Navigation collapsed={collapsed} setCollapsed={setCollapsed} />
        <main
          className={`flex-1 bg-gray-50 transition-all duration-300 ${
            collapsed ? "ml-0 lg:ml-20" : "ml-0 lg:ml-72"
          }`}
        >
          <div className="pt-16 lg:pt-20">
            <div className="mx-auto max-w-7xl py-10 px-4 sm:px-6">{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
}
