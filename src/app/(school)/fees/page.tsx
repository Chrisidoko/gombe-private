// app/(school)/fees/page.tsx
import { getUserFromCookie } from "@/lib/auth";
import FeesPageClient from "@/components/ui/FeesPageClient";

export default async function FeeDashboard() {
  const user = await getUserFromCookie();

  if (!user) {
    return (
      <div className="text-red-600 font-semibold">
        Error: Missing school ID.
      </div>
    );
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/schools/${user.institution}`, {
    cache: "no-store",
  });
  const school = await res.json();

  return (
    <main>
      <FeesPageClient school={school} />
    </main>
  );
}
