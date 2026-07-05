"use client";

import React, { useState, useEffect } from "react";
import {
  Loader2,
  CheckCircle,
  Save,
  X,
  Clock,
  AlertTriangle,
  Send,
} from "lucide-react";
import toast from "react-hot-toast";
import { School } from "@/lib/types";

type Course = { name: string; accredited: boolean };

type AcademicSnapshot = {
  mode_of_operation: string[];
  avg_fee: string;
  total_revenue: string;
  academic_session: string;
  session_start: string;
  session_end: string;
  programmes: string[];
  courses: Course[];
  total_students: string;
  enrollment_snapshot_date: string;
  graduated_count: string;
};

type AcademicStaff = { name: string; qualification: string };
type NonAcademicStaff = { name: string; role: string };

type AcademicChangeRequest = {
  id: number;
  status: string;
  current_snapshot: AcademicSnapshot;
  requested_changes: AcademicSnapshot;
  rejection_reason: string | null;
  created_at: string;
};

type FormData = {
  // General Information
  proprietorName: string;
  proprietorNin: string;
  propertyType: string;
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
  vcName: string;
  gsmNo: string;
  yearEstablished: string;

  // Academic Information
  modeOfOperation: string[];
  avgFee: string;
  totalRevenue: string;
  academicSession: string;
  sessionStart: string;
  sessionEnd: string;
  programmes: string[];
  courses: Course[];
  totalStudents: string;
  enrollmentSnapshotDate: string;
  graduatedCount: string;

  // Infrastructure
  labStatus: string;
  libraryStatus: string;

  // People
  boardMembers: string[];
  academicStaff: AcademicStaff[];
  nonAcademicStaff: NonAcademicStaff[];

  // License Information
  license_status: string;
};

const lgas = [
  "Akko",
  "Balanga",
  "Billiri",
  "Dukku",
  "Funakaye",
  "Gombe",
  "Kaltungo",
  "Kwami",
  "Nafada",
  "Shongom",
  "Yamaltu/Deba",
];

