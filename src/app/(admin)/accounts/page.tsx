"use client";

import { useEffect, useState } from "react";
import {
  UserCheck,
  UserX,
  Loader2,
  Building2,
  MapPin,
  Mail,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
} from "lucide-react";
import toast from "react-hot-toast";

type Account = {
  id: number;
  name: string;
  email: string;
  institution: string;
  status: string;
  is_verified: boolean;
  created_at: string;
  school_name: string | null;
  lga: string | null;
  state: string | null;
  phone: string | null;
};

type StatusFilter = "pending" | "approved" | "rejected";

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function AccountApprovalsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<StatusFilter>("pending");
  const [acting, setActing] = useState<number | null>(null);
  const [error, setError] = useState("");

  async function fetchAccounts(status: StatusFilter) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/auth/verify?status=${status}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setAccounts(data);
    } catch {
      setError("Could not load accounts.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAccounts(filter);
  }, [filter]);

  async function handleAction(id: number, action: "approve" | "reject") {
    setActing(id);
    try {
      const res = await fetch("/api/admin/accounts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success(
        action === "approve"
          ? "Account approved — notification sent"
          : "Account rejected",
      );

      // Remove from list
      setAccounts((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Action failed");
    } finally {
      setActing(null);
    }
  }

  const FILTERS: {
    label: string;
    value: StatusFilter;
    icon: React.ElementType;
    color: string;
  }[] = [
    {
      label: "Pending",
      value: "pending",
      icon: Clock,
      color: "text-yellow-600 bg-yellow-50 border-yellow-200",
    },
    {
      label: "Approved",
      value: "approved",
      icon: CheckCircle2,
      color: "text-green-600 bg-green-50 border-green-200",
    },
    {
      label: "Rejected",
      value: "rejected",
      icon: XCircle,
      color: "text-red-600 bg-red-50 border-red-200",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Account Approvals
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Review and approve institution account registrations
            </p>
          </div>
          <button
            onClick={() => fetchAccounts(filter)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-700 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-2">
          {FILTERS.map(({ label, value, icon: Icon, color }) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border transition ${
                filter === value
                  ? color
                  : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
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
            <CheckCircle2 className="w-10 h-10 text-gray-200 mb-3" />
            <p className="text-sm font-semibold text-gray-500">
              No {filter} accounts
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {filter === "pending"
                ? "All accounts have been reviewed"
                : `No accounts with ${filter} status`}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {accounts.map((account) => (
              <div
                key={account.id}
                className="bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-4"
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  {/* Left — account info */}
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-green-50 border border-green-100 shrink-0">
                      <Building2 className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-bold text-gray-800">
                          {account.school_name || account.name}
                        </p>
                        {/* Verified badge */}
                        {account.is_verified ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3 h-3" />
                            Email Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-yellow-600 bg-yellow-50 border border-yellow-200 px-2 py-0.5 rounded-full">
                            <Clock className="w-3 h-3" />
                            Unverified
                          </span>
                        )}
                      </div>

                      <p className="text-xs font-mono text-gray-400 mt-0.5">
                        {account.institution}
                      </p>

                      <div className="flex flex-wrap items-center gap-3 mt-2">
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                          <Mail className="w-3 h-3 text-gray-400" />
                          {account.email}
                        </div>
                        {account.lga && (
                          <div className="flex items-center gap-1.5 text-xs text-gray-500">
                            <MapPin className="w-3 h-3 text-gray-400" />
                            {account.lga}, {account.state}
                          </div>
                        )}
                      </div>

                      <p className="text-[10px] text-gray-400 mt-1.5">
                        Registered {formatDate(account.created_at)}
                      </p>
                    </div>
                  </div>

                  {/* Right — actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {filter === "pending" ? (
                      <>
                        <button
                          onClick={() => handleAction(account.id, "reject")}
                          disabled={acting === account.id}
                          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-red-600 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100 transition disabled:opacity-50"
                        >
                          {acting === account.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <UserX className="w-3.5 h-3.5" />
                          )}
                          Reject
                        </button>
                        <button
                          onClick={() => handleAction(account.id, "approve")}
                          disabled={acting === account.id}
                          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-green-600 hover:bg-green-700 rounded-xl transition disabled:opacity-50"
                        >
                          {acting === account.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <UserCheck className="w-3.5 h-3.5" />
                          )}
                          Approve
                        </button>
                      </>
                    ) : (
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border ${
                          filter === "approved"
                            ? "bg-green-50 text-green-700 border-green-200"
                            : "bg-red-50 text-red-600 border-red-200"
                        }`}
                      >
                        {filter === "approved" ? (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5" />
                        )}
                        {filter.charAt(0).toUpperCase() + filter.slice(1)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
