"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { CircleX, Loader2, CircleCheck, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";
import { useSearchParams } from "next/navigation";

import Link from "next/link";

interface LicenseResult {
  status: "valid" | "expired" | "invalid";
  school?: {
    name: string;
    school_id: string;
    state: string;
    ownership: string;
    license_expiry_date: string;
    courses: string[];
  };
}

export default function VerifyForm() {
  const [license, setLicense] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<LicenseResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const searchParams = useSearchParams();

  // ── Auto-verify if license param is in the URL (e.g. from QR code scan) ──
  useEffect(() => {
    const licenseParam = searchParams.get("license");
    if (licenseParam) {
      setLicense(licenseParam);
      handleVerifyWithValue(licenseParam); // trigger immediately
    }
  }, []);

  // Extracted so it can be called with a direct value (not relying on state)
  async function handleVerifyWithValue(licenseNumber: string) {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(
        `/api/schools/verify-license?license=${encodeURIComponent(licenseNumber)}`,
      );
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
        toast.error(data.error || "Something went wrong");
      } else {
        setResult(data);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to connect to server",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify() {
    if (!license.trim()) return;
    handleVerifyWithValue(license);
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
            Verify Certificate
          </h2>

          {/* 🔁 CONDITIONAL RENDERING */}
          {!result ? (
            // Input Mode
            <div className="flex flex-col gap-4 w-full">
              <div className="px-6 text-sm text-center font-medium text-gray-600">
                Enter your Certificate Number to see your institution&apos;s
                details
              </div>

              <input
                type="text"
                placeholder="(e.g MOE/H/163939)"
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
            <div className="w-full relative">
              {/* Back Button */}
              <button
                onClick={handleBack}
                className="flex items-center gap-1 text-gray-400 hover:text-gray-600 text-sm mb-6 transition"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>

              {/* Status Banner */}
              {result.status === "valid" && (
                <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-5">
                  <CircleCheck className="w-6 h-6 text-green-600 shrink-0" />
                  <div>
                    <p className="font-bold text-green-700 text-sm">
                      Certificate is VALID
                    </p>
                    <p className="text-green-600 text-xs">
                      This institution holds a valid certificate
                    </p>
                  </div>
                </div>
              )}
              {result.status === "expired" && (
                <div className="flex items-center gap-3 bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 mb-5">
                  <CircleX className="w-6 h-6 text-yellow-600 shrink-0" />
                  <div>
                    <p className="font-bold text-yellow-700 text-sm">
                      Certificate has EXPIRED
                    </p>
                    <p className="text-yellow-600 text-xs">
                      This certificate is no longer valid
                    </p>
                  </div>
                </div>
              )}
              {result.status === "invalid" && (
                <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-5">
                  <CircleX className="w-6 h-6 text-red-600 shrink-0" />
                  <div>
                    <p className="font-bold text-red-700 text-sm">
                      Invalid Certificate
                    </p>
                    <p className="text-red-600 text-xs">
                      No record found for this certificate number
                    </p>
                  </div>
                </div>
              )}

              {/* School Details */}
              {result.school && (
                <div className="space-y-4">
                  {/* School name */}
                  <div className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                    <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-0.5">
                      Institution
                    </p>
                    <p className="text-sm font-bold text-gray-800">
                      {result.school.name}
                    </p>
                  </div>

                  {/* Expiry date */}
                  <div className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                    <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-0.5">
                      Certificate Expiry
                    </p>
                    <p className="text-sm font-bold text-gray-800">
                      {new Date(
                        result.school.license_expiry_date,
                      ).toDateString()}
                    </p>
                  </div>

                  {/* Courses */}
                  <div className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                    <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">
                      Approved Courses
                    </p>
                    {result.school.courses &&
                    result.school.courses.length > 0 ? (
                      <ul className="space-y-1.5">
                        {result.school.courses.map((course, index) => (
                          <li
                            key={index}
                            className="flex items-center gap-2 text-sm text-gray-700"
                          >
                            <span className="w-5 h-5 rounded-full bg-green-100 text-green-700 text-xs font-bold flex items-center justify-center shrink-0">
                              {index + 1}
                            </span>
                            {course}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-400 italic">
                        No courses listed
                      </p>
                    )}
                  </div>
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
