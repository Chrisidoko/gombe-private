"use client";

import { useEffect, useState } from "react";
import {
  PackageOpen,
  Loader2,
  ChevronRight,
  Building2,
  Mail,
  Calendar,
  FileText,
  X,
  MapPin,
  Phone,
  Hash,
  Shield,
  ExternalLink,
  File,
  BookOpen,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { formatDate } from "@/lib/formatDate";

// ─── School registration types ────────────────────────────────────────────────

interface School {
  id: number;
  school_id: string;
  name: string;
  email: string;
  license_number: string;
  created_at: string;
}

interface SchoolDetails {
  id: number;
  name: string;
  school_id: string;
  state: string;
  ownership: string;
  lga: string;
  address: string;
  email: string;
  contact_person_phone: string;
  tin: string;
  website: string;
  license_number: string;
  license_status: string;
  last_license_renewal: string;
  license_expiry_date: string;
  courses: string[];
}

interface SchoolDocument {
  id: number;
  school_id: string;
  document_type: string;
  file_url: string;
}

// ─── Academic change-request types ───────────────────────────────────────────

interface AcademicSnapshot {
  mode_of_operation: string[];
  avg_fee: string;
  total_revenue: string;
  academic_session: string;
  session_start: string;
  session_end: string;
  programmes: string[];
  courses: string[];
}

interface AcademicRequest {
  id: number;
  school_id: string;
  school_name: string;
  school_email: string;
  status: string;
  current_snapshot: AcademicSnapshot;
  requested_changes: AcademicSnapshot;
  rejection_reason: string | null;
  created_at: string;
}

// ─── Diff helpers ─────────────────────────────────────────────────────────────

function ArrayDiff({
  label,
  current,
  proposed,
}: {
  label: string;
  current: string[];
  proposed: string[];
}) {
  const added = proposed.filter((v) => !current.includes(v));
  const removed = current.filter((v) => !proposed.includes(v));
  const unchanged = current.filter((v) => proposed.includes(v));

  if (added.length === 0 && removed.length === 0) return null;

  return (
    <div className="mb-4">
      <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
        {label}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {unchanged.map((v) => (
          <span
            key={v}
            className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600"
          >
            {v}
          </span>
        ))}
        {removed.map((v) => (
          <span
            key={v}
            className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 line-through"
          >
            {v}
          </span>
        ))}
        {added.map((v) => (
          <span
            key={v}
            className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700"
          >
            + {v}
          </span>
        ))}
      </div>
    </div>
  );
}

function ScalarDiff({
  label,
  current,
  proposed,
}: {
  label: string;
  current: string;
  proposed: string;
}) {
  if (!current && !proposed) return null;
  if (current === proposed) return null;

  return (
    <div className="mb-3">
      <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
        {label}
      </p>
      <div className="flex items-center gap-2 text-sm">
        <span className="line-through text-red-600">
          {current || "—"}
        </span>
        <span className="text-gray-400">→</span>
        <span className="text-green-700 font-medium">{proposed || "—"}</span>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function Requests() {
  const [activeTab, setActiveTab] = useState<"registrations" | "academic">(
    "registrations",
  );

  // ── School registrations state
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [schoolDetails, setSchoolDetails] = useState<SchoolDetails | null>(
    null,
  );
  const [documents, setDocuments] = useState<SchoolDocument[]>([]);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [aloading, aSetLoading] = useState<{
    id: number | null;
    action: string | null;
  }>({ id: null, action: null });

  // ── Academic requests state
  const [academicRequests, setAcademicRequests] = useState<AcademicRequest[]>(
    [],
  );
  const [academicLoading, setAcademicLoading] = useState(true);
  const [selectedAcademic, setSelectedAcademic] =
    useState<AcademicRequest | null>(null);
  const [academicActionLoading, setAcademicActionLoading] = useState<{
    id: number | null;
    action: string | null;
  }>({ id: null, action: null });

  // ── Fetch school registrations
  useEffect(() => {
    fetch("/api/schools/unapproved")
      .then((r) => r.json())
      .then((data) => setSchools(data.schools || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // ── Fetch academic change requests
  useEffect(() => {
    fetch("/api/admin/academic-change-requests")
      .then((r) => r.json())
      .then((data) => setAcademicRequests(data.requests || []))
      .catch(console.error)
      .finally(() => setAcademicLoading(false));
  }, []);

  // ── Fetch school details when one is selected
  useEffect(() => {
    if (!selectedSchool) return;
    setDetailsLoading(true);
    setDocumentsLoading(true);

    fetch(`/api/schools/${selectedSchool.school_id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => data && setSchoolDetails(data))
      .catch(console.error)
      .finally(() => setDetailsLoading(false));

    fetch(`/api/schools/${selectedSchool.school_id}/documents`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => data && setDocuments(data.documents || []))
      .catch(console.error)
      .finally(() => setDocumentsLoading(false));
  }, [selectedSchool]);

  // ── School registration actions
  async function handleAction(
    request_id: number,
    school_id: string,
    action: "approve" | "reject",
    reason?: string,
  ) {
    aSetLoading({ id: request_id, action });
    try {
      const endpoint =
        action === "approve" ? "/api/schools/approve" : "/api/schools/reject";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ school_id, reason }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      setSchools((prev) => prev.filter((s) => s.school_id !== school_id));
      setSelectedSchool(null);
      setSchoolDetails(null);
    } catch (error) {
      console.error(error);
    } finally {
      aSetLoading({ id: null, action: null });
    }
  }

  // ── Academic change request actions
  async function handleAcademicAction(
    id: number,
    action: "approve" | "reject",
    reason?: string,
  ) {
    setAcademicActionLoading({ id, action });
    try {
      const endpoint = `/api/admin/academic-change-requests/${id}/${action}`;
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      setAcademicRequests((prev) => prev.filter((r) => r.id !== id));
      setSelectedAcademic(null);
    } catch (error) {
      console.error(error);
    } finally {
      setAcademicActionLoading({ id: null, action: null });
    }
  }

  const handleCloseModal = () => {
    setSelectedSchool(null);
    setSchoolDetails(null);
    setDocuments([]);
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <main className="max-w-7xl mx-auto px-4 py-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Pending Requests
        </h1>
        <p className="text-gray-500 text-sm">
          Review and act on institution registration and academic change
          requests.
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab("registrations")}
          className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors flex items-center gap-2 ${
            activeTab === "registrations"
              ? "bg-white border border-b-white border-gray-200 -mb-px text-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <Building2 className="w-4 h-4" />
          New Registrations
          {schools.length > 0 && (
            <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-1.5 py-0.5 rounded-full">
              {schools.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("academic")}
          className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors flex items-center gap-2 ${
            activeTab === "academic"
              ? "bg-white border border-b-white border-gray-200 -mb-px text-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Academic Changes
          {academicRequests.length > 0 && (
            <span className="bg-amber-100 text-amber-700 text-xs font-semibold px-1.5 py-0.5 rounded-full">
              {academicRequests.length}
            </span>
          )}
        </button>
      </div>

      {/* ── Tab: New School Registrations ── */}
      {activeTab === "registrations" && (
        <>
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-12">
              <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
              <p className="text-gray-600">Loading schools...</p>
            </div>
          ) : schools.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 py-16 text-gray-500">
              <PackageOpen className="w-16 h-16" />
              <p className="text-lg font-medium">No pending approvals</p>
              <p className="text-sm">
                All school registrations have been processed
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {schools.map((school) => (
                <div
                  key={school.id}
                  onClick={() => setSelectedSchool(school)}
                  className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-all cursor-pointer hover:border-blue-300"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-100 p-2 rounded-lg">
                        <Building2 className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 line-clamp-1">
                          {school.name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {school.school_id}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="w-4 h-4" />
                      <span className="truncate">
                        {school.email || "No email"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <FileText className="w-4 h-4 text-gray-600" />
                      {school.license_number ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                          Existing School
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          New School
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>Submission Date : </span>
                      <span>{formatDate(school.created_at)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Tab: Academic Change Requests ── */}
      {activeTab === "academic" && (
        <>
          {academicLoading ? (
            <div className="flex items-center justify-center gap-2 py-12">
              <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
              <p className="text-gray-600">Loading requests...</p>
            </div>
          ) : academicRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 py-16 text-gray-500">
              <PackageOpen className="w-16 h-16" />
              <p className="text-lg font-medium">No pending academic changes</p>
              <p className="text-sm">
                No approved schools have submitted academic update requests
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {academicRequests.map((req) => (
                <div
                  key={req.id}
                  onClick={() => setSelectedAcademic(req)}
                  className="bg-white border border-amber-200 rounded-lg p-6 hover:shadow-lg transition-all cursor-pointer hover:border-amber-400"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-amber-100 p-2 rounded-lg">
                        <BookOpen className="w-6 h-6 text-amber-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 line-clamp-1">
                          {req.school_name}
                        </h3>
                        <p className="text-sm text-gray-500">{req.school_id}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="w-4 h-4" />
                      <span className="truncate">{req.school_email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>Submitted: {formatDate(req.created_at)}</span>
                    </div>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                      Academic Update Request
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ─── School Registration Detail Modal ─────────────────────────────── */}
      {selectedSchool && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                School Details
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              {detailsLoading ? (
                <div className="flex items-center justify-center py-12 gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                  <p className="text-gray-600">Loading school details...</p>
                </div>
              ) : schoolDetails ? (
                <>
                  <div className="mb-6">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="bg-blue-100 p-3 rounded-xl">
                        <Building2 className="w-8 h-8 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">
                          {schoolDetails.name}
                        </h3>
                        <p className="text-gray-500">
                          {schoolDetails.school_id}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Basic Information */}
                  <div className="mb-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">
                      Basic Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-start gap-2">
                          <Mail className="w-4 h-4 text-gray-500 mt-1" />
                          <div className="flex-1">
                            <label className="text-xs font-medium text-gray-500 block mb-1">
                              Email Address
                            </label>
                            <p className="text-gray-900">
                              {schoolDetails.email || "Not provided"}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-start gap-2">
                          <Phone className="w-4 h-4 text-gray-500 mt-1" />
                          <div className="flex-1">
                            <label className="text-xs font-medium text-gray-500 block mb-1">
                              Contact Person Phone
                            </label>
                            <p className="text-gray-900">
                              {schoolDetails.contact_person_phone ||
                                "Not provided"}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-start gap-2">
                          <Building2 className="w-4 h-4 text-gray-500 mt-1" />
                          <div className="flex-1">
                            <label className="text-xs font-medium text-gray-500 block mb-1">
                              Ownership Type
                            </label>
                            <p className="text-gray-900">
                              {schoolDetails.ownership || "Not specified"}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-start gap-2">
                          <Hash className="w-4 h-4 text-gray-500 mt-1" />
                          <div className="flex-1">
                            <label className="text-xs font-medium text-gray-500 block mb-1">
                              Tax Identification Number (TIN)
                            </label>
                            <p className="text-gray-900">
                              {schoolDetails.tin || "Not provided"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Location */}
                  <div className="mb-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">
                      Location Information
                    </h4>
                    <div className="space-y-4">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-start gap-2">
                          <MapPin className="w-4 h-4 text-gray-500 mt-1" />
                          <div className="flex-1">
                            <label className="text-xs font-medium text-gray-500 block mb-1">
                              Address
                            </label>
                            <p className="text-gray-900">
                              {schoolDetails.address || "Not provided"}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-gray-50 rounded-lg p-4">
                          <label className="text-xs font-medium text-gray-500 block mb-1">
                            Website
                          </label>
                          <p className="text-gray-900">
                            {schoolDetails.website || "Not specified"}
                          </p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <label className="text-xs font-medium text-gray-500 block mb-1">
                            Local Government Area (LGA)
                          </label>
                          <p className="text-gray-900">
                            {schoolDetails.lga || "Not specified"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Courses */}
                  <div className="mb-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">
                      Courses Offered
                    </h4>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-start gap-2">
                        <Building2 className="w-4 h-4 text-gray-500 mt-1" />
                        <div className="flex-1">
                          <label className="text-xs font-medium text-gray-500 block mb-1">
                            Course list
                          </label>
                          <ul className="text-gray-900">
                            {schoolDetails.courses &&
                            schoolDetails.courses.length > 0
                              ? schoolDetails.courses.map((course, index) => (
                                  <li key={index}>{course}</li>
                                ))
                              : "Not provided"}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* License */}
                  <div className="mb-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">
                      License Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-start gap-2">
                          <FileText className="w-4 h-4 text-gray-500 mt-1" />
                          <div className="flex-1">
                            <label className="text-xs font-medium text-gray-500 block mb-1">
                              License Number
                            </label>
                            <p className="text-gray-900">
                              {schoolDetails.license_number || "Not available"}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-start gap-2">
                          <Shield className="w-4 h-4 text-gray-500 mt-1" />
                          <div className="flex-1">
                            <label className="text-xs font-medium text-gray-500 block mb-1">
                              License Status
                            </label>
                            <p className="text-gray-900">
                              {schoolDetails.license_status || "Not specified"}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-start gap-2">
                          <Calendar className="w-4 h-4 text-gray-500 mt-1" />
                          <div className="flex-1">
                            <label className="text-xs font-medium text-gray-500 block mb-1">
                              License Expiry Date
                            </label>
                            <p className="text-gray-900">
                              {schoolDetails.license_expiry_date
                                ? new Date(
                                    schoolDetails.license_expiry_date,
                                  ).toLocaleDateString("en-US", {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                  })
                                : "Not available"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Documents */}
                  <div className="mb-8">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">
                      Uploaded Documents
                    </h4>
                    {documentsLoading ? (
                      <div className="flex items-center justify-center py-8 gap-2 bg-gray-50 rounded-lg">
                        <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                        <p className="text-gray-600">Loading documents...</p>
                      </div>
                    ) : documents.length > 0 ? (
                      <div className="grid grid-cols-1 gap-4">
                        {documents.map((doc) => (
                          <div
                            key={doc.id}
                            className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:bg-gray-100 transition-colors"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-start gap-3 flex-1">
                                <div className="bg-blue-100 p-2 rounded-lg">
                                  <File className="w-5 h-5 text-blue-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-gray-900 mb-1">
                                    {doc.document_type}
                                  </p>
                                  <p className="text-xs text-gray-500 truncate">
                                    {doc.file_url.split("/").pop()}
                                  </p>
                                </div>
                              </div>
                              <a
                                href={doc.file_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-medium whitespace-nowrap"
                              >
                                View
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-gray-50 rounded-lg p-8 text-center text-gray-500">
                        <File className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>No documents uploaded</p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <button
                      disabled={
                        aloading.id === selectedSchool.id &&
                        aloading.action === "approve"
                      }
                      onClick={() =>
                        handleAction(
                          selectedSchool.id,
                          selectedSchool.school_id,
                          "approve",
                        )
                      }
                      className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {aloading.id === selectedSchool.id &&
                      aloading.action === "approve" ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>Approving...</span>
                        </>
                      ) : (
                        "Approve School"
                      )}
                    </button>

                    <button
                      disabled={
                        aloading.id === selectedSchool.id &&
                        aloading.action === "reject"
                      }
                      onClick={() => {
                        const reason =
                          prompt("Enter reason for rejection (optional):") ||
                          "";
                        handleAction(
                          selectedSchool.id,
                          selectedSchool.school_id,
                          "reject",
                          reason,
                        );
                      }}
                      className="flex-1 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {aloading.id === selectedSchool.id &&
                      aloading.action === "reject" ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>Rejecting...</span>
                        </>
                      ) : (
                        "Reject School"
                      )}
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <p>Unable to load school details</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── Academic Change Request Detail Modal ─────────────────────────── */}
      {selectedAcademic && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Academic Update Request
                </h2>
                <p className="text-sm text-gray-500">
                  {selectedAcademic.school_name}
                </p>
              </div>
              <button
                onClick={() => setSelectedAcademic(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              <div className="flex items-center gap-2 mb-5 text-sm text-gray-500">
                <Mail className="w-4 h-4" />
                <span>{selectedAcademic.school_email}</span>
                <span className="mx-2">·</span>
                <Calendar className="w-4 h-4" />
                <span>Submitted {formatDate(selectedAcademic.created_at)}</span>
              </div>

              {/* Diff section */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">
                  Proposed Changes
                </h3>
                <p className="text-xs text-gray-500 mb-3">
                  <span className="inline-block w-3 h-3 rounded-full bg-green-200 mr-1" />
                  Added &nbsp;
                  <span className="inline-block w-3 h-3 rounded-full bg-red-200 mr-1 ml-2" />
                  Removed &nbsp;
                  <span className="inline-block w-3 h-3 rounded-full bg-gray-200 mr-1 ml-2" />
                  Unchanged
                </p>

                <ArrayDiff
                  label="Courses"
                  current={selectedAcademic.current_snapshot.courses ?? []}
                  proposed={selectedAcademic.requested_changes.courses ?? []}
                />
                <ArrayDiff
                  label="Programmes"
                  current={selectedAcademic.current_snapshot.programmes ?? []}
                  proposed={
                    selectedAcademic.requested_changes.programmes ?? []
                  }
                />
                <ArrayDiff
                  label="Mode of Operation"
                  current={
                    selectedAcademic.current_snapshot.mode_of_operation ?? []
                  }
                  proposed={
                    selectedAcademic.requested_changes.mode_of_operation ?? []
                  }
                />
                <ScalarDiff
                  label="Academic Session"
                  current={
                    selectedAcademic.current_snapshot.academic_session ?? ""
                  }
                  proposed={
                    selectedAcademic.requested_changes.academic_session ?? ""
                  }
                />
                <ScalarDiff
                  label="Session Start"
                  current={selectedAcademic.current_snapshot.session_start ?? ""}
                  proposed={
                    selectedAcademic.requested_changes.session_start ?? ""
                  }
                />
                <ScalarDiff
                  label="Session End"
                  current={selectedAcademic.current_snapshot.session_end ?? ""}
                  proposed={
                    selectedAcademic.requested_changes.session_end ?? ""
                  }
                />
                <ScalarDiff
                  label="Average Fee (₦)"
                  current={selectedAcademic.current_snapshot.avg_fee ?? ""}
                  proposed={selectedAcademic.requested_changes.avg_fee ?? ""}
                />
                <ScalarDiff
                  label="Last Year Revenue (₦)"
                  current={
                    selectedAcademic.current_snapshot.total_revenue ?? ""
                  }
                  proposed={
                    selectedAcademic.requested_changes.total_revenue ?? ""
                  }
                />
              </div>

              {/* Action buttons */}
              <div className="flex gap-3">
                <button
                  disabled={
                    academicActionLoading.id === selectedAcademic.id &&
                    academicActionLoading.action === "approve"
                  }
                  onClick={() =>
                    handleAcademicAction(selectedAcademic.id, "approve")
                  }
                  className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {academicActionLoading.id === selectedAcademic.id &&
                  academicActionLoading.action === "approve" ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Approving...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Approve Changes
                    </>
                  )}
                </button>

                <button
                  disabled={
                    academicActionLoading.id === selectedAcademic.id &&
                    academicActionLoading.action === "reject"
                  }
                  onClick={() => {
                    const reason =
                      prompt("Enter reason for rejection (optional):") || "";
                    handleAcademicAction(selectedAcademic.id, "reject", reason);
                  }}
                  className="flex-1 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {academicActionLoading.id === selectedAcademic.id &&
                  academicActionLoading.action === "reject" ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Rejecting...</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-5 h-5" />
                      Reject Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
