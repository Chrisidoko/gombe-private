// components/TopPaymentsChart.tsx
"use client";

import { PieChart, Pie, Tooltip, ResponsiveContainer, Legend } from "recharts";
import type { TooltipProps } from "recharts";

type TopPayment = {
  name: string;
  count: number;
  total: number;
};

const COLORS = [
  "#15803d",
  "#f59e0b",
  "#3b82f6",
  "#22c55e",
  "#8b5cf6",
  "#bbf7d0",
];

type CustomTooltipProps = TooltipProps<number, string> & {
  active?: boolean;
  payload?: { value: number; payload: TopPayment; name: string }[];
};

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    const d = payload[0].payload;
    return (
      <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-4 py-3">
        <p className="text-xs font-bold text-gray-700 mb-1.5 max-w-[180px] leading-snug">
          {d.name}
        </p>
        <p className="text-xs text-green-600 font-bold">
          ₦{d.total.toLocaleString()}
        </p>
        <p className="text-[10px] text-gray-400">{d.count} transactions</p>
      </div>
    );
  }
  return null;
}

export default function TopPaymentsChart({ data }: { data: TopPayment[] }) {
  const total = data.reduce((sum, d) => sum + d.total, 0);

  return (
    <div className="w-full bg-white rounded-2xl border border-gray-200 shadow-sm p-6 h-full flex flex-col">
      {/* Header */}
      <div className="mb-4 flex flex-col gap-1">
        <h3 className="font-semibold text-gray-800 text-lg">Top Payments</h3>
        <p className="text-xs text-gray-500">
          Highest payment sources by total amount collected
        </p>
      </div>

      {/* Chart area */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Donut — fixed height so center label is predictable */}
        <div className="relative" style={{ height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data.map((item, index) => ({
                  ...item,
                  fill: COLORS[index % COLORS.length],
                }))}
                dataKey="total"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={95}
                paddingAngle={3}
              />
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>

          {/* Center label — positioned relative to the fixed height box */}
          <div
            className="absolute pointer-events-none flex flex-col items-center justify-center"
            style={{
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
            }}
          >
            <p className="text-[10px] text-gray-400 uppercase tracking-widest whitespace-nowrap">
              Total
            </p>
            <p className="text-sm font-black text-gray-800 whitespace-nowrap">
              ₦
              {total >= 1000000
                ? `${(total / 1000000).toFixed(1)}M`
                : `${(total / 1000).toFixed(0)}k`}
            </p>
          </div>
        </div>

        {/* Legend — outside the chart, always below */}
        <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-2">
          {data.map((item, index) => (
            <div key={item.name} className="flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <span className="text-[11px] text-gray-500 leading-tight">
                {item.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
