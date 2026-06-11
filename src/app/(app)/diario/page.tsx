import { getCampaignData } from "@/lib/data";
import { computeDaily } from "@/lib/calc";
import { CHANNELS } from "@/lib/constants";
import {
  formatCOP,
  formatDate,
  formatDateShort,
  formatDecimal,
  formatNumber,
} from "@/lib/format";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { DailyArea, type DailyAreaDatum } from "@/components/charts/daily-area";

export default async function DiarioPage() {
  const data = await getCampaignData();
  if (!data) return <EmptyState />;

  const daily = computeDaily(data);

  const area: DailyAreaDatum[] = daily.map((d) => ({
    label: formatDateShort(d.date),
    meta: d.byChannel.meta?.investment ?? 0,
    pilas: d.byChannel.pilas?.investment ?? 0,
    youtube: d.byChannel.youtube?.investment ?? 0,
    google_display: d.byChannel.google_display?.investment ?? 0,
  }));

  const totalInvestment = daily.reduce((a, d) => a + d.totalInvestment, 0);
  const totalFactor = daily.reduce((a, d) => a + d.weightFactor, 0);
  const peak = daily.reduce((max, d) => (d.totalInvestment > max.totalInvestment ? d : max), daily[0]);

  return (
    <>
      <PageHeader
        title="Desglose Diario"
        description="Inversión distribuida día a día. El factor de peso determina cuánto presupuesto recibe cada día."
      />

      <Card>
        <CardHeader
          title="Curva de inversión diaria"
          subtitle={`Día pico: ${formatDate(peak.date)} con ${formatCOP(peak.totalInvestment)}`}
        />
        <CardBody>
          <DailyArea data={area} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Detalle por día" />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="px-4 py-3 font-medium">Día</th>
                <th className="px-4 py-3 font-medium">Fecha</th>
                <th className="px-4 py-3 text-right font-medium">Factor</th>
                <th className="px-4 py-3 text-right font-medium">Total / día</th>
                {(["meta", "pilas", "youtube", "google_display"] as const).map((k) => (
                  <th key={k} className="px-4 py-3 text-right font-medium">
                    {CHANNELS[k].label}
                  </th>
                ))}
                <th className="px-4 py-3 text-right font-medium">Impresiones</th>
              </tr>
            </thead>
            <tbody>
              {daily.map((d) => (
                <tr key={d.dayNumber} className="border-b border-slate-50 hover:bg-slate-50/60">
                  <td className="px-4 py-3 font-medium text-slate-900">{d.dayNumber}</td>
                  <td className="px-4 py-3 text-slate-600">{formatDate(d.date)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-600">
                    {formatDecimal(d.weightFactor)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums font-medium text-slate-900">
                    {formatCOP(d.totalInvestment)}
                  </td>
                  {(["meta", "pilas", "youtube", "google_display"] as const).map((k) => (
                    <td key={k} className="px-4 py-3 text-right tabular-nums text-slate-600">
                      {formatCOP(d.byChannel[k]?.investment ?? 0)}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-right tabular-nums text-slate-600">
                    {formatNumber(d.totalImpressions)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-200 font-semibold text-slate-900">
                <td className="px-4 py-3" colSpan={2}>
                  Total · {daily.length} días
                </td>
                <td className="px-4 py-3 text-right tabular-nums">{formatDecimal(totalFactor)}</td>
                <td className="px-4 py-3 text-right tabular-nums">{formatCOP(totalInvestment)}</td>
                {(["meta", "pilas", "youtube", "google_display"] as const).map((k) => (
                  <td key={k} className="px-4 py-3 text-right tabular-nums">
                    {formatCOP(daily.reduce((a, d) => a + (d.byChannel[k]?.investment ?? 0), 0))}
                  </td>
                ))}
                <td className="px-4 py-3 text-right tabular-nums">
                  {formatNumber(daily.reduce((a, d) => a + d.totalImpressions, 0))}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
        <div className="border-t border-slate-100 px-4 py-3 text-xs text-slate-400">
          * Inversión diaria = presupuesto total × factor ÷ suma de factores. El total siempre
          iguala el presupuesto sin importar los factores.
        </div>
      </Card>
    </>
  );
}
