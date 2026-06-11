import { getCampaignData } from "@/lib/data";
import {
  computeChannels,
  computeDaily,
  computeTotals,
} from "@/lib/calc";
import { CHANNELS } from "@/lib/constants";
import {
  formatCOP,
  formatCOPCompact,
  formatDate,
  formatNumber,
  formatPercent,
} from "@/lib/format";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { KpiCard } from "@/components/ui/kpi-card";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ChannelDonut, type DonutDatum } from "@/components/charts/channel-donut";
import { DailyArea, type DailyAreaDatum } from "@/components/charts/daily-area";
import { TrackingTable, type TrackingRow } from "@/components/tracking-table";
import { formatDateShort } from "@/lib/format";

export default async function ResumenPage() {
  let data;
  try {
    data = await getCampaignData();
  } catch {
    return (
      <EmptyState
        title="Conecta Supabase para empezar"
        description="Configura NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env.local y ejecuta las migraciones SQL."
        ctaHref="/importar"
        ctaLabel="Ir a Importar"
      />
    );
  }
  if (!data) return <EmptyState />;

  const channels = computeChannels(data);
  const totals = computeTotals(channels);
  const daily = computeDaily(data);
  const { campaign } = data;

  const donut: DonutDatum[] = channels.map((c) => ({
    name: CHANNELS[c.channel].label,
    value: c.plannedBudget,
    share: c.participationPct,
    color: CHANNELS[c.channel].color,
  }));

  const area: DailyAreaDatum[] = daily.map((d) => ({
    label: formatDateShort(d.date),
    meta: d.byChannel.meta?.investment ?? 0,
    pilas: d.byChannel.pilas?.investment ?? 0,
    youtube: d.byChannel.youtube?.investment ?? 0,
    google_display: d.byChannel.google_display?.investment ?? 0,
  }));

  const tracking: TrackingRow[] = channels.map((c) => ({
    channelId: data.channels.find((ch) => ch.channel === c.channel)!.id,
    channel: c.channel,
    planned: c.plannedBudget,
    real: c.realInvestment,
    difference: c.difference,
    executionPct: c.executionPct,
  }));

  const endDate = daily[daily.length - 1]?.date ?? campaign.start_date;

  return (
    <>
      <PageHeader
        title="Resumen Ejecutivo"
        description={`${campaign.name} · ${formatDate(campaign.start_date)} → ${formatDate(endDate)} · ${campaign.duration_days} días`}
      />

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Inversión total"
          value={formatCOP(campaign.total_budget)}
          hint={`${formatCOPCompact(totals.dailyBudget)} / día`}
          accent="brand"
          icon={<Icon path="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />}
        />
        <KpiCard
          label="Impresiones proyectadas"
          value={formatNumber(totals.impressions)}
          hint={`Alcance único ~${formatNumber(totals.reach)}`}
          accent="violet"
          icon={<Icon path="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z M12 9a3 3 0 100 6 3 3 0 000-6z" />}
        />
        <KpiCard
          label="Clicks proyectados"
          value={formatNumber(totals.clicks)}
          hint={`CTR ponderado ${formatPercent(totals.weightedCtr)}`}
          accent="emerald"
          icon={<Icon path="M9 11l3 3L22 4 M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />}
        />
        <KpiCard
          label="Costo por click"
          value={formatCOP(totals.blendedCpc)}
          hint={`CPM mezcla ${formatCOP(totals.blendedCpm)}`}
          accent="amber"
          icon={<Icon path="M3 3v18h18 M7 14l3-3 4 4 6-6" />}
        />
      </div>

      {/* Distribución + KPIs canal */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader title="Distribución por canal" subtitle="Participación del presupuesto" />
          <CardBody>
            <ChannelDonut data={donut} />
            <ul className="mt-4 space-y-2">
              {channels.map((c) => (
                <li key={c.channel} className="flex items-center justify-between text-sm">
                  <span className="inline-flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: CHANNELS[c.channel].color }}
                    />
                    <span className="text-slate-700">{CHANNELS[c.channel].label}</span>
                  </span>
                  <span className="tabular-nums text-slate-500">
                    {formatPercent(c.participationPct, 0)} · {formatCOPCompact(c.plannedBudget)}
                  </span>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader
            title="Inversión diaria por canal"
            subtitle="Distribución del presupuesto a lo largo de la campaña"
          />
          <CardBody>
            <DailyArea data={area} />
          </CardBody>
        </Card>
      </div>

      {/* Seguimiento real vs meta */}
      <Card>
        <CardHeader
          title="Seguimiento real vs meta"
          subtitle="Actualiza la inversión real ejecutada por canal para monitorear la ejecución presupuestal"
        />
        <TrackingTable
          rows={tracking}
          totals={{
            planned: totals.plannedBudget,
            real: totals.realInvestment,
            difference: totals.difference,
            executionPct: totals.executionPct,
          }}
        />
      </Card>
    </>
  );
}

function Icon({ path }: { path: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={path} />
    </svg>
  );
}
