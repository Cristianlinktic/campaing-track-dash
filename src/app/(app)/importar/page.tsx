import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { ImportForm } from "./import-form";

export default function ImportarPage() {
  return (
    <>
      <PageHeader
        title="Importar Excel"
        description="Carga masiva del plan de pauta. Sube tu archivo .xlsx con el formato del template."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader
              title="Subir plan de pauta"
              subtitle="El archivo reemplaza los datos de la campaña actual (la inversión real registrada se conserva)."
            />
            <CardBody>
              <ImportForm />
            </CardBody>
          </Card>
        </div>

        <Card>
          <CardHeader title="Formato esperado" />
          <CardBody className="space-y-4 text-sm text-slate-600">
            <p>El Excel debe contener estas hojas (el orden y los emojis son tolerantes):</p>
            <ul className="space-y-2">
              <li className="flex gap-2">
                <Dot /> <span><b>Resumen Ejecutivo</b> — presupuesto, duración, % / CPM / CTR por canal.</span>
              </li>
              <li className="flex gap-2">
                <Dot /> <span><b>Distribución x Canal</b> — objetivo, público y KPI por canal.</span>
              </li>
              <li className="flex gap-2">
                <Dot /> <span><b>Desglose Diario</b> — fecha de inicio y factor de peso por día.</span>
              </li>
              <li className="flex gap-2">
                <Dot /> <span><b>Proyecciones</b> — frecuencia estimada por canal.</span>
              </li>
            </ul>
            <div className="rounded-lg bg-amber-50 px-3 py-2.5 text-xs text-amber-800">
              Las métricas (impresiones, clicks, CPC, alcance) se <b>calculan</b> en el dashboard a
              partir de estos parámetros — no es necesario que estén en el archivo.
            </div>
          </CardBody>
        </Card>
      </div>
    </>
  );
}

function Dot() {
  return <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />;
}
