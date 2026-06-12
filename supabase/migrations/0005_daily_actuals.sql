-- ════════════════════════════════════════════════════════════════════════
--  campaign_daily_actuals — inversión real por canal por día
--  Se usa para comparar vs el plan en la gráfica de Resumen.
-- ════════════════════════════════════════════════════════════════════════

create table if not exists public.campaign_daily_actuals (
  id            uuid primary key default gen_random_uuid(),
  campaign_id   uuid not null references public.campaign_dash(id) on delete cascade,
  day_number    integer not null,
  date          date not null,
  meta          numeric(14,2) not null default 0,
  pilas         numeric(14,2) not null default 0,
  youtube       numeric(14,2) not null default 0,
  google_display numeric(14,2) not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (campaign_id, day_number)
);

create index if not exists idx_actuals_campaign on public.campaign_daily_actuals(campaign_id);

create trigger campaign_daily_actuals_updated_at
  before update on public.campaign_daily_actuals
  for each row execute function public.set_updated_at();

alter table public.campaign_daily_actuals enable row level security;
alter table public.campaign_daily_actuals force row level security;

-- Inicializa filas vacías para los días ya sembrados
insert into public.campaign_daily_actuals (campaign_id, day_number, date)
select d.campaign_id, d.day_number, d.date
from public.daily_plan d
on conflict (campaign_id, day_number) do nothing;
