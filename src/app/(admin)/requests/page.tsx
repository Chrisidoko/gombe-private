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
  Clock,
  ExternalLink,
  File,
} from "lucide-react";
import { formatDate } from "@/lib/formatDate";

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
  phone: string;
  tin: string;
  license_number: string;
  license_status: string;
  last_license_renewal: string;
  license_expiry_date: string;
}

interface SchoolDocument {
  id: number;
  school_id: string;
  document_type: string;
  file_url: string;
}

export default function Requests() {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [schoolDetails, setSchoolDetails] = useState<SchoolDetails | null>(
    null
  );
  const [documents, setDocuments] = useState<SchoolDocument[]>([]);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [aloading, aSetLoading] = useState<{
    id: number | null;
    action: string | null;
  }>({
    id: null,
    action: null,
  });

  useEffect(() => {
    async function fetchSchools() {
      try {
        const res = await fetch("/api/schools/unapproved");
        const data = await res.json();
        setSchools(data.schools || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchSchools();
  }, []);

  useEffect(() => {
    async function fetchSchoolDetails() {
      if (!selectedSchool) return;

      setDetailsLoading(true);
      setDocumentsLoading(true);

      try {
        // Fetch school details
        const detailsRes = await fetch(
          `/api/schools/${selectedSchool.school_id}`
        );
        if (detailsRes.ok) {
          const data = await detailsRes.json();
          setSchoolDetails(data);
        }
      } catch (err) {
        console.error("Error fetching details:", err);
      } finally {
        setDetailsLoading(false);
      }

      try {
        // Fetch documents
        const docsRes = await fetch(
          `/api/schools/${selectedSchool.school_id}/documents`
        );
        if (docsRes.ok) {
          const data = await docsRes.json();
          setDocuments(data.documents || []);
        }
      } catch (err) {
        console.error("Error fetching documents:", err);
      } finally {
        setDocumentsLoading(false);
      }
    }

    fetchSchoolDetails();
  }, [selectedSchool]);

  async function handleAction(
    request_id: number,
    school_id: string,
    action: "approve" | "reject",
    reason?: string
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

  const handleCloseModal = () => {
    setSelectedSchool(null);
    setSchoolDetails(null);
    setDocuments([]);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-12">
        <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
        <p className="text-gray-600">Loading schools...</p>
      </div>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          School Onboarding & Registrations
        </h1>
        <p className="text-gray-600">
          Review and approve institution registration requests
        </p>
      </div>

      {schools.length === 0 ? (
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
                    <p className="text-sm text-gray-500">{school.school_id}</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="w-4 h-4" />
                  <span className="truncate">{school.email || "No email"}</span>
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

      {/* Detail Modal */}
      {selectedSchool && (
        <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center p-4 z-50">
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
                            <label className="text-sm font-medium text-gray-500 block mb-1">
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
                            <label className="text-sm font-medium text-gray-500 block mb-1">
                              Phone Number
                            </label>
                            <p className="text-gray-900">
                              {schoolDetails.phone || "Not provided"}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-start gap-2">
                          <Building2 className="w-4 h-4 text-gray-500 mt-1" />
                          <div className="flex-1">
                            <label className="text-sm font-medium text-gray-500 block mb-1">
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
                            <label className="text-sm font-medium text-gray-500 block mb-1">
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

                  {/* Location Information */}
                  <div className="mb-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">
                      Location Information
                    </h4>
                    <div className="space-y-4">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-start gap-2">
                          <MapPin className="w-4 h-4 text-gray-500 mt-1" />
                          <div className="flex-1">
                            <label className="text-sm font-medium text-gray-500 block mb-1">
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
                          <label className="text-sm font-medium text-gray-500 block mb-1">
                            State
                          </label>
                          <p className="text-gray-900">
                            {schoolDetails.state || "Not specified"}
                          </p>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-4">
                          <label className="text-sm font-medium text-gray-500 block mb-1">
                            Local Government Area (LGA)
                          </label>
                          <p className="text-gray-900">
                            {schoolDetails.lga || "Not specified"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* License Information */}
                  <div className="mb-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">
                      License Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-start gap-2">
                          <FileText className="w-4 h-4 text-gray-500 mt-1" />
                          <div className="flex-1">
                            <label className="text-sm font-medium text-gray-500 block mb-1">
                              License Number
                            </label>
                            <p className="text-gray-900">
                              {schoolDetails.license_number}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-start gap-2">
                          <Shield className="w-4 h-4 text-gray-500 mt-1" />
                          <div className="flex-1">
                            <label className="text-sm font-medium text-gray-500 block mb-1">
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
                          <Clock className="w-4 h-4 text-gray-500 mt-1" />
                          <div className="flex-1">
                            <label className="text-sm font-medium text-gray-500 block mb-1">
                              Last License Renewal
                            </label>
                            <p className="text-gray-900">
                              {schoolDetails.last_license_renewal
                                ? new Date(
                                    schoolDetails.last_license_renewal
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

                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-start gap-2">
                          <Calendar className="w-4 h-4 text-gray-500 mt-1" />
                          <div className="flex-1">
                            <label className="text-sm font-medium text-gray-500 block mb-1">
                              License Expiry Date
                            </label>
                            <p className="text-gray-900">
                              {schoolDetails.license_expiry_date
                                ? new Date(
                                    schoolDetails.license_expiry_date
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

                  {/* Documents Section */}
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
                      <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
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

                  {/* Action Buttons */}
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
                          "approve"
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
                          reason
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
    </main>
  );
}
