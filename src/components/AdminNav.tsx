"use client";

import { TabNavigation, TabNavigationLink } from "@/components/TabNavigation";
import Link from "next/link";
import LogoutButton from "@/components/ui/logoutbutton";
import { usePathname } from "next/navigation";

interface NavigationProps {
  collapsed: boolean;
  setCollapsed: (val: boolean) => void;
}

const Navigation: React.FC<NavigationProps> = ({ collapsed, setCollapsed }) => {
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
        {/* User Section & Logout */}
        <div
          className={`p-4 border-t border-gray-200 ${collapsed ? "px-2" : ""}`}
        >
          {!collapsed ? (
            <div className="mb-3 p-3 bg-gradient-to-r from-green-50 to-orange-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                  <svg
                    className="w-6 h-6"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    School Admin
                  </p>
                  <p className="text-xs text-gray-600 truncate">
                    admin@school.com
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="mb-3 flex justify-center">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
                <svg
                  className="w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
          )}
          <LogoutButton collapsed={collapsed} />
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
};

export { Navigation };
