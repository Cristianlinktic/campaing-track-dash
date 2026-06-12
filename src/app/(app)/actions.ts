"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { logout } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase/server";

// Tipo de retorno estándar para las actions que muestran toast.
export type ActionResult = { ok: true; message: string } | { ok: false; error: string };

function num(formData: FormData, key: string): number {
  const raw = String(formData.get(key) ?? "").replace(",", ".");
  const n = parseFloat(raw);
  return Number.isFinite(n) ? n : 0;
}

export async function logoutAction() {
  await logout();
  redirect("/login");
}

/** Actualiza los parámetros globales de la campaña. */
export async function updateParamsAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const id = String(formData.get("campaign_id") ?? "");
  if (!id) return { ok: false, error: "ID de campaña no encontrado." };

  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from("campaign_dash")
      .update({
        name: String(formData.get("name") ?? "").trim() || "Campaña de pauta",
        total_budget: num(formData, "total_budget"),
        duration_days: Math.round(num(formData, "duration_days")) || 1,
        start_date: String(formData.get("start_date") ?? ""),
      })
      .eq("id", id);

    if (error) throw error;
    revalidatePath("/", "layout");
    return { ok: true, message: "Parámetros de campaña guardados correctamente." };
  } catch {
    return { ok: false, error: "No se pudieron guardar los parámetros. Intenta de nuevo." };
  }
}

/**
 * Actualiza la configuración de un canal.
 * Los % se reciben como número entero (38) y se guardan como fracción (0.38).
 */
export async function updateChannelAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const id = String(formData.get("channel_id") ?? "");
  if (!id) return { ok: false, error: "ID de canal no encontrado." };

  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from("campaign_channels")
      .update({
        participation_pct: num(formData, "participation_pct") / 100,
        cpm: num(formData, "cpm"),
        ctr: num(formData, "ctr") / 100,
        frequency: num(formData, "frequency") || 1,
        objective: String(formData.get("objective") ?? "").trim() || null,
        target_audience: String(formData.get("target_audience") ?? "").trim() || null,
        main_kpi: String(formData.get("main_kpi") ?? "").trim() || null,
      })
      .eq("id", id);

    if (error) throw error;
    revalidatePath("/", "layout");
    return { ok: true, message: "Canal actualizado correctamente." };
  } catch {
    return { ok: false, error: "No se pudo actualizar el canal. Intenta de nuevo." };
  }
}

/** Upsert de métricas acumuladas (inversión, impresión, pacing). */
export async function updateMetricsAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const campaignId = String(formData.get("campaign_id") ?? "");
  if (!campaignId) return { ok: false, error: "ID de campaña no encontrado." };

  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from("campaign_metrics")
      .upsert(
        {
          campaign_id: campaignId,
          inversion_acumulada: num(formData, "inversion_acumulada"),
          impresion_acumulada: Math.round(num(formData, "impresion_acumulada")),
          pacing_presupuestal: num(formData, "pacing_presupuestal"),
          alcance_acumulado: Math.round(num(formData, "alcance_acumulado")),
        },
        { onConflict: "campaign_id" },
      );

    if (error) throw error;
    revalidatePath("/", "layout");
    return { ok: true, message: "Métricas acumuladas guardadas correctamente." };
  } catch {
    return { ok: false, error: "No se pudieron guardar las métricas. Intenta de nuevo." };
  }
}

/** Guarda la inversión real diaria por canal (todos los días en un solo submit). */
export async function saveDailyActualsAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const campaignId = String(formData.get("campaign_id") ?? "");
  if (!campaignId) return { ok: false, error: "ID de campaña no encontrado." };

  try {
    const supabase = getSupabaseAdmin();

    // Recopila dinámicamente todas las filas del formulario.
    // Cada día tiene inputs: meta_{n}, pilas_{n}, youtube_{n}, google_display_{n}, date_{n}
    const rows: {
      campaign_id: string;
      day_number: number;
      date: string;
      meta: number;
      pilas: number;
      youtube: number;
      google_display: number;
    }[] = [];

    for (let i = 1; i <= 60; i++) {
      const date = formData.get(`date_${i}`);
      if (!date) break;
      rows.push({
        campaign_id: campaignId,
        day_number: i,
        date: String(date),
        meta: num(formData, `meta_${i}`),
        pilas: num(formData, `pilas_${i}`),
        youtube: num(formData, `youtube_${i}`),
        google_display: num(formData, `google_display_${i}`),
      });
    }

    if (rows.length === 0) return { ok: false, error: "No se encontraron datos de días." };

    const { error } = await supabase
      .from("campaign_daily_actuals")
      .upsert(rows, { onConflict: "campaign_id,day_number" });

    if (error) throw error;
    revalidatePath("/", "layout");
    return { ok: true, message: `Datos reales guardados para ${rows.length} días.` };
  } catch {
    return { ok: false, error: "No se pudieron guardar los datos. Intenta de nuevo." };
  }
}

/** Guarda impresiones reales diarias por canal (todos los días en un solo submit). */
export async function saveDailyImpressionsAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const campaignId = String(formData.get("campaign_id") ?? "");
  if (!campaignId) return { ok: false, error: "ID de campaña no encontrado." };

  try {
    const supabase = getSupabaseAdmin();
    const rows: {
      campaign_id: string;
      day_number: number;
      date: string;
      meta: number;
      pilas: number;
      youtube: number;
      google_display: number;
    }[] = [];

    for (let i = 1; i <= 60; i++) {
      const date = formData.get(`date_${i}`);
      if (!date) break;
      rows.push({
        campaign_id: campaignId,
        day_number: i,
        date: String(date),
        meta: Math.round(num(formData, `meta_${i}`)),
        pilas: Math.round(num(formData, `pilas_${i}`)),
        youtube: Math.round(num(formData, `youtube_${i}`)),
        google_display: Math.round(num(formData, `google_display_${i}`)),
      });
    }

    if (rows.length === 0) return { ok: false, error: "No se encontraron datos de días." };

    const { error } = await supabase
      .from("campaign_daily_impressions")
      .upsert(rows, { onConflict: "campaign_id,day_number" });

    if (error) throw error;
    revalidatePath("/", "layout");
    return { ok: true, message: `Impresiones guardadas para ${rows.length} días.` };
  } catch {
    return { ok: false, error: "No se pudieron guardar las impresiones. Intenta de nuevo." };
  }
}

/** Guarda la inversión real ejecutada de un canal (seguimiento en Resumen). */
export async function updateRealInvestmentAction(formData: FormData) {
  const id = String(formData.get("channel_id") ?? "");
  if (!id) return;

  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("campaign_channels")
    .update({ real_investment: num(formData, "real_investment") })
    .eq("id", id);

  if (error) throw error;
  revalidatePath("/", "layout");
}
