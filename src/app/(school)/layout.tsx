// No "use client" — Now a Server Component
import { getUserFromCookie } from "@/lib/auth";
import { redirect } from "next/navigation";
import SchoolShell from "@/components/SchoolShelllayout";

export default async function SchoolLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  //  await works here because this is a Server Component
  const user = await getUserFromCookie();

  if (!user || !user.institution) {
    redirect("/"); // redirect to login if not authenticated
  }

  return (
    // ✅ Pass the institution down to the client shell as a plain prop
    <SchoolShell institution={user.institution}>{children}</SchoolShell>
  );
}
