import { getCampaignData } from "@/lib/data";
import { computeChannels, participationSum } from "@/lib/calc";
import { CHANNELS } from "@/lib/constants";
import { formatPercent } from "@/lib/format";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ActionForm } from "@/components/action-form";
import { SaveButton } from "@/components/save-button";
import { updateChannelAction, updateMetricsAction, updateParamsAction } from "../actions";
import { ConfigTabs } from "./config-tabs";
import { DailyActualsForm } from "./daily-actuals-form";
import { DailyImpressionsForm } from "./daily-impressions-form";

export default async function ConfiguracionPage() {
  const data = await getCampaignData();
  if (!data) return <EmptyState />;

  const { campaign, channels, metrics, days, actuals, impressions } = data;
  const computed = computeChannels(data);
  const pctSum = participationSum(channels);
  const pctOk = Math.abs(pctSum - 1) < 0.005;

  // ── Tab 1: Parámetros ──────────────────────────────────────────────────
  const tabParams = (
    <div className="space-y-6">
      <Card>
        <CardHeader title="Parámetros de campaña" />
        <CardBody>
          <ActionForm action={updateParamsAction} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <input type="hidden" name="campaign_id" value={campaign.id} />
            <FieldInput label="Nombre" name="name" defaultValue={campaign.name} className="sm:col-span-2" />
            <FieldInput label="Presupuesto total (COP)" name="total_budget" type="number" defaultValue={campaign.total_budget} min={0} step={1000} />
            <FieldInput label="Duración (días)" name="duration_days" type="number" defaultValue={campaign.duration_days} min={1} />
            <FieldInput label="Fecha de inicio" name="start_date" type="date" defaultValue={campaign.start_date} />
            <div className="flex items-end sm:col-span-2 lg:col-span-3">
              <SaveButton>Guardar parámetros</SaveButton>
            </div>
          </ActionForm>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Métricas acumuladas"
          subtitle="Estos valores se muestran en las cards del Resumen Ejecutivo. Actualízalos diariamente."
        />
        <CardBody>
          <ActionForm action={updateMetricsAction} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <input type="hidden" name="campaign_id" value={campaign.id} />
            <FieldInput label="Inversión acumulada (COP)" name="inversion_acumulada" type="number" defaultValue={metrics?.inversion_acumulada ?? 0} min={0} step={1000} />
            <FieldInput label="Impresión acumulada" name="impresion_acumulada" type="number" defaultValue={metrics?.impresion_acumulada ?? 0} min={0} step={1000} />
            <FieldInput label="Alcance acumulado" name="alcance_acumulado" type="number" defaultValue={metrics?.alcance_acumulado ?? 0} min={0} step={1000} />
            <FieldInput label="Pacing presupuestal (%)" name="pacing_presupuestal" type="number" defaultValue={metrics?.pacing_presupuestal ?? 0} min={0} max={999} step={0.1} />
            <div className="flex items-end sm:col-span-2 lg:col-span-4">
              <SaveButton>Guardar métricas</SaveButton>
            </div>
          </ActionForm>
        </CardBody>
      </Card>
    </div>
  );

  // ── Tab 2: Canales ─────────────────────────────────────────────────────
  const tabCanales = (
    <div className="space-y-4">
      {!pctOk && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          ⚠️ La suma de participación es <b>{formatPercent(pctSum, 1)}</b> (debería ser 100%). Ajusta los porcentajes.
        </div>
      )}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {channels.map((ch) => {
          const m = computed.find((c) => c.channel === ch.channel)!;
          return (
            <Card key={ch.id}>
              <CardHeader
                title={CHANNELS[ch.channel].label}
                subtitle={CHANNELS[ch.channel].subtitle}
                action={
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">
                    {formatPercent(m.participationPct, 0)}
                  </span>
                }
              />
              <CardBody>
                <ActionForm action={updateChannelAction} className="space-y-4">
                  <input type="hidden" name="channel_id" value={ch.id} />
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <FieldInput label="% Participación" name="participation_pct" type="number" defaultValue={round(ch.participation_pct * 100, 2)} step={0.5} min={0} max={100} />
                    <FieldInput label="CPM (COP)" name="cpm" type="number" defaultValue={ch.cpm} step={50} min={0} />
                    <FieldInput label="CTR (%)" name="ctr" type="number" defaultValue={round(ch.ctr * 100, 3)} step={0.1} min={0} />
                    <FieldInput label="Frecuencia" name="frequency" type="number" defaultValue={ch.frequency} step={0.1} min={1} />
                  </div>
                  <FieldTextarea label="Objetivo" name="objective" defaultValue={ch.objective ?? ""} />
                  <FieldTextarea label="Público objetivo" name="target_audience" defaultValue={ch.target_audience ?? ""} />
                  <FieldInput label="KPI principal" name="main_kpi" defaultValue={ch.main_kpi ?? ""} />
                  <div className="flex justify-end">
                    <SaveButton>Guardar canal</SaveButton>
                  </div>
                </ActionForm>
              </CardBody>
            </Card>
          );
        })}
      </div>
    </div>
  );

  // ── Tab 3: Inversión real por día ─────────────────────────────────────
  const tabDiario = (
    <Card>
      <CardHeader
        title="Inversión real por canal por día"
        subtitle="Ingresa los valores reales de inversión diaria por canal. Se comparan vs. el plan en la gráfica del Resumen."
      />
      <CardBody>
        <DailyActualsForm campaignId={campaign.id} days={days} actuals={actuals} />
      </CardBody>
    </Card>
  );

  // ── Tab 4: Impresiones reales por día ──────────────────────────────────
  const tabImpresiones = (
    <Card>
      <CardHeader
        title="Impresiones reales por canal por día"
        subtitle="Ingresa las impresiones reales por canal. Se muestran como líneas punteadas en la gráfica de impresiones del Resumen."
      />
      <CardBody>
        <DailyImpressionsForm campaignId={campaign.id} days={days} impressions={impressions} />
      </CardBody>
    </Card>
  );

  return (
    <>
      <PageHeader
        title="Configuración"
        description="Edita los parámetros de la campaña. Las métricas del dashboard se recalculan automáticamente."
      />
      <ConfigTabs
        tabs={[
          { id: "parametros", label: "Parámetros", icon: "⚙️", content: tabParams },
          { id: "canales", label: "Canales", icon: "📣", content: tabCanales },
          { id: "diario", label: "Inversión real", icon: "💰", content: tabDiario },
          { id: "impresiones", label: "Impresiones reales", icon: "👁", content: tabImpresiones },
        ]}
      />
    </>
  );
}

function round(n: number, d: number) {
  const f = 10 ** d;
  return Math.round(n * f) / f;
}

function FieldInput({
  label, name, type = "text", defaultValue, className = "", ...rest
}: {
  label: string; name: string; type?: string;
  defaultValue?: string | number; className?: string;
  min?: number; max?: number; step?: number;
}) {
  return (
    <label className={`flex flex-col gap-1.5 ${className}`}>
      <span className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</span>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        {...rest}
        // "any" elimina la validación de incremento del navegador → acepta cualquier número
        step={type === "number" ? "any" : undefined}
        className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
      />
    </label>
  );
}

function FieldTextarea({ label, name, defaultValue }: { label: string; name: string; defaultValue?: string }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</span>
      <textarea
        name={name} defaultValue={defaultValue} rows={2}
        className="resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
      />
    </label>
  );
}
