"use client";

import { BadgeCheck, XCircle, CircleX, Building } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface SchoolLicense {
  id: number;
  name: string;
  type: string;
  state: string;
  lga: string;
  address: string;
  licenseStatus: "Valid" | "Expired";
  expirationDate: string;
}

const schools: SchoolLicense[] = [
  {
    id: 106980,
    name: "Irepo Grammar School",
    type: "Private Individual",
    state: "Oyo State",
    lga: "Irepo LGA",
    address: "Plot 8, Funke Zainab Usman Street, Lekki Phase 1",
    licenseStatus: "Valid", // or "Expired"
    expirationDate: "2026-04-15",
  },
];

export default function SchoolLicenseOverview() {
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
      <div className="px-26 py-12">
        {schools.map((school) => (
          <div
            key={school.id}
            className="border border-gray-300 rounded-xl p-5 bg-white space-y-4 rounded-b-none"
          >
            <div className="flex items-center gap-4">
              <div className="px-3 py-3 text-[#28a745] border border-gray-300 rounded-lg">
                <Building />
              </div>

              <div className="flex flex-col justify-center ">
                <p className="text-sm text-gray-500">School ID: {school.id}</p>
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {school.name}
                  </h2>
                  <div
                    className={`flex items-center gap-2 mt-3 sm:mt-0 px-3 py-1 rounded-full text-sm font-medium ${
                      school.licenseStatus === "Valid"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {school.licenseStatus === "Valid" ? (
                      <BadgeCheck className="w-4 h-4" />
                    ) : (
                      <XCircle className="w-4 h-4" />
                    )}
                    {school.licenseStatus === "Valid"
                      ? "License Active"
                      : "License Expired"}
                  </div>
                </div>
              </div>

              <div className="ml-auto flex flex-col">
                <button className="flex justify-center px-3 py-2 text-sm sm:text-lg text-white font-semibold bg-[#28a745] rounded-lg hover:scale-105 transition-transform duration-100 cursor-pointer">
                  Renew License
                </button>
                <div className="pt-2">
                  <p className="text-xs text-gray-500">
                    License Expiration Date:
                    <span
                      className={`ml-2 font-medium ${
                        new Date(school.expirationDate) < new Date()
                          ? "text-red-600"
                          : "text-green-700"
                      }`}
                    >
                      {school.expirationDate}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-[3%] grid sm:grid-cols-4 gap-4 text-sm pt-6 border-t border-gray-300">
              <div className="border-r border-gray-300 space-y-2">
                <p className="text-gray-500">Address</p>
                <p className="font-medium">{school.address}</p>
              </div>
              <div className=" border-r border-gray-300 space-y-2">
                <p className="text-gray-500">State</p>
                <p className="font-medium">{school.state}</p>
              </div>
              <div className="border-r border-gray-300 space-y-2">
                <p className="text-gray-500">LGA</p>
                <p className="font-medium">{school.lga}</p>
              </div>
              <div className="space-y-2">
                <p className="text-gray-500">Type of Ownership </p>
                <p className="font-medium">{school.type}</p>
              </div>
            </div>
          </div>
        ))}
        <div className="bg-[#28a745] rounded-xl p-5 rounded-t-none border border-gray-300">
          <span className="font-semibold text-white ">School Information </span>
          <div className="mt-[1%]  text-white w-[100%] grid sm:grid-cols-2 gap-4 text-sm pt-6 border-t border-white-300 ">
            <div className="space-y-2">
              <p className="font-semibold text-xs uppercase text-black px-3 py-1 bg-[#fbbf23] rounded-sm inline-flex ">
                License Number
              </p>
              <p className="font-semibold text-lg">5788586445553AB</p>
            </div>
            <div className=" space-y-2 ">
              <p className="font-semibold text-xs uppercase text-black px-3 py-1 bg-[#fbbf23] rounded-sm inline-flex">
                License Issue Date
              </p>
              <p className="font-semibold text-lg">2024-04-15</p>
            </div>
            <div className="space-y-2">
              <p className="font-semibold text-xs uppercase text-black px-3 py-1 bg-[#fbbf23] rounded-sm inline-flex">
                Tax Identification Number
              </p>
              <p className="font-semibold text-lg">77979909053ABL</p>
            </div>
            <div className="space-y-2 ">
              <p className="font-semibold text-xs uppercase text-black px-3 py-1 bg-[#fbbf23] rounded-sm inline-flex">
                Phone
              </p>
              <p className="font-semibold text-lg">09076525895</p>
            </div>
            <div className="space-y-2  ">
              <p className="font-semibold text-xs uppercase text-black px-3 py-1 bg-[#fbbf23] rounded-sm inline-flex">
                Official Email
              </p>
              <p className="font-semibold text-lg">school@yahoo.com</p>
            </div>
          </div>
        </div>
      </div>
      <footer className="w-full mt-auto bg-gray-100 border-t border-gray-300 py-6">
        <div className="max-w-6xl mx-auto px-6 flex flex-col items-center justify-between text-xs sm:text-sm text-gray-600">
          {/* Left Side */}
          <div className="flex items-center mb-4 md:mb-0 text-center md:text-left">
            © {new Date().getFullYear()} Powered by{" "}
            <span className="ml-1">
              <Image src="/paypro.png" alt="Logo" width={46} height={46} />
            </span>
            . All Rights Reserved.
          </div>

          {/* Right Side */}
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
