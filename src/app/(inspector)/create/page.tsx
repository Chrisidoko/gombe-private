import React from "react";
import { getUserFromCookie } from "@/lib/auth";

import TopHeader from "@/components/TopHeader";
import CreateSchoolPage from "./CreatePage";
import { UserRoundSearch } from "lucide-react";

export default async function CreatePage() {
  const user = await getUserFromCookie();

  if (!user) {
    return (
      <div className="text-red-500 font-semibold mt-10 text-center">
        Unauthorized — please log in again.
      </div>
    );
  }

  return (
    <main>
      {/* User bar */}

      <TopHeader />

      <div className="bg-green-50 w-full mx-auto mt-2 mb-2 p-2 flex items-center justify-center gap-2 text-center">
        <UserRoundSearch className="text-green-800" />
        <p className="text-sm font-bold text-green-600">{user?.name}</p>
        <p className="text-xs text-gray-600">{user?.email ?? "N/A"}</p>
      </div>

      {/* Inspector search page */}
      <CreateSchoolPage />
    </main>
  );
}
