import { getCampaignData } from "@/lib/data";
import { computeChannels, participationSum } from "@/lib/calc";
import { CHANNELS } from "@/lib/constants";
import { formatPercent } from "@/lib/format";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { SaveButton } from "@/components/save-button";
import { updateChannelAction, updateParamsAction } from "../actions";

export default async function ConfiguracionPage() {
  const data = await getCampaignData();
  if (!data) return <EmptyState />;

  const { campaign, channels } = data;
  const computed = computeChannels(data);
  const pctSum = participationSum(channels);
  const pctOk = Math.abs(pctSum - 1) < 0.005;

  return (
    <>
      <PageHeader
        title="Configuración"
        description="Edita los parámetros base de la campaña. Todas las métricas del dashboard se recalculan automáticamente."
      />

      {/* Parámetros globales */}
      <Card>
        <CardHeader title="Parámetros de campaña" />
        <CardBody>
          <form action={updateParamsAction} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <input type="hidden" name="campaign_id" value={campaign.id} />
            <FieldInput label="Nombre" name="name" defaultValue={campaign.name} className="sm:col-span-2" />
            <FieldInput
              label="Presupuesto total (COP)"
              name="total_budget"
              type="number"
              defaultValue={campaign.total_budget}
              min={0}
              step={1000}
            />
            <FieldInput
              label="Duración (días)"
              name="duration_days"
              type="number"
              defaultValue={campaign.duration_days}
              min={1}
            />
            <FieldInput
              label="Fecha de inicio"
              name="start_date"
              type="date"
              defaultValue={campaign.start_date}
            />
            <div className="flex items-end sm:col-span-2 lg:col-span-3">
              <SaveButton>Guardar parámetros</SaveButton>
            </div>
          </form>
        </CardBody>
      </Card>

      {/* Aviso de suma de participación */}
      {!pctOk && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          ⚠️ La suma de participación de los canales es{" "}
          <b>{formatPercent(pctSum, 1)}</b> (debería ser 100%). Ajusta los porcentajes.
        </div>
      )}

      {/* Configuración por canal */}
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
                <form action={updateChannelAction} className="space-y-4">
                  <input type="hidden" name="channel_id" value={ch.id} />
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <FieldInput
                      label="% Participación"
                      name="participation_pct"
                      type="number"
                      defaultValue={round(ch.participation_pct * 100, 2)}
                      step={0.5}
                      min={0}
                      max={100}
                    />
                    <FieldInput
                      label="CPM (COP)"
                      name="cpm"
                      type="number"
                      defaultValue={ch.cpm}
                      step={50}
                      min={0}
                    />
                    <FieldInput
                      label="CTR (%)"
                      name="ctr"
                      type="number"
                      defaultValue={round(ch.ctr * 100, 3)}
                      step={0.1}
                      min={0}
                    />
                    <FieldInput
                      label="Frecuencia"
                      name="frequency"
                      type="number"
                      defaultValue={ch.frequency}
                      step={0.1}
                      min={1}
                    />
                  </div>
                  <FieldTextarea label="Objetivo" name="objective" defaultValue={ch.objective ?? ""} />
                  <FieldTextarea
                    label="Público objetivo"
                    name="target_audience"
                    defaultValue={ch.target_audience ?? ""}
                  />
                  <FieldInput label="KPI principal" name="main_kpi" defaultValue={ch.main_kpi ?? ""} />
                  <div className="flex justify-end">
                    <SaveButton>Guardar canal</SaveButton>
                  </div>
                </form>
              </CardBody>
            </Card>
          );
        })}
      </div>
    </>
  );
}

function round(n: number, d: number) {
  const f = 10 ** d;
  return Math.round(n * f) / f;
}

function FieldInput({
  label,
  name,
  type = "text",
  defaultValue,
  className = "",
  ...rest
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string | number;
  className?: string;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <label className={`flex flex-col gap-1.5 ${className}`}>
      <span className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</span>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        {...rest}
        className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
      />
    </label>
  );
}

function FieldTextarea({
  label,
  name,
  defaultValue,
}: {
  label: string;
  name: string;
  defaultValue?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</span>
      <textarea
        name={name}
        defaultValue={defaultValue}
        rows={2}
        className="resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
      />
    </label>
  );
}
