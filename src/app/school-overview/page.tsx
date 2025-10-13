import { Suspense } from "react";
import SchoolOverviewClient from "./SchoolOverviewClient";
import { CircleX, Building } from "lucide-react";
import Link from "next/link";

export default function SchoolOverviewPage() {
  return (
    <Suspense
      fallback={
        <div
          className="min-h-screen flex flex-col bg-white"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.9), rgba(255,255,255,1.0)), url('/kirs.png')",
            backgroundSize: "620px",
            backgroundPosition: "top right",
            backgroundRepeat: "no-repeat",
          }}
        >
          {/* Header */}
          <Link href="/">
            <button className="w-full flex justify-center items-center gap-2 bg-[#28a745] text-white font-semibold py-3 text-sm transition cursor-pointer">
              <CircleX /> Cancel & Return Home
            </button>
          </Link>
          <div className="px-26 py-12">
            <div>
              <div className="border border-gray-300 rounded-xl p-5 bg-white space-y-4 rounded-b-none">
                <div className="flex items-center gap-4">
                  <div className="px-3 py-3 text-[#28a745] border border-gray-300 rounded-lg">
                    <Building />
                  </div>

                  <div className="flex flex-col justify-center ">
                    <div className="flex items-center">
                      <p> School ID: </p>
                      <div className="ml-2 h-4 w-32 bg-gray-100 rounded-lg animate-pulse"></div>
                    </div>
                    <div className="h-7 w-90 bg-gray-100 rounded-lg animate-pulse">
                      {" "}
                    </div>
                  </div>

                  <div className="ml-auto flex flex-col">
                    <button className="flex justify-center px-3 py-2 bg-[#28a745] rounded-lg text-white text-sm sm:text-lg font-semibold">
                      Renew License
                    </button>
                    <div className="pt-2">
                      <div className="flex items-center text-xs text-gray-500">
                        <p>License Expiration Date: </p>
                        <div className="ml-2 h-3 w-20 bg-gray-100 rounded-xl animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-[3%] grid sm:grid-cols-4 gap-4 text-sm pt-6 border-t border-gray-300">
                  <div className="border-r border-gray-300 space-y-2">
                    <p className="text-gray-500">Address</p>

                    <div className="h-6 w-48 bg-gray-100 rounded-lg animate-pulse"></div>
                  </div>
                  <div className=" border-r border-gray-300 space-y-2">
                    <p className="text-gray-500">State</p>
                    <div className="h-6  w-48 bg-gray-100 rounded-lg animate-pulse"></div>
                  </div>
                  <div className="border-r border-gray-300 space-y-2">
                    <p className="text-gray-500">LGA</p>

                    <div className="h-6 w-48 bg-gray-100 rounded-lg animate-pulse"></div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-gray-500">Type of Ownership </p>

                    <div className="h-6 w-48 bg-gray-100 rounded-lg animate-pulse"></div>
                  </div>
                </div>
              </div>

              <div className="bg-[#28a745] rounded-xl p-5 rounded-t-none border border-gray-300">
                <span className="font-semibold text-white ">
                  School Information{" "}
                </span>
                <div className="mt-[1%]  text-white w-[100%] grid sm:grid-cols-2 gap-4 text-sm pt-6 border-t border-white-300 ">
                  <div className="space-y-2">
                    <p className="font-semibold text-xs uppercase text-black px-3 py-1 bg-[#fbbf23] rounded-sm inline-flex ">
                      License Number
                    </p>

                    <div className="h-7 w-68 bg-gray-100  rounded-lg animate-pulse"></div>
                  </div>
                  <div className=" space-y-2 ">
                    <p className="font-semibold text-xs uppercase text-black px-3 py-1 bg-[#fbbf23] rounded-sm inline-flex">
                      License Issue Date
                    </p>

                    <div className="h-7 w-68 bg-gray-100 rounded-lg animate-pulse"></div>
                  </div>
                  <div className="space-y-2">
                    <p className="font-semibold text-xs uppercase text-black px-3 py-1 bg-[#fbbf23] rounded-sm inline-flex">
                      Tax Identification Number
                    </p>

                    <div className="h-7 w-68 bg-gray-100  rounded-lg animate-pulse"></div>
                  </div>
                  <div className="space-y-2 ">
                    <p className="font-semibold text-xs uppercase text-black px-3 py-1 bg-[#fbbf23] rounded-sm inline-flex">
                      Phone
                    </p>

                    <div className="h-7 w-68 bg-gray-100 rounded-lg animate-pulse"></div>
                  </div>
                  <div className="space-y-2  ">
                    <p className="font-semibold text-xs uppercase text-black px-3 py-1 bg-[#fbbf23] rounded-sm inline-flex">
                      Official Email
                    </p>

                    <div className="h-7 w-68 bg-gray-100  rounded-lg animate-pulse"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      }
    >
      <SchoolOverviewClient />
    </Suspense>
  );
}
