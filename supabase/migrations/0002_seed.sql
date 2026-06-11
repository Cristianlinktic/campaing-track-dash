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
