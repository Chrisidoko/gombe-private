"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { CircleX, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [formData, setFormData] = useState({
    tin: "",
    email: "",
    otp: "",
  });

  const [showOtp, setShowOtp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const router = useRouter();

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      if (!showOtp) {
        // Step 1: Send OTP
        const res = await fetch("/api/send-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tin: formData.tin,
            email: formData.email,
          }),
        });

        const data = await res.json();

        if (!res.ok) throw new Error(data.error || "Failed to send OTP");

        toast.success(" OTP sent to your email!");
        setShowOtp(true);
      } else {
        // Step 2: Verify OTP
        const res = await fetch("/api/verify-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tin: formData.tin,
            otp: formData.otp,
          }),
        });

        const data = await res.json();

        if (data.valid) {
          toast.success("OTP verified successfully!");
          router.push(`/school-overview?tin=${formData.tin}`);
        } else {
          throw new Error(data.message || "Invalid OTP");
        }
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Link href="/">
        <button className="w-full flex justify-center items-center gap-2 bg-[#28a745] text-white font-semibold py-3 text-sm">
          <CircleX /> Cancel & Return Home
        </button>
      </Link>

      <main className="flex justify-center mt-[3%] w-[86vw] sm:w-[60vw] mx-auto rounded-3xl border border-[#e6e7eb] shadow-xl">
        <div className="w-full px-6 py-14">
          <Image
            src="/kirs.png"
            alt="Logo"
            className="mx-auto"
            width={76}
            height={76}
          />
          <h2 className="mt-[1%] text-2xl sm:text-3xl text-center font-bold text-[#28a745] mb-4">
            Renew License
          </h2>

          <form onSubmit={handleSubmit} className="p-4 w-full text-sm">
            {!showOtp ? (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                <div className="flex flex-col gap-2 w-full sm:w-1/2">
                  <label className="text-sm font-medium">TIN</label>
                  <input
                    type="text"
                    value={formData.tin}
                    placeholder="Tax Identification Number (TIN)"
                    onChange={(e) => handleChange("tin", e.target.value)}
                    className="w-full p-3 border border-gray-400 rounded"
                    required
                  />
                </div>

                <div className="flex flex-col gap-2 w-full sm:w-1/2">
                  <label className="text-sm font-medium">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    placeholder="Official Email Address"
                    onChange={(e) => handleChange("email", e.target.value)}
                    className="w-full p-3 border border-gray-400 rounded"
                    required
                  />
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4 mt-4">
                <p className="text-center text-gray-600">
                  Enter the 6-digit OTP sent to your registered email.
                </p>
                <input
                  type="text"
                  maxLength={6}
                  value={formData.otp}
                  onChange={(e) => handleChange("otp", e.target.value)}
                  className="w-full sm:w-1/2 text-center text-lg tracking-widest p-3 border border-gray-400 rounded"
                  required
                />
                <button
                  type="button"
                  className="text-gray-500 text-xs mt-2 cursor-pointer"
                  onClick={() => setShowOtp(false)}
                >
                  ← Go Back
                </button>
              </div>
            )}

            {errorMsg && (
              <p className="text-red-500 text-center mt-4">{errorMsg}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full mt-6 py-3 flex items-center justify-center gap-2 rounded font-semibold text-white transition-colors
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
    </div>
  );
}
