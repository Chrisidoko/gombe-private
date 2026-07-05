"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Building,
  Building2,
  FileQuestionMark,
  UserRoundCog,
} from "lucide-react";
import LogoutButton from "@/components/ui/logoutbutton";

interface NavigationProps {
  collapsed: boolean;
  setCollapsed: (val: boolean) => void;
}

const Navigation: React.FC<NavigationProps> = ({ collapsed, setCollapsed }) => {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const navItems = [
    {
      href: "/dashboard",
      label: "Overview",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
          />
        </svg>
      ),
    },
    // {
    //   href: "/evaluations",
    //   label: "Assessment",
    //   icon: (
    //     <svg
    //       className="w-5 h-5"
    //       fill="none"
    //       stroke="currentColor"
    //       viewBox="0 0 24 24"
    //     >
    //       <path
    //         strokeLinecap="round"
    //         strokeLinejoin="round"
    //         strokeWidth={2}
    //         d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
    //       />
    //     </svg>
    //   ),
    // },

    {
      href: "/requests",
      label: "Requests",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
    {
      href: "/institutions",
      label: "Institutions",
      icon: <Building2 className="w-4 h-4" />,
    },
    {
      href: "/questionnaires",
      label: "Questionnaires",
      icon: <FileQuestionMark className="w-4 h-4" />,
    },

    {
      href: "/create-school",
      label: "Create School",
      icon: <Building className="w-4 h-4" />,
    },
    {
      href: "/accounts",
      label: "Users",
      icon: <UserRoundCog className="w-4 h-4" />,
    },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-screen transition-all duration-300 ease-in-out lg:translate-x-0 ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        } ${
          collapsed ? "w-20" : "w-72"
        } bg-white border-r border-gray-200 shadow-xl`}
      >
        <div className="flex flex-col h-full">
          {/* Logo Header */}
          <div
            className={`p-6 border-b border-gray-200 transition-all ${
              collapsed ? "px-4" : ""
            }`}
          >
            <div
              className={`flex items-center ${
                collapsed ? "justify-center" : "gap-3"
              }`}
            >
              <img
                src="/gombe_logo.png"
                alt="KIRS logo"
                className={`flex-shrink-0 transition-all ${
                  collapsed ? "w-10 h-10" : "w-12 h-12"
                }`}
              />
              {!collapsed && (
                <div className="min-w-0">
                  <h1 className="font-bold text-sm text-gray-900 leading-tight">
                    Gombe State Private
                  </h1>
                  <p className="text-xs text-gray-600">
                    Tertiary Institutions Portal
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Collapse Toggle Button - Desktop Only */}
          <div className="hidden lg:block px-4 py-3 border-b border-gray-100">
            <button
              onClick={() => setCollapsed(!collapsed)}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-all ${
                collapsed ? "justify-center" : ""
              }`}
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <svg
                className={`w-5 h-5 transition-transform duration-300 ${
                  collapsed ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
                />
              </svg>
              {!collapsed && <span>Collapse</span>}
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group relative ${
                    isActive
                      ? "bg-green-600 text-white shadow-md"
                      : "text-gray-700 hover:bg-gray-100"
                  } ${collapsed ? "justify-center" : ""}`}
                  title={collapsed ? item.label : ""}
                >
                  <span
                    className={`flex-shrink-0 ${
                      isActive
                        ? "text-white"
                        : "text-gray-500 group-hover:text-green-600"
                    }`}
                  >
                    {item.icon}
                  </span>
                  {!collapsed && (
                    <>
                      <span className="flex-1 font-medium text-sm">
                        {item.label}
                      </span>
                      {/* {item.badge && (
                        <span
                          className={`flex items-center justify-center w-6 h-6 text-xs font-bold rounded-full ${
                            isActive
                              ? "bg-white text-green-600"
                              : "bg-red-500 text-white"
                          }`}
                        >
                          {item.badge}
                        </span>
                      )} */}
                    </>
                  )}
                  {/* {collapsed && item.badge && (
                    <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 text-xs font-bold rounded-full bg-red-500 text-white">
                      {item.badge}
                    </span>
                  )} */}

                  {/* Tooltip for collapsed state */}
                  {collapsed && (
                    <div className="absolute left-full ml-2 px-3 py-2 bg-yellow-500 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                      {item.label}
                      <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-yellow-500 rotate-45"></div>
                    </div>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User Section & Logout */}
          <div
            className={`p-4 border-t border-gray-200 ${
              collapsed ? "px-2" : ""
            }`}
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
                      Admin
                    </p>
                    <p className="text-xs text-gray-600 truncate">
                      Click to View Profile
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
      </aside>

      {/* Top Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => setIsMobileOpen(true)}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>

          <div className="flex items-center gap-2">
            <img src="/gombe_logo.png" alt="KIRS logo" className="w-8 h-8" />
            <span className="font-bold text-sm text-gray-900">KIRS Portal</span>
          </div>

          <div className="w-10" />
        </div>
      </header>

      {/* Desktop Top Bar */}
      <div
        className={`hidden lg:block fixed top-0 z-20 bg-white border-b border-gray-200 shadow-sm transition-all duration-300 ${
          collapsed ? "left-20" : "left-72"
        } right-0`}
      >
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-500">Dashboard</span>
            <svg
              className="w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
            <span className="font-medium text-gray-900">
              {navItems.find((item) => item.href === pathname)?.label ||
                "Overview"}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors relative">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export { Navigation };
