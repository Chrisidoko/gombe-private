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
  Rectangle,
} from "recharts";
import type { TooltipProps } from "recharts";
// import type {
//   ValueType,
//   NameType,
// } from "recharts/types/component/DefaultTooltipContent";

import { MapPin, Loader2 } from "lucide-react";

type LGAData = {
  lga: string;
  count: number;
};

// ── Custom Tooltip ─────────────────────────────────────────────────────────────

type CustomTooltipProps = TooltipProps<number, string> & {
  active?: boolean;
  payload?: { value: number; payload: { lga: string } }[];
};

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-0.5">
          {payload[0].payload.lga}
        </p>
        <p className="text-lg font-bold text-[#16a34a]">
          {payload[0].value}{" "}
          <span className="text-sm font-medium text-gray-500">
            {payload[0].value === 1 ? "Institution" : "Institutions"}
          </span>
        </p>
      </div>
    );
  }
  return null;
}

export default function LGAChart() {
  const [data, setData] = useState<LGAData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchLGAStats() {
      try {
        const res = await fetch("/api/dashboard/lga-stats");
        if (!res.ok) throw new Error("Failed to fetch LGA stats");
        const json = await res.json();
        // Sort by count descending so largest bars appear first
        const sorted = json.sort((a: LGAData, b: LGAData) => b.count - a.count);
        setData(sorted);
      } catch (err) {
        setError("Could not load LGA data.");
      } finally {
        setLoading(false);
      }
    }
    fetchLGAStats();
  }, []);

  const total = data.reduce((sum, d) => sum + d.count, 0);
  const maxCount = Math.max(...data.map((d) => d.count), 1);

  // Generate shades of green based on count intensity
  const getBarColor = (count: number) => {
    const intensity = count / maxCount;
    if (intensity >= 0.75) return "#15803d"; // dark green
    if (intensity >= 0.5) return "#16a34a"; // medium green
    if (intensity >= 0.25) return "#22c55e"; // light green
    return "#86efac"; // lightest green
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex items-center justify-center h-64">
        <p className="text-sm text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-green-50 border border-green-100">
            <MapPin className="w-4 h-4 text-green-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-800">
              Institutions by LGA
            </h3>
            <p className="text-xs text-gray-400">
              {data.length} LGAs · {total} total institutions
            </p>
          </div>
        </div>

        {/* Legend */}
        <div className="hidden sm:flex items-center gap-3 text-xs text-gray-500">
          {[
            { color: "#15803d", label: "High" },
            { color: "#22c55e", label: "Mid" },
            { color: "#86efac", label: "Low" },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-sm"
                style={{ backgroundColor: color }}
              />
              {label}
            </div>
          ))}
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={data}
          margin={{ top: 4, right: 4, left: -20, bottom: 60 }}
          barCategoryGap="30%"
        >
          <CartesianGrid vertical={false} stroke="#f0f0f0" />

          <XAxis
            dataKey="lga"
            tick={{ fontSize: 11, fill: "#9ca3af" }}
            angle={-40}
            textAnchor="end"
            interval={0}
            tickLine={false}
            axisLine={false}
          />

          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 11, fill: "#9ca3af" }}
            tickLine={false}
            axisLine={false}
          />

          <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f9fafb" }} />

          <Bar
            dataKey="count"
            radius={[6, 6, 0, 0]}
            maxBarSize={48}
            shape={(props) => {
              const { x, y, width, height, payload } = props;

              return (
                <Rectangle
                  x={x}
                  y={y}
                  width={width}
                  height={height}
                  radius={[6, 6, 0, 0]}
                  fill={getBarColor(payload.count)}
                />
              );
            }}
          />
        </BarChart>
      </ResponsiveContainer>

      {/* Summary pills */}
      <div className="mt-5 pt-4 border-t border-gray-100 flex flex-wrap gap-2">
        {data.slice(0, 5).map((d) => (
          <div
            key={d.lga}
            className="inline-flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-full px-3 py-1"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            <span className="text-xs font-medium text-gray-600">{d.lga}</span>
            <span className="text-xs font-bold text-green-600">{d.count}</span>
          </div>
        ))}
        {data.length > 5 && (
          <div className="inline-flex items-center bg-gray-50 border border-gray-200 rounded-full px-3 py-1">
            <span className="text-xs text-gray-400">
              +{data.length - 5} more
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
