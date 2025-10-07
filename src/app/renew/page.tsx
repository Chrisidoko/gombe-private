"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { CircleX, Loader2 } from "lucide-react";

export default function LoginPage() {
  const [formData, setFormData] = useState({
    tin: "",
    email: "",
    otp: "",
  });

  const [showOtp, setShowOtp] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!showOtp) {
      // Step 1: Send OTP to email
      console.log("Sending OTP to:", formData);
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        setShowOtp(true);
      }, 1000); // simulate network request
    } else {
      // Step 2: Verify OTP
      console.log("Verifying OTP:", formData.otp);
      alert("OTP verified successfully ✅");
      // Here you can redirect to dashboard or home
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header */}
      <Link href="/">
        <button className="w-full flex justify-center items-center gap-2 bg-[#28a745] text-white font-semibold py-3 text-sm transition cursor-pointer">
          <CircleX /> Cancel & Return Home
        </button>
      </Link>

      {/* Main Section */}
      <main className="flex justify-center bg-white mt-[3%] w-[86vw] sm:w-[60vw] mx-auto rounded-3xl border border-[#e6e7eb] shadow-xl">
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
              Renew License
            </h2>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-4 w-full text-sm">
            {!showOtp ? (
              // Step 1: TIN + Email
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                <div className="flex flex-col gap-2 w-full sm:w-1/2">
                  <label className="text-sm font-medium">TIN</label>
                  <input
                    type="text"
                    placeholder="Tax Identification Number (TIN)"
                    value={formData.tin}
                    onChange={(e) => handleChange("tin", e.target.value)}
                    className="w-full p-3 border border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="flex flex-col gap-2 w-full sm:w-1/2">
                  <label className="text-sm font-medium">Email</label>
                  <input
                    type="email"
                    placeholder="Enter Institution’s Official Email"
                    value={formData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    className="w-full p-3 border border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
            ) : (
              // Step 2: OTP
              <div className="flex flex-col items-center gap-4 mt-4">
                <p className="text-center text-gray-600">
                  Enter the 6-digit OTP sent to your registered email.
                </p>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="Enter OTP"
                  value={formData.otp}
                  onChange={(e) => handleChange("otp", e.target.value)}
                  className="w-full sm:w-1/2 text-center text-lg tracking-widest p-3 border border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />

                <button
                  type="button"
                  className="text-blue-600 text-xs underline mt-2 cursor-pointer"
                  onClick={() => alert("Resend OTP clicked")}
                >
                  Resend OTP
                </button>

                <button
                  type="button"
                  className="text-gray-500 text-xs mt-2 cursor-pointer"
                  onClick={() => setShowOtp(false)}
                >
                  ← Go Back
                </button>
              </div>
            )}

            {/* Submit Button */}

            <button
              type="submit"
              disabled={loading}
              className={`w-full mt-6 py-3 flex items-center justify-center gap-2 rounded font-semibold text-white transition-colors cursor-pointer
    ${
      loading
        ? "bg-[#23913b] cursor-not-allowed opacity-80"
        : "bg-[#28a745] hover:bg-[#23913b]"
    }`}
            >
              {loading && <Loader2 className="w-5 h-5 animate-spin" />}
              {loading ? "Processing" : showOtp ? "Verify OTP" : "Proceed"}
            </button>
          </form>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full bg-gray-100 border-t border-gray-300 py-6 mt-auto">
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
