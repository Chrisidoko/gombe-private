"use client";

import { useEffect, useState } from "react";
import { BadgeCheck, XCircle, CircleX, Building, Loader2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { formatDate } from "@/lib/formatDate";
import { useSearchParams, useRouter } from "next/navigation";

interface SchoolLicense {
  id: number;
  school_id: string;
  name: string;
  ownership: string;
  state: string;
  lga: string;
  tin: string;
  phone: number;
  email: string;
  address: string;
  license_number: string;
  license_status: "Valid" | "Expired";
  license_expiry_date: string;
  last_license_renewal: string;
}

export default function SchoolOverviewClient() {
  const [school, setSchool] = useState<SchoolLicense | null>(null);
  const [loading, setLoading] = useState(true);
  const [cloading, setCloading] = useState(false);

  const searchParams = useSearchParams();
  const tin = searchParams.get("tin");
  const router = useRouter();

  useEffect(() => {
    const fetchSchool = async () => {
      try {
        const url = tin
          ? `/api/schools/licenseinfo?tin=${tin}`
          : "/api/schools/licenseinfo";
        const res = await fetch(url);
        const data = await res.json();

        if (res.ok) {
          setSchool(tin ? data[0] : data);
        } else {
          console.error("Error:", data.error);
        }
      } catch (error) {
        console.error("Error fetching school:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSchool();
  }, [tin]);

  const handleRenew = () => {
    setCloading(true);
    setTimeout(() => {
      if (!school) return;
      const params = new URLSearchParams({
        tin: school.tin,
        email: school.email,
        name: school.name,
        amount: "500",
        item: "license",
      });
      router.push(`/checkout?${params.toString()}`);
    }, 3000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-[#28a745]" />
        <span className="ml-2">Loading school details...</span>
      </div>
    );
  }

  if (!school) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-500">No school found for the provided TIN.</p>
      </div>
    );
  }

  return (
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

      {/* Main Content */}
      <div className="px-26 py-12">
        <div key={school.id}>
          {/* Top section */}
          <div className="border border-gray-300 rounded-xl p-5 bg-white space-y-4 rounded-b-none">
            <div className="flex items-center gap-4">
              <div className="px-3 py-3 text-[#28a745] border border-gray-300 rounded-lg">
                <Building />
              </div>

              <div className="flex flex-col justify-center">
                <p className="text-sm text-gray-500">
                  School ID: {school.school_id}
                </p>
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {school.name}
                  </h2>
                  <div
                    className={`flex items-center gap-2 mt-3 sm:mt-0 px-3 py-1 rounded-full text-sm font-medium ${
                      school.license_status === "Valid"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {school.license_status === "Valid" ? (
                      <BadgeCheck className="w-4 h-4" />
                    ) : (
                      <XCircle className="w-4 h-4" />
                    )}
                    {school.license_status === "Valid"
                      ? "License Active"
                      : "License Expired"}
                  </div>
                </div>
              </div>

              <div className="ml-auto flex flex-col">
                <button
                  onClick={handleRenew}
                  disabled={cloading}
                  className={`flex justify-center items-center gap-2 px-3 py-2 text-sm sm:text-lg text-white font-semibold bg-[#28a745] rounded-lg transition-transform duration-100 cursor-pointer ${
                    cloading
                      ? "opacity-70 cursor-not-allowed"
                      : "hover:scale-105"
                  }`}
                >
                  {cloading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing
                    </>
                  ) : (
                    "Renew License"
                  )}
                </button>
                <div className="pt-2">
                  <p className="text-xs text-gray-500">
                    License Expiration Date:
                    <span
                      className={`ml-2 font-medium ${
                        new Date(school.license_expiry_date) < new Date()
                          ? "text-red-600"
                          : "text-green-700"
                      }`}
                    >
                      {formatDate(school.license_expiry_date)}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="mt-[3%] grid sm:grid-cols-4 gap-4 text-sm pt-6 border-t border-gray-300">
              <div className="border-r border-gray-300 space-y-2">
                <p className="text-gray-500">Address</p>
                <p className="font-medium">{school.address}</p>
              </div>
              <div className="border-r border-gray-300 space-y-2">
                <p className="text-gray-500">State</p>
                <p className="font-medium">{school.state}</p>
              </div>
              <div className="border-r border-gray-300 space-y-2">
                <p className="text-gray-500">LGA</p>
                <p className="font-medium">{school.lga}</p>
              </div>
              <div className="space-y-2">
                <p className="text-gray-500">Type of Ownership</p>
                <p className="font-medium">{school.ownership}</p>
              </div>
            </div>
          </div>

          {/* Footer Section */}
          <div className="bg-[#28a745] rounded-xl p-5 rounded-t-none border border-gray-300">
            <span className="font-semibold text-white">School Information</span>
            <div className="mt-[1%] text-white grid sm:grid-cols-2 gap-4 text-sm pt-6 border-t border-white-300">
              <div className="space-y-2">
                <p className="font-semibold text-xs uppercase text-black px-3 py-1 bg-[#fbbf23] rounded-sm inline-flex">
                  License Number
                </p>
                <p className="font-semibold text-lg">{school.license_number}</p>
              </div>
              <div className="space-y-2">
                <p className="font-semibold text-xs uppercase text-black px-3 py-1 bg-[#fbbf23] rounded-sm inline-flex">
                  License Issue Date
                </p>
                <p className="font-semibold text-lg">
                  {formatDate(school.last_license_renewal)}
                </p>
              </div>
              <div className="space-y-2">
                <p className="font-semibold text-xs uppercase text-black px-3 py-1 bg-[#fbbf23] rounded-sm inline-flex">
                  Tax Identification Number
                </p>
                <p className="font-semibold text-lg">{school.tin}</p>
              </div>
              <div className="space-y-2">
                <p className="font-semibold text-xs uppercase text-black px-3 py-1 bg-[#fbbf23] rounded-sm inline-flex">
                  Phone
                </p>
                <p className="font-semibold text-lg">{school.phone}</p>
              </div>
              <div className="space-y-2">
                <p className="font-semibold text-xs uppercase text-black px-3 py-1 bg-[#fbbf23] rounded-sm inline-flex">
                  Official Email
                </p>
                <p className="font-semibold text-lg">{school.email}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full mt-auto bg-gray-100 border-t border-gray-300 py-6">
        <div className="max-w-6xl mx-auto px-6 flex flex-col items-center justify-between text-xs sm:text-sm text-gray-600">
          <div className="flex items-center mb-4 md:mb-0 text-center md:text-left">
            © {new Date().getFullYear()} Powered by{" "}
            <span className="ml-1">
              <Image src="/paypro.png" alt="Logo" width={46} height={46} />
            </span>
            . All Rights Reserved.
          </div>

          <div className="flex space-x-4">
            <a href="#" className="hover:underline">
              Privacy Policy
            </a>
            <span>|</span>
            <a href="#" className="hover:underline">
              Terms of Service
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
