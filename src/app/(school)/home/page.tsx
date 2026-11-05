import {
  AlertCircle,
  ArrowRight,
  CheckCircle,
  Clock,
  ShieldCheck,
} from "lucide-react";
import { getUserFromCookie, authHeaders } from "@/lib/auth";
import Link from "next/link";
import { formatDate } from "@/lib/formatDate";
import ComplyCard from "@/components/ui/complyCard";
import { getActionItems } from "@/lib/compliance";
import { getCertificateState, getDisplayedExpiry } from "@/lib/certificate";

const naira = (n: number) => `₦${n.toLocaleString()}`;

export default async function SchoolOverviewDashboard() {
  const user = await getUserFromCookie();

  if (!user) {
    return (
      <div className="text-red-600 font-semibold">
        Error: Missing school ID.
      </div>
    );
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/schools/${user.institution}`, {
    cache: "no-store",
    headers: await authHeaders(),
  });

  if (!res.ok) {
    return (
      <div className="text-center text-red-600">
        Failed to load school information.
      </div>
    );
  }

  const school = await res.json();
  const actions = await getActionItems(user.institution || "");

  const isApproved = school?.approval_status === "approved";
  const profileComplete = school?.form_status === "complete";
  const certificate = getCertificateState(school);
  const expiryDate = getDisplayedExpiry(school);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
        <div className="min-w-0">
          <p className="text-xs text-gray-500">Welcome back, {user?.name}</p>
          <h1 className="text-xl font-bold text-gray-900 truncate">
            {school?.name}
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            TIN {school?.tin || "—"}
            {school?.lga ? ` · ${school.lga}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border ${
              isApproved
                ? "bg-green-50 border-green-200 text-green-700"
                : "bg-amber-50 border-amber-200 text-amber-700"
            }`}
          >
            {isApproved ? (
              <CheckCircle className="w-3.5 h-3.5" />
            ) : (
              <Clock className="w-3.5 h-3.5" />
            )}
            {isApproved ? "Approved" : "Awaiting approval"}
          </span>
          {profileComplete ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border bg-green-50 border-green-200 text-green-700">
              <CheckCircle className="w-3.5 h-3.5" />
              Profile complete
            </span>
          ) : (
            <Link
              href="/profile"
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border bg-yellow-50 border-yellow-200 text-yellow-800 hover:bg-yellow-100"
            >
              <AlertCircle className="w-3.5 h-3.5" />
              Profile incomplete
            </Link>
          )}
        </div>
      </div>

      {/* Compliance score and certificate */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ComplyCard school_id={school.school_id} wide showNextStep />
        </div>

        <div className="bg-gradient-to-br from-green-600 via-emerald-600 to-teal-600 rounded-xl shadow-lg overflow-hidden relative">
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: "url('/gombe_logo.png')",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          ></div>
          <div className="relative p-6 h-full flex flex-col">
            <div className="flex items-center justify-between gap-3 mb-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5" />
                Certificate
              </h3>
              {certificate === "valid" ? (
                <span className="bg-white text-green-600 px-3 py-1 rounded-full text-xs font-bold">
                  ACTIVE
                </span>
              ) : certificate === "expired" ? (
                <span className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                  EXPIRED
                </span>
              ) : (
                <span className="bg-white/20 text-white px-3 py-1 rounded-full text-xs font-bold">
                  NOT ISSUED
                </span>
              )}
            </div>

            {certificate === "none" ? (
              <p className="text-sm text-green-50">
                {isApproved
                  ? "Your certificate is issued once the Certificate fee is paid."
                  : "Your certificate is issued after your institution is approved."}
              </p>
            ) : (
              <div className="space-y-3">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-3 border border-white/20">
                  <p className="text-yellow-300 text-[11px] font-semibold uppercase">
                    Certificate Number
                  </p>
                  <p className="text-white text-lg font-bold">
                    {school?.license_number || "—"}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-3 border border-white/20">
                    <p className="text-yellow-300 text-[11px] font-semibold uppercase">
                      Issued
                    </p>
                    <p className="text-white text-sm font-bold">
                      {school?.last_license_renewal
                        ? formatDate(school.last_license_renewal)
                        : "N/A"}
                    </p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-3 border border-white/20">
                    <p className="text-yellow-300 text-[11px] font-semibold uppercase">
                      Expires
                    </p>
                    <p className="text-white text-sm font-bold">
                      {expiryDate
                        ? formatDate(String(expiryDate))
                        : "Does not expire"}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Everything outstanding, most urgent first */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-gray-900">Action Needed</h3>
          {actions.length > 0 && (
            <span className="text-xs font-semibold text-gray-500">
              {actions.length} item{actions.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        {actions.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <CheckCircle className="w-8 h-8 text-green-500 mx-auto" />
            <p className="mt-2 text-sm font-semibold text-gray-700">
              You&apos;re all caught up
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              Nothing to pay or file right now.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {actions.map((item, i) => (
              <Link
                key={`${item.source}-${item.label}-${i}`}
                href={item.href}
                className="flex items-center justify-between gap-4 px-6 py-3.5 hover:bg-gray-50 transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-800 sm:truncate">
                    {item.label}
                  </p>
                  <p className="text-xs text-gray-400">
                    {item.source}
                    {item.dueDate &&
                      ` · ${item.overdue ? "was due" : "due"} ${formatDate(item.dueDate)}`}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {item.overdue && (
                    <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-red-50 text-red-600">
                      Overdue
                    </span>
                  )}
                  {item.amount !== null && (
                    <span className="text-sm font-bold text-gray-800">
                      {naira(item.amount)}
                    </span>
                  )}
                  <ArrowRight className="w-4 h-4 text-gray-300" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
