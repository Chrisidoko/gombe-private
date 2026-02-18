"use client";

import { useState } from "react";
import { Mail, ShieldCheck, Loader2 } from "lucide-react";

interface FormCompletionModalProps {
  school_id: string; // pass the school's TIN from session/context
}

type Step = "email" | "otp" | "done";

export default function FormCompletionModal({
  school_id,
}: FormCompletionModalProps) {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ── Step 1: send OTP ────────────────────────────────────────────────────────
  async function handleSendOtp() {
    setError("");
    if (!email) return setError("Please enter your email address.");

    setLoading(true);
    try {
      const res = await fetch("/api/schools/form-status/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ school_id, email }),
      });

      const data = await res.json();
      if (!res.ok) return setError(data.error || "Failed to send OTP.");

      setStep("otp");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // ── Step 2: verify OTP then mark form complete ───────────────────────────────
  async function handleVerifyOtp() {
    setError("");
    if (!otp) return setError("Please enter the OTP sent to your email.");

    setLoading(true);
    try {
      // 1. Verify OTP
      const verifyRes = await fetch("/api/schools/form-status/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ school_id, otp }),
      });

      const verifyData = await verifyRes.json();
      if (!verifyData.valid)
        return setError(verifyData.message || "Invalid or expired OTP.");

      // 2. Mark form as complete
      const updateRes = await fetch("/api/schools/form-status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ school_id, email }),
      });

      if (!updateRes.ok)
        return setError("Verified but failed to update form status.");

      setStep("done");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // ── Completed — dismiss modal ────────────────────────────────────────────────
  if (step === "done") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-8 text-center">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mx-auto mb-4">
            <ShieldCheck className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Email Verified!
          </h2>
          <p className="text-gray-500 text-sm mb-6">
            Your email has been verified and you can proceed to complete your
            profile.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 rounded-xl transition"
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-100">
              {step === "email" ? (
                <Mail className="w-5 h-5 text-green-700" />
              ) : (
                <ShieldCheck className="w-5 h-5 text-green-700" />
              )}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800">
                {step === "email" ? "Verify Your Email" : "Enter OTP"}
              </h2>
              <p className="text-xs text-gray-400">
                {step === "email"
                  ? "Complete your profile to continue"
                  : `Code sent to ${email}`}
              </p>
            </div>
          </div>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-6">
          <div className="flex-1 h-1.5 rounded-full bg-green-600" />
          <div
            className={`flex-1 h-1.5 rounded-full transition-colors ${step === "otp" ? "bg-green-600" : "bg-gray-200"}`}
          />
        </div>

        {/* Email step */}
        {step === "email" && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                placeholder="Enter your school email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendOtp()}
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              onClick={handleSendOtp}
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-medium py-2.5 rounded-xl transition flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? "Sending..." : "Send OTP"}
            </button>
          </div>
        )}

        {/* OTP step */}
        {step === "otp" && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                One-Time Password
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                onKeyDown={(e) => e.key === "Enter" && handleVerifyOtp()}
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm tracking-widest text-center font-mono focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              onClick={handleVerifyOtp}
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-medium py-2.5 rounded-xl transition flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? "Verifying..." : "Verify OTP"}
            </button>
            <button
              onClick={() => {
                setStep("email");
                setError("");
                setOtp("");
              }}
              className="w-full text-sm text-gray-500 hover:text-gray-700 transition"
            >
              ← Change email address
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
