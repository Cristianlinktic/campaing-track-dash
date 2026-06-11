"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatNumber } from "@/lib/format";

export interface BarDatum {
  name: string;
  value: number;
  color: string;
}

export function ChannelBar({
  data,
  unit = "",
}: {
  data: BarDatum[];
  unit?: string;
}) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11, fill: "#94a3b8" }}
            tickLine={false}
            axisLine={{ stroke: "#e2e8f0" }}
          />
          <YAxis
            tickFormatter={(v) => formatNumber(v as number)}
            tick={{ fontSize: 11, fill: "#94a3b8" }}
            tickLine={false}
            axisLine={false}
            width={64}
          />
          <Tooltip
            cursor={{ fill: "#f8fafc" }}
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              return (
                <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-md">
                  <p className="font-semibold text-slate-900">{label}</p>
                  <p className="text-slate-600">
                    {formatNumber(payload[0].value as number)} {unit}
                  </p>
                </div>
              );
            }}
          />
          <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={64}>
            {data.map((d) => (
              <Cell key={d.name} fill={d.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
