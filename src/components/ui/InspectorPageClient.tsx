"use client";

import { useState, useEffect, useRef } from "react";
import {
  Search,
  Building2,
  MapPin,
  Phone,
  Mail,
  BadgeCheck,
  GraduationCap,
  Loader2,
  X,
  Calendar,
  ChevronRight,
} from "lucide-react";
import { getUserFromCookie } from "@/lib/auth";
import ComplyCard from "@/components/ui/complyCard";

type School = {
  school_id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  lga: string;
  state: string;
  ownership: string;
  license_number: string | null;
  license_status: string | null;
  license_expiry_date: string | null;
  last_license_renewal: string | null;
  approval_status: string;
  form_status: string;
  programmes: string[];
  courses: string[];
};

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function LicenseStatusBadge({ status }: { status: string | null }) {
  const s = status || "Inactive";
  const map: Record<string, string> = {
    Active: "bg-green-100 text-green-700 border-green-200",
    Expired: "bg-red-50 text-red-600 border-red-200",
    Inactive: "bg-gray-100 text-gray-500 border-gray-200",
  };
  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wide ${map[s] ?? "bg-gray-100 text-gray-500 border-gray-200"}`}
    >
      {s}
    </span>
  );
}

export default function InspectorPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<School[]>([]);
  const [searching, setSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selected, setSelected] = useState<School | null>(null);
  const [searchError, setSearchError] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.length < 2) {
      setResults([]);
      setShowDropdown(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      setSearchError("");
      try {
        const res = await fetch(
          `/api/inspector/search?q=${encodeURIComponent(query)}`,
        );
        if (!res.ok) throw new Error("Search failed");
        const data = await res.json();
        setResults(data);
        setShowDropdown(true);
      } catch {
        setSearchError("Search failed. Please try again.");
      } finally {
        setSearching(false);
      }
    }, 400);
  }, [query]);

  function handleSelect(school: School) {
    setSelected(school);
    setQuery(school.name);
    setShowDropdown(false);
  }

  function handleClear() {
    setSelected(null);
    setQuery("");
    setResults([]);
  }

  const isLicenseExpired =
    selected?.license_expiry_date &&
    new Date(selected.license_expiry_date) < new Date();

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Field Inspector</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Search for any institution to view their license, compliance status
            and approved courses.
          </p>
        </div>

        {/* Search bar */}
        <div ref={wrapperRef} className="relative">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (selected) setSelected(null);
              }}
              placeholder="Search institution by name..."
              className="w-full pl-11 pr-10 py-3.5 bg-white border border-gray-200 rounded-2xl text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
            />
            {/* Loading / clear */}
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              {searching ? (
                <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
              ) : query ? (
                <button onClick={handleClear}>
                  <X className="w-4 h-4 text-gray-400 hover:text-gray-600 transition" />
                </button>
              ) : null}
            </div>
          </div>

          {/* Dropdown results */}
          {showDropdown && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border border-gray-200 shadow-xl z-50 overflow-hidden">
              {results.length === 0 ? (
                <div className="px-5 py-4 text-sm text-gray-400 text-center">
                  No institutions found for &quot;{query}&quot;
                </div>
              ) : (
                <ul className="divide-y divide-gray-100 max-h-72 overflow-y-auto">
                  {results.map((school) => (
                    <li key={school.school_id}>
                      <button
                        onClick={() => handleSelect(school)}
                        className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition text-left"
                      >
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-green-50 border border-green-100 shrink-0">
                          <Building2 className="w-4 h-4 text-green-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-gray-800 truncate">
                            {school.name}
                          </p>
                          <p className="text-xs text-gray-400">
                            {school.lga}, {school.state}
                          </p>
                        </div>
                        <LicenseStatusBadge status={school.license_status} />
                        <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {searchError && (
          <p className="text-xs text-red-400 text-center">{searchError}</p>
        )}

        {/* Empty state */}
        {!selected && !searching && !showDropdown && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-green-50 border border-green-100 mb-4">
              <Search className="w-7 h-7 text-green-500" />
            </div>
            <h3 className="text-base font-bold text-gray-700 mb-1">
              Search for an Institution
            </h3>
            <p className="text-sm text-gray-400 max-w-xs leading-relaxed">
              Type an institution name above to view their certificate status,
              compliance score and approved courses.
            </p>
          </div>
        )}

        {/* Selected school detail */}
        {selected && (
          <div className="space-y-5">
            {/* Basic Info card */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="bg-[#1a5c2e] px-6 py-5 flex items-center gap-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-white/10 shrink-0">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base font-black text-white leading-tight truncate">
                    {selected.name}
                  </h2>
                  <p className="text-xs text-green-300 mt-0.5 font-mono">
                    {selected.school_id}
                  </p>
                </div>
              </div>

              <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                      Location
                    </p>
                    <p className="text-sm text-gray-700">
                      {selected.address || "—"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {selected.lga}, {selected.state}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <Building2 className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                      Ownership
                    </p>
                    <p className="text-sm text-gray-700">
                      {selected.ownership || "—"}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <Phone className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                      Phone
                    </p>
                    <p className="text-sm text-gray-700">
                      {selected.phone || "—"}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <Mail className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                      Email
                    </p>
                    <p className="text-sm text-gray-700 truncate">
                      {selected.email || "—"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* License card + Compliance card side by side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* License card */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 bg-gray-50">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-green-50 border border-green-100">
                    <BadgeCheck className="w-4 h-4 text-green-600" />
                  </div>
                  <h3 className="text-sm font-bold text-gray-700 uppercase tracking-widest">
                    Certificate Information
                  </h3>
                </div>
                <div className="px-5 py-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold">
                      Status
                    </p>
                    <LicenseStatusBadge status={selected.license_status} />
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold">
                      Certificate Number
                    </p>
                    <p className="text-sm font-bold text-gray-800 font-mono">
                      {selected.license_number || "—"}
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold">
                      Last Renewal
                    </p>
                    <p className="text-sm text-gray-700">
                      {formatDate(selected.last_license_renewal)}
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold">
                      Expiry Date
                    </p>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-gray-400" />
                      <p
                        className={`text-sm font-semibold ${isLicenseExpired ? "text-red-600" : "text-gray-700"}`}
                      >
                        {formatDate(selected.license_expiry_date)}
                      </p>
                    </div>
                  </div>
                  {isLicenseExpired && (
                    <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
                      <p className="text-xs font-semibold text-red-600">
                        ⚠ This Certificate has expired
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Compliance card — reused */}
              <ComplyCard school_id={selected.school_id} />
            </div>

            {/* Programmes */}
            {selected.programmes?.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 bg-gray-50">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-green-50 border border-green-100">
                    <GraduationCap className="w-4 h-4 text-green-600" />
                  </div>
                  <h3 className="text-sm font-bold text-gray-700 uppercase tracking-widest">
                    Programmes Offered
                  </h3>
                </div>
                <div className="px-5 py-4 flex flex-wrap gap-2">
                  {selected.programmes.map((p) => (
                    <span
                      key={p}
                      className="text-xs font-medium bg-green-50 text-green-700 border border-green-100 px-3 py-1.5 rounded-full"
                    >
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Approved Courses */}
            {selected.courses?.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 bg-gray-50">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 border border-blue-100">
                    <GraduationCap className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-700 uppercase tracking-widest">
                      Approved Courses
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {selected.courses.length} course
                      {selected.courses.length !== 1 ? "s" : ""} approved
                    </p>
                  </div>
                </div>
                <div className="px-5 py-4">
                  <ul className="space-y-2">
                    {selected.courses.map((course, i) => (
                      <li
                        key={i}
                        className="flex items-center gap-3 text-sm text-gray-700"
                      >
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-50 text-blue-600 text-[10px] font-bold shrink-0">
                          {i + 1}
                        </span>
                        {course}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
