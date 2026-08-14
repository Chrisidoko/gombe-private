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
    property_type: string | null;
    license_expiry_date: string;
    courses: { name: string; accredited: boolean }[];
  };
}

interface SchoolSuggestion {
  school_id: string;
  name: string;
  license_number: string;
}

export default function VerifyForm() {
  const [mode, setMode] = useState<"license" | "name">("license");
  const [license, setLicense] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<LicenseResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [schoolName, setSchoolName] = useState("");
  const [suggestions, setSuggestions] = useState<SchoolSuggestion[]>([]);
  const [searching, setSearching] = useState(false);

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

  async function handleVerifyBySchoolId(schoolId: string) {
    setLoading(true);
    setError(null);
    setResult(null);
    setSuggestions([]);

    try {
      const res = await fetch(
        `/api/schools/verify-license?school_id=${encodeURIComponent(schoolId)}`,
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

  // ── Debounced school-name search ──
  useEffect(() => {
    if (mode !== "name" || schoolName.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    const timeout = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `/api/schools/search-by-name?q=${encodeURIComponent(schoolName.trim())}`,
        );
        const data = await res.json();
        setSuggestions(res.ok ? data : []);
      } catch {
        setSuggestions([]);
      } finally {
        setSearching(false);
      }
    }, 350);

    return () => clearTimeout(timeout);
  }, [schoolName, mode]);

  function handleBack() {
    // reset view to form mode
    setResult(null);
    setLicense("");
    setSchoolName("");
    setSuggestions([]);
    setError(null);
  }

  function handleModeChange(next: "license" | "name") {
    setMode(next);
    setError(null);
    setSuggestions([]);
  }

  return (
    <div
      className="flex flex-col min-h-screen bg-gray-50 bg-cover"
      style={{
        backgroundImage:
          "linear-gradient(rgba(25,155,57,0.9), rgba(25,155,57,1.0)), url('/gombe_logo.png')",
        backgroundSize: "100vw",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <main className="flex-grow">
        <div className="relative flex flex-col items-center bg-white mt-[16%] sm:mt-[3%] mb-10 sm:mb-12 w-[86vw] sm:w-[40vw] mx-auto rounded-xl border border-gray-300 shadow-xl px-8 py-12">
          {/* Top Logo */}
          <div className="w-20 h-20 rounded-2xl bg-white shadow-md border border-gray-100 flex items-center justify-center mx-auto overflow-hidden">
            <Image
              src="/gombe_logo.png"
              alt="Gombe State Ministry of Education"
              width={64}
              height={64}
              className="object-contain"
            />
          </div>

          <h2 className="text-3xl mt-6 font-bold mb-6 font-black">
            Verify Certificate
          </h2>

          {/* 🔁 CONDITIONAL RENDERING */}
          {!result ? (
            // Input Mode
            <div className="flex flex-col gap-4 w-full">
              {/* Search mode tabs */}
              <div className="flex w-full rounded-lg bg-gray-100 p-1">
                <button
                  type="button"
                  onClick={() => handleModeChange("license")}
                  className={`flex-1 py-1.5 text-sm font-semibold rounded-md transition ${
                    mode === "license"
                      ? "bg-white text-green-700 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Certificate Number
                </button>
                <button
                  type="button"
                  onClick={() => handleModeChange("name")}
                  className={`flex-1 py-1.5 text-sm font-semibold rounded-md transition ${
                    mode === "name"
                      ? "bg-white text-green-700 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Institution Name
                </button>
              </div>

              {mode === "license" ? (
                <>
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
                </>
              ) : (
                <>
                  <div className="px-6 text-sm text-center font-medium text-gray-600">
                    Start typing your institution&apos;s name and select it from
                    the list
                  </div>

                  <div className="relative">
                    <input
                      type="text"
                      placeholder="(e.g Gombe Model Institution)"
                      value={schoolName}
                      onChange={(e) => setSchoolName(e.target.value)}
                      className="p-2 border rounded text-center w-full"
                    />

                    {searching && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Loader2 className="animate-spin w-4 h-4 text-gray-400" />
                      </div>
                    )}

                    {suggestions.length > 0 && (
                      <ul className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-56 overflow-y-auto text-left">
                        {suggestions.map((s) => (
                          <li key={s.school_id}>
                            <button
                              type="button"
                              onClick={() =>
                                handleVerifyBySchoolId(s.school_id)
                              }
                              className="w-full px-4 py-2 text-sm hover:bg-green-50 transition"
                            >
                              <p className="font-semibold text-gray-800">
                                {s.name}
                              </p>
                              <p className="text-xs text-gray-400">
                                {s.license_number}
                              </p>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}

                    {!searching &&
                      schoolName.trim().length >= 2 &&
                      suggestions.length === 0 && (
                        <p className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg px-4 py-2 text-sm text-gray-400 text-center">
                          No matching school found
                        </p>
                      )}
                  </div>

                  {loading && (
                    <div className="flex justify-center">
                      <Loader2 className="animate-spin w-4 h-4 text-green-600" />
                    </div>
                  )}
                </>
              )}

              <div className="text-center">
                <Link
                  href="/"
                  className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back to Homepage
                </Link>
              </div>

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

                  {/* Property type */}
                  {result.school.property_type && (
                    <div className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                      <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-0.5">
                        Property Type
                      </p>
                      <p className="text-sm font-bold text-gray-800">
                        {result.school.property_type}
                      </p>
                    </div>
                  )}

                  {/* Courses */}
                  <div className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                    <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">
                      Courses
                    </p>
                    {result.school.courses &&
                    result.school.courses.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {result.school.courses.map((course) => (
                          <span
                            key={course.name}
                            className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border ${
                              course.accredited
                                ? "bg-green-50 border-green-200 text-green-800"
                                : "bg-red-50 border-red-200 text-red-800"
                            }`}
                          >
                            {course.name}
                            <span
                              className={`px-1 py-0.5 rounded-full text-[10px] font-bold ${
                                course.accredited
                                  ? "bg-green-200 text-green-800"
                                  : "bg-red-200 text-red-800"
                              }`}
                            >
                              {course.accredited
                                ? "Accredited"
                                : "Not Accredited"}
                            </span>
                          </span>
                        ))}
                      </div>
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

      <footer className="mt-auto w-full bg-gray-100 border-t border-gray-300 py-3">
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
