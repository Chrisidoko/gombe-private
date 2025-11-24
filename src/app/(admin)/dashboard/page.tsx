import React from "react";
import {
  School,
  CheckCircle2,
  FileCheck,
  Clock,
  Users,
  Building2,
  GraduationCap,
  BookOpen,
} from "lucide-react";
import { getUserFromCookie } from "@/lib/auth";

// Dummy data
const dashboardStats = {
  totalSchools: 156,
  activeSchools: 142,
  approvedSchools: 148,
  totalLicenses: 200,
  activeLicenses: 167,
  expiringLicenses: 23,
  schoolsByCategory: {
    polytechnics: 45,
    universities: 67,
    colleges: 44,
  },
};

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  color,
  subtitle,
}) => {
  return (
    <div
      className="bg-white rounded-lg shadow-md p-6 border-l-4 transition-all hover:shadow-lg"
      style={{ borderLeftColor: color }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div
          className="p-3 rounded-lg"
          style={{ backgroundColor: `${color}20` }}
        >
          <div style={{ color }}>{icon}</div>
        </div>
      </div>
    </div>
  );
};

interface CategoryCardProps {
  category: string;
  count: number;
  icon: React.ReactNode;
  color: string;
}

const CategoryCard: React.FC<CategoryCardProps> = ({
  category,
  count,
  icon,
  color,
}) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-5 hover:shadow-lg transition-all">
      <div className="flex items-center gap-4">
        <div
          className="p-3 rounded-full"
          style={{ backgroundColor: `${color}20` }}
        >
          <div style={{ color }}>{icon}</div>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-600">{category}</p>
          <p className="text-2xl font-bold text-gray-900">{count}</p>
        </div>
      </div>
    </div>
  );
};

export default async function AdminDashboard() {
  const user = await getUserFromCookie();

  if (!user) {
    return (
      <div className="text-red-500 font-semibold mt-10 text-center">
        Unauthorized — please log in again.
      </div>
    );
  }
  console.log("User object:", user);

  return (
    <main className="p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-6">
        <div className="w-full">
          <div className="mb-4">
            <h3 className="font-semibold text-[#28a745] text-xl">
              Welcome to your Dashboard,
              <span className="font-light text-gray-700"> {user?.name}</span>
            </h3>
            <div className="text-sm max-w-2xl grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 mt-2">
              <span className="border-r border-gray-300 pr-4">
                Designation: CBS Admin{" "}
              </span>
              <span className="text-gray-600">
                Email: {user?.email ?? "N/A"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full h-px bg-gray-300 my-6" />

      {/* Main Statistics Grid */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Overview Statistics
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Schools"
            value={dashboardStats.totalSchools}
            icon={<School size={24} />}
            color="#3b82f6"
            subtitle="Registered institutions"
          />
          <StatCard
            title="Active Schools"
            value={dashboardStats.activeSchools}
            icon={<CheckCircle2 size={24} />}
            color="#10b981"
            subtitle="Currently operational"
          />
          <StatCard
            title="Approved Schools"
            value={dashboardStats.approvedSchools}
            icon={<FileCheck size={24} />}
            color="#8b5cf6"
            subtitle="Verified & approved"
          />
          <StatCard
            title="Total Licenses"
            value={dashboardStats.totalLicenses}
            icon={<Users size={24} />}
            color="#f59e0b"
            subtitle="All licenses issued"
          />
        </div>
      </div>

      {/* License Details */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          License Management
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-600">
                Active Licenses
              </h3>
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle2 size={20} className="text-green-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {dashboardStats.activeLicenses}
            </p>
            <p className="text-xs text-gray-500 mt-1">Currently in use</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-600">
                Expiring Soon
              </h3>
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock size={20} className="text-orange-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {dashboardStats.expiringLicenses}
            </p>
            <p className="text-xs text-gray-500 mt-1">Within 30 days</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-600">
                Available Licenses
              </h3>
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileCheck size={20} className="text-blue-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {dashboardStats.totalLicenses - dashboardStats.activeLicenses}
            </p>
            <p className="text-xs text-gray-500 mt-1">Ready to assign</p>
          </div>
        </div>
      </div>

      {/* Schools by Category */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Schools by Category
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <CategoryCard
            category="Polytechnics"
            count={dashboardStats.schoolsByCategory.polytechnics}
            icon={<Building2 size={24} />}
            color="#06b6d4"
          />
          <CategoryCard
            category="Universities"
            count={dashboardStats.schoolsByCategory.universities}
            icon={<GraduationCap size={24} />}
            color="#8b5cf6"
          />
          <CategoryCard
            category="Colleges"
            count={dashboardStats.schoolsByCategory.colleges}
            icon={<BookOpen size={24} />}
            color="#ec4899"
          />
        </div>
      </div>

      {/* Summary Card */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow-md p-6 border border-blue-200">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Quick Summary
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-blue-600">
              {Math.round(
                (dashboardStats.activeSchools / dashboardStats.totalSchools) *
                  100
              )}
              %
            </p>
            <p className="text-xs text-gray-600 mt-1">Schools Active</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-green-600">
              {Math.round(
                (dashboardStats.activeLicenses / dashboardStats.totalLicenses) *
                  100
              )}
              %
            </p>
            <p className="text-xs text-gray-600 mt-1">Licenses Utilized</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-purple-600">
              {dashboardStats.approvedSchools}
            </p>
            <p className="text-xs text-gray-600 mt-1">Approved Total</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-orange-600">
              {dashboardStats.expiringLicenses}
            </p>
            <p className="text-xs text-gray-600 mt-1">Need Attention</p>
          </div>
        </div>
      </div>
    </main>
  );
}

// import { Divider } from "@/components/Divider";

// // import { Building } from "lucide-react";

// // import Emptystate from "@/components/ui/emptystate";

// import { getUserFromCookie } from "@/lib/auth";
// // import { formatDate } from "@/lib/formatDate";

// export default async function HomeDashboard() {
//   const user = await getUserFromCookie();

//   if (!user) {
//     return (
//       <div className="text-red-500 font-semibold mt-10 text-center">
//         Unauthorized — please log in again.
//       </div>
//     );
//   }
//   console.log("User object:", user);

// return (
//   <main>
//     <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
//       <div className="w-full">
//         <div className="mb-4">
//           <h3 className="font-semibold text-[#28a745]">
//             Welcome to your Dashboard,
//             <span className="font-light text-gray-700"> {user?.name}</span>
//           </h3>
//           <div className="text-sm max-w-2xl grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 mt-2">
//             <span className="border-r border-gray-300">
//               Designation: CBS Admin{" "}
//             </span>
//             <span className="border-r border-gray-300">
//               Email: {user?.email ?? "N/A"}
//             </span>
//           </div>
//         </div>
//       </div>
//     </div>
//     <Divider />

//     {/* events grid */}
//   </main>
// );
// }
