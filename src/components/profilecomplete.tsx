"use client";

import Link from "next/link";

export default function CompleteProfile() {
  return (
    <div
      className="relative bg-[#1c9b39] w-full h-40 p-3 rounded-xl"
      style={{
        backgroundImage:
          "linear-gradient(rgba(25,155,57,0.9), rgba(25,155,57,1.0)), url('/kirs.png')",
        backgroundSize: "620px",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="flex flex-col text-white">
        <span className="font-semibold text-lg sm:text-xl">
          Institution Enumeration
        </span>
        <span className="font-base text-xs sm:text-sm">
          Please complete your institution profile to be fully onboarded on the
          Kano State Electronic School Management System
        </span>
      </div>
      <Link href="/register">
        <button className="absolute bottom-3 right-3 w-[40%] sm:w-[26%] bg-[#fbbf23] text-sm sm:text-base text-white px-2 md:px-4 py-2 font-semibold rounded-lg shadow cursor-pointer">
          Complete profile
        </button>
      </Link>
    </div>
  );
}
