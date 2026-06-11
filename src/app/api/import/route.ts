import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { parsePautaWorkbook, ExcelParseError } from "@/lib/excel";
import { replaceCampaignFromPlan } from "@/lib/data";

export const runtime = "nodejs";
export const maxDuration = 30;

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  let file: File | null = null;
  try {
    const form = await req.formData();
    const f = form.get("file");
    if (f instanceof File) file = f;
  } catch {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }

  if (!file) {
    return NextResponse.json({ error: "No se recibió ningún archivo." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "El archivo supera el límite de 5 MB." },
      { status: 413 },
    );
  }
  if (!/\.xlsx$/i.test(file.name)) {
    return NextResponse.json(
      { error: "Formato no soportado. Sube un archivo .xlsx." },
      { status: 415 },
    );
  }

  try {
    const buffer = await file.arrayBuffer();
    const plan = await parsePautaWorkbook(buffer);
    await replaceCampaignFromPlan(plan);

    return NextResponse.json({
      ok: true,
      summary: {
        name: plan.name,
        totalBudget: plan.total_budget,
        durationDays: plan.duration_days,
        startDate: plan.start_date,
        channels: plan.channels.length,
        days: plan.days.length,
      },
    });
  } catch (err) {
    if (err instanceof ExcelParseError) {
      return NextResponse.json({ error: err.message }, { status: 422 });
    }
    console.error("Error al importar pauta:", err);
    return NextResponse.json(
      { error: "Error procesando el archivo. Revisa el formato e inténtalo de nuevo." },
      { status: 500 },
    );
  }
}
