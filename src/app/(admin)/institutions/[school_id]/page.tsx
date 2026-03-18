// app/(admin)/institutions/[school_id]/page.tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  MapPin,
  //   Phone,
  //   Mail,
  GraduationCap,
  //   Users,
  Calendar,
  BadgeCheck,
  //   FileText,
  DollarSign,
} from "lucide-react";

type School = {
  school_id: string;
  name: string;
  email: string;
  contact_person_phone: string;
  contact_person: string;
  contact_person_designation: string;
  proprietor_name: string;
  address: string;
  lga: string;
  state: string;
  tin: string;
  ownership: string;
  website: string | null;
  approval_status: string;
  license_status: string;
  license_number: string | null;
  last_license_renewal: string | null;
  license_expiry_date: string | null;
  form_status: string;
  programmes: string[];
  courses: string[];
  mode_of_operation: string[];
  category: string | null;
  avg_fee: string | null;
  total_revenue: string | null;
  academic_session: string | null;
  session_start: string | null;
  session_end: string | null;
  total_students: number | null;
  total_staff: number | null;
  total_academic_staff: number | null;
  created_at: string;
  updated_at: string | null;
};

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatCurrency(v: string | null) {
  if (!v) return "—";
  return `₦${parseFloat(v).toLocaleString()}`;
}

