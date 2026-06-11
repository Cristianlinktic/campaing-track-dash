import { getCampaignData } from "@/lib/data";
import { computeChannels, computeTotals } from "@/lib/calc";
import { CHANNELS } from "@/lib/constants";
import {
  formatCOP,
  formatDecimal,
  formatNumber,
  formatPercent,
} from "@/lib/format";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ChannelBadge } from "@/components/ui/channel-badge";
import { ChannelBar, type BarDatum } from "@/components/charts/channel-bar";

export default async function CanalesPage() {
  const data = await getCampaignData();
  if (!data) return <EmptyState />;

  const channels = computeChannels(data);
  const totals = computeTotals(channels);

  const impressionsData: BarDatum[] = channels.map((c) => ({
    name: CHANNELS[c.channel].label,
    value: c.impressions,
    color: CHANNELS[c.channel].color,
  }));
  const clicksData: BarDatum[] = channels.map((c) => ({
    name: CHANNELS[c.channel].label,
    value: c.clicks,
    color: CHANNELS[c.channel].color,
  }));

  return (
    <>
      <PageHeader
        title="Distribución por Canal"
        description="Reparto presupuestario y métricas proyectadas para los 15 días de campaña."
      />

      {/* Tabla principal */}
      <Card>
        <CardHeader title="Presupuesto y proyección por canal" />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="px-4 py-3 font-medium">Canal</th>
                <th className="px-4 py-3 text-right font-medium">%</th>
                <th className="px-4 py-3 text-right font-medium">Presupuesto</th>
                <th className="px-4 py-3 text-right font-medium">Diario</th>
                <th className="px-4 py-3 text-right font-medium">CPM</th>
                <th className="px-4 py-3 text-right font-medium">Impresiones</th>
                <th className="px-4 py-3 text-right font-medium">CTR</th>
                <th className="px-4 py-3 text-right font-medium">Clicks</th>
                <th className="px-4 py-3 text-right font-medium">CPC</th>
                <th className="px-4 py-3 text-right font-medium">Alcance</th>
              </tr>
            </thead>
            <tbody>
              {channels.map((c) => (
                <tr key={c.channel} className="border-b border-slate-50 hover:bg-slate-50/60">
                  <td className="px-4 py-3">
                    <ChannelBadge channel={c.channel} showSubtitle />
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-600">
                    {formatPercent(c.participationPct, 0)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums font-medium text-slate-900">
                    {formatCOP(c.plannedBudget)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-600">
                    {formatCOP(c.dailyBudget)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-600">
                    {formatCOP(c.cpm)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-600">
                    {formatNumber(c.impressions)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-600">
                    {formatPercent(c.ctr)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-600">
                    {formatNumber(c.clicks)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-600">
                    {formatCOP(c.cpc)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-600">
                    {formatNumber(c.reach)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-200 font-semibold text-slate-900">
                <td className="px-4 py-3">Total</td>
                <td className="px-4 py-3 text-right tabular-nums">100%</td>
                <td className="px-4 py-3 text-right tabular-nums">{formatCOP(totals.plannedBudget)}</td>
                <td className="px-4 py-3 text-right tabular-nums">{formatCOP(totals.dailyBudget)}</td>
                <td className="px-4 py-3 text-right tabular-nums">{formatCOP(totals.blendedCpm)}</td>
                <td className="px-4 py-3 text-right tabular-nums">{formatNumber(totals.impressions)}</td>
                <td className="px-4 py-3 text-right tabular-nums">{formatPercent(totals.weightedCtr)}</td>
                <td className="px-4 py-3 text-right tabular-nums">{formatNumber(totals.clicks)}</td>
                <td className="px-4 py-3 text-right tabular-nums">{formatCOP(totals.blendedCpc)}</td>
                <td className="px-4 py-3 text-right tabular-nums">{formatNumber(totals.reach)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
        <div className="border-t border-slate-100 px-4 py-3 text-xs text-slate-400">
          * Alcance estimado = impresiones ÷ frecuencia por canal (frecuencia promedio{" "}
          {formatDecimal(
            channels.reduce((a, c) => a + c.frequency, 0) / (channels.length || 1),
          )}
          x).
        </div>
      </Card>

      {/* Gráficos */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Impresiones por canal" />
          <CardBody>
            <ChannelBar data={impressionsData} unit="impresiones" />
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Clicks por canal" />
          <CardBody>
            <ChannelBar data={clicksData} unit="clicks" />
          </CardBody>
        </Card>
      </div>

      {/* Objetivos */}
      <Card>
        <CardHeader
          title="Objetivos y tipo de campaña por canal"
          subtitle="Estrategia, público objetivo y KPI principal"
        />
        <CardBody>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {channels.map((c) => {
              const meta = CHANNELS[c.channel];
              return (
                <div
                  key={c.channel}
                  className="rounded-xl border border-slate-200 p-4"
                  style={{ borderTopColor: meta.color, borderTopWidth: 3 }}
                >
                  <div className="mb-3 flex items-center justify-between">
                    <ChannelBadge channel={c.channel} showSubtitle />
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                      {formatPercent(c.participationPct, 0)}
                    </span>
                  </div>
                  <dl className="space-y-2.5 text-sm">
                    <Field label="Objetivo" value={c.objective} />
                    <Field label="Público objetivo" value={c.targetAudience} />
                    <Field label="KPI principal" value={c.mainKpi} />
                  </dl>
                </div>
              );
            })}
          </div>
        </CardBody>
      </Card>
    </>
  );
}

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="text-slate-700">{value ?? "—"}</dd>
    </div>
  );
}
