import { Divider } from "@/components/Divider";

// import { Building } from "lucide-react";

// import Emptystate from "@/components/ui/emptystate";

import { getUserFromCookie } from "@/lib/auth";
// import { formatDate } from "@/lib/formatDate";

export default async function HomeDashboard() {
  const user = await getUserFromCookie();

  if (!user) {
    return (
      <div className="text-red-500 font-semibold mt-10 text-center">
        Unauthorized — please log in again.
      </div>
    );
  }
  console.log("User object:", user);

  return (
    <main>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="w-full">
          <div className="mb-4">
            <h3 className="font-semibold text-[#28a745]">
              Welcome to your Dashboard,
              <span className="font-light text-gray-700"> {user?.name}</span>
            </h3>
            <div className="text-sm max-w-2xl grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 mt-2">
              <span className="border-r border-gray-300">
                Designation: CBS Admin{" "}
              </span>
              <span className="border-r border-gray-300">
                Email: {user?.email ?? "N/A"}
              </span>
            </div>
          </div>
        </div>
      </div>
      <Divider />

      {/* events grid */}
    </main>
  );
}
