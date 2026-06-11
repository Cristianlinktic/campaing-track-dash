"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CHANNELS } from "@/lib/constants";
import type { ChannelKey } from "@/lib/types";
import { formatCOP, formatCOPCompact } from "@/lib/format";

export interface DailyAreaDatum {
  label: string; // fecha corta
  meta: number;
  pilas: number;
  youtube: number;
  google_display: number;
}

const ORDER: ChannelKey[] = ["google_display", "youtube", "pilas", "meta"];

export function DailyArea({ data }: { data: DailyAreaDatum[] }) {
  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
          <defs>
            {ORDER.map((key) => (
              <linearGradient key={key} id={`g-${key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={CHANNELS[key].color} stopOpacity={0.85} />
                <stop offset="100%" stopColor={CHANNELS[key].color} stopOpacity={0.35} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "#94a3b8" }}
            tickLine={false}
            axisLine={{ stroke: "#e2e8f0" }}
          />
          <YAxis
            tickFormatter={(v) => formatCOPCompact(v as number)}
            tick={{ fontSize: 11, fill: "#94a3b8" }}
            tickLine={false}
            axisLine={false}
            width={64}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              const total = payload.reduce((a, p) => a + (p.value as number), 0);
              return (
                <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-md">
                  <p className="mb-1 font-semibold text-slate-900">{label}</p>
                  {[...payload].reverse().map((p) => (
                    <p key={p.dataKey as string} className="flex items-center justify-between gap-4 text-slate-600">
                      <span className="flex items-center gap-1.5">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: p.color as string }}
                        />
                        {CHANNELS[p.dataKey as ChannelKey].label}
                      </span>
                      <span className="font-medium">{formatCOP(p.value as number)}</span>
                    </p>
                  ))}
                  <p className="mt-1 flex justify-between border-t border-slate-100 pt-1 font-semibold text-slate-900">
                    <span>Total</span>
                    <span>{formatCOP(total)}</span>
                  </p>
                </div>
              );
            }}
          />
          {ORDER.map((key) => (
            <Area
              key={key}
              type="monotone"
              dataKey={key}
              stackId="1"
              stroke={CHANNELS[key].color}
              strokeWidth={1.5}
              fill={`url(#g-${key})`}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
