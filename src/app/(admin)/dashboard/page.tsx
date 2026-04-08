import React from "react";
// import pool from "@/lib/db";
import {
  School,
  CheckCircle2,
  FileCheck,
  // Clock,
  Users,
  Building2,
  GraduationCap,
  BookOpen,
  Stethoscope,
  Computer,
} from "lucide-react";
import { getUserFromCookie } from "@/lib/auth";
import LGAChart from "@/components/ui/LGACharts";

interface SchoolStats {
  totalSchools: number;
  activeSchools: number;
  pendingApprovals: number;
  totalLicenses: number;
  totalPolytechnics: number;
  totalUniversities: number;
  totalCollegesOfEducation: number;
  totalSchoolsOfHealthTechnology: number;
}

// Dummy data
const dashboardStats = {
  activeLicenses: 0,
  expiringLicenses: 0,
  schoolsByCategory: {
    polytechnics: 0,
    universities: 0,
    colleges: 0,
    healthTech: 0,
    examcenters: 0,
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
      className="bg-white rounded-lg shadow-md p-5 border-b-4 transition-all hover:shadow-lg"
      style={{ borderBottomColor: color }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div
          className="p-2 rounded-lg"
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
    <div className="bg-white h-32 rounded-lg shadow-md px-4 py-4 hover:shadow-lg transition-all">
      <div className="flex flex-col items-start gap-4">
        <div
          className="p-2 rounded-full"
          style={{ backgroundColor: `${color}20` }}
        >
          <div style={{ color }}>{icon}</div>
        </div>
        <div className="mt-1">
          <p className="text-xs font-medium text-gray-500">{category}</p>
          <p className="text-xl font-semibold text-gray-900">{count}</p>
        </div>
      </div>
    </div>
  );
};

async function getSchoolStats(): Promise<SchoolStats> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/dashboard/stats`, {
    cache: "no-store", // ← make sure this exists on every fetch
  });

  if (!res.ok) throw new Error("Failed to fetch school stats");

  return res.json();
}

export default async function AdminDashboard() {
  const user = await getUserFromCookie();
  const stats = await getSchoolStats();

  if (!user) {
    return (
      <div className="text-red-500 font-semibold mt-10 text-center">
        Unauthorized — please log in again.
      </div>
    );
  }
  // console.log("User object:", user);

  return (
    <main className="px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-6">
        <div className="w-full">
          <div className="mb-4 flex flex-col sm:flex-row justify-between items-center">
            {/* <h3 className="font-semibold text-gray-900 text-2xl">
              Dashboard Overview{" "}
            </h3> */}
            <div className="text-sm grid grid-cols-1 gap-2 mt-2">
              <div className="flex items-center gap-2">
                <div className="text-base text-gray-500">
                  <span className="font-semibold text-sm text-gray-700">
                    {user?.name}
                  </span>
                </div>

                <div className="bg-green-500/20 rounded-md p-1 flex items-center justify-center">
                  <span className="mx-auto text-xs text-green-700 font-semibold">
                    ADMIN
                  </span>
                </div>
              </div>
              <span className="text-center sm:text-left text-gray-600 text-xs">
                {user?.email ?? "N/A"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Statistics Grid */}
      <div className="mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Institutions"
            value={stats.totalSchools}
            icon={<School size={20} />}
            color="#3b82f6"
            subtitle="Registered"
          />
          <StatCard
            title="Active Institutions"
            value={stats.activeSchools}
            icon={<CheckCircle2 size={20} />}
            color="#10b981"
            subtitle="Approved & Operational"
          />
          <StatCard
            title="Pending Approvals"
            value={stats.pendingApprovals}
            icon={<FileCheck size={20} />}
            color="#8b5cf6"
            subtitle="Awaiting verification"
          />
          <StatCard
            title="Total Certificates"
            value={stats.totalLicenses}
            icon={<Users size={20} />}
            color="#f59e0b"
            subtitle="All Consent Certificates"
          />
        </div>
      </div>

      {/* Schools by Category */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row gap-3">
          <LGAChart />
          <div className="h-1/3 md:w-1/3 grid grid-cols-2 gap-4 md:ml-auto">
            <CategoryCard
              category="Polytechnics"
              count={stats.totalPolytechnics}
              icon={<Building2 size={20} />}
              color="#06b6d4"
            />
            <CategoryCard
              category="Universities"
              count={stats.totalUniversities}
              icon={<GraduationCap size={20} />}
              color="#8b5cf6"
            />
            <CategoryCard
              category="Colleges"
              count={stats.totalCollegesOfEducation}
              icon={<BookOpen size={20} />}
              color="#ec4899"
            />
            <CategoryCard
              category="Health Technology"
              count={stats.totalSchoolsOfHealthTechnology}
              icon={<Stethoscope size={20} />}
              color="#f59e0b"
            />
            <CategoryCard
              category="Exam Centers"
              count={dashboardStats.schoolsByCategory.examcenters}
              icon={<Computer size={20} />}
              color="#f59e0b"
            />
          </div>
        </div>
      </div>

      {/* Consent Details */}
      {/* <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Management</h2>
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
                Consent Certificates
              </h3>
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileCheck size={20} className="text-blue-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {stats.totalLicenses - dashboardStats.activeLicenses}
            </p>
            <p className="text-xs text-gray-500 mt-1">Assigned and In-use</p>
          </div>
        </div>
      </div> */}

      {/* Summary Card */}
      {/* <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow-md p-6 border border-blue-200">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Quick Summary
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-blue-600">
              {Math.round(
                (dashboardStats.activeSchools / dashboardStats.totalSchools) *
                  100,
              )}
              %
            </p>
            <p className="text-xs text-gray-600 mt-1">Schools Active</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-green-600">
              {Math.round(
                (dashboardStats.activeLicenses / dashboardStats.totalLicenses) *
                  100,
              )}
              %
            </p>
            <p className="text-xs text-gray-600 mt-1">Licenses Utilized</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-purple-600">
              {dashboardStats.pendingApprovals}
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
      </div> */}
    </main>
  );
}
