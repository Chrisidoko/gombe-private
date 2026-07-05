"use client";

import { useState } from "react";
import { Edit, CheckCircle, AlertCircle } from "lucide-react";
import { School } from "@/lib/types";

function formatDate(dateString: string | null) {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatCurrency(amount: string | number | null) {
  if (!amount) return "—";
  return `₦${Number(amount).toLocaleString()}`;
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">{label}</p>
      <div className="text-sm font-semibold text-gray-900">{value || "—"}</div>
    </div>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <div className="pb-3 mb-5 border-b border-gray-100">
      <h2 className="text-sm font-bold text-gray-700">{title}</h2>
    </div>
  );
}

const TABS = [
  { id: "general",        label: "General" },
  { id: "academic",       label: "Academic" },
  { id: "facilities",     label: "Facilities" },
  { id: "people",         label: "People" },
  { id: "certificate",    label: "Certificate" },
] as const;
type TabId = typeof TABS[number]["id"];

export default function SchoolProfileView({
  schoolData,
  onEdit,
}: {
  schoolData: School;
  onEdit?: () => void;
}) {
  const [activeTab, setActiveTab] = useState<TabId>("general");

  const courses = (Array.isArray(schoolData?.courses) ? schoolData.courses : []).map(
    (c) => (typeof c === "string" ? { name: c, accredited: true } : c),
  );

  const incomplete = schoolData?.form_status !== "complete";

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900">School Profile</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Last updated: {formatDate(schoolData?.updated_at)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {incomplete && (
            <span className="flex items-center gap-1.5 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-full">
              <AlertCircle className="w-3.5 h-3.5" />
              Profile incomplete
            </span>
          )}
          {!incomplete && (
            <span className="flex items-center gap-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-200 px-3 py-1.5 rounded-full">
              <CheckCircle className="w-3.5 h-3.5" />
              Profile complete
            </span>
          )}
          {onEdit && (
            <button
              onClick={onEdit}
              className="flex items-center gap-2 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg transition-all"
            >
              <Edit className="w-4 h-4" />
              Edit Profile
            </button>
          )}
        </div>
      </div>

      {/* Tab Bar */}
      <div className="bg-white rounded-xl border border-gray-200 px-4 py-2 flex gap-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 px-3 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === tab.id
                ? "bg-green-600 text-white shadow-sm"
                : "text-gray-500 hover:bg-gray-100"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── General ── */}
      {activeTab === "general" && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <SectionTitle title="Institution Details" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Field label="Institution Name" value={schoolData?.name} />
              <Field label="Category" value={schoolData?.category} />
              <Field label="VC / Rector / Provost" value={schoolData?.vc_name} />
              <Field label="GSM Number" value={schoolData?.gsm_no} />
              <Field label="Year Established" value={schoolData?.year_established} />
              <Field label="Site Type" value={schoolData?.property_type} />
              <Field label="LGA" value={schoolData?.lga} />
              <Field label="Address" value={schoolData?.address} />
              <Field
                label="Website"
                value={
                  schoolData?.website ? (
                    <a href={schoolData.website} target="_blank" rel="noreferrer"
                      className="text-blue-600 underline underline-offset-2">
                      {schoolData.website}
                    </a>
                  ) : null
                }
              />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <SectionTitle title="Proprietor & Ownership" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Field label="Proprietor Name" value={schoolData?.proprietor_name} />
              <Field label="Ownership Type" value={schoolData?.ownership} />
              <Field label="TIN Number" value={schoolData?.tin} />
              <Field label="Last Tax Filing" value={formatDate(schoolData?.last_tax_filing)} />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <SectionTitle title="Contact Person" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <Field label="Name" value={schoolData?.contact_person} />
              <Field label="Designation" value={schoolData?.contact_person_designation} />
              <Field label="Phone" value={schoolData?.contact_person_phone} />
            </div>
          </div>
        </div>
      )}

      {/* ── Academic ── */}
      {activeTab === "academic" && (
        <div className="space-y-4">
          {/* Enrolment snapshot */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Total Students", value: schoolData?.total_students ?? "—" },
              { label: "Enrolment Date", value: formatDate(schoolData?.enrollment_snapshot_date) },
              { label: "Graduates (to 2023)", value: schoolData?.graduated_count ?? "—" },
            ].map((s) => (
              <div key={s.label} className="bg-white rounded-xl border border-gray-200 px-5 py-4">
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{s.label}</p>
                <p className="text-xl font-bold text-gray-900">{s.value}</p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <SectionTitle title="Mode of Operation" />
            <div className="flex flex-wrap gap-2">
              {(schoolData?.mode_of_operation ?? []).length > 0 ? (
                schoolData.mode_of_operation.map((m) => (
                  <span key={m} className="px-3 py-1 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold rounded-full">
                    {m}
                  </span>
                ))
              ) : <p className="text-sm text-gray-400">Not specified</p>}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <SectionTitle title="Programmes Offered" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {(schoolData?.programmes ?? []).length > 0 ? (
                schoolData.programmes.map((p) => (
                  <div key={p} className="flex items-center gap-2 px-3 py-2 bg-purple-50 border border-purple-100 rounded-lg">
                    <CheckCircle className="w-4 h-4 text-purple-500 shrink-0" />
                    <span className="text-xs font-medium text-gray-800">{p}</span>
                  </div>
                ))
              ) : <p className="text-sm text-gray-400 col-span-2">No programmes specified</p>}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <SectionTitle title="Courses" />
            {courses.length > 0 ? (
              <>
                <div className="flex gap-4 text-xs font-semibold text-gray-400 mb-3">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
                    Accredited: {courses.filter((c) => c.accredited).length}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />
                    Not Accredited: {courses.filter((c) => !c.accredited).length}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {courses.map((course, i) => (
                    <span
                      key={i}
                      className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border ${
                        course.accredited
                          ? "bg-green-50 border-green-200 text-green-800"
                          : "bg-red-50 border-red-200 text-red-800"
                      }`}
                    >
                      {course.name}
                      <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                        course.accredited ? "bg-green-200 text-green-800" : "bg-red-200 text-red-800"
                      }`}>
                        {course.accredited ? "Accredited" : "Not Accredited"}
                      </span>
                    </span>
                  ))}
                </div>
              </>
            ) : <p className="text-sm text-gray-400">No courses added</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <SectionTitle title="Fees" />
              <div className="space-y-4">
                <Field label="Average Fee per Semester" value={formatCurrency(schoolData?.avg_fee)} />
                <Field label="Total Annual Revenue" value={formatCurrency(schoolData?.total_revenue)} />
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <SectionTitle title="Academic Calendar" />
              <div className="space-y-4">
                <Field label="Session" value={schoolData?.academic_session} />
                <Field label="Start Date" value={formatDate(schoolData?.session_start)} />
                <Field label="End Date" value={formatDate(schoolData?.session_end)} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Facilities ── */}
      {activeTab === "facilities" && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <SectionTitle title="Infrastructure Availability" />
          <p className="text-xs text-gray-400 mb-6">
            Availability as reported by the institution. Adequacy is assessed separately by an inspector.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { label: "Laboratories / Workshop", value: schoolData?.lab_status },
              { label: "Library", value: schoolData?.library_status },
            ].map((f) => (
              <div key={f.label} className="flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-gray-50">
                <p className="text-sm font-semibold text-gray-700">{f.label}</p>
                {f.value ? (
                  <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${
                    f.value === "Available"
                      ? "bg-green-100 text-green-700 border border-green-200"
                      : "bg-red-100 text-red-700 border border-red-200"
                  }`}>
                    {f.value}
                  </span>
                ) : (
                  <span className="text-xs text-gray-400">Not set</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── People ── */}
      {activeTab === "people" && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <SectionTitle title="Board Members" />
            {(schoolData?.board_members ?? []).length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {schoolData.board_members.map((m, i) => (
                  <span key={i} className="px-3 py-1.5 bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs font-semibold rounded-full">
                    {m}
                  </span>
                ))}
              </div>
            ) : <p className="text-sm text-gray-400">No board members added</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <SectionTitle title="Academic Staff" />
              {(schoolData?.academic_staff ?? []).length > 0 ? (
                <div className="space-y-2">
                  {schoolData.academic_staff.map((s, i) => (
                    <div key={i} className="flex items-center justify-between px-3 py-2 bg-blue-50 border border-blue-100 rounded-lg">
                      <span className="text-xs font-semibold text-gray-800">{s.name}</span>
                      <span className="text-xs text-blue-600 font-medium">{s.qualification}</span>
                    </div>
                  ))}
                </div>
              ) : <p className="text-sm text-gray-400">No academic staff added</p>}
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <SectionTitle title="Non-Academic Staff" />
              {(schoolData?.non_academic_staff ?? []).length > 0 ? (
                <div className="space-y-2">
                  {schoolData.non_academic_staff.map((s, i) => (
                    <div key={i} className="flex items-center justify-between px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg">
                      <span className="text-xs font-semibold text-gray-800">{s.name}</span>
                      <span className="text-xs text-gray-500 font-medium">{s.role}</span>
                    </div>
                  ))}
                </div>
              ) : <p className="text-sm text-gray-400">No non-academic staff added</p>}
            </div>
          </div>
        </div>
      )}

      {/* ── Certificate ── */}
      {activeTab === "certificate" && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <SectionTitle title="Consent Certificate" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Current Status</p>
              {schoolData?.license_status ? (
                <span className={`inline-flex items-center gap-2 px-4 py-2 text-sm rounded-lg font-semibold ${
                  schoolData.license_status === "Active"
                    ? "bg-green-100 text-green-700 border border-green-200"
                    : "bg-red-100 text-red-700 border border-red-200"
                }`}>
                  <CheckCircle className="w-4 h-4" />
                  {schoolData.license_status}
                </span>
              ) : (
                <span className="text-sm text-gray-400">Not recorded</span>
              )}
            </div>
            <Field label="Certificate / License Number" value={schoolData?.license_number} />
            <Field label="Amount Paid" value={formatCurrency(schoolData?.prev_amount)} />
            <Field label="Payment Date" value={formatDate(schoolData?.prev_licence_date)} />
          </div>
        </div>
      )}
    </div>
  );
}
