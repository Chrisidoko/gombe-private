"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  ClipboardCheck,
  ChartNoAxesGantt,
  FileText,
  Settings2,
} from "lucide-react";
import LogoutButton from "@/components/ui/logoutbutton";

interface NavigationProps {
  collapsed: boolean;
  setCollapsed: (val: boolean) => void;
}

const Ops2Navigation: React.FC<NavigationProps> = ({
  collapsed,
  setCollapsed,
}) => {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const navItems = [
    {
      href: "/review-bulk",
      label: "Review Bulk Assessments",
      icon: <ChartNoAxesGantt size={18} />,
    },
    {
      href: "/review-evaluations",
      label: "Review Self Assessments",
      icon: <ClipboardCheck size={18} />,
    },
    {
      href: "/review-demand-notices",
      label: "Review Demand Notices",
      icon: <Settings2 size={18} />,
    },
  ];

  return (
    <>
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-50 h-screen transition-all duration-300 ease-in-out lg:translate-x-0 ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        } ${collapsed ? "w-20" : "w-72"} bg-white border-r border-gray-200 shadow-xl`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div
            className={`p-6 border-b border-gray-200 transition-all ${collapsed ? "px-4" : ""}`}
          >
            <div
              className={`flex items-center ${collapsed ? "justify-center" : "gap-3"}`}
            >
              <img
                src="/gombe_logo.png"
                alt="Gombe State logo"
                className={`flex-shrink-0 transition-all ${collapsed ? "w-10 h-10" : "w-12 h-12"}`}
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

          {/* Role badge */}
          {!collapsed && (
            <div className="px-4 py-2 border-b border-gray-100">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-xs font-semibold text-amber-700">
                <FileText size={11} />
                Reviewer — Operator 2
              </span>
            </div>
          )}

          {/* Collapse toggle */}
          <div className="hidden lg:block px-4 py-3 border-b border-gray-100">
            <button
              onClick={() => setCollapsed(!collapsed)}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-all ${collapsed ? "justify-center" : ""}`}
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <svg
                className={`w-5 h-5 transition-transform duration-300 ${collapsed ? "rotate-180" : ""}`}
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

          {/* Nav */}
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
                      ? "bg-amber-600 text-white shadow-md"
                      : "text-gray-700 hover:bg-gray-100"
                  } ${collapsed ? "justify-center" : ""}`}
                  title={collapsed ? item.label : ""}
                >
                  <span
                    className={`flex-shrink-0 ${isActive ? "text-white" : "text-gray-500 group-hover:text-amber-600"}`}
                  >
                    {item.icon}
                  </span>
                  {!collapsed && (
                    <span className="flex-1 font-medium text-sm">
                      {item.label}
                    </span>
                  )}
                  {collapsed && (
                    <div className="absolute left-full ml-2 px-3 py-2 bg-amber-600 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                      {item.label}
                      <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-amber-600 rotate-45" />
                    </div>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          <div
            className={`p-4 border-t border-gray-200 ${collapsed ? "px-2" : ""}`}
          >
            {!collapsed ? (
              <div className="mb-3 p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
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
                      Operator 2
                    </p>
                    <p className="text-xs text-gray-600 truncate">Reviewer</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mb-3 flex justify-center">
                <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center text-white font-bold">
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

      {/* Mobile top header */}
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
            <img src="/gombe_logo.png" alt="logo" className="w-8 h-8" />
            <span className="font-bold text-sm text-gray-900">
              GAPTEMS — Reviewer
            </span>
          </div>
          <div className="w-10" />
        </div>
      </header>

      {/* Desktop top bar */}
      <div
        className={`hidden lg:block fixed top-0 z-20 bg-white border-b border-gray-200 shadow-sm transition-all duration-300 ${
          collapsed ? "left-20" : "left-72"
        } right-0`}
      >
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-500">Reviewer</span>
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
                "Review Queue"}
            </span>
          </div>
        </div>
      </div>
    </>
  );
};

export { Ops2Navigation };
