-- ════════════════════════════════════════════════════════════════════════
--  campaign_daily_impressions — impresiones reales por canal por día
-- ════════════════════════════════════════════════════════════════════════

create table if not exists public.campaign_daily_impressions (
  id             uuid primary key default gen_random_uuid(),
  campaign_id    uuid not null references public.campaign_dash(id) on delete cascade,
  day_number     integer not null,
  date           date not null,
  meta           numeric(16,0) not null default 0,
  pilas          numeric(16,0) not null default 0,
  youtube        numeric(16,0) not null default 0,
  google_display numeric(16,0) not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (campaign_id, day_number)
);

create index if not exists idx_daily_impr_campaign
  on public.campaign_daily_impressions(campaign_id);

create trigger campaign_daily_impressions_updated_at
  before update on public.campaign_daily_impressions
  for each row execute function public.set_updated_at();

alter table public.campaign_daily_impressions enable row level security;
alter table public.campaign_daily_impressions force row level security;

-- Inicializa filas vacías para los días ya sembrados
insert into public.campaign_daily_impressions (campaign_id, day_number, date)
select d.campaign_id, d.day_number, d.date
from public.daily_plan d
on conflict (campaign_id, day_number) do nothing;
