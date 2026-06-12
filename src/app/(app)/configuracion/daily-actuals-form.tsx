"use client";

import { useActionState, useEffect } from "react";
import { useToast } from "@/components/ui/toast";
import { saveDailyActualsAction } from "@/app/(app)/actions";
import { useFormStatus } from "react-dom";
import { CHANNELS } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import type { DailyActuals, DailyPlan } from "@/lib/types";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Guardando…" : "Guardar datos reales"}
    </button>
  );
}

interface Props {
  campaignId: string;
  days: DailyPlan[];
  actuals: DailyActuals[];
}

export function DailyActualsForm({ campaignId, days, actuals }: Props) {
  const { show } = useToast();
  const [state, formAction] = useActionState(saveDailyActualsAction, null);

  useEffect(() => {
    if (!state) return;
    state.ok ? show("success", state.message) : show("error", state.error);
  }, [state, show]);

  const actualsMap = new Map(actuals.map((a) => [a.day_number, a]));

  const channels = [
    { key: "meta" as const, label: CHANNELS.meta.label, color: CHANNELS.meta.color },
    { key: "pilas" as const, label: CHANNELS.pilas.label, color: CHANNELS.pilas.color },
    { key: "youtube" as const, label: CHANNELS.youtube.label, color: CHANNELS.youtube.color },
    { key: "google_display" as const, label: CHANNELS.google_display.label, color: CHANNELS.google_display.color },
  ];

  return (
    <form action={formAction}>
      <input type="hidden" name="campaign_id" value={campaignId} />

      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-400">
              <th className="px-4 py-3 font-medium">Día</th>
              <th className="px-4 py-3 font-medium">Fecha</th>
              {channels.map((ch) => (
                <th key={ch.key} className="px-3 py-3 font-medium">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: ch.color }} />
                    {ch.label}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {days.map((day) => {
              const actual = actualsMap.get(day.day_number);
              return (
                <tr key={day.day_number} className="border-b border-slate-50 hover:bg-slate-50/60">
                  <td className="px-4 py-2 font-medium text-slate-700">{day.day_number}</td>
                  <td className="px-4 py-2 text-slate-500">
                    {formatDate(day.date)}
                    {/* Hidden fields para el server action */}
                    <input type="hidden" name={`date_${day.day_number}`} value={day.date} />
                  </td>
                  {channels.map((ch) => (
                    <td key={ch.key} className="px-3 py-2">
                      <input
                        type="number"
                        name={`${ch.key}_${day.day_number}`}
                        defaultValue={actual?.[ch.key] || ""}
                        min={0}
                        step="any"
                        placeholder="0"
                        className="no-spin w-full min-w-[100px] rounded-md border border-slate-200 px-2.5 py-1.5 text-right text-sm tabular-nums outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                      />
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <p className="text-xs text-slate-400">
          Valores en COP. Deja en 0 los días sin datos reales aún.
        </p>
        <SubmitButton />
      </div>
    </form>
  );
}
