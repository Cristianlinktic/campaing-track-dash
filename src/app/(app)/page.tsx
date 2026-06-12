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
  formatDecimal,
  formatNumber,
  formatPercent,
} from "@/lib/format";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { KpiCard } from "@/components/ui/kpi-card";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ChannelDonut, type DonutDatum } from "@/components/charts/channel-donut";
import { DailyArea, type DailyAreaDatum } from "@/components/charts/daily-area";
import {
  ComparisonChart,
  type ComparisonDatum,
} from "@/components/charts/comparison-chart";
import { TrackingTable, type TrackingRow } from "@/components/tracking-table";
import { Tabs } from "@/components/ui/tabs";
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

  // Mapas para acceso O(1) por day_number
  const actualsMap = new Map(data.actuals.map((a) => [a.day_number, a]));
  const impressionsMap = new Map(data.impressions.map((r) => [r.day_number, r]));

  const comparison: ComparisonDatum[] = daily.map((d) => {
    const actual = actualsMap.get(d.dayNumber);
    return {
      label: formatDateShort(d.date),
      meta_plan: d.byChannel.meta?.investment ?? 0,
      pilas_plan: d.byChannel.pilas?.investment ?? 0,
      youtube_plan: d.byChannel.youtube?.investment ?? 0,
      google_display_plan: d.byChannel.google_display?.investment ?? 0,
      meta_real: actual?.meta ?? 0,
      pilas_real: actual?.pilas ?? 0,
      youtube_real: actual?.youtube ?? 0,
      google_display_real: actual?.google_display ?? 0,
    };
  });

  const impressionsComparison: ComparisonDatum[] = daily.map((d) => {
    const imp = impressionsMap.get(d.dayNumber);
    return {
      label: formatDateShort(d.date),
      meta_plan: d.byChannel.meta?.impressions ?? 0,
      pilas_plan: d.byChannel.pilas?.impressions ?? 0,
      youtube_plan: d.byChannel.youtube?.impressions ?? 0,
      google_display_plan: d.byChannel.google_display?.impressions ?? 0,
      meta_real: imp?.meta ?? 0,
      pilas_real: imp?.pilas ?? 0,
      youtube_real: imp?.youtube ?? 0,
      google_display_real: imp?.google_display ?? 0,
    };
  });

  return (
    <>
      <PageHeader
        title="Resumen Ejecutivo"
        description={`${campaign.name} · ${formatDate(campaign.start_date)} → ${formatDate(endDate)} · ${campaign.duration_days} días`}
      />

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Card 1 — Inversión: número grande = acumulada (config), hint = diario */}
        <KpiCard
          label="Inversión"
          value={
            data.metrics?.inversion_acumulada
              ? formatCOP(data.metrics.inversion_acumulada)
              : "—"
          }
          hint={`Estimado: ${formatCOP(campaign.total_budget)}`}
          accent="brand"
          icon={<Icon path="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />}
        />
        {/* Card 2 — Impresiones: número grande = acumulada (config), hint = proyectadas */}
        <KpiCard
          label="Impresiones"
          value={
            data.metrics?.impresion_acumulada
              ? formatNumber(data.metrics.impresion_acumulada)
              : "—"
          }
          hint={`Estimado: $ ${formatNumber(totals.impressions)}`}
          accent="violet"
          icon={<Icon path="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z M12 9a3 3 0 100 6 3 3 0 000-6z" />}
        />
        {/* Card 3 — Alcance: número grande = acumulado (config), hint = estimado calculado */}
        <KpiCard
          label="Alcance"
          value={
            data.metrics?.alcance_acumulado
              ? formatNumber(data.metrics.alcance_acumulado)
              : "—"
          }
          hint={`Estimado: $ ${formatNumber(totals.reach)}`}
          accent="emerald"
          icon={<Icon path="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75 M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />}
        />
        {/* Card 4 — Pacing presupuestal (config), se muestra como % */}
        <KpiCard
          label="Pacing presupuestal"
          value={
            data.metrics?.pacing_presupuestal != null
              ? `${formatDecimal(data.metrics.pacing_presupuestal)} %`
              : "— %"
          }
          hint="Meta de ejecución presupuestal"
          accent="amber"
          icon={<Icon path="M3 3v18h18 M7 14l3-3 4 4 6-6" />}
        />
      </div>

      {/* Gráficas Plan vs Real con tabs */}
      <Card>
        <CardBody>
          <Tabs
            tabs={[
              {
                id: "inversion",
                label: "Inversión",
                content: (
                  <div className="space-y-3">
                    <p className="text-xs text-slate-400">
                      Áreas: inversión planificada · Líneas punteadas: inversión real
                      (Configuración → Inversión real)
                    </p>
                    <ComparisonChart data={comparison} />
                  </div>
                ),
              },
              {
                id: "impresiones",
                label: "Impresiones",
                content: (
                  <div className="space-y-3">
                    <p className="text-xs text-slate-400">
                      Áreas: impresiones planificadas · Líneas punteadas: impresiones reales
                      (Configuración → Impresiones reales)
                    </p>
                    <ComparisonChart data={impressionsComparison} mode="number" />
                  </div>
                ),
              },
            ]}
          />
        </CardBody>
      </Card>

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
