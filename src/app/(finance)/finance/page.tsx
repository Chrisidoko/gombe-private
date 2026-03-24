import React from "react";
import { getUserFromCookie } from "@/lib/auth";
// import { Construction } from "lucide-react";
import RevenuePerformancePage from "@/components/ui/performancetable";

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
    <main className="px-3">
      <RevenuePerformancePage />
    </main>
  );
}
