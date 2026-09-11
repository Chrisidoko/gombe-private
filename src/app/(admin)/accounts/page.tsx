"use client";

import { useEffect, useState } from "react";
import {
  Loader2,
  Users,
  Mail,
  RefreshCw,
  UserPlus,
  X,
  Ban,
  RotateCcw,
} from "lucide-react";
import toast from "react-hot-toast";

type StaffAccount = {
  id: number;
  name: string;
  email: string;
  institution: string;
  status: string;
  created_at: string;
};

const INSTITUTION_LABELS: Record<string, { label: string; cls: string }> = {
  CBS_Admin: {
    label: "Admin",
    cls: "bg-purple-50 text-purple-700 border-purple-200",
  },
  CBS_Finance: {
    label: "Management",
    cls: "bg-blue-50 text-blue-700 border-blue-200",
  },
  CBS_Inspector: {
    label: "Inspector",
    cls: "bg-orange-50 text-orange-700 border-orange-200",
  },
  CBS_Operator: {
    label: "Operator",
    cls: "bg-teal-50 text-teal-700 border-teal-200",
  },
  CBS_Operator2: {
    label: "Operator 2",
    cls: "bg-teal-50 text-teal-700 border-teal-200",
  },
};

const STAFF_ROLE_OPTIONS: { value: string; label: string }[] = [
  { value: "CBS_Admin", label: "Admin" },
  { value: "CBS_Finance", label: "Management" },
  { value: "CBS_Inspector", label: "Inspector" },
  { value: "CBS_Operator", label: "Operator" },
  { value: "CBS_Operator2", label: "Operator 2 (Reviewer)" },
];

function institutionBadge(institution: string) {
  return (
    INSTITUTION_LABELS[institution] || {
      label: institution,
      cls: "bg-gray-50 text-gray-600 border-gray-200",
    }
  );
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function StatusBadge({ status }: { status: string }) {
  const isActive = status === "approved";
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
        isActive
          ? "bg-green-50 text-green-700 border-green-200"
          : "bg-gray-100 text-gray-500 border-gray-200"
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-green-500" : "bg-gray-400"}`}
      />
      {isActive ? "Active" : "Inactive"}
    </span>
  );
}

function CreateAccountModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [institution, setInstitution] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !institution) {
      toast.error("Fill in name, email, and role");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/staff-accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, institution }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success(`Account created — set-password email sent to ${email}`);
      onCreated();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create account");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-base font-bold text-gray-900">Create Staff Account</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-xs text-gray-500 mb-5">
          For internal ministry roles only. The account is active
          immediately — the user gets an email to set their own password.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Amina Yusuf"
              className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">
              Role
            </label>
            <select
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
              className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">Select a role</option>
              {STAFF_ROLE_OPTIONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#28a745] hover:bg-[#218838] text-white font-bold text-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <UserPlus className="w-4 h-4" />
              )}
              {submitting ? "Creating…" : "Create Account"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function StaffAccountsPage() {
  const [accounts, setAccounts] = useState<StaffAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [toggling, setToggling] = useState<number | null>(null);

  async function fetchAccounts() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/staff-accounts");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setAccounts(data);
    } catch {
      setError("Could not load staff accounts.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAccounts();
  }, []);

  async function handleToggleStatus(account: StaffAccount) {
    const nextStatus = account.status === "approved" ? "disabled" : "approved";
    setToggling(account.id);
    try {
      const res = await fetch(`/api/admin/staff-accounts/${account.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setAccounts((prev) =>
        prev.map((a) => (a.id === account.id ? { ...a, status: nextStatus } : a)),
      );
      toast.success(
        nextStatus === "disabled"
          ? `${account.name}'s account disabled`
          : `${account.name}'s account re-enabled`,
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update account");
    } finally {
      setToggling(null);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Staff Accounts</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Internal ministry accounts — Admin, Management, Inspector, and
              Operator roles.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={fetchAccounts}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-700 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#28a745] hover:bg-[#218838] text-white text-xs font-bold transition"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Create Staff Account
            </button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
          </div>
        ) : error ? (
          <div className="text-center py-24 text-sm text-red-400">{error}</div>
        ) : accounts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Users className="w-10 h-10 text-gray-200 mb-3" />
            <p className="text-sm font-semibold text-gray-500">
              No staff accounts yet
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Use &ldquo;Create Staff Account&rdquo; to add the first one.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {accounts.map((account) => (
              <div
                key={account.id}
                className="bg-white rounded-2xl border border-gray-200 shadow-xs px-5 py-4"
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  {/* Left — status + account info */}
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-green-50 border border-green-100 shrink-0">
                      <Users className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <StatusBadge status={account.status} />
                        <p className="text-sm font-bold text-gray-800">
                          {account.name}
                        </p>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${institutionBadge(account.institution).cls}`}
                        >
                          {institutionBadge(account.institution).label}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 mt-1.5">
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                          <Mail className="w-3 h-3 text-gray-400" />
                          {account.email}
                        </div>
                        <p className="text-[10px] text-gray-400">
                          Created {formatDate(account.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Right — disable/enable */}
                  <button
                    onClick={() => handleToggleStatus(account)}
                    disabled={toggling === account.id}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border transition disabled:opacity-50 disabled:cursor-not-allowed shrink-0 ${
                      account.status === "approved"
                        ? "text-red-600 bg-red-50 border-red-200 hover:bg-red-100"
                        : "text-green-700 bg-green-50 border-green-200 hover:bg-green-100"
                    }`}
                  >
                    {toggling === account.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : account.status === "approved" ? (
                      <Ban className="w-3.5 h-3.5" />
                    ) : (
                      <RotateCcw className="w-3.5 h-3.5" />
                    )}
                    {account.status === "approved" ? "Disable" : "Enable"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showCreateModal && (
        <CreateAccountModal
          onClose={() => setShowCreateModal(false)}
          onCreated={fetchAccounts}
        />
      )}
    </div>
  );
}
