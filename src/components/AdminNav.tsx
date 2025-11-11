"use client";

import { TabNavigation, TabNavigationLink } from "@/components/TabNavigation";
import Link from "next/link";
import LogoutButton from "@/components/ui/logoutbutton";
import { usePathname } from "next/navigation";

function Navigation() {
  const pathname = usePathname();

  return (
    <div className="shadow-s sticky top-0 z-20 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between pt-10 px-4 sm:px-6 ">
        <div className="flex items-center gap-2">
          <img src="/kirs.png" alt="manam logo" className="w-12" />
          <span className="font-bold text-lg text-gray-900">
            Kano State Electronic School Management System
          </span>
        </div>
        <div className="flex items-center flex-nowrap gap-1 ">
          <LogoutButton />
        </div>
      </div>
      <TabNavigation className="mt-12">
        <div className="mx-auto flex w-full max-w-7xl items-center px-6">
          <TabNavigationLink
            className="inline-flex gap-2"
            asChild
            active={pathname === "/dashboard"}
          >
            <Link href="/dashboard">Overview</Link>
          </TabNavigationLink>
          <TabNavigationLink
            className="inline-flex gap-2"
            asChild
            active={pathname === "/assessments"}
          >
            <Link href="/assessments">
              Assesments
              <div className="w-4 h-4 flex justify-center text-xs items-center rounded-full text-white bg-red-500">
                3
              </div>
            </Link>
          </TabNavigationLink>

          <TabNavigationLink
            className="inline-flex gap-2"
            asChild
            active={pathname === "/transactions"}
          >
            <Link href="/transactions">Transactions</Link>
          </TabNavigationLink>

          <TabNavigationLink
            className="inline-flex gap-2"
            asChild
            active={pathname === "/requests"}
          >
            <Link href="/requests">Request</Link>
          </TabNavigationLink>
          {/* {role === "superAdmin" && (
            <TabNavigationLink
              className="inline-flex gap-2"
              asChild
              active={pathname === "/admin/user"}
            >
              <Link href="/admin/user">Users</Link>
            </TabNavigationLink>
          )} */}
        </div>
      </TabNavigation>
    </div>
  );
}

export { Navigation };
