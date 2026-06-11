// ════════════════════════════════════════════════════════════════════════
//  MOTOR DE CÁLCULO
//  Replica las fórmulas del Excel "Plan de inversión para pauta".
//  A partir de los inputs base (presupuesto, %/CPM/CTR/frecuencia por canal y
//  factores de peso diarios) deriva todas las métricas proyectadas.
//  Única fuente de verdad: cambiar un input recalcula todo el dashboard.
// ════════════════════════════════════════════════════════════════════════

import type {
  CampaignChannel,
  CampaignData,
  ChannelKey,
  DailyPlan,
} from "./types";
import { CHANNEL_ORDER } from "./constants";

// ── Métricas por canal ────────────────────────────────────────────────────

export interface ChannelMetrics {
  channel: ChannelKey;
  participationPct: number; // 0..1
  cpm: number;
  ctr: number; // 0..1
  frequency: number;
  // Plan
  plannedBudget: number; // presupuesto = total * %
  dailyBudget: number; // presupuesto / duración
  impressions: number; // (presupuesto / cpm) * 1000
  clicks: number; // impresiones * ctr
  cpc: number; // presupuesto / clicks
  reach: number; // impresiones / frecuencia (alcance único)
  // Seguimiento real
  realInvestment: number;
  difference: number; // real - planificado
  executionPct: number; // real / planificado (0..1)
  // Cualitativos
  objective: string | null;
  targetAudience: string | null;
  mainKpi: string | null;
}

export interface Totals {
  plannedBudget: number;
  dailyBudget: number;
  impressions: number;
  clicks: number;
  reach: number;
  realInvestment: number;
  difference: number;
  executionPct: number; // real / planificado
  weightedCtr: number; // clicks / impresiones
  blendedCpc: number; // presupuesto / clicks
  blendedCpm: number; // presupuesto / impresiones * 1000
}

function safeDiv(a: number, b: number): number {
  return b ? a / b : 0;
}

/** Calcula las métricas de un canal a partir de su config y el presupuesto total. */
export function computeChannel(
  totalBudget: number,
  durationDays: number,
  ch: CampaignChannel,
): ChannelMetrics {
  const plannedBudget = totalBudget * ch.participation_pct;
  const dailyBudget = safeDiv(plannedBudget, durationDays);
  const impressions = safeDiv(plannedBudget, ch.cpm) * 1000;
  const clicks = impressions * ch.ctr;
  const cpc = safeDiv(plannedBudget, clicks);
  const reach = safeDiv(impressions, ch.frequency);
  const difference = ch.real_investment - plannedBudget;
  const executionPct = safeDiv(ch.real_investment, plannedBudget);

  return {
    channel: ch.channel,
    participationPct: ch.participation_pct,
    cpm: ch.cpm,
    ctr: ch.ctr,
    frequency: ch.frequency,
    plannedBudget,
    dailyBudget,
    impressions,
    clicks,
    cpc,
    reach,
    realInvestment: ch.real_investment,
    difference,
    executionPct,
    objective: ch.objective,
    targetAudience: ch.target_audience,
    mainKpi: ch.main_kpi,
  };
}

/** Métricas de todos los canales, ordenadas según CHANNEL_ORDER. */
export function computeChannels(data: CampaignData): ChannelMetrics[] {
  const { campaign, channels } = data;
  return [...channels]
    .sort(
      (a, b) =>
        CHANNEL_ORDER.indexOf(a.channel) - CHANNEL_ORDER.indexOf(b.channel),
    )
    .map((ch) =>
      computeChannel(campaign.total_budget, campaign.duration_days, ch),
    );
}

/** Agrega los totales de campaña a partir de las métricas por canal. */
export function computeTotals(channels: ChannelMetrics[]): Totals {
  const plannedBudget = sum(channels, (c) => c.plannedBudget);
  const dailyBudget = sum(channels, (c) => c.dailyBudget);
  const impressions = sum(channels, (c) => c.impressions);
  const clicks = sum(channels, (c) => c.clicks);
  const reach = sum(channels, (c) => c.reach);
  const realInvestment = sum(channels, (c) => c.realInvestment);

  return {
    plannedBudget,
    dailyBudget,
    impressions,
    clicks,
    reach,
    realInvestment,
    difference: realInvestment - plannedBudget,
    executionPct: safeDiv(realInvestment, plannedBudget),
    weightedCtr: safeDiv(clicks, impressions),
    blendedCpc: safeDiv(plannedBudget, clicks),
    blendedCpm: safeDiv(plannedBudget, impressions) * 1000,
  };
}

// ── Desglose diario ───────────────────────────────────────────────────────

export interface DailyChannelMetric {
  channel: ChannelKey;
  investment: number;
  impressions: number;
  clicks: number;
}

export interface DailyMetrics {
  dayNumber: number;
  date: string;
  weightFactor: number;
  totalInvestment: number;
  totalImpressions: number;
  totalClicks: number;
  byChannel: Record<ChannelKey, DailyChannelMetric>;
}

/**
 * Inversión diaria = total * factor / Σ(factores).
 * Garantiza que la suma de los días siempre iguale el presupuesto total,
 * sin importar los factores (igual que el Excel).
 */
export function computeDaily(data: CampaignData): DailyMetrics[] {
  const { campaign, channels, days } = data;
  const sortedDays = [...days].sort((a, b) => a.day_number - b.day_number);
  const sumFactors = sortedDays.reduce((acc, d) => acc + d.weight_factor, 0);

  const orderedChannels = [...channels].sort(
    (a, b) => CHANNEL_ORDER.indexOf(a.channel) - CHANNEL_ORDER.indexOf(b.channel),
  );

  return sortedDays.map((day) => {
    const totalInvestment = safeDiv(
      campaign.total_budget * day.weight_factor,
      sumFactors,
    );

    const byChannel = {} as Record<ChannelKey, DailyChannelMetric>;
    let totalImpressions = 0;
    let totalClicks = 0;

    for (const ch of orderedChannels) {
      const investment = totalInvestment * ch.participation_pct;
      const impressions = safeDiv(investment, ch.cpm) * 1000;
      const clicks = impressions * ch.ctr;
      byChannel[ch.channel] = { channel: ch.channel, investment, impressions, clicks };
      totalImpressions += impressions;
      totalClicks += clicks;
    }

    return {
      dayNumber: day.day_number,
      date: day.date,
      weightFactor: day.weight_factor,
      totalInvestment,
      totalImpressions,
      totalClicks,
      byChannel,
    };
  });
}

// ── Validaciones ──────────────────────────────────────────────────────────

/** Suma de los % de participación (debería ser 1.0). */
export function participationSum(channels: CampaignChannel[]): number {
  return channels.reduce((acc, c) => acc + c.participation_pct, 0);
}

// ── helper ────────────────────────────────────────────────────────────────

function sum<T>(arr: T[], pick: (x: T) => number): number {
  return arr.reduce((acc, x) => acc + pick(x), 0);
}

export function sumDays(days: DailyPlan[]): number {
  return days.reduce((acc, d) => acc + d.weight_factor, 0);
}
