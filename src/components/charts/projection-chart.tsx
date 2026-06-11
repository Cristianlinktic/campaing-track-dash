"use client";

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatNumber } from "@/lib/format";

export interface ProjectionDatum {
  label: string;
  impressions: number;
  clicks: number;
}

export function ProjectionChart({ data }: { data: ProjectionDatum[] }) {
  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "#94a3b8" }}
            tickLine={false}
            axisLine={{ stroke: "#e2e8f0" }}
          />
          <YAxis
            yAxisId="left"
            tickFormatter={(v) => formatNumber(v as number)}
            tick={{ fontSize: 11, fill: "#94a3b8" }}
            tickLine={false}
            axisLine={false}
            width={64}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tickFormatter={(v) => formatNumber(v as number)}
            tick={{ fontSize: 11, fill: "#94a3b8" }}
            tickLine={false}
            axisLine={false}
            width={56}
          />
          <Tooltip
            cursor={{ fill: "#f8fafc" }}
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              const imp = payload.find((p) => p.dataKey === "impressions");
              const clk = payload.find((p) => p.dataKey === "clicks");
              return (
                <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-md">
                  <p className="mb-1 font-semibold text-slate-900">{label}</p>
                  <p className="flex items-center justify-between gap-4 text-slate-600">
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-brand-400" />
                      Impresiones
                    </span>
                    <span className="font-medium">{formatNumber(imp?.value as number)}</span>
                  </p>
                  <p className="flex items-center justify-between gap-4 text-slate-600">
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      Clicks
                    </span>
                    <span className="font-medium">{formatNumber(clk?.value as number)}</span>
                  </p>
                </div>
              );
            }}
          />
          <Bar
            yAxisId="left"
            dataKey="impressions"
            fill="#93b4ff"
            radius={[4, 4, 0, 0]}
            maxBarSize={28}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="clicks"
            stroke="#10b981"
            strokeWidth={2.5}
            dot={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
