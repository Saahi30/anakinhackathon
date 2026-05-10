-- StockStrike: brand profile, products, competitors

create table if not exists public.brand_profile (
  id int primary key default 1,
  brand_name text default '',
  brand_tagline text default '',
  brand_description text default '',
  brand_voice text default '',
  brand_categories text default '',
  brand_value_props text default '',
  brand_target_audience text default '',
  brand_website text default '',
  brand_source_url text default '',
  brand_marketplaces text default '',
  brand_regions text default '',
  brand_logo_url text default '',
  brand_notes text default '',
  source_type text default '',
  confidence text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint single_row check (id = 1)
);

insert into public.brand_profile (id) values (1) on conflict do nothing;

create table if not exists public.products (
  id bigserial primary key,
  url text not null,
  platform text not null default 'unknown',
  title text,
  category text,
  price text,
  rating text,
  review_count text,
  seller text,
  image_url text,
  attributes jsonb,
  enrichment_status text not null default 'pending',
  enrichment_error text,
  source text not null default 'manual',
  created_at timestamptz not null default now()
);

create index if not exists products_enrichment_status_idx on public.products (enrichment_status);

create table if not exists public.competitors (
  id bigserial primary key,
  product_id bigint references public.products(id) on delete cascade,
  url text not null,
  platform text not null default 'amazon',
  title text,
  asin text,
  price text,
  rating text,
  review_count text,
  image_url text,
  score real default 0,
  reasons jsonb,
  status text not null default 'proposed',
  priority int not null default 0,
  source text not null default 'rainforest',
  monitor_id bigint references public.monitors(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists competitors_product_idx on public.competitors (product_id);
create index if not exists competitors_status_idx on public.competitors (status);

-- Link monitors back to competitors so the dashboard can group by user product
alter table public.monitors
  add column if not exists competitor_id bigint references public.competitors(id) on delete set null;

alter table public.brand_profile disable row level security;
alter table public.products disable row level security;
alter table public.competitors disable row level security;

alter publication supabase_realtime add table public.products;
alter publication supabase_realtime add table public.competitors;
alter publication supabase_realtime add table public.brand_profile;
