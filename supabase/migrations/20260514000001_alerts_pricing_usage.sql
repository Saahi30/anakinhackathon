-- StockStrike: low-stock tier, price tracking, snooze, auto-pause, usage counters, slack ack tokens

-- ---- monitors: snooze + fail tracking + price/low-stock state ----
alter table public.monitors
  add column if not exists last_price text,
  add column if not exists last_price_value numeric,
  add column if not exists last_price_at timestamptz,
  add column if not exists low_stock_since timestamptz,
  add column if not exists snooze_until timestamptz,
  add column if not exists consecutive_failures int not null default 0,
  add column if not exists auto_paused_at timestamptz;

-- ---- usage: rolling counters of anakin scrapes + groq tokens per UTC day ----
create table if not exists public.usage_daily (
  day date primary key,
  anakin_scrapes int not null default 0,
  groq_tokens int not null default 0,
  slack_sent int not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.usage_daily disable row level security;

create or replace function public.bump_usage(
  p_day date,
  p_anakin int,
  p_groq int,
  p_slack int
) returns void language plpgsql as $$
begin
  insert into public.usage_daily (day, anakin_scrapes, groq_tokens, slack_sent, updated_at)
  values (p_day, coalesce(p_anakin,0), coalesce(p_groq,0), coalesce(p_slack,0), now())
  on conflict (day) do update set
    anakin_scrapes = public.usage_daily.anakin_scrapes + coalesce(p_anakin,0),
    groq_tokens    = public.usage_daily.groq_tokens    + coalesce(p_groq,0),
    slack_sent     = public.usage_daily.slack_sent     + coalesce(p_slack,0),
    updated_at     = now();
end;
$$;

-- ---- alert_actions: one-shot signed tokens for Slack interactive buttons ----
create table if not exists public.alert_actions (
  token text primary key,
  monitor_id bigint not null references public.monitors(id) on delete cascade,
  action text not null,
  payload jsonb,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists alert_actions_monitor_idx on public.alert_actions (monitor_id);

alter table public.alert_actions disable row level security;

-- ---- settings: new feature toggles + thresholds ----
insert into public.settings (key, value) values
  ('alert_tier_low_stock_enabled', '1'),
  ('alert_tier_price_drop_enabled', '1'),
  ('alert_tier_restock_enabled', '1'),
  ('adaptive_polling_enabled', '1'),
  ('auto_pause_threshold', '5'),
  ('ad_copy_variants', '3'),
  ('price_drop_min_pct', '5')
on conflict (key) do nothing;

alter publication supabase_realtime add table public.usage_daily;
