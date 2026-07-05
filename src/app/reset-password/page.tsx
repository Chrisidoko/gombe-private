"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Loader2, Eye, EyeOff, CheckCircle2, XCircle } from "lucide-react";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  // Redirect if no token
  useEffect(() => {
    if (!token) router.replace("/forgot-password");
  }, [token, router]);

  const passwordsMatch = password === confirmPassword && confirmPassword !== "";
  const passwordValid = password.length >= 8;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!passwordsMatch || !passwordValid) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
        return;
      }

      setSuccess(true);

      // Redirect to login after 3 seconds
      setTimeout(() => router.push("/"), 3000);
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
          "linear-gradient(rgba(25,155,57,0.9), rgba(25,155,57,1.0)), url('/gombe_logo.png')",
        backgroundSize: "100vw",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <main className="flex-grow flex items-center justify-center px-4 py-12">
        <div className="bg-white w-full max-w-md rounded-2xl border border-gray-200 shadow-xl px-8 py-10">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <Image src="/gombe_logo.png" alt="Logo" width={64} height={64} />
          </div>

          {success ? (
            // Success state
            <div className="text-center">
              <div className="flex items-center justify-center w-14 h-14 rounded-full bg-green-100 mx-auto mb-4">
                <CheckCircle2 className="w-7 h-7 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Password Reset!
              </h2>
              <p className="text-sm text-gray-500 leading-relaxed">
                Your password has been reset successfully. Redirecting you to
                login...
              </p>
              <Loader2 className="w-5 h-5 animate-spin text-green-500 mx-auto mt-4" />
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-1 text-center">
                Reset Password
              </h2>
              <p className="text-sm text-gray-500 text-center mb-8">
                Enter your new password below.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* New password */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-widest mb-1.5">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min. 8 characters"
                      required
                      className="w-full pl-4 pr-10 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {/* Password strength indicator */}
                  {password && (
                    <div className="flex items-center gap-1.5 mt-1.5">
                      {passwordValid ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-red-400" />
                      )}
                      <p
                        className={`text-xs ${
                          passwordValid ? "text-green-600" : "text-red-400"
                        }`}
                      >
                        {passwordValid
                          ? "Password length is valid"
                          : "At least 8 characters required"}
                      </p>
                    </div>
                  )}
                </div>

                {/* Confirm password */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-widest mb-1.5">
                    Confirm Password
                  </label>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your password"
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  {confirmPassword && (
                    <div className="flex items-center gap-1.5 mt-1.5">
                      {passwordsMatch ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-red-400" />
                      )}
                      <p
                        className={`text-xs ${
                          passwordsMatch ? "text-green-600" : "text-red-400"
                        }`}
                      >
                        {passwordsMatch
                          ? "Passwords match"
                          : "Passwords do not match"}
                      </p>
                    </div>
                  )}
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                    <p className="text-xs text-red-600 text-center">{error}</p>
                    {error.includes("expired") && (
                      <div className="text-center mt-2">
                        <Link
                          href="/forgot-password"
                          className="text-xs font-semibold text-red-600 underline"
                        >
                          Request a new reset link
                        </Link>
                      </div>
                    )}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !passwordsMatch || !passwordValid}
                  className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 rounded-lg text-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {loading ? "Resetting..." : "Reset Password"}
                </button>
              </form>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
