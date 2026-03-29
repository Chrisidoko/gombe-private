import React from "react";
import { getUserFromCookie } from "@/lib/auth";
// import { Construction } from "lucide-react";

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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-1">
        <div className="w-full">
          Coming soon: Inspector&apos; dashboard for performance insights.
        </div>
      </div>
    </main>
  );
}
