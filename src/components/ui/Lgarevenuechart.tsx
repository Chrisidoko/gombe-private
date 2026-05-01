"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { MapPin, Loader2 } from "lucide-react";
import type { TooltipProps } from "recharts";

type LGARevenue = {
  lga: string;
  transactionCount: number;
  totalRevenue: number;
  lastPayment: string | null;
};

type CustomTooltipProps = TooltipProps<number, string> & {
  active?: boolean;
  payload?: { value: number; payload: LGARevenue }[];
};

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    const d = payload[0].payload;
    return (
      <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-4 py-3 text-left min-w-[180px]">
        <p className="text-xs font-bold text-gray-700 mb-2">{d.lga} LGA</p>
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs text-gray-400">Revenue</span>
            <span className="text-xs font-bold text-green-600">
              ₦{d.totalRevenue.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs text-gray-400">Transactions</span>
            <span className="text-xs font-semibold text-gray-700">
              {d.transactionCount}
            </span>
          </div>
          {d.lastPayment && (
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs text-gray-400">Last Payment</span>
              <span className="text-xs font-semibold text-gray-700">
                {new Date(d.lastPayment).toLocaleDateString("en-NG", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
}

export default function LGARevenueChart() {
  const [data, setData] = useState<LGARevenue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/dashboard/lga-revenue");
        if (!res.ok) throw new Error("Failed to fetch");
        const json = await res.json();
        setData(json);
      } catch {
        setError("Could not load LGA revenue data.");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const totalRevenue = data.reduce((sum, d) => sum + d.totalRevenue, 0);
  const maxRevenue = Math.max(...data.map((d) => d.totalRevenue), 1);

  // Color intensity based on revenue proportion
  const getBarColor = (revenue: number) => {
    const ratio = revenue / maxRevenue;
    if (ratio >= 0.75) return "#15803d";
    if (ratio >= 0.5) return "#16a34a";
    if (ratio >= 0.25) return "#22c55e";
    return "#86efac";
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex items-center justify-center h-80">
        <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex items-center justify-center h-80">
        <p className="text-sm text-red-400">{error}</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex items-center justify-center h-80">
        <p className="text-sm text-gray-400">No revenue data available yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden overflow-hidden h-full flex flex-col">
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-green-50 border border-green-100">
              <MapPin className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-800">
                Revenue by LGA
              </h3>
              <p className="text-xs text-gray-400 mt-0.5 ">
                <span className="font-bold uppercase tracking-widest text-gray-400 mb-3">
                  {" "}
                  Top Performing LGAs{" "}
                </span>{" "}
                — {data.length} LGAs contributing
              </p>
            </div>
          </div>

          {/* Total */}
          <div className="text-right">
            <p className="text-xs text-gray-400 uppercase tracking-widest">
              Total Collected
            </p>
            <p className="text-lg font-black text-green-600">
              ₦{totalRevenue.toLocaleString()}
            </p>
          </div>
        </div>
        {/* Footer — top 3 LGAs */}
        <div className="px-6 py-2 bg-gray-50">
          <div className="flex flex-wrap gap-2">
            {data.slice(0, 3).map((d, i) => (
              <div
                key={d.lga}
                className="inline-flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2"
              >
                <span
                  className={`text-xs font-black ${
                    i === 0
                      ? "text-yellow-500"
                      : i === 1
                        ? "text-gray-400"
                        : "text-orange-400"
                  }`}
                >
                  #{i + 1}
                </span>
                <div>
                  <p className="text-xs font-bold text-gray-700">{d.lga}</p>
                  <p className="text-[10px] text-green-600 font-semibold">
                    ₦{d.totalRevenue.toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="px-2 py-5 flex-1 relative">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 4, right: 16, left: 8, bottom: 60 }}
            barCategoryGap="30%"
          >
            <CartesianGrid vertical={false} stroke="#f0f0f0" />
            <XAxis
              dataKey="lga"
              tick={{ fontSize: 11, fill: "#4b5563" }}
              angle={-40}
              textAnchor="end"
              interval={0}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tickFormatter={(v) =>
                v >= 1000000
                  ? `₦${(v / 1000000).toFixed(1)}M`
                  : `₦${(v / 1000).toFixed(0)}k`
              }
              tick={{ fontSize: 10, fill: "#9ca3af" }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f9fafb" }} />
            <Bar dataKey="totalRevenue" radius={[6, 6, 0, 0]} maxBarSize={48}>
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={getBarColor(entry.totalRevenue)}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
