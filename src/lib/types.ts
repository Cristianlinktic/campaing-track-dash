// Tipos de dominio compartidos en toda la app.

export type ChannelKey = "meta" | "pilas" | "youtube" | "google_display";

export const CHANNEL_KEYS: ChannelKey[] = [
  "meta",
  "pilas",
  "youtube",
  "google_display",
];

// ── Filas tal como viven en Supabase ──────────────────────────────────────

export interface Campaign {
  id: string;
  name: string;
  description: string | null;
  total_budget: number;
  duration_days: number;
  start_date: string; // YYYY-MM-DD
  status: "draft" | "active" | "completed";
  created_at: string;
  updated_at: string;
}

export interface CampaignChannel {
  id: string;
  campaign_id: string;
  channel: ChannelKey;
  position: number;
  participation_pct: number; // 0..1
  cpm: number;
  ctr: number; // 0..1
  frequency: number;
  objective: string | null;
  recommended_format: string | null;
  target_audience: string | null;
  main_kpi: string | null;
  real_investment: number;
  created_at: string;
  updated_at: string;
}

export interface DailyPlan {
  id: string;
  campaign_id: string;
  day_number: number;
  date: string; // YYYY-MM-DD
  weight_factor: number;
  created_at: string;
  updated_at: string;
}

export interface CampaignMetrics {
  id: string;
  campaign_id: string;
  inversion_acumulada: number;
  impresion_acumulada: number;
  pacing_presupuestal: number; // porcentaje, ej: 73.5
  alcance_acumulado: number;
  updated_at: string;
}

export interface DailyActuals {
  id: string;
  campaign_id: string;
  day_number: number;
  date: string;
  meta: number;
  pilas: number;
  youtube: number;
  google_display: number;
}

export interface DailyImpressions {
  id: string;
  campaign_id: string;
  day_number: number;
  date: string;
  meta: number;
  pilas: number;
  youtube: number;
  google_display: number;
}

// Snapshot completo que consumen las páginas del dashboard.
export interface CampaignData {
  campaign: Campaign;
  channels: CampaignChannel[];
  days: DailyPlan[];
  metrics: CampaignMetrics | null;
  actuals: DailyActuals[];
  impressions: DailyImpressions[];
}

// ── Estructura que produce el parser de Excel ─────────────────────────────

export interface ParsedChannel {
  channel: ChannelKey;
  participation_pct: number;
  cpm: number;
  ctr: number;
  frequency: number;
  objective: string | null;
  target_audience: string | null;
  main_kpi: string | null;
}

export interface ParsedDay {
  day_number: number;
  date: string; // YYYY-MM-DD
  weight_factor: number;
}

export interface ParsedPlan {
  name: string;
  total_budget: number;
  duration_days: number;
  start_date: string; // YYYY-MM-DD
  channels: ParsedChannel[];
  days: ParsedDay[];
}
