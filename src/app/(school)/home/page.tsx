import {
  Building,
  // Calendar,
  // MapPin,
  // FileText,
  AlertCircle,
  CheckCircle,
  Clock,
} from "lucide-react";
import { getUserFromCookie } from "@/lib/auth";
import Link from "next/link";
import { formatDate } from "@/lib/formatDate";
import ComplyCard from "@/components/ui/complyCard";
// import dynamic from "next/dynamic";

// const CompleteProfile = dynamic(() => import("@/components/profilecomplete"), {
//   ssr: true, // or false, depending on your needs
//   loading: () => <div>Loading...</div>, // optional loading state
// });

// Sample stats - these would come from your API
const complianceStats = {
  totalNotices: 0,
  paidNotices: 0,
  complianceScore: 0,
  overdueInvoices: 0,
  upcomingDeadlines: 0,
};

function getDaysUntilExpiry(expiryDate: string) {
  const today = new Date();
  const expiry = new Date(expiryDate);
  const diffTime = expiry.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

export default async function SchoolOverviewDashboard(
  {
    // stats = complianceStats,
  }: {
    stats?: typeof complianceStats;
  },
) {
  const user = await getUserFromCookie();

  if (!user) {
    return (
      <div className="text-red-500 font-semibold mt-10 text-center">
        Unauthorized — please log in again.
      </div>
    );
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/schools/${user.institution}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    return (
      <div className="text-center text-red-600">
        Failed to load school information.
      </div>
    );
  }

  const school = await res.json();

  const daysUntilExpiry = school.license_expiry_date
    ? getDaysUntilExpiry(school.license_expiry_date)
    : null;

  const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry <= 30;
  const isExpired = daysUntilExpiry !== null && daysUntilExpiry < 0;

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-green-50 to-orange-50 rounded-xl p-6 border border-green-100">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome back, <span className="text-green-600">{user?.name}</span>
            </h1>
            <p className="text-gray-600 mt-1">
              Here&lsquo;s your institution&lsquo;s overview and compliance
              status
            </p>

            <div className="flex flex-wrap gap-4 mt-4">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <svg
                  className="w-4 h-4 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                <span className="text-sm font-semibold text-gray-600">
                  {user?.email}
                </span>
              </div>
            </div>
          </div>

          {school?.form_status !== "complete" && (
            <Link
              href="/profile"
              className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-2 flex items-center gap-2 cursor-pointer"
            >
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-800">
                Profile Incomplete
              </span>
            </Link>
          )}
        </div>
      </div>

      {/* School Information Card */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="bg-green-600 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
              <Building className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-white">{school?.name}</h2>
              <p className="text-blue-100 text-sm">TIN: {school?.tin}</p>
            </div>
          </div>
        </div>
        {/* 
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-gray-500 text-sm">
                <MapPin className="w-4 h-4" />
                <span className="font-medium">Address</span>
              </div>
              <p className="text-gray-900 text-sm font-medium">
                {school?.address}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-gray-500 text-sm">
                <MapPin className="w-4 h-4" />
                <span className="font-medium">State</span>
              </div>
              <p className="text-gray-900 font-medium">{school?.state}</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-gray-500 text-sm">
                <MapPin className="w-4 h-4" />
                <span className="font-medium">LGA</span>
              </div>
              <p className="text-gray-900 font-medium">{school?.lga}</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-gray-500 text-sm">
                <Building className="w-4 h-4" />
                <span className="font-medium">Ownership</span>
              </div>
              <p className="text-gray-900 font-medium">{school?.ownership}</p>
            </div>
          </div>
        </div> */}
      </div>

      {/* Compliance & License Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Compliance Score */}
        <ComplyCard school_id={school.school_id} />

        {/* License Information */}
        <div className="lg:col-span-2 bg-gradient-to-br from-green-600 via-emerald-600 to-teal-600 rounded-xl shadow-lg overflow-hidden relative">
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: "url('/gombe_logo.png')",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          ></div>

          <div className="relative p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">
                Certificate Information
              </h3>
              {isExpired ? (
                <span className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  EXPIRED
                </span>
              ) : isExpiringSoon ? (
                <span className="bg-yellow-400 text-gray-900 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  EXPIRING SOON
                </span>
              ) : (
                <span className="bg-white text-green-600 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" />
                  ACTIVE
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                <p className="text-yellow-300 text-xs font-semibold uppercase mb-2">
                  Certificate Number
                </p>
                <p className="text-white text-lg font-bold">
                  {school?.license_number}
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                <p className="text-yellow-300 text-xs font-semibold uppercase mb-2">
                  Issue Date
                </p>
                <p className="text-white text-lg font-bold">
                  {school?.last_license_renewal
                    ? formatDate(school.last_license_renewal)
                    : "N/A"}
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                <p className="text-yellow-300 text-xs font-semibold uppercase mb-2">
                  Expiry Date
                </p>
                <p className="text-white text-lg font-bold">
                  {school?.license_expiry_date
                    ? formatDate(school.license_expiry_date)
                    : "N/A"}
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                <p className="text-yellow-300 text-xs font-semibold uppercase mb-2">
                  Days Remaining
                </p>
                <p
                  className={`text-lg font-bold ${
                    isExpired
                      ? "text-red-300"
                      : isExpiringSoon
                        ? "text-yellow-300"
                        : "text-white"
                  }`}
                >
                  {daysUntilExpiry !== null
                    ? isExpired
                      ? `Expired ${Math.abs(daysUntilExpiry)} days ago`
                      : `${daysUntilExpiry} days`
                    : "N/A"}
                </p>
              </div>
            </div>

            {isExpiringSoon && !isExpired && (
              <div className="mt-6 bg-yellow-400/20 border border-yellow-400/50 rounded-lg p-4">
                <p className="text-yellow-100 text-sm">
                  <strong>Action Required:</strong> Your certificate will expire
                  in {daysUntilExpiry} days. Please renew to maintain
                  compliance.
                </p>
              </div>
            )}

            {isExpired && (
              <div className="mt-6 bg-red-500/20 border border-red-400/50 rounded-lg p-4">
                <p className="text-red-100 text-sm">
                  <strong>Urgent:</strong> Your certificate has expired.
                  Immediate renewal is required to avoid penalties.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
