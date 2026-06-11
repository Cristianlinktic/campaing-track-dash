-- ════════════════════════════════════════════════════════════════════════
--  DASHBOARD DE PAUTA — Esquema de base de datos (Supabase / PostgreSQL)
-- ════════════════════════════════════════════════════════════════════════
--  Ejecuta este archivo completo en:  Supabase → SQL Editor → New query.
--  Diseño "single source of truth": se almacenan SOLO los inputs base del
--  plan; las métricas derivadas (impresiones, clicks, CPC, alcance) se
--  calculan en la aplicación (src/lib/calc.ts), igual que las fórmulas del
--  Excel se recalculan al editar las celdas amarillas.
--
--  SEGURIDAD / RLS:
--  La app usa autenticación propia (tabla `users`) y accede a la base de
--  datos exclusivamente desde el servidor con la SERVICE ROLE KEY, que
--  ignora RLS. Por eso habilitamos RLS en TODAS las tablas y NO creamos
--  políticas permisivas para los roles `anon` / `authenticated`: con la
--  clave pública (anon) nadie puede leer ni escribir. Defensa en
--  profundidad: aunque se filtrara la anon key, los datos quedan cerrados.
-- ════════════════════════════════════════════════════════════════════════

create extension if not exists pgcrypto;

-- ── RESET (instalación limpia) ─────────────────────────────────────────────
--  Elimina versiones previas de estas tablas para evitar conflictos de tipos
--  (p. ej. un `campaigns.id` integer de un intento anterior). Seguro durante
--  la instalación inicial. ⚠️  Borra los datos de estas tablas: si ya tienes
--  información en producción, NO ejecutes este bloque.
drop table if exists public.daily_plan        cascade;
drop table if exists public.campaign_channels cascade;
drop table if exists public.campaign_dash     cascade;
drop table if exists public.app_user_campaing         cascade;

