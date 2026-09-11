"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { ResponsiveContainer } from "recharts";
import { MapPin, Loader2 } from "lucide-react";
import type { TooltipProps } from "recharts";

// Single series (revenue), so one hue throughout — LGAs are nominal
// categories with no natural order, so coloring bars by their own value
// would double-encode what bar height already shows. See dataviz anti
// -patterns: "a value-ramp on nominal categories."
const BAR_COLOR = "#28a745";
const BAR_COLOR_ACTIVE = "#218838";

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
        <div className="flex items-center gap-1.5 mb-2">
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: BAR_COLOR }}
          />
          <p className="text-xs font-bold text-gray-700">{d.lga} LGA</p>
        </div>
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
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden h-full flex flex-col">
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
              <p className="text-xs text-gray-400 mt-0.5">
                <span className="font-bold uppercase tracking-widest text-gray-400">
                  Top Performing LGAs
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
            barCategoryGap="34%"
          >
            <defs>
              <linearGradient id="lgaBarFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={BAR_COLOR} stopOpacity={1} />
                <stop offset="100%" stopColor={BAR_COLOR} stopOpacity={0.75} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="#f1f5f9" />
            <XAxis
              dataKey="lga"
              tick={{ fontSize: 11, fill: "#6b7280" }}
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
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: "#f8fafc" }}
            />
            <Bar
              dataKey="totalRevenue"
              fill="url(#lgaBarFill)"
              activeBar={{ fill: BAR_COLOR_ACTIVE }}
              radius={[4, 4, 0, 0]}
              maxBarSize={24}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
