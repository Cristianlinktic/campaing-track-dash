import { getCampaignData } from "@/lib/data";
import { computeChannels, computeDaily, computeTotals } from "@/lib/calc";
import { CHANNELS } from "@/lib/constants";
import {
  formatCOP,
  formatDate,
  formatDateShort,
  formatDecimal,
  formatNumber,
  formatPercent,
} from "@/lib/format";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { KpiCard } from "@/components/ui/kpi-card";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ChannelBadge } from "@/components/ui/channel-badge";
import {
  ProjectionChart,
  type ProjectionDatum,
} from "@/components/charts/projection-chart";

export default async function ProyeccionesPage() {
  const data = await getCampaignData();
  if (!data) return <EmptyState />;

  const channels = computeChannels(data);
  const totals = computeTotals(channels);
  const daily = computeDaily(data);

  const chart: ProjectionDatum[] = daily.map((d) => ({
    label: formatDateShort(d.date),
    impressions: Math.round(d.totalImpressions),
    clicks: Math.round(d.totalClicks),
  }));

  return (
    <>
      <PageHeader
        title="Proyecciones"
        description="Estimación de impresiones, clicks y alcance basada en CPM, CTR y frecuencia por canal."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Impresiones totales" value={formatNumber(totals.impressions)} accent="violet" />
        <KpiCard label="Clicks totales" value={formatNumber(totals.clicks)} accent="emerald" />
        <KpiCard
          label="Alcance único estimado"
          value={formatNumber(totals.reach)}
          hint="Suma de impresiones ÷ frecuencia"
          accent="brand"
        />
        <KpiCard
          label="CTR ponderado"
          value={formatPercent(totals.weightedCtr)}
          hint={`CPC ${formatCOP(totals.blendedCpc)}`}
          accent="amber"
        />
      </div>

      {/* Proyección consolidada por canal */}
      <Card>
        <CardHeader title="Proyección consolidada por canal" />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="px-4 py-3 font-medium">Canal</th>
                <th className="px-4 py-3 text-right font-medium">Inversión</th>
                <th className="px-4 py-3 text-right font-medium">CPM</th>
                <th className="px-4 py-3 text-right font-medium">Impresiones</th>
                <th className="px-4 py-3 text-right font-medium">CTR</th>
                <th className="px-4 py-3 text-right font-medium">Clicks</th>
                <th className="px-4 py-3 text-right font-medium">Frecuencia</th>
                <th className="px-4 py-3 text-right font-medium">Alcance único</th>
              </tr>
            </thead>
            <tbody>
              {channels.map((c) => (
                <tr key={c.channel} className="border-b border-slate-50 hover:bg-slate-50/60">
                  <td className="px-4 py-3">
                    <ChannelBadge channel={c.channel} />
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-600">{formatCOP(c.plannedBudget)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-600">{formatCOP(c.cpm)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-600">{formatNumber(c.impressions)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-600">{formatPercent(c.ctr)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-600">{formatNumber(c.clicks)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-600">{formatDecimal(c.frequency)}x</td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-600">{formatNumber(c.reach)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-200 font-semibold text-slate-900">
                <td className="px-4 py-3">Total</td>
                <td className="px-4 py-3 text-right tabular-nums">{formatCOP(totals.plannedBudget)}</td>
                <td className="px-4 py-3 text-right tabular-nums">{formatCOP(totals.blendedCpm)}</td>
                <td className="px-4 py-3 text-right tabular-nums">{formatNumber(totals.impressions)}</td>
                <td className="px-4 py-3 text-right tabular-nums">{formatPercent(totals.weightedCtr)}</td>
                <td className="px-4 py-3 text-right tabular-nums">{formatNumber(totals.clicks)}</td>
                <td className="px-4 py-3 text-right tabular-nums">—</td>
                <td className="px-4 py-3 text-right tabular-nums">{formatNumber(totals.reach)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>

      {/* Proyección diaria */}
      <Card>
        <CardHeader
          title="Proyección diaria — impresiones y clicks"
          subtitle="Todos los canales combinados"
        />
        <CardBody>
          <ProjectionChart data={chart} />
        </CardBody>
      </Card>

      <p className="px-1 text-xs text-slate-400">
        * Las proyecciones se recalculan automáticamente al editar CPM, CTR o frecuencia en
        Configuración. Campaña del {formatDate(daily[0]?.date ?? data.campaign.start_date)} al{" "}
        {formatDate(daily[daily.length - 1]?.date ?? data.campaign.start_date)}.
      </p>
    </>
  );
}
