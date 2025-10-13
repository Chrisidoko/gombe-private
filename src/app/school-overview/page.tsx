import { Suspense } from "react";
import SchoolOverviewClient from "./SchoolOverviewClient";

export default function SchoolOverviewPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-gray-500">
          Loading school overview...
        </div>
      }
    >
      <SchoolOverviewClient />
    </Suspense>
  );
}