export default function SchoolProfileForm({
  schoolData,
}: {
  schoolData: School;
}) {
  const [formData, setFormData] = useState<FormData>({
    proprietorName: schoolData.proprietor_name ?? "",
    proprietorNin: schoolData.proprietor_nin ?? "",
    propertyType: schoolData.property_type ?? "",
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
    courses: (schoolData.courses ?? []).map((c) =>
      typeof c === "string" ? { name: c, accredited: true } : c,
    ),
    totalStudents: schoolData.total_students?.toString() ?? "",
    enrollmentSnapshotDate: schoolData.enrollment_snapshot_date ?? "",
    graduatedCount: schoolData.graduated_count?.toString() ?? "",
    vcName: schoolData.vc_name ?? "",
    gsmNo: schoolData.gsm_no ?? "",
    yearEstablished: schoolData.year_established?.toString() ?? "",
    labStatus: schoolData.lab_status ?? "",
    libraryStatus: schoolData.library_status ?? "",
    boardMembers: schoolData.board_members ?? [],
    academicStaff: schoolData.academic_staff ?? [],
    nonAcademicStaff: schoolData.non_academic_staff ?? [],
    license_status: schoolData.license_status ?? "",
  });

  const isApproved = schoolData?.approval_status === "approved";

  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>("general");
  const [courseInput, setCourseInput] = useState("");

  // People section inputs
  const [boardMemberInput, setBoardMemberInput] = useState("");
  const [academicStaffName, setAcademicStaffName] = useState("");
  const [academicStaffQual, setAcademicStaffQual] = useState("");
  const [nonAcademicStaffName, setNonAcademicStaffName] = useState("");
  const [nonAcademicStaffRole, setNonAcademicStaffRole] = useState("");

  const [pendingRequest, setPendingRequest] =
    useState<AcademicChangeRequest | null>(null);
  const [academicSubmitLoading, setAcademicSubmitLoading] = useState(false);
  const [withdrawLoading, setWithdrawLoading] = useState(false);

  // When the school is approved, check for any pending academic change request
  useEffect(() => {
    if (!isApproved) return;
    fetch("/api/schools/academic-change-request")
      .then((r) => r.json())
      .then((data) => {
        if (data.request?.status === "pending") {
          setPendingRequest(data.request);
          const ch = data.request.requested_changes as AcademicSnapshot;
          setFormData((prev) => ({
            ...prev,
            modeOfOperation: ch.mode_of_operation ?? prev.modeOfOperation,
            avgFee: ch.avg_fee ?? prev.avgFee,
            totalRevenue: ch.total_revenue ?? prev.totalRevenue,
            academicSession: ch.academic_session ?? prev.academicSession,
            sessionStart: ch.session_start ?? prev.sessionStart,
            sessionEnd: ch.session_end ?? prev.sessionEnd,
            programmes: ch.programmes ?? prev.programmes,
            courses: ch.courses ?? prev.courses,
            totalStudents: ch.total_students ?? prev.totalStudents,
            enrollmentSnapshotDate:
              ch.enrollment_snapshot_date ?? prev.enrollmentSnapshotDate,
            graduatedCount: ch.graduated_count ?? prev.graduatedCount,
          }));
        }
      })
      .catch(console.error);
  }, [isApproved]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleChange = (field: keyof FormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleCheckbox = (
    field: "modeOfOperation" | "programmes",
    value: string,
  ) => {
    setFormData((prev) => {
      const current = prev[field] as string[];
      const selected = current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value];
      return { ...prev, [field]: selected };
    });
  };

  // Submit academic section changes for re-approval
  const handleAcademicSubmit = async () => {
    setAcademicSubmitLoading(true);
    try {
      const requested_changes: AcademicSnapshot = {
        mode_of_operation: formData.modeOfOperation,
        avg_fee: formData.avgFee,
        total_revenue: formData.totalRevenue,
        academic_session: formData.academicSession,
        session_start: formData.sessionStart,
        session_end: formData.sessionEnd,
        programmes: formData.programmes,
        courses: formData.courses,
        total_students: formData.totalStudents,
        enrollment_snapshot_date: formData.enrollmentSnapshotDate,
        graduated_count: formData.graduatedCount,
      };
      const res = await fetch("/api/schools/academic-change-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requested_changes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to submit");
      setPendingRequest(data.request);
      toast.success("Academic changes submitted for ministry review.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to submit changes",
      );
    } finally {
      setAcademicSubmitLoading(false);
    }
  };

  // Withdraw the pending academic change request
  const handleWithdraw = async () => {
    setWithdrawLoading(true);
    try {
      const res = await fetch("/api/schools/academic-change-request", {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to withdraw");
      setPendingRequest(null);
      // Reset academic fields back to the currently approved values
      setFormData((prev) => ({
        ...prev,
        modeOfOperation: schoolData.mode_of_operation ?? [],
        avgFee: schoolData.avg_fee ?? "",
        totalRevenue: schoolData.total_revenue ?? "",
        academicSession: schoolData.academic_session ?? "2025/2026",
        sessionStart: schoolData.session_start ?? "",
        sessionEnd: schoolData.session_end ?? "",
        programmes: schoolData.programmes ?? [],
        courses: (schoolData.courses ?? []).map((c) =>
          typeof c === "string" ? { name: c, accredited: true } : c,
        ),
        totalStudents: schoolData.total_students?.toString() ?? "",
        enrollmentSnapshotDate: schoolData.enrollment_snapshot_date ?? "",
        graduatedCount: schoolData.graduated_count?.toString() ?? "",
      }));
      toast.success("Change request withdrawn.");
    } catch {
      toast.error("Failed to withdraw request.");
    } finally {
      setWithdrawLoading(false);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);

    try {
      // When approved, only send non-academic fields — academic changes go through re-approval
      const payload = isApproved
        ? {
            proprietorName: formData.proprietorName,
            proprietorNin: formData.proprietorNin,
            propertyType: formData.propertyType,
            contact_person: formData.contact_person,
            contact_person_phone: formData.contact_person_phone,
            contact_person_designation: formData.contact_person_designation,
            ownershipType: formData.ownershipType,
            address: formData.address,
            lga: formData.lga,
            tin: formData.tin,
            lastTaxFiling: formData.lastTaxFiling,
            category: formData.category,
            website: formData.website,
            license_status: formData.license_status,
            vcName: formData.vcName,
            gsmNo: formData.gsmNo,
            yearEstablished: formData.yearEstablished,
            labStatus: formData.labStatus,
            libraryStatus: formData.libraryStatus,
            boardMembers: formData.boardMembers,
            academicStaff: formData.academicStaff,
            nonAcademicStaff: formData.nonAcademicStaff,
          }
        : formData;

      const res = await fetch("/api/schools/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to update profile");
      }

      toast.success("Profile updated successfully!");

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
    formData.proprietorName &&
    formData.contact_person &&
    formData.category &&
    formData.vcName;
  const isAcademicComplete =
    formData.modeOfOperation.length > 0 &&
    formData.programmes.length > 0 &&
    formData.totalStudents;
  const isInfrastructureComplete = formData.labStatus && formData.libraryStatus;
  const isPeopleComplete =
    formData.boardMembers.length > 0 || formData.academicStaff.length > 0;
  const isLicenseComplete = formData.license_status;

  const completionPercentage = Math.round(
    ([
      isGeneralComplete,
      isAcademicComplete,
      isInfrastructureComplete,
      isPeopleComplete,
      isLicenseComplete,
    ].filter(Boolean).length /
      5) *
      100,
  );

  const STEPS = [
    { id: "general", label: "General Info" },
    { id: "academic", label: "Academic" },
    { id: "infrastructure", label: "Facilities" },
    { id: "people", label: "People" },
    { id: "license", label: "Certificate" },
  ] as const;
  type StepId = (typeof STEPS)[number]["id"];
  const stepComplete: Record<StepId, boolean> = {
    general: !!isGeneralComplete,
    academic: !!isAcademicComplete,
    infrastructure: !!isInfrastructureComplete,
    license: !!isLicenseComplete,
    people: !!isPeopleComplete,
  };
  const currentStepIndex = STEPS.findIndex((s) => s.id === activeSection);
  const prevStep = () => {
    if (currentStepIndex > 0) setActiveSection(STEPS[currentStepIndex - 1].id);
  };
  const nextStep = () => {
    if (currentStepIndex < STEPS.length - 1)
      setActiveSection(STEPS[currentStepIndex + 1].id);
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Compact header */}
      <div className="bg-white rounded-xl px-6 py-4 mb-4 border border-gray-200 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900">
            Update School Profile
          </h1>
          <p className="text-xs text-gray-500">
            Complete all sections to submit your institution&apos;s information
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative w-14 h-14">
            <svg className="w-14 h-14 transform -rotate-90">
              <circle
                cx="28"
                cy="28"
                r="22"
                stroke="rgba(7,234,37,0.2)"
                strokeWidth="5"
                fill="none"
              />
              <circle
                cx="28"
                cy="28"
                r="22"
                stroke="#16a34a"
                strokeWidth="5"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 22}`}
                strokeDashoffset={`${2 * Math.PI * 22 * (1 - completionPercentage / 100)}`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-bold text-gray-900">
                {completionPercentage}%
              </span>
            </div>
          </div>
          <span className="text-xs text-gray-500">Complete</span>
        </div>
      </div>

      {/* Horizontal Stepper */}
      <div className="bg-white rounded-xl border border-gray-200 px-6 py-4 mb-4">
        <div className="flex items-center">
          {STEPS.map((step, index) => (
            <React.Fragment key={step.id}>
              <button
                type="button"
                onClick={() => setActiveSection(step.id)}
                className="flex flex-col items-center gap-1 group flex-1 min-w-0"
              >
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                    activeSection === step.id
                      ? "bg-green-600 text-white shadow-md"
                      : stepComplete[step.id]
                        ? "bg-green-100 text-green-700 border-2 border-green-500"
                        : "bg-gray-100 text-gray-400 border-2 border-gray-200 group-hover:border-gray-400"
                  }`}
                >
                  {stepComplete[step.id] && activeSection !== step.id ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>
                <span
                  className={`text-xs font-medium text-center leading-tight px-1 ${
                    activeSection === step.id
                      ? "text-green-700 font-semibold"
                      : stepComplete[step.id]
                        ? "text-green-600"
                        : "text-gray-400"
                  }`}
                >
                  {step.label}
                </span>
              </button>
              {index < STEPS.length - 1 && (
                <div
                  className={`h-0.5 flex-[0.3] mx-1 mb-4 rounded transition-colors ${
                    stepComplete[step.id] ? "bg-green-400" : "bg-gray-200"
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      <form className="space-y-4">
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {activeSection === "general" && (
            <div className="p-6">
              <div className="mb-5 pb-4 border-b border-gray-100">
                <h2 className="text-sm font-bold text-gray-800">
                  General Information
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Basic school details, ownership, contact person, and site
                  information
                </p>
              </div>
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
                    Proprietor NIN
                  </label>
                  <input
                    type="text"
                    placeholder="11-digit National Identification Number"
                    value={formData.proprietorNin}
                    onChange={(e) =>
                      handleChange(
                        "proprietorNin",
                        e.target.value.replace(/\D/g, "").slice(0, 11),
                      )
                    }
                    maxLength={11}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Site Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.propertyType}
                    onChange={(e) =>
                      handleChange("propertyType", e.target.value)
                    }
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    required
                  >
                    <option value="">Select site type</option>
                    <option value="Permanent">Permanent</option>
                    <option value="Temporary">Temporary</option>
                  </select>
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

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Name of VC / Rector / Provost{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Full name of institution head"
                    value={formData.vcName}
                    onChange={(e) => handleChange("vcName", e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Institution GSM No <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g., 08012345678"
                    value={formData.gsmNo}
                    onChange={(e) => handleChange("gsmNo", e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Year of Establishment
                  </label>
                  <input
                    type="number"
                    placeholder="e.g., 2005"
                    min="1900"
                    max={new Date().getFullYear()}
                    value={formData.yearEstablished}
                    onChange={(e) =>
                      handleChange("yearEstablished", e.target.value)
                    }
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>
            </div>
          )}

          {activeSection === "academic" && (
            <div className="p-6 space-y-6">
              <div className="pb-4 border-b border-gray-100">
                <h2 className="text-sm font-bold text-gray-800">
                  Academic Information
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Mode of operation, programmes offered, courses with
                  accreditation status, fees, student enrolment, and academic
                  calendar
                </p>
              </div>
              {/* Status banners */}
              {isApproved && pendingRequest && (
                <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5">
                  <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                  <p className="text-xs text-amber-700 font-medium">
                    Your changes are under ministry review. Currently approved
                    data remains live on the verification portal.
                  </p>
                </div>
              )}
              {isApproved && !pendingRequest && (
                <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2.5">
                  <AlertTriangle className="w-4 h-4 text-blue-500 shrink-0" />
                  <p className="text-xs text-blue-700 font-medium">
                    Changes to this section require ministry re-approval. Your
                    currently approved data stays live until the ministry
                    reviews and approves the update.
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
                          isApproved && !!pendingRequest
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
                            !(isApproved && !!pendingRequest) &&
                            toggleCheckbox("modeOfOperation", mode)
                          }
                          disabled={isApproved && !!pendingRequest}
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
                      disabled={isApproved && !!pendingRequest}
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
                      disabled={isApproved && !!pendingRequest}
                      className="w-full pl-8 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              {/* Enrolment & Graduate figures */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Students Enrolled <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    placeholder="Total enrolled students"
                    value={formData.totalStudents}
                    onChange={(e) =>
                      handleChange("totalStudents", e.target.value)
                    }
                    disabled={isApproved && !!pendingRequest}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Enrolment Date
                  </label>
                  <input
                    type="date"
                    value={formData.enrollmentSnapshotDate}
                    onChange={(e) =>
                      handleChange("enrollmentSnapshotDate", e.target.value)
                    }
                    disabled={isApproved && !!pendingRequest}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Graduates (up to 2023)
                  </label>
                  <input
                    type="number"
                    placeholder="Cumulative graduates"
                    value={formData.graduatedCount}
                    onChange={(e) =>
                      handleChange("graduatedCount", e.target.value)
                    }
                    disabled={isApproved && !!pendingRequest}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed"
                  />
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
                    disabled={isApproved && !!pendingRequest}
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
                    disabled={isApproved && !!pendingRequest}
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
                    disabled={isApproved && !!pendingRequest}
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
                        isApproved && !!pendingRequest
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
                          !(isApproved && !!pendingRequest) &&
                          toggleCheckbox("programmes", prog)
                        }
                        disabled={isApproved && !!pendingRequest}
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
                    {formData.courses.map((course: Course, index: number) => (
                      <span
                        key={index}
                        className={`inline-flex items-center gap-1.5 text-sm px-3 py-1 rounded-full border font-medium ${
                          course.accredited
                            ? "bg-green-50 border-green-300 text-green-800"
                            : "bg-red-50 border-red-300 text-red-800"
                        }`}
                      >
                        {course.name}
                        <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${
                          course.accredited
                            ? "bg-green-200 text-green-800"
                            : "bg-red-200 text-red-800"
                        }`}>
                          {course.accredited ? "Accredited" : "Not Accredited"}
                        </span>
                        {!(isApproved && !!pendingRequest) && (
                          <button
                            type="button"
                            onClick={() =>
                              handleChange(
                                "courses",
                                formData.courses.filter((_, i) => i !== index),
                              )
                            }
                            className="opacity-50 hover:opacity-100 transition font-bold leading-none ml-0.5"
                          >
                            ×
                          </button>
                        )}
                      </span>
                    ))}
                  </div>
                )}

                {/* Add course input — hidden when there is a pending request */}
                {!(isApproved && !!pendingRequest) && (
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
                                { name: courseInput.trim(), accredited: true },
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
                              { name: courseInput.trim(), accredited: true },
                            ]);
                            setCourseInput("");
                          }
                        }}
                        className="px-3 py-2.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg transition-all whitespace-nowrap"
                      >
                        + Accredited
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (courseInput.trim()) {
                            handleChange("courses", [
                              ...formData.courses,
                              { name: courseInput.trim(), accredited: false },
                            ]);
                            setCourseInput("");
                          }
                        }}
                        className="px-3 py-2.5 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold rounded-lg transition-all whitespace-nowrap"
                      >
                        + Not Accredited
                      </button>
                    </div>
                    <p className="text-xs text-gray-400 mt-1.5">
                      Type a course name then click the green or red button to set its accreditation status.
                    </p>
                  </>
                )}
              </div>

              {/* Re-approval action buttons */}
              {isApproved && (
                <div className="flex justify-end pt-2 border-t border-gray-100">
                  {pendingRequest ? (
                    <button
                      type="button"
                      onClick={handleWithdraw}
                      disabled={withdrawLoading}
                      className="px-4 py-2 text-sm border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      {withdrawLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <X className="w-4 h-4" />
                      )}
                      Withdraw Request
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleAcademicSubmit}
                      disabled={academicSubmitLoading}
                      className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      {academicSubmitLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                      Submit for Re-approval
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {activeSection === "infrastructure" && (
            <div className="p-6 space-y-6">
              <div className="pb-4 border-b border-gray-100">
                <h2 className="text-sm font-bold text-gray-800">
                  Infrastructure & Facilities
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Indicate whether the institution&apos;s laboratories,
                  workshops, and library are physically available on the
                  premises. Adequacy will be assessed separately by an
                  inspector.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Laboratories / Workshop{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-3">
                    {["Available", "Not Available"].map((option) => (
                      <label
                        key={option}
                        className={`flex-1 flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all ${
                          formData.labStatus === option
                            ? option === "Available"
                              ? "border-green-500 bg-green-50"
                              : "border-red-400 bg-red-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <input
                          type="radio"
                          value={option}
                          checked={formData.labStatus === option}
                          onChange={() => handleChange("labStatus", option)}
                          className="w-4 h-4"
                        />
                        <span className="font-medium text-gray-900 text-sm">
                          {option}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Library <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-3">
                    {["Available", "Not Available"].map((option) => (
                      <label
                        key={option}
                        className={`flex-1 flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all ${
                          formData.libraryStatus === option
                            ? option === "Available"
                              ? "border-green-500 bg-green-50"
                              : "border-red-400 bg-red-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <input
                          type="radio"
                          value={option}
                          checked={formData.libraryStatus === option}
                          onChange={() => handleChange("libraryStatus", option)}
                          className="w-4 h-4"
                        />
                        <span className="font-medium text-gray-900 text-sm">
                          {option}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === "license" && (
            <div className="p-6">
              <div className="mb-5 pb-4 border-b border-gray-100">
                <h2 className="text-sm font-bold text-gray-800">
                  Consent Certificate
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Record the current status of the institution&apos;s
                  consent-to-operate certificate issued by the Ministry
                </p>
              </div>
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
                  your certificate is currently active, you will be asked to
                  upload it in the next step.
                </p>
              </div>
            </div>
          )}

          {activeSection === "people" && (
            <div className="p-6 space-y-8">
              <div className="pb-4 border-b border-gray-100">
                <h2 className="text-sm font-bold text-gray-800">People</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Board members, academic staff with qualifications, and
                  non-academic staff with their roles
                </p>
              </div>

              {/* Board Members */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Board Members
                </label>
                {formData.boardMembers.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {formData.boardMembers.map((member, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1.5 bg-indigo-50 border border-indigo-200 text-indigo-700 text-sm px-3 py-1 rounded-full"
                      >
                        {member}
                        <button
                          type="button"
                          onClick={() =>
                            handleChange(
                              "boardMembers",
                              formData.boardMembers.filter(
                                (_, i) => i !== index,
                              ),
                            )
                          }
                          className="text-indigo-400 hover:text-red-500 transition font-bold leading-none"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g., Dr. Aisha Musa"
                    value={boardMemberInput}
                    onChange={(e) => setBoardMemberInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        if (boardMemberInput.trim()) {
                          handleChange("boardMembers", [
                            ...formData.boardMembers,
                            boardMemberInput.trim(),
                          ]);
                          setBoardMemberInput("");
                        }
                      }
                    }}
                    className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (boardMemberInput.trim()) {
                        handleChange("boardMembers", [
                          ...formData.boardMembers,
                          boardMemberInput.trim(),
                        ]);
                        setBoardMemberInput("");
                      }
                    }}
                    className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-all"
                  >
                    + Add
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1.5">
                  Press Enter or click Add to insert a member.
                </p>
              </div>

              {/* Academic Staff */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Academic Staff Disposition
                  </label>
                  {formData.academicStaff.length > 0 && (
                    <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                      {formData.academicStaff.length} staff
                    </span>
                  )}
                </div>
                {formData.academicStaff.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {formData.academicStaff.map((staff, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1.5 bg-green-50 border border-green-200 text-green-800 text-sm px-3 py-1 rounded-full"
                      >
                        <span className="font-medium">{staff.name}</span>
                        <span className="text-xs text-green-600">
                          — {staff.qualification}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            handleChange(
                              "academicStaff",
                              formData.academicStaff.filter(
                                (_, i) => i !== index,
                              ),
                            )
                          }
                          className="text-green-400 hover:text-red-500 transition font-bold leading-none"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Full name"
                    value={academicStaffName}
                    onChange={(e) => setAcademicStaffName(e.target.value)}
                    className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  />
                  <input
                    type="text"
                    placeholder="Qualification (e.g., Ph.D, M.Sc)"
                    value={academicStaffQual}
                    onChange={(e) => setAcademicStaffQual(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        if (
                          academicStaffName.trim() &&
                          academicStaffQual.trim()
                        ) {
                          handleChange("academicStaff", [
                            ...formData.academicStaff,
                            {
                              name: academicStaffName.trim(),
                              qualification: academicStaffQual.trim(),
                            },
                          ]);
                          setAcademicStaffName("");
                          setAcademicStaffQual("");
                        }
                      }
                    }}
                    className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (
                        academicStaffName.trim() &&
                        academicStaffQual.trim()
                      ) {
                        handleChange("academicStaff", [
                          ...formData.academicStaff,
                          {
                            name: academicStaffName.trim(),
                            qualification: academicStaffQual.trim(),
                          },
                        ]);
                        setAcademicStaffName("");
                        setAcademicStaffQual("");
                      }
                    }}
                    className="px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition-all"
                  >
                    + Add
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1.5">
                  Enter name and qualification, then press Enter or click Add.
                </p>
              </div>

              {/* Non-Academic Staff */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Non-Academic Staff Disposition
                  </label>
                  {formData.nonAcademicStaff.length > 0 && (
                    <span className="text-xs font-semibold text-gray-600 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-full">
                      {formData.nonAcademicStaff.length} staff
                    </span>
                  )}
                </div>
                {formData.nonAcademicStaff.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {formData.nonAcademicStaff.map((staff, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1.5 bg-gray-100 border border-gray-200 text-gray-700 text-sm px-3 py-1 rounded-full"
                      >
                        <span className="font-medium">{staff.name}</span>
                        <span className="text-xs text-gray-500">
                          — {staff.role}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            handleChange(
                              "nonAcademicStaff",
                              formData.nonAcademicStaff.filter(
                                (_, i) => i !== index,
                              ),
                            )
                          }
                          className="text-gray-400 hover:text-red-500 transition font-bold leading-none"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Full name"
                    value={nonAcademicStaffName}
                    onChange={(e) => setNonAcademicStaffName(e.target.value)}
                    className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-all"
                  />
                  <input
                    type="text"
                    placeholder="Role (e.g., Accountant, Librarian)"
                    value={nonAcademicStaffRole}
                    onChange={(e) => setNonAcademicStaffRole(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        if (
                          nonAcademicStaffName.trim() &&
                          nonAcademicStaffRole.trim()
                        ) {
                          handleChange("nonAcademicStaff", [
                            ...formData.nonAcademicStaff,
                            {
                              name: nonAcademicStaffName.trim(),
                              role: nonAcademicStaffRole.trim(),
                            },
                          ]);
                          setNonAcademicStaffName("");
                          setNonAcademicStaffRole("");
                        }
                      }
                    }}
                    className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (
                        nonAcademicStaffName.trim() &&
                        nonAcademicStaffRole.trim()
                      ) {
                        handleChange("nonAcademicStaff", [
                          ...formData.nonAcademicStaff,
                          {
                            name: nonAcademicStaffName.trim(),
                            role: nonAcademicStaffRole.trim(),
                          },
                        ]);
                        setNonAcademicStaffName("");
                        setNonAcademicStaffRole("");
                      }
                    }}
                    className="px-4 py-2.5 bg-gray-600 hover:bg-gray-700 text-white text-sm font-semibold rounded-lg transition-all"
                  >
                    + Add
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1.5">
                  Enter name and role, then press Enter or click Add.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Step navigation */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={prevStep}
            disabled={currentStepIndex <= 0}
            className="px-5 py-2.5 border-2 text-sm border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ← Previous
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="px-8 py-2.5 text-sm bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Profile
              </>
            )}
          </button>
          <button
            type="button"
            onClick={nextStep}
            disabled={currentStepIndex >= STEPS.length - 1}
            className="px-5 py-2.5 border-2 text-sm border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next →
          </button>
        </div>
      </form>
    </div>
  );
}
