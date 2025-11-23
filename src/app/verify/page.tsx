"use client";

import { useState } from "react";
import Image from "next/image";
import { CircleX, Loader2, CircleCheck, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";

import Link from "next/link";

interface LicenseResult {
  status: "valid" | "expired" | "invalid";
  school?: {
    name: string;
    school_id: string;
    state: string;
    ownership: string;
    license_expiry_date: string;
  };
}

export default function VerifyForm() {
  const [license, setLicense] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<LicenseResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleVerify() {
    if (!license.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(`/api/schools/verify-license?license=${license}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
        toast.error(data.error || "Something went wrong");
      } else {
        setResult(data);
      }
    } catch (err) {
      //   setError("Failed to connect to server");
      setError(
        err instanceof Error ? err.message : "Failed to connect to server"
      );
    } finally {
      setLoading(false);
    }
  }

  function handleBack() {
    // reset view to form mode
    setResult(null);
    setLicense("");
    setError(null);
  }

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow">
        <Link href="/">
          <button className="w-full flex justify-center items-center gap-2 bg-[#28a745] text-white font-semibold py-3 text-sm transition cursor-pointer">
            <CircleX /> Cancel & Return Home
          </button>
        </Link>

        <div className="relative flex flex-col items-center bg-white mt-[16%] sm:mt-[3%] w-[86vw] sm:w-[44vw] mx-auto rounded-xl border border-gray-300 shadow-xl px-8 py-12">
          {/* Top Logo */}
          <div className="max-w-6xl px-6 py-2">
            <Image
              src="/KD_logo.png"
              alt="Logo"
              className="mx-auto"
              width={76}
              height={76}
            />
          </div>

          <h2 className="text-3xl font-bold mb-6 text-[#28a745]">
            Verify License
          </h2>

          {/* 🔁 CONDITIONAL RENDERING */}
          {!result ? (
            // Input Mode
            <div className="flex flex-col gap-4 w-full">
              <div className="px-6 text-sm text-center font-medium text-gray-600">
                Enter your License Number to see your License Validity
              </div>

              <input
                type="text"
                placeholder="(e.g KA/TCC/16383939BC)"
                value={license}
                onChange={(e) => setLicense(e.target.value)}
                className="p-2 border rounded text-center"
              />

              <button
                onClick={handleVerify}
                disabled={loading}
                className="px-6 py-2 bg-green-600 text-white rounded flex justify-center items-center gap-2"
              >
                {loading && <Loader2 className="animate-spin w-4 h-4" />}
                {loading ? "Checking" : "Proceed and Confirm"}
              </button>

              {error && (
                <p className="text-red-500 text-sm text-center mt-4">{error}</p>
              )}
            </div>
          ) : (
            // Result Mode
            <div className="w-full text-center relative">
              {/* Back Button */}
              <button
                onClick={handleBack}
                className="absolute left-0 -top-4 sm:-top-2 text-gray-500 hover:text-gray-700 flex items-center gap-1 text-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>

              {/* Status Display */}
              {result.status === "valid" && (
                <div className="text-green-600 flex gap-2 items-center justify-center mt-4">
                  <CircleCheck className="w-8 h-8 mb-2" />
                  <p className="font-bold text-lg">License is VALID</p>
                </div>
              )}
              {result.status === "expired" && (
                <div className="text-yellow-600 flex gap-2 items-center justify-center mt-4">
                  <CircleX className="w-8 h-8 mb-2" />
                  <p className="font-bold text-lg">License has EXPIRED </p>
                </div>
              )}
              {result.status === "invalid" && (
                <div className="text-red-600 flex gap-2 items-center justify-center mt-4">
                  <CircleX className="w-8 h-8 mb-2" />
                  <p className="font-bold text-lg">Invalid License </p>
                </div>
              )}

              {result.school && (
                <div className="mt-6 text-sm text-gray-700 border-t pt-4 text-left">
                  <p>
                    <strong>School Name:</strong> {result.school.name}
                  </p>
                  <p>
                    <strong>School ID:</strong> {result.school.school_id}
                  </p>
                  <p>
                    <strong>State:</strong> {result.school.state}
                  </p>
                  <p>
                    <strong>Ownership:</strong> {result.school.ownership}
                  </p>
                  <p>
                    <strong>Expiry Date:</strong>{" "}
                    {new Date(result.school.license_expiry_date).toDateString()}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <footer className="mt-auto w-full bg-gray-100 border-t border-gray-300 py-6">
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
