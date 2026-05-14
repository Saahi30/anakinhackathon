-- StockStrike: server-persisted playbooks + per-monitor ROI defaults

create table if not exists public.playbooks (
  id text primary key,
  name text not null default 'Untitled playbook',
  enabled boolean not null default true,
  trigger jsonb not null default '{}'::jsonb,
  actions jsonb not null default '[]'::jsonb,
  fire_count int not null default 0,
  last_fired_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists playbooks_enabled_idx on public.playbooks (enabled);

alter table public.playbooks disable row level security;

alter publication supabase_realtime add table public.playbooks;

-- ROI estimation inputs. Stored per-monitor so the team can tune attribution
-- per SKU (a ₹2 chocolate strike does NOT capture ₹2000 of revenue).
alter table public.monitors
  add column if not exists est_aov_inr numeric default 800,
  add column if not exists est_capture_rate numeric default 0.08,
  add column if not exists est_impressions_per_hour numeric default 1200,
  add column if not exists est_spend_per_hour_inr numeric default 350;

-- Convenience: cumulative strike summary view for the dashboard.
create or replace view public.monitor_strike_summary as
  select
    m.id as monitor_id,
    m.label,
    m.platform,
    m.url,
    coalesce(stats.strike_count, 0) as strike_count,
    coalesce(stats.avg_duration_seconds, 0) as avg_duration_seconds,
    stats.last_strike_at
  from public.monitors m
  left join (
    select
      monitor_id,
      count(*) as strike_count,
      avg(extract(epoch from coalesce(ended_at, now()) - started_at)) as avg_duration_seconds,
      max(started_at) as last_strike_at
    from (
      select
        e.monitor_id,
        e.created_at as started_at,
        (
          select min(e2.created_at)
          from public.events e2
          where e2.monitor_id = e.monitor_id
            and e2.kind = 'back_in_stock'
            and e2.created_at > e.created_at
        ) as ended_at
      from public.events e
      where e.kind = 'oos_detected'
    ) windows
    group by monitor_id
  ) stats on stats.monitor_id = m.id;
