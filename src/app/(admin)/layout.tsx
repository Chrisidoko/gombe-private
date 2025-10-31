"use client";

import { Navigation } from "@/components/AdminNav";
import { usePathname } from "next/navigation";

export default function SchoolLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/" || pathname === "/signup/";

  return (
    <div className="bg-white">
      {!isLoginPage && <Navigation />}
      <div className="mx-auto max-w-7xl py-10 px-4 sm:px-6">{children}</div>
    </div>
  );
}
