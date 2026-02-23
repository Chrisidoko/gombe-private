// app/(school)/profile/page.tsx - Server Component (NO "use client")
import { getUserFromCookie } from "@/lib/auth";
import ProfilePageClient from "@/components/ui/ProfilePageClient";
import { School } from "@/lib/types"; // Import the type

export default async function ProfilePage() {
  const user = await getUserFromCookie();

  if (!user) {
    return (
      <div className="text-red-500 font-semibold mt-10 text-center">
        Unauthorized — please log in again.
      </div>
    );
  }

  // Fetch school data
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/schools/${user.institution}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    return (
      <div className="text-center text-red-600">
        Failed to load school information.
      </div>
    );
  }

  const school: School = await res.json(); // Type it with the imported School type

  // console.log(school);

  // Pass data to client component
  return <ProfilePageClient school={school} />;
}
