"use client";

import { useState } from "react";
import {
  Building2,
  Mail,
  Lock,
  Hash,
  CheckCircle,
  Loader2,
  Copy,
  Check,
  RefreshCw,
} from "lucide-react";

type Result = {
  school_id: string;
  email: string;
  password: string;
  message: string;
};

function generatePreviewEmail(name: string): string {
  if (!name.trim()) return "";
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .trim()
    .split(/\s+/)
    .slice(0, 3)
    .join("");
  return `${slug}@gesms.edu.ng`;
}

export default function CreateSchoolPage() {
  const [schoolName, setSchoolName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const previewEmail = generatePreviewEmail(schoolName);
  const previewPassword = "Password@123";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setResult(null);

    if (!schoolName.trim()) return setError("Please enter a school name.");

    setLoading(true);
    try {
      const res = await fetch("/api/schools/create-school", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: schoolName }),
      });

      const data = await res.json();
      if (!res.ok) return setError(data.error || "Something went wrong.");

      setResult(data);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function copyToClipboard(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

  function handleReset() {
    setSchoolName("");
    setResult(null);
    setError("");
  }

  return (
    <main>
      {/* User bar */}
      <div className="min-h-screen bg-gray-50 flex justify-center px-4 py-12">
        <div className="w-full max-w-lg">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-green-600">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">
                Create New Institution
              </h1>
            </div>
            <p className="text-sm text-gray-500 ml-13">
              Enter the school name to auto-generate login credentials.
            </p>
          </div>

          {/* Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            {!result ? (
              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                {/* School Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    School Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="e.g. Gombe Private Institution"
                      value={schoolName}
                      onChange={(e) => setSchoolName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                      autoFocus
                    />
                  </div>
                </div>

                {/* Auto-generated preview */}
                {schoolName.trim() && (
                  <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 space-y-3">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Auto-generated Credentials
                    </p>

                    {/* Email preview */}
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        Email
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          value={previewEmail}
                          readOnly
                          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-white text-gray-600 cursor-default"
                        />
                      </div>
                    </div>

                    {/* Password preview */}
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        Default Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          value={previewPassword}
                          readOnly
                          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-white text-gray-600 cursor-default font-mono"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Error */}
                {error && (
                  <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">
                    {error}
                  </p>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl transition flex items-center justify-center gap-2 text-sm"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Creating
                      School...
                    </>
                  ) : (
                    "Create School"
                  )}
                </button>
              </form>
            ) : (
              /* ── Success state ── */
              <div className="p-6 space-y-5">
                <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-100">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">
                      School Created Successfully
                    </p>
                    <p className="text-xs text-gray-400">
                      Save these credentials — the password won&apos;t be shown
                      again.
                    </p>
                  </div>
                </div>

                {/* Result fields */}
                {[
                  {
                    label: "School ID",
                    value: result.school_id,
                    icon: Hash,
                    key: "school_id",
                  },
                  {
                    label: "Email",
                    value: result.email,
                    icon: Mail,
                    key: "email",
                  },
                  {
                    label: "Password",
                    value: result.password,
                    icon: Lock,
                    key: "password",
                  },
                ].map(({ label, value, icon: Icon, key }) => (
                  <div key={key}>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      {label}
                    </label>
                    <div className="relative">
                      <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={value}
                        readOnly
                        className="w-full pl-10 pr-12 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-700 font-mono cursor-default"
                      />
                      <button
                        type="button"
                        onClick={() => copyToClipboard(value, key)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-green-600 transition"
                        title="Copy"
                      >
                        {copied === key ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}

                {/* Create another */}
                <button
                  onClick={handleReset}
                  className="w-full mt-2 border border-gray-300 hover:border-green-500 hover:text-green-600 text-gray-600 font-semibold py-2.5 rounded-xl transition flex items-center justify-center gap-2 text-sm"
                >
                  <RefreshCw className="w-4 h-4" />
                  Create Another School
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
