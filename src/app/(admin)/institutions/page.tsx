"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Building2,
  Loader2,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  X,
} from "lucide-react";

type Institution = {
  school_id: string;
  name: string;
  email: string;
  lga: string;
  state: string;
  approval_status: string;
  license_status: string;
  license_number: string | null;
  created_at: string;
};

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

const APPROVAL_OPTIONS = ["approved", "unapproved", "pending"];
const LICENSE_OPTIONS = ["Active", "Expired", "Inactive"];

function StatusBadge({
  value,
  type,
}: {
  value: string;
  type: "approval" | "license";
}) {
  const map: Record<string, string> = {
    approved: "bg-green-100 text-green-700",
    unapproved: "bg-red-50 text-red-600",
    pending: "bg-yellow-100 text-yellow-700",
    Active: "bg-green-100 text-green-700",
    Expired: "bg-red-50 text-red-600",
    Inactive: "bg-gray-100 text-gray-500",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
        map[value] ?? "bg-gray-100 text-gray-500"
      }`}
    >
      {value}
    </span>
  );
}

export default function InstitutionsPage() {
  const router = useRouter();

  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [lgas, setLgas] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [search, setSearch] = useState("");
  const [approvalFilter, setApprovalFilter] = useState("");
  const [licenseFilter, setLicenseFilter] = useState("");
  const [lgaFilter, setLgaFilter] = useState("");
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const activeFilterCount = [approvalFilter, licenseFilter, lgaFilter].filter(
    Boolean,
  ).length;

  const fetchInstitutions = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "20");
      if (search) params.set("search", search);
      if (approvalFilter) params.set("approval_status", approvalFilter);
      if (licenseFilter) params.set("license_status", licenseFilter);
      if (lgaFilter) params.set("lga", lgaFilter);

      const res = await fetch(`/api/admin/schools?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();

      setInstitutions(json.data);
      setPagination(json.pagination);
      if (json.lgas?.length) setLgas(json.lgas);
    } catch {
      setError("Could not load institutions.");
    } finally {
      setLoading(false);
    }
  }, [page, search, approvalFilter, licenseFilter, lgaFilter]);

  useEffect(() => {
    fetchInstitutions();
  }, [fetchInstitutions]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [search, approvalFilter, licenseFilter, lgaFilter]);

  function clearFilters() {
    setApprovalFilter("");
    setLicenseFilter("");
    setLgaFilter("");
    setSearch("");
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-3">
      <div className="max-w-7xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Institutions</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {pagination
                ? `${pagination.total} institution${pagination.total !== 1 ? "s" : ""} registered`
                : "Loading..."}
            </p>
          </div>
        </div>

        {/* Search + Filter bar */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X className="w-3.5 h-3.5 text-gray-400" />
              </button>
            )}
          </div>

          {/* Filter toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg border transition ${
              showFilters || activeFilterCount > 0
                ? "bg-green-600 text-white border-green-600"
                : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
            {activeFilterCount > 0 && (
              <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-white text-green-700 text-[10px] font-black">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Clear filters */}
          {activeFilterCount > 0 && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-500 hover:text-red-700 transition"
            >
              <X className="w-3.5 h-3.5" />
              Clear
            </button>
          )}
        </div>

        {/* Filter dropdowns */}
        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white border border-gray-200 rounded-xl p-4">
            {/* Approval status */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5">
                Approval Status
              </label>
              <select
                value={approvalFilter}
                onChange={(e) => setApprovalFilter(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">All</option>
                {APPROVAL_OPTIONS.map((o) => (
                  <option key={o} value={o}>
                    {o.charAt(0).toUpperCase() + o.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* License status */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5">
                Certificate Status
              </label>
              <select
                value={licenseFilter}
                onChange={(e) => setLicenseFilter(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">All</option>
                {LICENSE_OPTIONS.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>

            {/* LGA */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5">
                LGA
              </label>
              <select
                value={lgaFilter}
                onChange={(e) => setLgaFilter(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">All LGAs</option>
                {lgas.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
          </div>
        ) : error ? (
          <div className="text-center py-24 text-sm text-red-400">{error}</div>
        ) : institutions.length === 0 ? (
          <div className="text-center py-24 text-sm text-gray-400">
            No institutions found.
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Table head */}
            <div className="grid grid-cols-12 px-6 py-3 bg-gray-50 border-b border-gray-100 text-[10px] font-bold uppercase tracking-widest text-gray-400">
              <div className="col-span-6">Institution</div>
              <div className="col-span-2">LGA</div>
              <div className="col-span-2">Approval</div>
              <div className="col-span-2">Certificate</div>
            </div>

            {/* Table rows */}
            <div className="divide-y divide-gray-100">
              {institutions.map((inst) => (
                <div
                  key={inst.school_id}
                  onClick={() =>
                    router.push(
                      `/institutions/${encodeURIComponent(inst.school_id)}`,
                    )
                  }
                  className="grid grid-cols-12 px-6 py-4 items-center hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  {/* Name + email */}
                  <div className="col-span-6 flex items-center gap-3 min-w-0">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-green-50 border border-green-100 shrink-0">
                      <Building2 className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm max-w-[90%] font-semibold text-gray-800 truncate">
                        {inst.name}
                      </p>
                      <p className="text-xs text-gray-400 truncate">
                        {inst.email}
                      </p>
                    </div>
                  </div>

                  {/* LGA */}
                  <div className="col-span-2">
                    <p className="text-xs text-gray-500">{inst.lga || "—"}</p>
                  </div>

                  {/* Approval status */}
                  <div className="col-span-2">
                    <StatusBadge value={inst.approval_status} type="approval" />
                  </div>

                  {/* License status */}
                  <div className="col-span-2">
                    <StatusBadge
                      value={inst.license_status || "Inactive"}
                      type="license"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between text-sm">
            <p className="text-gray-500 text-xs">
              Showing{" "}
              <span className="font-semibold text-gray-700">
                {(pagination.page - 1) * pagination.limit + 1}–
                {Math.min(pagination.page * pagination.limit, pagination.total)}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-gray-700">
                {pagination.total}
              </span>
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold border border-gray-200 rounded-lg bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Prev
              </button>
              <span className="text-xs text-gray-500">
                {page} / {pagination.totalPages}
              </span>
              <button
                onClick={() =>
                  setPage((p) => Math.min(pagination.totalPages, p + 1))
                }
                disabled={page === pagination.totalPages}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold border border-gray-200 rounded-lg bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                Next
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