-- ── Trigger genérico para mantener updated_at ──────────────────────────────
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ════════════════════════════════════════════════════════════════════════
--  app_user_campaing  — login básico (usuario + contraseña hasheada con bcrypt)
-- ════════════════════════════════════════════════════════════════════════
create table if not exists public.app_user_campaing (
  id            uuid primary key default gen_random_uuid(),
  username      text not null unique,
  password_hash text not null,                       -- bcrypt, NUNCA texto plano
  display_name  text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create trigger app_user_campaing_set_updated_at
  before update on public.app_user_campaing
  for each row execute function public.set_updated_at();

-- ════════════════════════════════════════════════════════════════════════
--  campaign_dash  — la campaña (singleton) y sus parámetros globales
-- ════════════════════════════════════════════════════════════════════════
create table if not exists public.campaign_dash (
  id             uuid primary key default gen_random_uuid(),
  name           text not null default 'Campaña de pauta',
  description    text,
  total_budget   numeric(14,2) not null default 0,   -- presupuesto total (COP)
  duration_days  integer not null default 15,
  start_date     date not null default current_date,
  status         text not null default 'active'
                 check (status in ('draft', 'active', 'completed')),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create trigger campaign_dash_set_updated_at
  before update on public.campaign_dash
  for each row execute function public.set_updated_at();

-- ════════════════════════════════════════════════════════════════════════
--  campaign_channels — configuración e inputs por canal + seguimiento real
-- ════════════════════════════════════════════════════════════════════════
create table if not exists public.campaign_channels (
  id                 uuid primary key default gen_random_uuid(),
  campaign_id        uuid not null references public.campaign_dash(id) on delete cascade,
  channel            text not null
                     check (channel in ('meta', 'pilas', 'youtube', 'google_display')),
  position           integer not null default 0,        -- orden de visualización
  participation_pct  numeric(6,4) not null default 0,   -- 0..1  (% del presupuesto)
  cpm                numeric(12,2) not null default 0,   -- costo por mil (COP)
  ctr                numeric(6,4)  not null default 0,   -- 0..1  (click-through rate)
  frequency          numeric(5,2)  not null default 1.4, -- frecuencia estimada (alcance)
  objective          text,                               -- objetivo principal
  recommended_format text,                               -- formato recomendado
  target_audience    text,                               -- público objetivo
  main_kpi           text,                               -- KPI principal
  real_investment    numeric(14,2) not null default 0,   -- inversión real ejecutada
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  unique (campaign_id, channel)
);

create index if not exists idx_channels_campaign on public.campaign_channels(campaign_id);

create trigger channels_set_updated_at
  before update on public.campaign_channels
  for each row execute function public.set_updated_at();

-- ════════════════════════════════════════════════════════════════════════
--  daily_plan — desglose por día (factor de peso editable)
--  La inversión diaria se deriva:  budget * factor / Σ(factores)
-- ════════════════════════════════════════════════════════════════════════
create table if not exists public.daily_plan (
  id            uuid primary key default gen_random_uuid(),
  campaign_id   uuid not null references public.campaign_dash(id) on delete cascade,
  day_number    integer not null,
  date          date not null,
  weight_factor numeric(6,3) not null default 1,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (campaign_id, day_number)
);

create index if not exists idx_daily_campaign on public.daily_plan(campaign_id);

create trigger daily_set_updated_at
  before update on public.daily_plan
  for each row execute function public.set_updated_at();

-- ════════════════════════════════════════════════════════════════════════
--  ROW LEVEL SECURITY
--  Habilitado en todas las tablas. Sin políticas para anon/authenticated →
--  acceso denegado por defecto con la anon key. El servidor usa la service
--  role key (bypassa RLS) para todas las operaciones.
-- ════════════════════════════════════════════════════════════════════════
alter table public.app_user_campaing         enable row level security;
alter table public.campaign_dash     enable row level security;
alter table public.campaign_channels enable row level security;
alter table public.daily_plan        enable row level security;

-- Forzamos RLS incluso para el dueño de la tabla (defensa adicional).
alter table public.app_user_campaing         force row level security;
alter table public.campaign_dash     force row level security;
alter table public.campaign_channels force row level security;
alter table public.daily_plan        force row level security;


-- ════════════════════════════════════════════════════════════════════════
--  SEED — datos iniciales (basados en "Plan de inversión para pauta CNE Y A.E")
--  Ejecuta DESPUÉS de 0001_schema.sql.
--  Es idempotente: puedes correrlo varias veces sin duplicar.
-- ════════════════════════════════════════════════════════════════════════

-- ── Usuario inicial ───────────────────────────────────────────────────────
--  Credenciales por defecto:  admin / admin123
--  ⚠️  CÁMBIALAS tras el primer ingreso. La contraseña se guarda hasheada
--  con bcrypt (compatible con bcryptjs del backend).
insert into public.app_user_campaing (username, password_hash, display_name)
values ('admin', crypt('admin123', gen_salt('bf', 10)), 'Administrador')
on conflict (username) do nothing;

-- ── Campaña + canales + plan diario ───────────────────────────────────────
do $$
declare
  v_campaign_id uuid;
  v_factors numeric[] := array[0.7,0.8,0.9,1.0,1.05,1.1,1.2,1.2,1.1,1.1,1.5,2.5,2.5,1.15,0.7];
  v_start date := date '2026-06-09';
  i int;
begin
  -- Singleton: si ya existe una campaña, la reutilizamos.
  select id into v_campaign_id from public.campaign_dash order by created_at limit 1;

  if v_campaign_id is null then
    insert into public.campaign_dash (name, description, total_budget, duration_days, start_date, status)
    values (
      'Plan de inversión para pauta CNE y A.E',
      'Campaña de 15 días — Instagram · Facebook · Google Youtube · Google Display',
      44875000, 15, v_start, 'active'
    )
    returning id into v_campaign_id;
  end if;

  -- Canales (upsert por (campaign_id, channel))
  insert into public.campaign_channels
    (campaign_id, channel, position, participation_pct, cpm, ctr, frequency,
     objective, target_audience, main_kpi)
  values
    (v_campaign_id, 'meta', 0, 0.38, 6750, 0.017, 1.4,
     'Reconocimiento de marca y engagement',
     'Segmentación por intereses · Demografía 18–45 años',
     'Alcance + Engagement Rate'),
    (v_campaign_id, 'pilas', 1, 0.32, 6750, 0.017, 1.6,
     'Tráfico al sitio web y generación de leads',
     'Lookalike audiences · Remarketing',
     'CPC + CTR + Leads'),
    (v_campaign_id, 'youtube', 2, 0.07, 7000, 0.075, 1.3,
     'Captura de demanda activa / intención de búsqueda',
     'Keywords relacionadas a nombre y propuesta',
     'CTR + CPC + Conversiones'),
    (v_campaign_id, 'google_display', 3, 0.23, 3500, 0.008, 2.0,
     'Cobertura y retargeting visual',
     'Retargeting web + audiencias en mercado',
     'CPM + Frecuencia + Viewability')
  on conflict (campaign_id, channel) do nothing;

  -- Plan diario (15 días)
  for i in 1..array_length(v_factors, 1) loop
    insert into public.daily_plan (campaign_id, day_number, date, weight_factor)
    values (v_campaign_id, i, v_start + (i - 1), v_factors[i])
    on conflict (campaign_id, day_number) do nothing;
  end loop;
end $$;
