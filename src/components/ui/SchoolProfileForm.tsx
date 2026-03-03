"use client";

import { useState } from "react";
import {
  Loader2,
  Building,
  Users,
  FileText,
  CheckCircle,
  Save,
  X,
  Lock,
} from "lucide-react";
import toast from "react-hot-toast";
import { School } from "@/lib/types";

type FormData = {
  // General Information

  proprietorName: string;
  contact_person: string;
  contact_person_phone: string;
  contact_person_designation: string;
  ownershipType: string;
  address: string;
  lga: string;
  tin: string;
  lastTaxFiling: string;
  category: string;
  website: string;

  // Academic Information
  modeOfOperation: string[];
  avgFee: string;
  totalRevenue: string;
  academicSession: string;
  // weeksPerSemester: string;
  sessionStart: string;
  sessionEnd: string;
  programmes: string[];
  courses: string[];

  // License Information
  license_status: string;
  // licenseNumber: string;
  // licenseExpiry: string;
};

const lgas = [
  "Birnin Gwari",
  "Chikun",
  "Giwa",
  "Igabi",
  "Ikara",
  "Jaba",
  "Jema'a",
  "Kachia",
  "Kaduna North",
  "Kaduna South",
  "Kagarko",
  "Kajuru",
  "Kaura",
  "Kauru",
  "Kubau",
  "Kudan",
  "Lere",
  "Makarfi",
  "Sabon Gari",
  "Sanga",
  "Soba",
  "Zangon Kataf",
  "Zaria",
];

