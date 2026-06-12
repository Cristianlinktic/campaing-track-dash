"use client";

import { useFormStatus } from "react-dom";
import { updateRealInvestmentAction } from "@/app/(app)/actions";
import { CHANNELS } from "@/lib/constants";
import { formatCOP, formatPercent } from "@/lib/format";
import type { ChannelKey } from "@/lib/types";

export interface TrackingRow {
  channelId: string;
  channel: ChannelKey;
  planned: number;
  real: number;
  difference: number;
  executionPct: number;
}

function RowSaveButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 disabled:opacity-60"
    >
      {pending ? "…" : "Guardar"}
    </button>
  );
}

export function TrackingTable({
  rows,
  totals,
}: {
  rows: TrackingRow[];
  totals: { planned: number; real: number; difference: number; executionPct: number };
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[680px] text-sm">
        <thead>
          <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
            <th className="px-4 py-3 font-medium">Canal</th>
            <th className="px-4 py-3 text-right font-medium">Inversión Meta</th>
            <th className="px-4 py-3 text-right font-medium">Inversión Real</th>
            <th className="px-4 py-3 text-right font-medium">Diferencia</th>
            <th className="px-4 py-3 text-right font-medium">% Ejecución</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const meta = CHANNELS[row.channel];
            return (
              <tr key={row.channelId} className="border-b border-slate-50">
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: meta.color }}
                    />
                    <span className="font-medium text-slate-900">{meta.label}</span>
                  </span>
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-slate-600">
                  {formatCOP(row.planned)}
                </td>
                <td className="px-4 py-3 text-right">
                  <form
                    action={updateRealInvestmentAction}
                    className="flex items-center justify-end gap-2"
                  >
                    <input type="hidden" name="channel_id" value={row.channelId} />
                    <input
                      type="number"
                      name="real_investment"
                      defaultValue={row.real || ""}
                      min={0}
                      step="any"
                      placeholder="0"
                      className="no-spin w-32 rounded-md border border-slate-300 px-2.5 py-1.5 text-right text-sm tabular-nums outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                    />
                    <RowSaveButton />
                  </form>
                </td>
                <td
                  className={`px-4 py-3 text-right tabular-nums ${
                    row.difference < 0 ? "text-rose-600" : "text-emerald-600"
                  }`}
                >
                  {formatCOP(row.difference)}
                </td>
                <td className="px-4 py-3 text-right">
                  <ExecutionBadge pct={row.executionPct} />
                </td>
                <td />
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-slate-200 font-semibold text-slate-900">
            <td className="px-4 py-3">Total campaña</td>
            <td className="px-4 py-3 text-right tabular-nums">{formatCOP(totals.planned)}</td>
            <td className="px-4 py-3 text-right tabular-nums">{formatCOP(totals.real)}</td>
            <td
              className={`px-4 py-3 text-right tabular-nums ${
                totals.difference < 0 ? "text-rose-600" : "text-emerald-600"
              }`}
            >
              {formatCOP(totals.difference)}
            </td>
            <td className="px-4 py-3 text-right">{formatPercent(totals.executionPct, 0)}</td>
            <td />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

function ExecutionBadge({ pct }: { pct: number }) {
  const value = Math.round(pct * 100);
  const tone =
    value === 0
      ? "bg-slate-100 text-slate-500"
      : value < 90
        ? "bg-amber-50 text-amber-700"
        : value <= 110
          ? "bg-emerald-50 text-emerald-700"
          : "bg-rose-50 text-rose-700";
  return (
    <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${tone}`}>
      {value}%
    </span>
  );
}
