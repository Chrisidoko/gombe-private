"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Loader2, ArrowLeft, Mail } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
        return;
      }

      setSuccess(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="flex flex-col min-h-screen bg-gray-50 bg-cover"
      style={{
        backgroundImage:
          "linear-gradient(rgba(25,155,57,0.9), rgba(25,155,57,1.0)), url('/KD_logo.png')",
        backgroundSize: "100vw",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <main className="flex-grow flex items-center justify-center px-4 py-12">
        <div className="bg-white w-full max-w-md rounded-2xl border border-gray-200 shadow-xl px-8 py-10">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <Image src="/KD_logo.png" alt="Logo" width={64} height={64} />
          </div>

          {success ? (
            // Success state
            <div className="text-center">
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Check your email
              </h2>
              <p className="text-sm text-gray-500 leading-relaxed mb-6">
                If an account exists for{" "}
                <span className="font-semibold text-gray-700">{email}</span>,
                you will receive a password reset link shortly.
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-sm font-semibold text-green-600 hover:text-green-800 transition"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Login
              </Link>
            </div>
          ) : (
            // Form state
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-1 text-center">
                Forgot Password
              </h2>
              <p className="text-sm text-gray-500 text-center mb-8">
                Enter your email and we&apos;ll send you a reset link.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-widest mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      required
                      className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {error && (
                  <p className="text-xs text-red-500 text-center">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 rounded-lg text-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {loading ? "Sending..." : "Send Reset Link"}
                </button>

                <div className="text-center">
                  <Link
                    href="/"
                    className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Back to Login
                  </Link>
                </div>
              </form>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
