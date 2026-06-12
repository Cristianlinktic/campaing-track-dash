"use client";

import { useState } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CHANNELS, CHANNEL_ORDER } from "@/lib/constants";
import type { ChannelKey } from "@/lib/types";
import { formatCOP, formatCOPCompact, formatNumber } from "@/lib/format";

export interface ComparisonDatum {
  label: string;
  meta_plan: number;
  pilas_plan: number;
  youtube_plan: number;
  google_display_plan: number;
  meta_real: number;
  pilas_real: number;
  youtube_real: number;
  google_display_real: number;
}

interface ComparisonChartProps {
  data: ComparisonDatum[];
  /** "currency" usa formato COP (default), "number" usa formato numérico entero */
  mode?: "currency" | "number";
}

export function ComparisonChart({ data, mode = "currency" }: ComparisonChartProps) {
  const formatValue = mode === "number" ? formatNumber : formatCOP;
  const formatAxis  = mode === "number" ? formatNumber : formatCOPCompact;

  // null = todos los canales visibles; ChannelKey = solo ese canal
  const [selected, setSelected] = useState<ChannelKey | null>(null);

  function handleSelect(ch: ChannelKey) {
    setSelected((prev) => (prev === ch ? null : ch));
  }

  const visibleChannels = selected ? [selected] : CHANNEL_ORDER;

  const hasRealData = data.some(
    (d) => CHANNEL_ORDER.some((ch) => (d[`${ch}_real` as keyof ComparisonDatum] as number) > 0),
  );

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-slate-400">Canales:</span>

        {/* Botón Todos */}
        <button
          onClick={() => setSelected(null)}
          className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition ${
            selected === null
              ? "border-slate-700 bg-slate-700 text-white shadow-sm"
              : "border-slate-200 bg-white text-slate-500 hover:border-slate-400 hover:text-slate-700"
          }`}
        >
          Todos
        </button>

        {/* Un botón por canal */}
        {CHANNEL_ORDER.map((ch) => {
          const meta = CHANNELS[ch];
          const on = selected === ch;
          return (
            <button
              key={ch}
              onClick={() => handleSelect(ch)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition ${
                on
                  ? "border-transparent text-white shadow-sm"
                  : "border-slate-200 bg-white text-slate-400 hover:text-slate-700"
              }`}
              style={on ? { backgroundColor: meta.color } : {}}
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: on ? "rgba(255,255,255,0.75)" : meta.color }}
              />
              {meta.label}
            </button>
          );
        })}

        {/* Leyenda Proyección / Real */}
        <div className="ml-auto flex items-center gap-4 text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-6 rounded-full bg-slate-300" />
            Proyección
          </span>
          <span className="flex items-center gap-1.5">
            <svg width="24" height="8" className="shrink-0">
              <line x1="0" y1="4" x2="24" y2="4" stroke="#64748b" strokeWidth="2" strokeDasharray="4 2" />
            </svg>
            Real
          </span>
        </div>
      </div>

      {/* Gráfica */}
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
            <defs>
              {CHANNEL_ORDER.map((ch) => (
                <linearGradient key={ch} id={`cmp-${ch}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={CHANNELS[ch].color} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={CHANNELS[ch].color} stopOpacity={0.05} />
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
              tickFormatter={(v) => formatAxis(v as number)}
              tick={{ fontSize: 11, fill: "#94a3b8" }}
              tickLine={false}
              axisLine={false}
              width={64}
            />
            <Tooltip
              content={({ active: hov, payload, label }) => {
                if (!hov || !payload?.length) return null;
                const projEntries = payload.filter((p) => String(p.dataKey).endsWith("_plan"));
                const realEntries = payload.filter((p) => String(p.dataKey).endsWith("_real"));
                return (
                  <div className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs shadow-lg">
                    <p className="mb-2 font-semibold text-slate-900">{label}</p>
                    {projEntries.length > 0 && (
                      <p className="mb-1 font-medium text-slate-500">Proyección</p>
                    )}
                    {projEntries.map((p) => {
                      const ch = String(p.dataKey).replace("_plan", "") as ChannelKey;
                      return (
                        <p key={String(p.dataKey)} className="flex justify-between gap-6 text-slate-600">
                          <span className="flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: CHANNELS[ch].color }} />
                            {CHANNELS[ch].label}
                          </span>
                          <span className="font-medium">{formatValue(p.value as number)}</span>
                        </p>
                      );
                    })}
                    {realEntries.some((p) => (p.value as number) > 0) && (
                      <>
                        <p className="mb-1 mt-2 font-medium text-slate-500">Real</p>
                        {realEntries.map((p) => {
                          const ch = String(p.dataKey).replace("_real", "") as ChannelKey;
                          return (
                            <p key={String(p.dataKey)} className="flex justify-between gap-6 text-slate-600">
                              <span className="flex items-center gap-1.5">
                                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: CHANNELS[ch].color }} />
                                {CHANNELS[ch].label}
                              </span>
                              <span className="font-medium">{formatValue(p.value as number)}</span>
                            </p>
                          );
                        })}
                      </>
                    )}
                  </div>
                );
              }}
            />

            {/* Áreas (proyección) */}
            {visibleChannels.map((ch) => (
              <Area
                key={`area-${ch}`}
                type="monotone"
                dataKey={`${ch}_plan`}
                stroke={CHANNELS[ch].color}
                strokeWidth={1.5}
                fill={`url(#cmp-${ch})`}
                dot={false}
                activeDot={{ r: 3 }}
                name={`${CHANNELS[ch].label} proyección`}
              />
            ))}

            {/* Líneas punteadas (real) */}
            {hasRealData &&
              visibleChannels.map((ch) => (
                <Line
                  key={`line-${ch}`}
                  type="monotone"
                  dataKey={`${ch}_real`}
                  stroke={CHANNELS[ch].color}
                  strokeWidth={2}
                  strokeDasharray="6 3"
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0 }}
                  name={`${CHANNELS[ch].label} real`}
                />
              ))}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {!hasRealData && (
        <p className="text-center text-xs text-slate-400">
          Las líneas punteadas aparecerán cuando ingreses datos reales en{" "}
          <strong>Configuración</strong>.
        </p>
      )}
    </div>
  );
}
