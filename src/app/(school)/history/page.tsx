// app/(school)/fees/page.tsx
import { getUserFromCookie } from "@/lib/auth";
// import { Divider } from "@/components/Divider";
import TransactionsTable from "@/components/ui/transactiontable"; // import the client component

export default async function HistoryDashboard() {
  const user = await getUserFromCookie();

  if (!user) {
    return (
      <div className="text-red-600 font-semibold">
        Error: Missing school ID.
      </div>
    );
  }

  return (
    <main>
      {/* <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Fees</h1>
          <p className="text-gray-500 sm:text-sm/6">
            Demands Notices, Fines, Fees & Penalties
          </p>
        </div>
      </div>

      <Divider /> */}

      {/* Pass institution to the client component */}
      <TransactionsTable schoolId={user.institution || ""} />
    </main>
  );
}
