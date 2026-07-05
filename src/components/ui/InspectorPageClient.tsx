"use client";

import { useState, useEffect, useRef } from "react";
import {
  Search,
  Building2,
  MapPin,
  Mail,
  BadgeCheck,
  GraduationCap,
  Loader2,
  X,
  Calendar,
  ChevronRight,
  Phone,
  FlaskConical,
  Users,
  UserCog,
  CheckCircle2,
  Send,
} from "lucide-react";
import ComplyCard from "@/components/ui/complyCard";

type Course = { name: string; accredited: boolean };

type SchoolDetail = {
  lab_status: string | null;
  library_status: string | null;
  academic_staff: { name: string; qualification: string }[];
  non_academic_staff: { name: string; role: string }[];
  board_members: string[];
};

type School = {
  school_id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  lga: string;
  state: string;
  ownership: string;
  property_type: string | null;
  license_number: string | null;
  license_status: string | null;
  license_expiry_date: string | null;
  last_license_renewal: string | null;
  approval_status: string;
  form_status: string;
  programmes: string[];
  courses: Course[];
  // Gombe fields
  category: string | null;
  vc_name: string | null;
  gsm_no: string | null;
  contact_person: string | null;
  total_students: number | null;
  graduated_count: number | null;
  enrollment_snapshot_date: string | null;
  academic_session: string | null;
  session_start: string | null;
  session_end: string | null;
};

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
          {label}
        </p>
        <p className="text-sm text-gray-700">{value || "—"}</p>
      </div>
    </div>
  );
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
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
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
        const res = await fetch(`/api/inspector/search?q=${encodeURIComponent(query)}`);
        if (!res.ok) throw new Error("Search failed");
        const data = await res.json();
        // normalise courses in case old rows are still plain strings
        const normalised = data.map((s: School) => ({
          ...s,
          courses: (s.courses ?? []).map((c) =>
            typeof c === "string" ? { name: c, accredited: true } : c,
          ),
        }));
        setResults(normalised);
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

  // ── Assessment bottom sheets ──────────────────────────────────────────────
  type Sheet = "facilities" | "academic_staff" | "non_academic_staff" | null;
  const [openSheet, setOpenSheet] = useState<Sheet>(null);

  // Facilities
  const [labRating, setLabRating]     = useState<"adequate" | "not_adequate" | "">("");
  const [labNote, setLabNote]         = useState("");
  const [libRating, setLibRating]     = useState<"adequate" | "not_adequate" | "">("");
  const [libNote, setLibNote]         = useState("");

  // Staff (shared type)
  type StaffRating = "full_complement" | "partial_presence" | "insufficient" | "";
  const [acadRating, setAcadRating]   = useState<StaffRating>("");
  const [acadNote, setAcadNote]       = useState("");
  const [nonAcadRating, setNonAcadRating] = useState<StaffRating>("");
  const [nonAcadNote, setNonAcadNote] = useState("");

  const [submitting, setSubmitting]   = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState<Sheet>(null);

  // Lazy-loaded reference data for the open sheet
  const [schoolDetail, setSchoolDetail]       = useState<SchoolDetail | null>(null);
  const [detailLoading, setDetailLoading]     = useState(false);
  const detailCacheRef = useRef<Record<string, SchoolDetail>>({});

  async function openSheetWithDetail(sheet: Sheet) {
    if (!selected || !sheet) return;
    setOpenSheet(sheet);
    setSubmitError("");

    // Return cached data immediately if already fetched for this school
    const cached = detailCacheRef.current[selected.school_id];
    if (cached) { setSchoolDetail(cached); return; }

    setDetailLoading(true);
    setSchoolDetail(null);
    try {
      const res = await fetch(
        `/api/inspector/schools/${encodeURIComponent(selected.school_id)}`,
      );
      if (res.ok) {
        const data: SchoolDetail = await res.json();
        detailCacheRef.current[selected.school_id] = data;
        setSchoolDetail(data);
      }
    } catch {
      // silently skip — rating can still proceed without reference data
    } finally {
      setDetailLoading(false);
    }
  }

  function closeSheet() {
    setOpenSheet(null);
    setSubmitError("");
  }

  async function handleAssessmentSubmit(sheet: Sheet) {
    if (!selected || !sheet) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      const body: Record<string, string> = {
        school_id: selected.school_id,
        school_name: selected.name,
      };
      if (sheet === "facilities") {
        if (!labRating && !libRating) {
          setSubmitError("Please rate at least one facility.");
          return;
        }
        if (labRating) { body.lab_workshop_rating = labRating; body.lab_workshop_note = labNote; }
        if (libRating) { body.library_rating = libRating; body.library_note = libNote; }
      } else if (sheet === "academic_staff") {
        if (!acadRating) { setSubmitError("Please select a rating."); return; }
        body.academic_staff_rating = acadRating;
        body.academic_staff_note   = acadNote;
      } else {
        if (!nonAcadRating) { setSubmitError("Please select a rating."); return; }
        body.non_academic_staff_rating = nonAcadRating;
        body.non_academic_staff_note   = nonAcadNote;
      }

      const res = await fetch("/api/inspector/assessments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json();
        setSubmitError(err.error || "Failed to save assessment.");
        return;
      }
      setSubmitSuccess(sheet);
      closeSheet();
      // reset fields
      if (sheet === "facilities")       { setLabRating(""); setLabNote(""); setLibRating(""); setLibNote(""); }
      if (sheet === "academic_staff")   { setAcadRating(""); setAcadNote(""); }
      if (sheet === "non_academic_staff") { setNonAcadRating(""); setNonAcadNote(""); }
    } catch {
      setSubmitError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const STAFF_LEVELS: { value: StaffRating; label: string; description: string; color: string }[] = [
    { value: "full_complement", label: "Full Complement", description: "All departments have visible staff presence", color: "green" },
    { value: "partial_presence", label: "Partial Presence", description: "Some departments staffed, notable gaps observed", color: "amber" },
    { value: "insufficient", label: "Insufficient", description: "Little to no staff presence observed", color: "red" },
  ];

  const isLicenseExpired =
    selected?.license_expiry_date &&
    new Date(selected.license_expiry_date) < new Date();

  const accreditedCount = selected?.courses.filter((c) => c.accredited).length ?? 0;
  const notAccreditedCount = (selected?.courses.length ?? 0) - accreditedCount;

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Field Inspector</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Search for any institution to view their certificate status,
            compliance score and course accreditation.
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
          {showDropdown && !selected && (
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
              compliance score and course accreditation.
            </p>
          </div>
        )}

        {/* Selected school detail */}
        {selected && (
          <div className="space-y-5">
            {/* Basic Info card */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="bg-[#1a5c2e] px-6 py-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
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
                {selected.category && (
                  <span className="shrink-0 text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full bg-white/10 text-green-100 border border-white/20">
                    {selected.category}
                  </span>
                )}
              </div>

              <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InfoRow icon={MapPin} label="Location" value={
                  <>
                    <span className="block">{selected.address || "—"}</span>
                    <span className="text-xs text-gray-400">{selected.lga}, {selected.state}</span>
                  </>
                } />
                <InfoRow icon={Building2} label="Ownership" value={selected.ownership} />
                <InfoRow icon={Building2} label="Site Type" value={selected.property_type} />
                <InfoRow icon={GraduationCap} label="VC / Rector / Provost" value={selected.vc_name} />
                <InfoRow icon={Phone} label="GSM Number" value={selected.gsm_no || selected.phone} />
                <InfoRow icon={Mail} label="Email" value={selected.email} />
                {selected.contact_person && (
                  <InfoRow icon={Building2} label="Contact Person" value={selected.contact_person} />
                )}
              </div>

              {/* Action buttons */}
              <div className="px-6 pb-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { sheet: "facilities" as Sheet, icon: FlaskConical, label: "Lab / Workshop & Library", color: "blue" },
                  { sheet: "academic_staff" as Sheet, icon: Users, label: "Academic Staff Disposition", color: "purple" },
                  { sheet: "non_academic_staff" as Sheet, icon: UserCog, label: "Non-Academic Staff Disposition", color: "indigo" },
                ].map(({ sheet, icon: Icon, label, color }) => (
                  <button
                    key={sheet}
                    onClick={() => openSheetWithDetail(sheet)}
                    className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm font-semibold transition-all
                      ${submitSuccess === sheet
                        ? "bg-green-50 border-green-200 text-green-700"
                        : color === "blue"
                          ? "bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                          : color === "purple"
                            ? "bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100"
                            : "bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100"
                      }`}
                  >
                    {submitSuccess === sheet
                      ? <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                      : <Icon className="w-4 h-4 shrink-0" />
                    }
                    <span className="text-left leading-tight">{submitSuccess === sheet ? "Submitted ✓" : label}</span>
                  </button>
                ))}
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
                    <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold">Status</p>
                    <LicenseStatusBadge status={selected.license_status} />
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold">Certificate No.</p>
                    <p className="text-sm font-bold text-gray-800 font-mono">
                      {selected.license_number || "—"}
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold">Last Renewal</p>
                    <p className="text-sm text-gray-700">{formatDate(selected.last_license_renewal)}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold">Expiry Date</p>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-gray-400" />
                      <p className={`text-sm font-semibold ${isLicenseExpired ? "text-red-600" : "text-gray-700"}`}>
                        {formatDate(selected.license_expiry_date)}
                      </p>
                    </div>
                  </div>
                  {isLicenseExpired && (
                    <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
                      <p className="text-xs font-semibold text-red-600">
                        ⚠ This certificate has expired
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Compliance card */}
              <ComplyCard school_id={selected.school_id} />
            </div>

            {/* Academic Snapshot */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 bg-gray-50">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-purple-50 border border-purple-100">
                  <GraduationCap className="w-4 h-4 text-purple-600" />
                </div>
                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-widest">
                  Academic Snapshot
                </h3>
              </div>

              {/* Stat boxes */}
              <div className="grid grid-cols-3 divide-x divide-gray-100 border-b border-gray-100">
                {[
                  {
                    label: "Students Enrolled",
                    value: selected.total_students != null
                      ? selected.total_students.toLocaleString()
                      : "—",
                  },
                  {
                    label: "Graduates (to date)",
                    value: selected.graduated_count != null
                      ? selected.graduated_count.toLocaleString()
                      : "—",
                  },
                  {
                    label: "Enrolment Date",
                    value: formatDate(selected.enrollment_snapshot_date),
                  },
                ].map((s) => (
                  <div key={s.label} className="px-5 py-4 text-center">
                    <p className="text-xl font-black text-gray-900">{s.value}</p>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mt-1">
                      {s.label}
                    </p>
                  </div>
                ))}
              </div>

              {/* Academic Calendar */}
              <div className="px-5 py-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">
                    Academic Session
                  </p>
                  <p className="text-sm font-semibold text-gray-800">
                    {selected.academic_session || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">
                    Session Start
                  </p>
                  <p className="text-sm font-semibold text-gray-800">
                    {formatDate(selected.session_start)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">
                    Session End
                  </p>
                  <p className="text-sm font-semibold text-gray-800">
                    {formatDate(selected.session_end)}
                  </p>
                </div>
              </div>
            </div>

            {/* Programmes */}
            {selected.programmes?.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 bg-gray-50">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-green-50 border border-green-100">
                    <GraduationCap className="w-4 h-4 text-green-600" />
                  </div>
                  <h3 className="text-sm font-bold text-gray-700 uppercase tracking-widests">
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

            {/* Courses */}
            {selected.courses?.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 border border-blue-100">
                      <GraduationCap className="w-4 h-4 text-blue-600" />
                    </div>
                    <h3 className="text-sm font-bold text-gray-700 uppercase tracking-widest">
                      Courses
                    </h3>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-semibold text-gray-400">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
                      Accredited: {accreditedCount}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />
                      Not Accredited: {notAccreditedCount}
                    </span>
                  </div>
                </div>
                <div className="px-5 py-4 flex flex-wrap gap-2">
                  {selected.courses.map((course) => (
                    <span
                      key={course.name}
                      className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-full border ${
                        course.accredited
                          ? "bg-green-50 border-green-200 text-green-800"
                          : "bg-red-50 border-red-200 text-red-800"
                      }`}
                    >
                      {course.name}
                      <span className={`px-1 py-0.5 rounded-full text-[10px] font-bold ${
                        course.accredited
                          ? "bg-green-200 text-green-800"
                          : "bg-red-200 text-red-800"
                      }`}>
                        {course.accredited ? "Accredited" : "Not Accredited"}
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Bottom Sheet Overlay ─────────────────────────────────────────── */}
      {openSheet && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={closeSheet}
          />

          {/* Panel */}
          <div className="relative bg-white rounded-t-3xl shadow-2xl max-h-[90vh] flex flex-col">
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-10 h-1 rounded-full bg-gray-300" />
            </div>

            {/* Sheet header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
              <h2 className="text-base font-bold text-gray-900">
                {openSheet === "facilities" && "Facilities Assessment"}
                {openSheet === "academic_staff" && "Academic Staff Disposition"}
                {openSheet === "non_academic_staff" && "Non-Academic Staff Disposition"}
              </h2>
              <button onClick={closeSheet} className="p-1.5 rounded-lg hover:bg-gray-100 transition">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* School name badge */}
            <div className="px-6 py-3 bg-gray-50 border-b border-gray-100 shrink-0">
              <p className="text-xs text-gray-500">
                Rating for: <span className="font-semibold text-gray-800">{selected?.name}</span>
              </p>
            </div>

            {/* Scrollable content */}
            <div className="overflow-y-auto flex-1 px-6 py-5 space-y-6">

              {/* Reference data loading */}
              {detailLoading && (
                <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-xl border border-gray-100">
                  <Loader2 className="w-4 h-4 animate-spin text-gray-400 shrink-0" />
                  <p className="text-xs text-gray-400">Loading school records…</p>
                </div>
              )}

              {/* ── FACILITIES SHEET ── */}
              {openSheet === "facilities" && (
                <>
                  {/* Self-reported facility status */}
                  {schoolDetail && (
                    <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-blue-500 mb-2">
                        School self-reported
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { label: "Lab / Workshop", value: schoolDetail.lab_status },
                          { label: "Library", value: schoolDetail.library_status },
                        ].map((f) => (
                          <div key={f.label}>
                            <p className="text-[10px] text-blue-400 font-semibold mb-0.5">{f.label}</p>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                              f.value === "Available"
                                ? "bg-green-100 text-green-700"
                                : f.value
                                  ? "bg-red-100 text-red-700"
                                  : "bg-gray-100 text-gray-400"
                            }`}>
                              {f.value || "Not set"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {(["lab", "lib"] as const).map((key) => {
                    const isLab = key === "lab";
                    const rating = isLab ? labRating : libRating;
                    const setRating = isLab ? setLabRating : setLibRating;
                    const note = isLab ? labNote : libNote;
                    const setNote = isLab ? setLabNote : setLibNote;
                    return (
                      <div key={key}>
                        <p className="text-sm font-bold text-gray-700 mb-3">
                          {isLab ? "Laboratory / Workshop" : "Library"}
                        </p>
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          {(["adequate", "not_adequate"] as const).map((v) => (
                            <button
                              key={v}
                              type="button"
                              onClick={() => setRating(v)}
                              className={`py-3 rounded-xl text-sm font-semibold border-2 transition-all ${
                                rating === v
                                  ? v === "adequate"
                                    ? "bg-green-600 border-green-600 text-white"
                                    : "bg-red-600 border-red-600 text-white"
                                  : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                              }`}
                            >
                              {v === "adequate" ? "Adequate" : "Not Adequate"}
                            </button>
                          ))}
                        </div>
                        <textarea
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                          placeholder="Optional observation note..."
                          rows={2}
                          className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                        />
                      </div>
                    );
                  })}
                </>
              )}

              {/* ── STAFF SHEETS ── */}
              {(openSheet === "academic_staff" || openSheet === "non_academic_staff") && (() => {
                const isAcad = openSheet === "academic_staff";
                const rating = isAcad ? acadRating : nonAcadRating;
                const setRating = isAcad ? setAcadRating : setNonAcadRating;
                const note = isAcad ? acadNote : nonAcadNote;
                const setNote = isAcad ? setAcadNote : setNonAcadNote;
                const staffList = schoolDetail
                  ? isAcad
                    ? schoolDetail.academic_staff
                    : schoolDetail.non_academic_staff
                  : null;
                return (
                  <>
                    {/* Staff reference list */}
                    {staffList && staffList.length > 0 && (
                      <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-blue-500">
                            {isAcad ? "Academic" : "Non-Academic"} staff on record
                          </p>
                          <span className="text-[10px] font-bold bg-blue-200 text-blue-700 px-2 py-0.5 rounded-full">
                            {staffList.length} staff
                          </span>
                        </div>
                        <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                          {staffList.map((s, i) => (
                            <div key={i} className="flex items-start justify-between gap-2">
                              <span className="text-xs text-blue-900 font-medium leading-tight">{s.name}</span>
                              <span className="text-[10px] text-blue-500 shrink-0 text-right">
                                {"qualification" in s ? s.qualification : (s as { name: string; role: string }).role}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {staffList && staffList.length === 0 && (
                      <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-xs text-amber-700">
                        No {isAcad ? "academic" : "non-academic"} staff recorded by school.
                      </div>
                    )}

                    <div className="space-y-3">
                      {STAFF_LEVELS.map((level) => (
                        <button
                          key={level.value}
                          type="button"
                          onClick={() => setRating(level.value)}
                          className={`w-full flex items-start gap-3 px-4 py-4 rounded-xl border-2 text-left transition-all ${
                            rating === level.value
                              ? level.color === "green"
                                ? "bg-green-50 border-green-500"
                                : level.color === "amber"
                                  ? "bg-amber-50 border-amber-500"
                                  : "bg-red-50 border-red-500"
                              : "bg-white border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <div className={`w-4 h-4 rounded-full mt-0.5 shrink-0 border-2 flex items-center justify-center ${
                            rating === level.value
                              ? level.color === "green"
                                ? "border-green-500 bg-green-500"
                                : level.color === "amber"
                                  ? "border-amber-500 bg-amber-500"
                                  : "border-red-500 bg-red-500"
                              : "border-gray-300"
                          }`}>
                            {rating === level.value && (
                              <div className="w-2 h-2 rounded-full bg-white" />
                            )}
                          </div>
                          <div>
                            <p className={`text-sm font-bold ${
                              rating === level.value
                                ? level.color === "green" ? "text-green-800"
                                : level.color === "amber" ? "text-amber-800"
                                : "text-red-800"
                                : "text-gray-700"
                            }`}>{level.label}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{level.description}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Optional observation note..."
                      rows={3}
                      className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                    />
                  </>
                );
              })()}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-100 shrink-0 space-y-2">
              {submitError && (
                <p className="text-xs text-red-500 font-medium">{submitError}</p>
              )}
              <button
                onClick={() => handleAssessmentSubmit(openSheet)}
                disabled={submitting}
                className="w-full py-3.5 bg-[#1a5c2e] text-white text-sm font-bold rounded-xl hover:bg-[#154a26] disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
              >
                {submitting
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                  : <><Send className="w-4 h-4" /> Submit Assessment</>
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
