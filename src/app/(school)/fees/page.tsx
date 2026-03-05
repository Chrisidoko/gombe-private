// app/(school)/fees/page.tsx
import FeeTable from "@/components/ui/feestable";
import { getUserFromCookie } from "@/lib/auth";
// import { Divider } from "@/components/Divider";

export default async function FeeDashboard() {
  const user = await getUserFromCookie();

  if (!user) {
    return (
      <div className="text-red-600 font-semibold">
        Error: Missing school ID.
      </div>
    );
  }

  // Fetch school data
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/schools/${user.institution}`, {
    cache: "no-store",
  });

  const school = await res.json();
  // console.log("Fetched school data:", school);

  return (
    <main>
      {/* Pass institution to the client component */}

      <FeeTable
        programmes={school.programmes}
        school_id={school.school_id}
        license_status={school.license_status}
        approval_status={school.approval_status}
      />
    </main>
  );
}