function StatusBadge({ value }: { value: string }) {
  const map: Record<string, string> = {
    approved: "bg-green-100 text-green-700 border-green-200",
    unapproved: "bg-red-50 text-red-600 border-red-200",
    pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
    Active: "bg-green-100 text-green-700 border-green-200",
    Expired: "bg-red-50 text-red-600 border-red-200",
    Inactive: "bg-gray-100 text-gray-500 border-gray-200",
    complete: "bg-blue-100 text-blue-700 border-blue-200",
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide border ${
        map[value] ?? "bg-gray-100 text-gray-500 border-gray-200"
      }`}
    >
      {value}
    </span>
  );
}

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-green-50 border border-green-100">
          <Icon className="w-4 h-4 text-green-600" />
        </div>
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-widest">
          {title}
        </h2>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-0.5">
        {label}
      </p>
      <p className="text-sm font-medium text-gray-800">{value || "—"}</p>
    </div>
  );
}

async function getSchool(school_id: string): Promise<School | null> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const res = await fetch(
    `${baseUrl}/api/admin/schools/${encodeURIComponent(school_id)}`,
    { cache: "no-store" },
  );
  if (!res.ok) return null;
  return res.json();
}

export default async function InstitutionDetailPage({
  params,
}: {
  params: Promise<{ school_id: string }>; // ← Promise type
}) {
  const { school_id } = await params; // ← await it
  const school = await getSchool(school_id);

  if (!school) notFound();

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Back + Header */}
        <div>
          <Link
            href="/institutions"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Institutions
          </Link>

          <div className="flex items-start justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-green-50 border border-green-100">
                <Building2 className="w-7 h-7 text-green-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {school.name}
                </h1>
                <p className="text-xs font-mono text-gray-400 mt-0.5">
                  {school.school_id} | TIN: {school.tin}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <StatusBadge value={school.approval_status} />
              <StatusBadge value={school.license_status || "Inactive"} />
              {school.form_status && <StatusBadge value={school.form_status} />}
            </div>
          </div>
        </div>

        {/* Contact & Location */}
        <Section icon={MapPin} title="Contact & Location">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <Field
              label="Email"
              value={
                <a
                  href={`mailto:${school.email}`}
                  className="text-blue-600 hover:underline"
                >
                  {school.email}
                </a>
              }
            />
            <Field label="Proprietor" value={school.proprietor_name} />
            <Field label="LGA" value={school.lga} />
            <Field label="State" value={school.state} />
            <Field label="Ownership" value={school.ownership} />
            <Field label="Address" value={school.address} />
            <Field label="Contact Person" value={school.contact_person} />
            <Field
              label="Contact Person Designation"
              value={school.contact_person_designation}
            />
            <Field label="Contact Phone" value={school.contact_person_phone} />
            <Field
              label="Website"
              value={
                <a className="text-blue-600 hover:underline">
                  {school.website}{" "}
                </a>
              }
            />
          </div>
        </Section>

        {/* License Information */}
        <Section icon={BadgeCheck} title="Certificate & Account Information">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <Field label="Certificate Number" value={school.license_number} />
            <Field
              label="Certificatee Status"
              value={
                <StatusBadge value={school.license_status || "Inactive"} />
              }
            />
            <Field
              label="Last Renewal"
              value={formatDate(school.last_license_renewal)}
            />
            <Field
              label="Expiry Date"
              value={formatDate(school.license_expiry_date)}
            />
            <Field
              label="Form Status"
              value={<StatusBadge value={school.form_status} />}
            />
            <Field
              label="Approval Status"
              value={<StatusBadge value={school.approval_status} />}
            />
          </div>
        </Section>

        {/* Academic Information */}
        <Section icon={GraduationCap} title="Academic Information">
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              <Field label="Academic Session" value={school.academic_session} />
              <Field
                label="Session Start"
                value={formatDate(school.session_start)}
              />
              <Field
                label="Session End"
                value={formatDate(school.session_end)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {/* Category */}

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-2">
                  Category
                </p>
                <div className="flex text-sm flex-wrap gap-2">
                  <span>{school.category}</span>
                </div>
              </div>

              {/* Mode of Operation */}
              {school.mode_of_operation?.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-2">
                    Mode of Operation
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {school.mode_of_operation.map((m) => (
                      <span
                        key={m}
                        className="text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100 px-3 py-1 rounded-full"
                      >
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {/* Programmes */}
            {school.programmes?.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-2">
                  Programmes Offered
                </p>
                <div className="flex flex-wrap gap-2">
                  {school.programmes.map((p) => (
                    <span
                      key={p}
                      className="text-xs font-medium bg-green-50 text-green-700 border border-green-100 px-3 py-1 rounded-full"
                    >
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Courses */}
            {school.courses?.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-2">
                  Courses
                </p>
                <div className="flex flex-wrap gap-2">
                  {school.courses.map((c) => (
                    <span
                      key={c}
                      className="text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200 px-3 py-1 rounded-full"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Section>

        {/* Staff & Students */}
        {/* <Section icon={Users} title="Staff & Students">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="bg-gray-50 rounded-xl px-4 py-4 text-center border border-gray-100">
              <p className="text-2xl font-black text-gray-800">
                {school.total_students?.toLocaleString() ?? "—"}
              </p>
              <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest font-semibold">
                Total Students
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl px-4 py-4 text-center border border-gray-100">
              <p className="text-2xl font-black text-gray-800">
                {school.total_staff?.toLocaleString() ?? "—"}
              </p>
              <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest font-semibold">
                Total Staff
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl px-4 py-4 text-center border border-gray-100">
              <p className="text-2xl font-black text-gray-800">
                {school.total_academic_staff?.toLocaleString() ?? "—"}
              </p>
              <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest font-semibold">
                Academic Staff
              </p>
            </div>
          </div>
        </Section> */}

        {/* Financial Information */}
        <Section icon={DollarSign} title="Financial Information">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field
              label="Average Fee per Student"
              value={formatCurrency(school.avg_fee)}
            />
            <Field
              label="Last Year Revenue"
              value={formatCurrency(school.total_revenue)}
            />
          </div>
        </Section>

        {/* Record Info */}
        <Section icon={Calendar} title="Record Information">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field
              label="Date Registered"
              value={formatDate(school.created_at)}
            />
            <Field label="Last Updated" value={formatDate(school.updated_at)} />
          </div>
        </Section>
      </div>
    </div>
  );
}
