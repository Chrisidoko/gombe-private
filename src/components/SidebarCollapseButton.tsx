"use client";

// Round button on the sidebar's right edge that collapses and expands it.
// Desktop only; on mobile the sidebar opens from the menu button instead.
// Sits inside the sidebar's <aside>, which is fixed, so it rides along as the
// width changes.
import { ChevronLeft } from "lucide-react";

export default function SidebarCollapseButton({
  collapsed,
  setCollapsed,
}: {
  collapsed: boolean;
  setCollapsed: (val: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => setCollapsed(!collapsed)}
      aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      className="absolute -right-3.5 top-[34px] z-10 hidden lg:flex h-7 w-7 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-md transition-colors hover:border-green-600 hover:bg-green-600 hover:text-white"
    >
      <ChevronLeft
        className={`h-4 w-4 transition-transform duration-300 ${collapsed ? "rotate-180" : ""}`}
      />
    </button>
  );
}
