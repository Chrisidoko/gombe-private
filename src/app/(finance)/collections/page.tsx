import React from "react";

// import {
//   School,
//   CheckCircle2,
//   Computer,
// } from "lucide-react";
import { getUserFromCookie } from "@/lib/auth";
import TopPaymentsChart from "@/components/ui/TopPaymentsChart";
import LGARevenueChart from "@/components/ui/Lgarevenuechart";

interface SummariesResponse {
  today: {
    count: number;
    total: number;
  };
  week: {
    count: number;
    total: number;
  };
  month: {
    count: number;
    total: number;
  };
  year: {
    count: number;
    total: number;
  };

  topPayments: {
    name: string;
    count: number;
    total: number;
  }[];
}

interface StatCardProps {
  title: string;
  value: number;
  count: number;
  color: string;
  subtitle?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  count,
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
          <p className="text-xs font-medium text-gray-400 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-800"> ₦ {value}</p>
          <div className="flex items-end gap-1">
            <div
              className="px-1 rounded-sm"
              style={{ backgroundColor: `${color}20` }}
            >
              <div className="text-xs" style={{ color }}>
                {count}
              </div>
            </div>
            {subtitle && (
              <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

async function getSummariesStats(): Promise<SummariesResponse> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/dashboard/summaries`, {});

  if (!res.ok) throw new Error("Failed to fetch stats");

  return res.json();
}

export default async function FinanceDashboard() {
  const user = await getUserFromCookie();
  const data = await getSummariesStats();

  // data.today.total    → ₦ collected today
  // data.week.total     → ₦ collected this week
  // data.month.total    → ₦ collected this month
  // data.year.total     → ₦ collected this year
  // data.all_time.total → ₦ all time

  if (!user) {
    return (
      <div className="text-red-500 font-semibold mt-10 text-center">
        Unauthorized — please log in again.
      </div>
    );
  }

  return (
    <main className="px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-1">
        <div className="w-full">
          <div className="mb-4 flex flex-col sm:flex-row justify-between items-start">
            <div className="flex flex-col gap-2 mb-2">
              <h3 className="font-bold text-gray-800 text-2xl">
                Financial summaries{" "}
              </h3>
              <p className="text-sm text-gray-500">
                Financial performance, position, and totals
              </p>
            </div>
            <div className="text-sm grid grid-cols-1 gap-2 mt-2">
              <div className="flex items-center gap-2">
                <div className="text-base text-gray-500">
                  <span className="font-semibold text-sm text-gray-700">
                    {user?.name}
                  </span>
                </div>

                <div className="bg-green-500/20 rounded-md p-1 flex items-center justify-center">
                  <span className="mx-auto text-xs text-green-700 font-semibold">
                    FINANCE
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
      <div className="mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Today"
            value={data.today.total}
            count={data.today.count}
            color="#3b82f6"
            subtitle="Transactions"
          />
          <StatCard
            title="This Week"
            value={data.week.total}
            count={data.week.count}
            color="#10b981"
            subtitle="Transactions"
          />
          <StatCard
            title="This Month"
            value={data.month.total}
            count={data.month.count}
            color="#8b5cf6"
            subtitle="Transactions"
          />
          <StatCard
            title="This Year"
            value={data.year.total}
            count={data.year.count}
            color="#f59e0b"
            subtitle="Transactions"
          />
        </div>
      </div>
      <div className="flex w-full h-[72vh] gap-2 flex-col sm:flex-row">
        <div className="w-full md:w-2/3">
          <LGARevenueChart />
        </div>
        <div className="w-full md:w-1/3 ">
          <TopPaymentsChart data={data.topPayments} />
        </div>
      </div>
    </main>
  );
}
