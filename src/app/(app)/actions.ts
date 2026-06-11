"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { logout } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase/server";

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
export async function updateParamsAction(formData: FormData) {
  const id = String(formData.get("campaign_id") ?? "");
  if (!id) return;

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
}

/**
 * Actualiza la configuración de un canal.
 * La UI recibe % e índices como porcentaje (38, 1.7) → se guardan como
 * fracción (0.38, 0.017).
 */
export async function updateChannelAction(formData: FormData) {
  const id = String(formData.get("channel_id") ?? "");
  if (!id) return;

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
}

/** Guarda la inversión real ejecutada de un canal (seguimiento). */
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
