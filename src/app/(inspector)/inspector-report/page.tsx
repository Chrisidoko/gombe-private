import { getUserFromCookie } from "@/lib/auth";
import InspectorReportsClient from "@/components/ui/InspectorReportsClient";
import TopHeader from "@/components/TopHeader";
import { FileText } from "lucide-react";

export default async function InspectorReportsPage() {
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
      <TopHeader />

      <div className="bg-green-50 w-full mx-auto mt-2 mb-2 p-2 flex items-center justify-center gap-2 text-center">
        <FileText className="text-green-800 w-4 h-4" />
        <p className="text-sm font-bold text-green-600">{user?.name}</p>
        <p className="text-xs text-gray-600">{user?.email ?? "N/A"}</p>
      </div>

      <InspectorReportsClient />
    </main>
  );
}
