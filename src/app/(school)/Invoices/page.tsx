// app/(school)/Invoices/page.tsx
import { getUserFromCookie } from "@/lib/auth";
import DemandNoticesTabs from "@/components/ui/DemandNoticesTabs";

export default async function DemandNoticesPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const user = await getUserFromCookie();

  if (!user) {
    return (
      <div className="text-red-600 font-semibold">
        Error: Missing school ID.
      </div>
    );
  }

  const { tab } = await searchParams;

  return (
    <main className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Demand Notices</h1>
        <p className="text-sm text-gray-600 mt-1">
          Manage and track your Institution&apos;s demand notices
        </p>
      </div>
      <DemandNoticesTabs
        schoolId={user.institution || ""}
        initialTab={tab === "other" ? "other" : "single"}
      />
    </main>
  );
}
