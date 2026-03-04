import React from "react";
import { getUserFromCookie } from "@/lib/auth";
import { Construction } from "lucide-react";

export default async function Financepage() {
  const user = await getUserFromCookie();

  if (!user) {
    return (
      <div className="text-red-500 font-semibold mt-10 text-center">
        Unauthorized — please log in again.
      </div>
    );
  }

  return (
    <main className="px-6">
      {/* Under development notice */}
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-yellow-50 border border-yellow-200 mb-5">
          <Construction className="w-8 h-8 text-yellow-500" />
        </div>
        <h2 className="text-lg font-bold text-gray-800 mb-2">
          Performance & Projection Reports
        </h2>
        <p className="text-sm text-gray-500 max-w-sm leading-relaxed">
          This section is currently being developed and will be available once
          completed. Please check back later.
        </p>
      </div>
    </main>
  );
}