export default function SchoolProfileForm({
  schoolData,
}: {
  schoolData: School;
}) {
  const [formData, setFormData] = useState<FormData>({
    proprietorName: schoolData.proprietor_name ?? "",
    contact_person: schoolData.contact_person ?? "",
    contact_person_phone: schoolData.contact_person_phone ?? "",
    contact_person_designation: schoolData.contact_person_designation ?? "",
    ownershipType: schoolData.ownership ?? "Private Individual",
    address: schoolData.address ?? "",
    lga: schoolData.lga ?? "",
    tin: schoolData.tin ?? "",
    lastTaxFiling: schoolData.last_tax_filing ?? "",
    category: schoolData.category ?? "",
    website: schoolData.website ?? "",
    modeOfOperation: schoolData.mode_of_operation ?? [],
    avgFee: schoolData.avg_fee ?? "",
    totalRevenue: schoolData.total_revenue ?? "",
    academicSession: schoolData.academic_session ?? "2025/2026",
    // weeksPerSemester: "",
    sessionStart: schoolData.session_start ?? "",
    sessionEnd: schoolData.session_end ?? "",
    programmes: schoolData.programmes ?? [],
    courses: schoolData.courses ?? [],
    license_status: schoolData.license_status ?? "",
    // licenseNumber: "",
    // licenseExpiry: "",
  });

  const isApproved = schoolData?.approval_status === "approved";

  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [courseInput, setCourseInput] = useState("");

  const handleChange = (field: keyof FormData, value: string | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleCheckbox = (field: keyof FormData, value: string) => {
    setFormData((prev) => {
      const currentField = prev[field];
      if (Array.isArray(currentField)) {
        const selected = currentField.includes(value)
          ? currentField.filter((item) => item !== value)
          : [...currentField, value];
        return { ...prev, [field]: selected };
      }
      return prev;
    });
  };

  const handleSubmit = async () => {
    setLoading(true);

    try {
      const res = await fetch("/api/schools/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to update profile");
      }

      toast.success("Profile updated successfully!");

      // Optionally refresh the page or redirect
      window.location.reload();
    } catch (error) {
      console.error("Error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update profile",
      );
    } finally {
      setLoading(false);
    }
  };

  // Check completion status for each section
  const isGeneralComplete =
    formData.proprietorName && formData.contact_person && formData.category;
  const isAcademicComplete =
    formData.modeOfOperation.length > 0 && formData.programmes;
  const isLicenseComplete = formData.license_status;

  const completionPercentage = Math.round(
    ([isGeneralComplete, isAcademicComplete, isLicenseComplete].filter(Boolean)
      .length /
      3) *
      100,
  );

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header Card */}
      <div className="bg-white rounded-xl p-6 mb-6 text-gray-900 border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">
              Update Your School Profile
            </h1>
            <p className="text-gray-600 ">
              Fill in your school information to access all features
            </p>
          </div>
          <div className="text-center">
            <div className="relative w-24 h-24">
              <svg className="w-24 h-24 transform -rotate-90">
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke="rgba(7, 234, 37, 0.33)"
                  strokeWidth="6"
                  fill="none"
                />
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke="white"
                  strokeWidth="6"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 40}`}
                  strokeDashoffset={`${
                    2 * Math.PI * 40 * (1 - completionPercentage / 100)
                  }`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold">
                  {completionPercentage}%
                </span>
              </div>
            </div>
            <p className="text-xs text-gray-600 mt-2">Complete</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* General Information Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <button
            type="button"
            onClick={() =>
              setActiveSection(activeSection === "general" ? null : "general")
            }
            className="w-full px-6 py-4 flex items-center justify-between bg-gradient-to-r from-green-50 to-emerald-50 border-b border-gray-200 hover:from-green-100 hover:to-emerald-100 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                <Building className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <h2 className="text-base font-semibold text-gray-900">
                  General Information
                </h2>
                <p className="text-xs text-gray-600">
                  Basic school and ownership details
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {isGeneralComplete && (
                <span className="flex items-center gap-1 text-green-600 text-sm font-medium">
                  <CheckCircle className="w-4 h-4" />
                  Complete
                </span>
              )}
              <svg
                className={`w-5 h-5 text-gray-400 transition-transform ${
                  activeSection === "general" ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </button>

          {activeSection === "general" && (
            <div className="p-6">
              <div className="grid grid-cols-1 text-sm md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Proprietor Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Enter proprietor's full name"
                    value={formData.proprietorName}
                    onChange={(e) =>
                      handleChange("proprietorName", e.target.value)
                    }
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Contact Person <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="School Contact Person"
                    value={formData.contact_person}
                    onChange={(e) =>
                      handleChange("contact_person", e.target.value)
                    }
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Contact Person Designation
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="(e.g., Principal, Director, Bursar)"
                    value={formData.contact_person_designation}
                    onChange={(e) =>
                      handleChange("contact_person_designation", e.target.value)
                    }
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Contact Person Phone<span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="School Contact Person"
                    value={formData.contact_person_phone}
                    onChange={(e) =>
                      handleChange("contact_person_phone", e.target.value)
                    }
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Type of Ownership <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.ownershipType}
                    onChange={(e) =>
                      handleChange("ownershipType", e.target.value)
                    }
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  >
                    <option value="Private Individual">
                      Private Individual
                    </option>
                    <option value="Faith-Based">Faith-Based</option>
                    <option value="Corporate Body">Corporate Body</option>
                  </select>
                </div>

                <div className="md:col-span-2 ">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Institution Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Enter institution Address"
                    value={formData.address}
                    onChange={(e) => handleChange("address", e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    LGA <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.lga}
                    onChange={(e) => handleChange("lga", e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  >
                    <option value="">Select LGA</option>
                    {lgas.sort().map((lga) => (
                      <option key={lga} value={lga}>
                        {lga}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    TIN
                  </label>
                  <input
                    type="text"
                    placeholder="Tax Identification Number"
                    value={formData.tin}
                    onChange={(e) => handleChange("tin", e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Last Tax Filing Date
                  </label>
                  <input
                    type="date"
                    value={formData.lastTaxFiling}
                    onChange={(e) =>
                      handleChange("lastTaxFiling", e.target.value)
                    }
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      "College of Education",
                      "Polytechnic",
                      "University",
                      "School of Health Technology",
                    ].map((option) => (
                      <label
                        key={option}
                        className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all ${
                          formData.category === option
                            ? "border-green-500 bg-green-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <input
                          type="radio"
                          value={option}
                          checked={formData.category === option}
                          onChange={() => handleChange("category", option)}
                          className="w-4 h-4 text-purple-600"
                        />
                        <span className="font-medium text-gray-900">
                          {option}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    School Website
                  </label>
                  <input
                    type="text"
                    placeholder="www.yourschool.com"
                    value={formData.website}
                    onChange={(e) => handleChange("website", e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Academic Information Section */}
        <div className="bg-white text-sm rounded-xl shadow-md border border-gray-200 overflow-hidden">
          <button
            type="button"
            onClick={() =>
              setActiveSection(activeSection === "academic" ? null : "academic")
            }
            className="w-full px-6 py-4 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 hover:from-blue-100 hover:to-indigo-100 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <h2 className="text-base font-semibold text-gray-900">
                  Academic Information
                </h2>
                <p className="text-xs text-gray-600">
                  Programs, fees, and academic calendar
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {isApproved ? (
                <span className="flex items-center gap-1 text-blue-600 text-sm font-medium">
                  <Lock className="w-4 h-4" />
                  Locked
                </span>
              ) : (
                isAcademicComplete && (
                  <span className="flex items-center gap-1 text-green-600 text-sm font-medium">
                    <CheckCircle className="w-4 h-4" />
                    Complete
                  </span>
                )
              )}
              <svg
                className={`w-5 h-5 text-gray-400 transition-transform ${
                  activeSection === "academic" ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </button>

          {activeSection === "academic" && (
            <div className="p-6 space-y-6">
              {/* Locked notice */}
              {isApproved && (
                <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2.5">
                  <Lock className="w-4 h-4 text-blue-500 shrink-0" />
                  <p className="text-xs text-blue-700 font-medium">
                    This section is locked after ministry approval. Contact the
                    Ministry to request any changes.
                  </p>
                </div>
              )}

              {/* Mode of Operation */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Mode of Operation <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {["Full-Time", "Part-Time", "Distance Learning"].map(
                    (mode) => (
                      <label
                        key={mode}
                        className={`flex items-center gap-3 p-3 border-2 rounded-lg transition-all ${
                          isApproved
                            ? "cursor-not-allowed opacity-60"
                            : "cursor-pointer"
                        } ${
                          formData.modeOfOperation.includes(mode)
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={formData.modeOfOperation.includes(mode)}
                          onChange={() =>
                            !isApproved &&
                            toggleCheckbox("modeOfOperation", mode)
                          }
                          disabled={isApproved}
                          className="w-4 h-4 text-blue-600 disabled:cursor-not-allowed"
                        />
                        <span className="font-medium text-gray-900">
                          {mode}
                        </span>
                      </label>
                    ),
                  )}
                </div>
              </div>

              {/* Financial Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Average Fee per Student
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                      ₦
                    </span>
                    <input
                      type="number"
                      pattern="[0-9]*"
                      placeholder="0.00"
                      value={formData.avgFee}
                      onChange={(e) => handleChange("avgFee", e.target.value)}
                      disabled={isApproved}
                      className="w-full pl-8 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Last Year Revenue
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                      ₦
                    </span>
                    <input
                      type="number"
                      pattern="[0-9]*"
                      placeholder="0.00"
                      value={formData.totalRevenue}
                      onChange={(e) =>
                        handleChange("totalRevenue", e.target.value)
                      }
                      disabled={isApproved}
                      className="w-full pl-8 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              {/* Academic Calendar */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Current Academic Session{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.academicSession}
                    onChange={(e) =>
                      handleChange("academicSession", e.target.value)
                    }
                    disabled={isApproved}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed"
                    required
                  >
                    <option value="">Select Session</option>
                    {Array.from({ length: 3 }).map((_, i) => {
                      const startYear = new Date().getFullYear() - i;
                      const endYear = startYear + 1;
                      const session = `${startYear}/${endYear}`;
                      return (
                        <option key={session} value={session}>
                          {session}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Session Start Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.sessionStart}
                    onChange={(e) =>
                      handleChange("sessionStart", e.target.value)
                    }
                    disabled={isApproved}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Expected End Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.sessionEnd}
                    onChange={(e) => handleChange("sessionEnd", e.target.value)}
                    disabled={isApproved}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed"
                    required
                  />
                </div>
              </div>

              {/* Programmes */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Programmes Offered <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    "Bachelor's Degree ",
                    "Higher National Diploma (HND)",
                    "National Diploma / NCE",
                    "Postgraduate Diploma (PGD)",
                    "Master's Degree",
                    "Doctorate Degree (Ph.D.)",
                    "Professional Certifications",
                  ].map((prog) => (
                    <label
                      key={prog}
                      className={`flex items-center gap-3 p-3 border-2 rounded-lg transition-all ${
                        isApproved
                          ? "cursor-not-allowed opacity-60"
                          : "cursor-pointer"
                      } ${
                        formData.programmes.includes(prog)
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.programmes.includes(prog)}
                        onChange={() =>
                          !isApproved && toggleCheckbox("programmes", prog)
                        }
                        disabled={isApproved}
                        className="w-4 h-4 text-blue-600 disabled:cursor-not-allowed"
                        required
                      />
                      <span className="text-sm font-medium text-gray-900">
                        {prog}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Courses */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Courses
                </label>

                {/* Existing courses list */}
                {formData.courses.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {formData.courses.map((course: string, index: number) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1.5 bg-blue-50 border border-blue-200 text-blue-700 text-sm px-3 py-1 rounded-full"
                      >
                        {course}
                        {!isApproved && (
                          <button
                            type="button"
                            onClick={() =>
                              handleChange(
                                "courses",
                                formData.courses.filter(
                                  (_: string, i: number) => i !== index,
                                ),
                              )
                            }
                            className="text-blue-400 hover:text-red-500 transition font-bold leading-none"
                          >
                            ×
                          </button>
                        )}
                      </span>
                    ))}
                  </div>
                )}

                {/* Add course input — hidden when approved */}
                {!isApproved && (
                  <>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="e.g., Medical Laboratory Science"
                        value={courseInput}
                        onChange={(e) => setCourseInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            if (courseInput.trim()) {
                              handleChange("courses", [
                                ...formData.courses,
                                courseInput.trim(),
                              ]);
                              setCourseInput("");
                            }
                          }
                        }}
                        className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (courseInput.trim()) {
                            handleChange("courses", [
                              ...formData.courses,
                              courseInput.trim(),
                            ]);
                            setCourseInput("");
                          }
                        }}
                        className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-all"
                      >
                        + Add
                      </button>
                    </div>
                    <p className="text-xs text-gray-400 mt-1.5">
                      Press Enter or click Add to insert a course.
                    </p>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* License Information Section */}
        <div className="bg-white text-sm rounded-xl shadow-md border border-gray-200 overflow-hidden">
          <button
            type="button"
            onClick={() =>
              setActiveSection(activeSection === "license" ? null : "license")
            }
            className="w-full px-6 py-4 flex items-center justify-between bg-gradient-to-r from-purple-50 to-pink-50 border-b border-gray-200 hover:from-purple-100 hover:to-pink-100 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <h2 className="text-base font-semibold text-gray-900">
                  Consent Certificate Information
                </h2>
                <p className="text-xs text-gray-600">
                  Certificate status and payment details
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {isLicenseComplete && (
                <span className="flex items-center gap-1 text-green-600 text-sm font-medium">
                  <CheckCircle className="w-4 h-4" />
                  Complete
                </span>
              )}
              <svg
                className={`w-5 h-5 text-gray-400 transition-transform ${
                  activeSection === "license" ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </button>

          {activeSection === "license" && (
            <div className="p-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Current Certificate Status{" "}
                  <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {["Active", "Expired"].map((option) => (
                    <label
                      key={option}
                      className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all ${
                        formData.license_status === option
                          ? "border-purple-500 bg-purple-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <input
                        type="radio"
                        value={option}
                        checked={formData.license_status === option}
                        onChange={() => handleChange("license_status", option)}
                        className="w-4 h-4 text-purple-600"
                      />
                      <span className="font-medium text-gray-900">
                        {option}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                {/* <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    License Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="School License Number"
                    value={formData.licenseNumber}
                    onChange={(e) =>
                      handleChange("licenseNumber", e.target.value)
                    }
                    className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all ${formData.licenceStatus === "Expired" ? "bg-gray-100 text-gray-500" : ""}`}
                    required
                    disabled={formData.licenceStatus === "Expired"}
                  />
                </div> */}
                {/* <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    License Expiry Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    placeholder="School License Expiry Date"
                    value={formData.licenseExpiry}
                    onChange={(e) =>
                      handleChange("licenseExpiry", e.target.value)
                    }
                    className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all ${formData.licenceStatus === "Expired" ? "bg-gray-100 text-gray-500" : ""}`}
                    required
                    disabled={formData.licenceStatus === "Expired"}
                  />
                </div> */}
              </div>

              <div className="mt-6 text-sm text-gray-600">
                <p>
                  <span className="font-semibold text-red-500">Note:</span> If
                  your license is currently active, you will be asked to upload
                  it in the next step.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="px-6 py-3 border-2 text-sm border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all flex items-center gap-2"
          >
            <X className="w-5 h-5" />
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="px-8 py-3 text-sm bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg hover:shadow-xl"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                <span>Save Profile</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
