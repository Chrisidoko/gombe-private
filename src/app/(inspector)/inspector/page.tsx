import React from "react";
import { getUserFromCookie } from "@/lib/auth";
import LogoutButton from "@/components/ui/logoutbutton";
import InspectorPage from "@/components/ui/InspectorPageClient"; // ← your search component
import { Shield } from "lucide-react";

export default async function InspectorDashboard() {
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
      {/* User bar */}
      <div className="flex items-center justify-between py-3 mb-4 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-green-50 border border-green-100">
            <Shield className="w-4 h-4 text-green-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-800">{user?.name}</p>
            <p className="text-xs text-gray-400">{user?.email ?? "N/A"}</p>
          </div>
          <div className="bg-green-500/20 rounded-md px-2 py-0.5 ml-1">
            <span className="text-xs text-green-700 font-semibold">
              INSPECTOR
            </span>
          </div>
        </div>
        <LogoutButton collapsed={false} />
      </div>

      {/* Inspector search page */}
      <InspectorPage />
    </main>
  );
}
