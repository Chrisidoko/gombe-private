"use client";

import Image from "next/image";
import { useState } from "react";
import {
  EyeClosed,
  Eye,
  ClipboardPen,
  ReceiptText,
  CircleCheckBig,
} from "lucide-react";

import Link from "next/link";

const Page = () => {
  const [passwordVisible, setPasswordVisible] = useState(false);
  return (
    <div className="w-full flex flex-col sm:flex-row ">
      {/* Left Section */}
      <div className="w-[100%] sm:w-[45%] h-[100vh] bg-[#ffffff] relative top-0 left-0 flex flex-col justify-between sm:order-1 order-2">
        <div className="w-4/5 sm:w-3/5 mx-auto px-6 sm:px-0">
          <div className="relative mt-12 flex gap-1 items-center">
            {" "}
            <div className="flex flex-col text-[#28a745]">
              {/* <span className="font-semibold text-xl ">
                Public Tertiary Institutions
              </span> */}
            </div>
          </div>
        </div>

        <div className="w-4/5 sm:w-3/5 mx-auto flex flex-col gap-4 px-6 sm:px-0">
          <Image
            src="/kirs.png"
            alt="kano state"
            width={66}
            height={66}
            className="md:block object-cover mx-auto"
          />
          <h2 className="text-xl font-bold mx-auto">Sign-In</h2>
          <p className="text-gray-500 text-xs">
            Access the Dashboard using your email and password.
          </p>

          <form className="flex flex-col gap-4">
            <label className="text-sm font-medium">Email</label>
            <input
              type="email"
              className="w-full p-2 border border-gray-300 rounded-md text-sm"
              placeholder="Enter your email"
              // value={email}
              // onChange={(e) => setEmail(e.target.value)}
            />

            <label className="text-sm font-medium">Password</label>
            <div className="relative">
              <input
                type={passwordVisible ? "text" : "password"}
                className="w-full p-2 border border-gray-300 rounded-md text-sm"
                placeholder="Enter your password"
                // value={password}
                // onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button" // Prevents form submission
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600 text-sm"
                onClick={() => setPasswordVisible(!passwordVisible)}
              >
                {passwordVisible ? <EyeClosed size={14} /> : <Eye size={14} />}
              </button>
            </div>

            <button
              type="submit"
              // disabled={loading}
              className="w-full bg-[#28a745] mt-2 text-white font-semibold py-3 rounded-md text-sm transition cursor-pointer "
            >
              {/* {loading ? "Please Wait" : "Sign-In"} */}
              Sign-In
            </button>
          </form>

          <p className="text-xs text-gray-500">
            New on our platform?{" "}
            <Link href="/#" className="text-sm text-blue-700 font-semibold">
              Create an account
            </Link>
          </p>
          <div className="mt-16 flex gap-3 sm:gap-8 text-xs font-medium text-blue-700">
            <a href="#">Terms & Condition</a> <a href="#">Privacy Policy</a>{" "}
            <a href="#">Support</a>
          </div>
          <span className="flex items-center text-xs mt-3 mb-6">
            © {new Date().getFullYear()} Powered by{" "}
            <span className="ml-1">
              <Image src="/paypro.png" alt="Logo" width={46} height={46} />
            </span>
            . All Rights Reserved.
          </span>
        </div>
      </div>

      {/* Right Section */}
      <div
        className="w-full sm:w-[55%] relative bg-[#199b39] bg-cover bg-center sm:order-2 order-1"
        style={{
          backgroundImage:
            "linear-gradient(rgba(25,155,57,0.9), rgba(25,155,57,1.0)), url('/kirs.png')",
          backgroundSize: "620px",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <div className="flex flex-col h-full px-12 py-12">
          <div className="w-full font-semibold text-sm sm:text-lg bg-[#fbbf23] py-4 px-4 rounded-xl">
            Quick Access Modules
          </div>
          <div className="w-full mt-[4vh] flex gap-5 flex-col text-white font-semibold text-sm sm:text-lg ">
            <Link href="/renew">
              <div className="flex items-center gap-5 bg-white/20 rounded-xl border border-white py-4 px-4 cursor-pointer hover:bg-white/30">
                <ReceiptText /> Renew License
              </div>
            </Link>
            <Link href="/verify">
              <div className="flex items-center gap-5 bg-white/20 rounded-xl border border-white py-4 px-4 cursor-pointer hover:bg-white/30">
                <CircleCheckBig /> Verify License
              </div>
            </Link>
          </div>

          <div className="flex flex-col gap-5 py-7">
            <div className="w-full font-semibold text-sm sm:text-lg bg-white py-4 px-4 rounded-xl">
              Register School
            </div>
            <div className="flex flex-col gap-5 text-white font-semibold text-sm sm:text-lg">
              <Link href="/newregistration">
                <div className="flex items-center gap-5 bg-white/20 rounded-xl border border-white py-4 px-4 cursor-pointer hover:bg-white/30 ">
                  <ClipboardPen /> New School Registration
                </div>
              </Link>
              <Link href="/register">
                <div className="flex items-center gap-5 bg-white/20 rounded-xl border border-white py-4 px-4 cursor-pointer hover:bg-white/30 ">
                  <ClipboardPen /> Existing School Onboarding
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Page;
