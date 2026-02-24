"use client";

import { useState } from "react"; // Add this line!
import {
  Building,
  Users,
  FileText,
  Calendar,
  Edit,
  CheckCircle,
  Award,
} from "lucide-react";
import { School } from "@/lib/types";

function formatDate(dateString: string | null) {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatCurrency(amount: string | number | null) {
  if (!amount) return "₦0";
  return `₦${Number(amount).toLocaleString()}`;
}

export default function SchoolProfileView({
  schoolData,
  onEdit,
}: {
  schoolData: School;
  onEdit?: () => void;
}) {
  const [activeTab, setActiveTab] = useState<
    "overview" | "academic" | "license"
  >("overview");

  // Map database fields to component fields
  const data = {
    proprietorName: schoolData?.proprietor_name || "Not provided",
    contactPerson: schoolData?.contact_person || "Not provided",
    contactPersonDesignation:
      schoolData?.contact_person_designation || "Not provided",
    contactPersonPhone: schoolData?.contact_person_phone || "N/A",
    ownershipType: schoolData?.ownership || "Not specified",
    category: schoolData?.category || "Not specified",
    website: schoolData?.website || "N/A",
    tin: schoolData?.tin || "N/A",
    lastTaxFiling: schoolData?.last_tax_filing || null,
    modeOfOperation: Array.isArray(schoolData?.mode_of_operation)
      ? schoolData.mode_of_operation
      : [],
    avgFee: schoolData?.avg_fee || "0",
    totalRevenue: schoolData?.total_revenue || "0",
    academicSession: schoolData?.academic_session || "Not specified",

    sessionStart: schoolData?.session_start || null,
    sessionEnd: schoolData?.session_end || null,
    programmes: Array.isArray(schoolData?.programmes)
      ? schoolData.programmes
      : [],
    courses: Array.isArray(schoolData?.courses) ? schoolData.courses : [],
    licenseNumber: schoolData?.license_number || "N/A",
    licenceStatus: schoolData?.license_status || "Not specified",
    prevAmount: schoolData?.prev_amount || "0",
    prevDate: schoolData?.prev_licence_date || null,
    profileCompleted: schoolData?.form_status === "complete",
    lastUpdated: schoolData?.updated_at || new Date().toISOString(),
  };

  if (!data.profileCompleted) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Profile Incomplete</h3>
            <p className="text-sm text-gray-600">
              Please complete your school profile to access all features
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Card with Profile Status */}
      <div className="overflow-hidden">
        <div className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-2xl font-bold text-gray-900">
                    School Profile
                  </h1>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Last updated: {formatDate(data.lastUpdated)}
                </p>
              </div>
            </div>

            <button
              onClick={onEdit}
              className="flex items-center gap-2 bg-white text-green-600 px-4 py-2 rounded-lg font-medium hover:bg-green-50 transition-all shadow-md border border-green-200"
            >
              <Edit className="w-4 h-4" />
              Edit Profile
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl backdrop-blur-sm border border-gray-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab("overview")}
              className={`flex-1 px-6 py-3 text-sm font-semibold transition-all ${
                activeTab === "overview"
                  ? "bg-green-600 rounded-xl text-white"
                  : "text-gray-900 hover:bg-white/10"
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab("academic")}
              className={`flex-1 px-6 py-3 text-sm font-semibold transition-all ${
                activeTab === "academic"
                  ? "bg-green-600 rounded-xl text-white rounded-xl"
                  : "text-gray-900 hover:bg-white/10"
              }`}
            >
              Academic Info
            </button>
            <button
              onClick={() => setActiveTab("license")}
              className={`flex-1 px-6 py-3 text-sm font-semibold transition-all ${
                activeTab === "license"
                  ? "bg-green-600 rounded-xl text-white rounded-xl"
                  : "text-gray-900 hover:bg-white/10"
              }`}
            >
              License & Tax
            </button>
          </div>
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* General Information Card */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Building className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-base font-bold text-gray-900">
                General Information
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-500 mb-1">Proprietor Name</p>
                <p className="font-semibold text-gray-900">
                  {data.proprietorName}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-1">Contact Person</p>
                <p className="font-semibold text-gray-900">
                  {data.contactPerson}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-1">
                  Contact Person Designation
                </p>
                <p className="font-semibold text-gray-900">
                  {data.contactPersonDesignation}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-1">
                  Contact Person Phone
                </p>
                <p className="font-semibold text-gray-900">
                  {data.contactPersonPhone}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-1">Ownership Type</p>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-700">
                  {data.ownershipType}
                </span>
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-1">Category</p>
                <p className="font-mono font-semibold text-gray-900">
                  {data.category}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-1">Website</p>
                <p className="font-base underline text-blue-500">
                  {data.website}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-1">Profile Status</p>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-700">
                  <CheckCircle className="w-4 h-4" />
                  Complete
                </span>
              </div>
            </div>
          </div>
          {/* Tax Compliance */}
          <div className="md:col-span-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Tax Compliance Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">TIN Number</p>
                    <p className="font-mono font-bold text-gray-900">
                      {data.tin}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">
                      Last Filing Date
                    </p>
                    <p className="font-bold text-gray-900">
                      {formatDate(data.lastTaxFiling)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Academic Tab */}
      {activeTab === "academic" && (
        <div className="space-y-6">
          {/* Mode of Operation */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-200">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-base font-bold text-gray-900">
                Mode of Operation
              </h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {data.modeOfOperation.length > 0 ? (
                data.modeOfOperation.map((mode: string) => (
                  <span
                    key={mode}
                    className="px-4 py-2 bg-blue-50 text-blue-700 text-sm rounded-lg font-medium border border-blue-200"
                  >
                    {mode}
                  </span>
                ))
              ) : (
                <p className="text-gray-500 text-sm">Not specified</p>
              )}
            </div>
          </div>

          {/* Programmes Offered */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-200">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Award className="w-5 h-5 text-purple-600" />
              </div>
              <h2 className="text-base font-bold text-gray-900">
                Programmes Offered
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {data.programmes.length > 0 ? (
                data.programmes.map((prog: string) => (
                  <div
                    key={prog}
                    className="flex items-center gap-2 p-3 bg-purple-50 text-sm rounded-lg border border-purple-200"
                  >
                    <CheckCircle className="w-5 h-5 text-purple-600 flex-shrink-0" />
                    <span className="font-medium text-gray-900">{prog}</span>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm col-span-2">
                  No programmes specified
                </p>
              )}
            </div>
          </div>

          {/* Courses Offered */}

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-200">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Award className="w-5 h-5 text-purple-600" />
              </div>
              <h2 className="text-base font-bold text-gray-900">
                Courses Offered
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {data.courses.length > 0 ? (
                data.courses.map((prog: string) => (
                  <div
                    key={prog}
                    className="flex items-center gap-2 p-3 bg-orange-50 text-sm rounded-lg border border-orange-200"
                  >
                    <CheckCircle className="w-5 h-5 text-orange-600 flex-shrink-0" />
                    <span className="font-medium text-gray-900">{prog}</span>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm col-span-2">
                  No programmes specified
                </p>
              )}
            </div>
          </div>

          {/* Academic Calendar */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-200">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-green-600" />
              </div>
              <h2 className="text-base font-bold text-gray-900">
                Academic Calendar
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-gray-500 mb-1">Academic Session</p>
                <p className="font-semibold text-gray-900">
                  {data.academicSession}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-1">Session Start</p>
                <p className="font-semibold text-gray-900">
                  {formatDate(data.sessionStart)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Session End</p>
                <p className="font-semibold text-gray-900">
                  {formatDate(data.sessionEnd)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* License Tab */}
      {activeTab === "license" && (
        <div className="space-y-6">
          {/* License Status */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-green-600" />
              </div>
              <h2 className="text-base font-bold text-gray-900">
                License Status
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-500 mb-1">License Number</p>
                <p className="text-lg font-semibold text-gray-900">
                  {data.licenseNumber}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-2">Current Status</p>
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-2 px-4 py-2 text-sm rounded-lg font-semibold ${
                      data.licenceStatus === "Active Licence (Valid)"
                        ? "bg-green-100 text-green-700"
                        : data.licenceStatus === "Renewal Due"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    <CheckCircle className="w-5 h-5" />
                    {data.licenceStatus}
                  </span>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-1">Amount Paid</p>
                <p className="text-lg font-bold text-gray-900">
                  {formatCurrency(data.prevAmount)}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-1">Payment Date</p>
                <p className="text-lg font-bold text-gray-900">
                  {formatDate(data.prevDate)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
