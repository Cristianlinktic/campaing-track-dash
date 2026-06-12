-- ════════════════════════════════════════════════════════════════════════
--  campaign_metrics — valores acumulados y métricas manuales de seguimiento
--  Ejecuta este archivo en Supabase → SQL Editor después de 0001/setup.sql
-- ════════════════════════════════════════════════════════════════════════

create table if not exists public.campaign_metrics (
  id                    uuid primary key default gen_random_uuid(),
  campaign_id           uuid not null references public.campaign_dash(id) on delete cascade,
  inversion_acumulada   numeric(14,2) not null default 0,
  impresion_acumulada   numeric(16,0) not null default 0,
  pacing_presupuestal   numeric(6,2)  not null default 0,   -- porcentaje, ej: 73.5
  updated_at            timestamptz   not null default now(),
  unique (campaign_id)
);

create trigger campaign_metrics_set_updated_at
  before update on public.campaign_metrics
  for each row execute function public.set_updated_at();

alter table public.campaign_metrics enable row level security;
alter table public.campaign_metrics force row level security;

-- Inicializa la fila de métricas para la campaña que ya existe (si hay seed)
insert into public.campaign_metrics (campaign_id, inversion_acumulada, impresion_acumulada, pacing_presupuestal)
select id, 0, 0, 0
from public.campaign_dash
on conflict (campaign_id) do nothing;
