// components/TopPaymentsChart.tsx
"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type TopPayment = {
  name: string;
  count: number;
  total: number;
};

export default function TopPaymentsChart({ data }: { data: TopPayment[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
      >
        <CartesianGrid horizontal={false} stroke="#f0f0f0" />
        <XAxis
          type="number"
          tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`}
          tick={{ fontSize: 11, fill: "#9ca3af" }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          type="category"
          dataKey="name"
          width={160}
          tick={{ fontSize: 11, fill: "#6b7280" }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          formatter={(value: number | undefined) => [
            `₦${(value ?? 0).toLocaleString()}`,
            "Total Collected",
          ]}
          contentStyle={{
            fontSize: "11px",
            padding: "6px 10px",
            borderRadius: "8px",
            border: "1px solid #e5e7eb",
          }}
          itemStyle={{ fontSize: "11px" }}
          labelStyle={{ fontSize: "11px", fontWeight: 600 }}
          cursor={{ fill: "#f9fafb" }}
        />
        <Bar
          dataKey="total"
          fill="#16a34a"
          radius={[0, 6, 6, 0]}
          maxBarSize={32}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
