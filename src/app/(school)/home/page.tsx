import {
  Building,
  // Calendar,
  MapPin,
  FileText,
  AlertCircle,
  CheckCircle,
  Clock,
} from "lucide-react";
import { getUserFromCookie } from "@/lib/auth";
import Link from "next/link";
import { formatDate } from "@/lib/formatDate";
// import dynamic from "next/dynamic";

// const CompleteProfile = dynamic(() => import("@/components/profilecomplete"), {
//   ssr: true, // or false, depending on your needs
//   loading: () => <div>Loading...</div>, // optional loading state
// });

// Sample stats - these would come from your API
const complianceStats = {
  totalNotices: 10,
  paidNotices: 7,
  complianceScore: 70,
  overdueInvoices: 3,
  upcomingDeadlines: 2,
};

function getDaysUntilExpiry(expiryDate: string) {
  const today = new Date();
  const expiry = new Date(expiryDate);
  const diffTime = expiry.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

export default async function SchoolOverviewDashboard({
  stats = complianceStats,
}: {
  stats?: typeof complianceStats;
}) {
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
              Here&lsquo;s your school&lsquo;s overview and compliance status
            </p>

            <div className="flex flex-wrap gap-4 mt-4">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-700">School Administrator</span>
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
                <span className="text-gray-700">{user?.email}</span>
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

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-gray-500 text-sm">
                <MapPin className="w-4 h-4" />
                <span className="font-medium">Address</span>
              </div>
              <p className="text-gray-900 font-medium">{school?.address}</p>
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
        </div>
      </div>

      {/* Compliance & License Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Compliance Score */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Compliance Score
          </h3>

          <div className="flex flex-col items-center justify-center py-6">
            <div className="relative w-32 h-32">
              <svg className="w-32 h-32 transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="#e5e7eb"
                  strokeWidth="8"
                  fill="none"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="#10b981"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 56}`}
                  strokeDashoffset={`${
                    2 * Math.PI * 56 * (1 - stats.complianceScore / 100)
                  }`}
                  strokeLinecap="round"
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-3xl font-bold text-gray-900">
                  {stats.complianceScore}%
                </span>
              </div>
            </div>

            <div className="w-full mt-6 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Notices Sent</span>
                <span className="font-semibold text-gray-900">
                  {stats.totalNotices}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Notices Paid</span>
                <span className="font-semibold text-green-600">
                  {stats.paidNotices}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Outstanding</span>
                <span className="font-semibold text-red-600">
                  {stats.totalNotices - stats.paidNotices}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* License Information */}
        <div className="lg:col-span-2 bg-gradient-to-br from-green-600 via-emerald-600 to-teal-600 rounded-xl shadow-lg overflow-hidden relative">
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: "url('/KD_logo.png')",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          ></div>

          <div className="relative p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">
                License Information
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
                  License Number
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
                  <strong>Action Required:</strong> Your license will expire in{" "}
                  {daysUntilExpiry} days. Please renew to maintain compliance.
                </p>
              </div>
            )}

            {isExpired && (
              <div className="mt-6 bg-red-500/20 border border-red-400/50 rounded-lg p-4">
                <p className="text-red-100 text-sm">
                  <strong>Urgent:</strong> Your license has expired. Immediate
                  renewal is required to avoid penalties.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Overdue Invoices</p>
              <p className="text-2xl font-bold text-red-600 mt-1">
                {stats.overdueInvoices}
              </p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Upcoming Deadlines</p>
              <p className="text-2xl font-bold text-yellow-600 mt-1">
                {stats.upcomingDeadlines}
              </p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Paid This Year</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {stats.paidNotices}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Documents</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">
                {stats.totalNotices}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// import { Divider } from "@/components/Divider";

// import { Building } from "lucide-react";
// import { ProgressCircle } from "@/components/ui/ProgressCircle";
// import Emptystate from "@/components/ui/emptystate";
// import { getUserFromCookie } from "@/lib/auth";
// import { formatDate } from "@/lib/formatDate";

// import dynamic from "next/dynamic";
// const CompleteProfile = dynamic(() => import("@/components/profilecomplete"), {
//   ssr: true, // or false, depending on your needs
//   loading: () => <div>Loading...</div>, // optional loading state
// });

// export default async function HomeDashboard() {
//   const user = await getUserFromCookie();

//   if (!user) {
//     return (
//       <div className="text-red-500 font-semibold mt-10 text-center">
//         Unauthorized — please log in again.
//       </div>
//     );
//   }
//   // console.log("User object:", user);

//   // ✅ Use an absolute base URL
//   const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

//   // ✅ Use the user's institution to fetch school data
//   const res = await fetch(`${baseUrl}/api/schools/${user.institution}`, {
//     cache: "no-store",
//   });

//   if (!res.ok) {
//     return (
//       <div className="text-center text-red-600">
//         Failed to load school information.
//       </div>
//     );
//   }

//   const school = await res.json();

//   return (
//     <main>
//       <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
//         <div className="w-full">
//           <div className="mb-4">
//             <h3 className="font-semibold text-[#28a745]">
//               Welcome to your Dashboard,{" "}
//               <span className="font-light text-gray-700">{user?.name}</span>
//             </h3>
//             <div className="text-sm max-w-2xl grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 mt-2">
//               <span className="border-r border-gray-300">
//                 Designation: School Admin{" "}
//               </span>
//               <span className="border-r border-gray-300">
//                 Email: {user?.email ?? "N/A"}
//               </span>
//             </div>
//           </div>
//           {/*
//           Conditional Import Inside the Render This is the most recommended
//            and lint-safe way — the import only happens when needed. */}

//           {school?.form_status !== "completed" && <CompleteProfile />}
//         </div>
//       </div>
//       <Divider />
//       <div className="flex flex-col gap-6">
//         <div className="flex items-center gap-4">
//           <div className="px-3 py-3 bg-[#fbbf23] text-black rounded-lg">
//             <Building />
//           </div>

//           <div className="flex flex-col justify-center ">
//             <div className="flex flex-col sm:flex-row sm:items-center">
//               <p>
//                 Tax Identificaation Number:{" "}
//                 {school?.tin ?? (
//                   <div className="sm:ml-2 h-4 w-28 sm:w-32 bg-gray-100 rounded-sm animate-pulse"></div>
//                 )}{" "}
//               </p>
//             </div>
//             <p className="text-lg font-semibold text-gray-900">
//               {school?.name ?? (
//                 <div className="h-7 w-76 sm:w-90 bg-gray-100 rounded-lg animate-pulse"></div>
//               )}{" "}
//             </p>
//           </div>
//         </div>

//         <div className="mt-[3%] mb-[3%] grid sm:grid-cols-4 gap-4 text-sm pt-6 border-t border-gray-300">
//           <div className="border-r border-gray-300 space-y-2">
//             <p className="text-gray-500">Address</p>
//             {school?.address ?? (
//               <div className="h-6 w-48 bg-gray-100 rounded-lg animate-pulse"></div>
//             )}{" "}
//           </div>
//           <div className=" border-r border-gray-300 space-y-2">
//             <p className="text-gray-500">State</p>
//             {school?.state ?? (
//               <div className="h-6  w-48 bg-gray-100 rounded-lg animate-pulse"></div>
//             )}{" "}
//           </div>
//           <div className="border-r border-gray-300 space-y-2">
//             <p className="text-gray-500">LGA</p>
//             {school?.lga ?? (
//               <div className="h-6 w-48 bg-gray-100 rounded-lg animate-pulse"></div>
//             )}{" "}
//           </div>
//           <div className="space-y-2">
//             <p className="text-gray-500">Type of Ownership </p>
//             {school?.ownership ?? (
//               <div className="h-6 w-48 bg-gray-100 rounded-lg animate-pulse"></div>
//             )}{" "}
//           </div>
//         </div>
//         <h2 className="font-semibold">Compliance Score</h2>
//         <div className="flex flex-col items-center sm:flex-row gap-4">
//           <div className="w-full sm:w-fit flex flex-col sm:flex-row border border-gray-300 rounded-xl ">
//             <div className="w-full  sm:w-[16vw] flex py-12 flex-col gap-6">
//               <div className="flex items-center justify-center gap-x-5">
//                 <ProgressCircle
//                   variant="warning"
//                   value={62}
//                   radius={50}
//                   strokeWidth={8}
//                 >
//                   <span className="text-sm font-medium text-gray-900">75%</span>
//                 </ProgressCircle>
//               </div>
//               <div className="flex mx-auto gap-3 text-sm">
//                 <span className="border-l-2 border-[#28a745]  pl-3">
//                   {" "}
//                   Demands Notices Sent
//                 </span>
//                 <span className="font-semibold">10</span>
//               </div>
//               <div className="flex items-center mx-auto gap-3 text-sm">
//                 <span className="border-l-2 border-[#28a745]  pl-3">
//                   {" "}
//                   Demands Notices Paid
//                 </span>
//                 <span className="font-semibold">7</span>
//               </div>
//             </div>

//             <div
//               className="bg-[#28a745]/20 rounded-xl p-5 rounded-l-none"
//               style={{
//                 backgroundImage:
//                   "linear-gradient(rgba(25,155,57,0.9), rgba(25,155,57,1.0)), url('/kirs.png')",
//                 backgroundSize: "620px",
//                 backgroundPosition: "center",
//                 backgroundRepeat: "no-repeat",
//               }}
//             >
//               <div className="mt-[1%] text-white sm:w-[36vw] grid sm:grid-cols-2 gap-6 text-sm pt-6">
//                 <div className="space-y-2">
//                   <p className="font-semibold text-xs uppercase text-black px-3 py-1 bg-[#fbbf23] rounded-sm inline-flex ">
//                     License Number
//                   </p>

//                   <div className="font-base  text-lg">
//                     {school?.license_number ?? (
//                       <div className="h-7 w-68 bg-gray-100  rounded-lg animate-pulse"></div>
//                     )}{" "}
//                   </div>
//                 </div>
//                 <div className=" space-y-2 ">
//                   <p className="font-semibold text-xs uppercase text-black px-3 py-1 bg-[#fbbf23] rounded-sm inline-flex">
//                     License Issue Date
//                   </p>

//                   <div className="font-base text-lg">
//                     {school?.last_license_renewal ? (
//                       formatDate(school.last_license_renewal)
//                     ) : (
//                       <div className="h-7 w-68 bg-gray-100 rounded-lg animate-pulse"></div>
//                     )}
//                   </div>
//                 </div>

//                 <div className=" space-y-2 ">
//                   <p className="font-semibold text-xs uppercase text-black px-3 py-1 bg-[#fbbf23] rounded-sm inline-flex">
//                     License Expiry Date
//                   </p>

//                   <div className="font-base text-lg">
//                     {school?.license_expiry_date ? (
//                       formatDate(school.license_expiry_date)
//                     ) : (
//                       <div className="h-7 w-68 bg-gray-100 rounded-lg animate-pulse"></div>
//                     )}
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//           <div className="w-full sm:w-[30vw]">
//             {" "}
//             <Emptystate />{" "}
//           </div>
//         </div>
//       </div>
//       {/* events grid */}
//     </main>
//   );
// }
