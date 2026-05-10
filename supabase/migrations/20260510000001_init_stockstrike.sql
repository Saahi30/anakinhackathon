-- StockStrike core schema

create table if not exists public.monitors (
  id bigserial primary key,
  url text not null,
  label text,
  platform text not null default 'unknown',
  sku text,
  brand text,
  last_status text,
  last_checked_at timestamptz,
  last_oos_at timestamptz,
  last_back_in_stock_at timestamptz,
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists monitors_enabled_last_checked_idx
  on public.monitors (enabled, last_checked_at);

create table if not exists public.events (
  id bigserial primary key,
  monitor_id bigint not null references public.monitors(id) on delete cascade,
  kind text not null,
  status text,
  message text,
  payload jsonb,
  created_at timestamptz not null default now()
);

create index if not exists events_monitor_id_idx on public.events (monitor_id);
create index if not exists events_created_at_idx on public.events (created_at desc);

create table if not exists public.settings (
  key text primary key,
  value text
);

insert into public.settings (key, value) values
  ('slack_webhook_url', ''),
  ('auto_ad_copy', '1'),
  ('whatsapp_enabled', '0'),
  ('ads_bid_surge_enabled', '0'),
  ('brand_name', 'Your Brand'),
  ('poll_interval_seconds', '30')
on conflict (key) do nothing;

-- Hackathon scope: server-side access via service role only.
-- RLS disabled so the service-role key can read/write freely from API routes.
-- (Anon key is never used to talk to these tables; the dashboard goes through Next.js API routes.)
alter table public.monitors disable row level security;
alter table public.events disable row level security;
alter table public.settings disable row level security;

-- Realtime: broadcast inserts on monitors + events so the dashboard can subscribe.
alter publication supabase_realtime add table public.monitors;
alter publication supabase_realtime add table public.events;
