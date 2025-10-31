import { Divider } from "@/components/Divider";

import { Building } from "lucide-react";
import { ProgressCircle } from "@/components/ui/ProgressCircle";
import Emptystate from "@/components/ui/emptystate";

import { getUserFromCookie } from "@/lib/auth";
import { formatDate } from "@/lib/formatDate";

import dynamic from "next/dynamic";
const CompleteProfile = dynamic(() => import("@/components/profilecomplete"), {
  ssr: true, // or false, depending on your needs
  loading: () => <div>Loading...</div>, // optional loading state
});

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

  // ✅ Use an absolute base URL
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  // ✅ Use the user's institution to fetch school data
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

  const school = await res.json();

  return (
    <main>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="w-full">
          <div className="mb-4">
            <h3 className="font-semibold text-[#28a745]">
              Welcome to your Dashboard,{" "}
              <span className="font-light text-gray-700">{user?.name}</span>
            </h3>
            <div className="text-sm max-w-2xl grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 mt-2">
              <span className="border-r border-gray-300">
                Designation: School Admin{" "}
              </span>
              <span className="border-r border-gray-300">
                Email: {user?.email ?? "N/A"}
              </span>
            </div>
          </div>
          {/* 
          Conditional Import Inside the Render This is the most recommended
           and lint-safe way — the import only happens when needed. */}

          {school?.form_status !== "completed" && <CompleteProfile />}
        </div>
      </div>
      <Divider />
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <div className="px-3 py-3 bg-[#fbbf23] text-black rounded-lg">
            <Building />
          </div>

          <div className="flex flex-col justify-center ">
            <div className="flex flex-col sm:flex-row sm:items-center">
              <p>
                Tax Identificaation Number:{" "}
                {school?.tin ?? (
                  <div className="sm:ml-2 h-4 w-28 sm:w-32 bg-gray-100 rounded-sm animate-pulse"></div>
                )}{" "}
              </p>
            </div>
            <p className="text-lg font-semibold text-gray-900">
              {school?.name ?? (
                <div className="h-7 w-76 sm:w-90 bg-gray-100 rounded-lg animate-pulse"></div>
              )}{" "}
            </p>
          </div>
        </div>

        <div className="mt-[3%] mb-[3%] grid sm:grid-cols-4 gap-4 text-sm pt-6 border-t border-gray-300">
          <div className="border-r border-gray-300 space-y-2">
            <p className="text-gray-500">Address</p>
            {school?.address ?? (
              <div className="h-6 w-48 bg-gray-100 rounded-lg animate-pulse"></div>
            )}{" "}
          </div>
          <div className=" border-r border-gray-300 space-y-2">
            <p className="text-gray-500">State</p>
            {school?.state ?? (
              <div className="h-6  w-48 bg-gray-100 rounded-lg animate-pulse"></div>
            )}{" "}
          </div>
          <div className="border-r border-gray-300 space-y-2">
            <p className="text-gray-500">LGA</p>
            {school?.lga ?? (
              <div className="h-6 w-48 bg-gray-100 rounded-lg animate-pulse"></div>
            )}{" "}
          </div>
          <div className="space-y-2">
            <p className="text-gray-500">Type of Ownership </p>
            {school?.ownership ?? (
              <div className="h-6 w-48 bg-gray-100 rounded-lg animate-pulse"></div>
            )}{" "}
          </div>
        </div>
        <h2 className="font-semibold">Compliance Score</h2>
        <div className="flex flex-col items-center sm:flex-row gap-4">
          <div className="w-full sm:w-fit flex flex-col sm:flex-row border border-gray-300 rounded-xl ">
            <div className="w-full  sm:w-[16vw] flex py-12 flex-col gap-6">
              <div className="flex items-center justify-center gap-x-5">
                <ProgressCircle
                  variant="warning"
                  value={62}
                  radius={50}
                  strokeWidth={8}
                >
                  <span className="text-sm font-medium text-gray-900">75%</span>
                </ProgressCircle>
              </div>
              <div className="flex mx-auto gap-3 text-sm">
                <span className="border-l-2 border-[#28a745]  pl-3">
                  {" "}
                  Demands Sent
                </span>
                <span className="font-semibold">10</span>
              </div>
              <div className="flex items-center mx-auto gap-3 text-sm">
                <span className="border-l-2 border-[#28a745]  pl-3">
                  {" "}
                  Demands Paid
                </span>
                <span className="font-semibold">7</span>
              </div>
            </div>

            <div
              className="bg-[#28a745]/20 rounded-xl p-5 rounded-l-none"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(25,155,57,0.9), rgba(25,155,57,1.0)), url('/kirs.png')",
                backgroundSize: "620px",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
              }}
            >
              <div className="mt-[1%] text-white sm:w-[36vw] grid sm:grid-cols-2 gap-6 text-sm pt-6">
                <div className="space-y-2">
                  <p className="font-semibold text-xs uppercase text-black px-3 py-1 bg-[#fbbf23] rounded-sm inline-flex ">
                    License Number
                  </p>

                  <div className="font-base  text-lg">
                    {school?.license_number ?? (
                      <div className="h-7 w-68 bg-gray-100  rounded-lg animate-pulse"></div>
                    )}{" "}
                  </div>
                </div>
                <div className=" space-y-2 ">
                  <p className="font-semibold text-xs uppercase text-black px-3 py-1 bg-[#fbbf23] rounded-sm inline-flex">
                    License Issue Date
                  </p>

                  <div className="font-base text-lg">
                    {school?.last_license_renewal ? (
                      formatDate(school.last_license_renewal)
                    ) : (
                      <div className="h-7 w-68 bg-gray-100 rounded-lg animate-pulse"></div>
                    )}
                  </div>
                </div>

                <div className=" space-y-2 ">
                  <p className="font-semibold text-xs uppercase text-black px-3 py-1 bg-[#fbbf23] rounded-sm inline-flex">
                    License Expiry Date
                  </p>

                  <div className="font-base text-lg">
                    {school?.license_expiry_date ? (
                      formatDate(school.license_expiry_date)
                    ) : (
                      <div className="h-7 w-68 bg-gray-100 rounded-lg animate-pulse"></div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="w-full sm:w-[30vw]">
            {" "}
            <Emptystate />{" "}
          </div>
        </div>
      </div>
      {/* events grid */}
    </main>
  );
}
