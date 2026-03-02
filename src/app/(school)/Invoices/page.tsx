// app/(school)/fees/page.tsx
import { getUserFromCookie } from "@/lib/auth";
// import { Divider } from "@/components/Divider";
import InvoiceTable from "@/components/ui/InvoiceTable";

export default async function FeeDashboard() {
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
      {/* Pass institution to the client component */}
      <InvoiceTable schoolId={user.institution || ""} />
    </main>
  );
}
