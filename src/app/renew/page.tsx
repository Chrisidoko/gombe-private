"use client";

import { useState } from "react";
import Image from "next/image";

export default function LoginPage() {
  const [formData, setFormData] = useState({
    tin: "",
    email: "",
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Login submitted:", formData);
    // You can replace this with your API call
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Main Section */}
      <main className="flex justify-center bg-white mt-[5%] w-[86vw] sm:w-[60vw] mx-auto rounded-3xl border border-[#e6e7eb] shadow-xl">
        <div className="w-full px-6 py-14">
          <Image
            src="/kirs.png"
            alt="Logo"
            className="mx-auto"
            width={76}
            height={76}
          />
          <div className="max-w-2xl mx-auto mt-[4%]">
            <h2 className="text-2xl sm:text-4xl text-center font-extrabold text-[#28a745] mb-4">
              Renew Licenese
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="p-4 w-full">
            <div className="flex items-center justify-center gap-6">
              <div className="flex flex-col gap-2 w-1/2">
                <label className="text-sm font-medium">TIN</label>
                <input
                  type="text"
                  placeholder="Tax Identification Number (TIN)"
                  value={formData.tin}
                  onChange={(e) => handleChange("tin", e.target.value)}
                  className="w-full p-3 border border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex flex-col gap-2 w-1/2">
                <label className="text-sm font-medium">Email</label>
                <input
                  type="email"
                  placeholder="Enter Institution’s Official Email"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  className="w-full p-3 border border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-6 py-3 bg-[#28a745] text-white font-semibold rounded hover:bg-[#23913b] transition-colors"
            >
              Proceed
            </button>
          </form>
        </div>
      </main>

      <footer className="w-full bg-gray-100 border-t border-gray-300 py-6 mt-auto">
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
