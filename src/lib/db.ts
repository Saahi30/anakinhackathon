import { randomBytes } from "crypto";
import { supabaseServer } from "./supabase";

export type Monitor = {
  id: number;
  url: string;
  label: string | null;
  platform: string;
  sku: string | null;
  brand: string | null;
  last_status: string | null;
  last_checked_at: string | null;
  last_oos_at: string | null;
  last_back_in_stock_at: string | null;
  created_at: string;
  enabled: number;
  last_price: string | null;
  last_price_value: number | null;
  last_price_at: string | null;
  low_stock_since: string | null;
  snooze_until: string | null;
  consecutive_failures: number;
  auto_paused_at: string | null;
};

export type Event = {
  id: number;
  monitor_id: number;
  kind: string;
  status: string | null;
  message: string | null;
  payload: string | null;
  created_at: string;
};

export type EventWithMonitor = Event & {
  monitor_label: string | null;
  monitor_platform: string | null;
  monitor_url: string | null;
};

const DEFAULT_SETTINGS: Record<string, string> = {
  slack_webhook_url: "",
  auto_ad_copy: "1",
  whatsapp_enabled: "0",
  ads_bid_surge_enabled: "0",
  brand_name: "Your Brand",
  brand_website: "",
  brand_tagline: "",
  brand_description: "",
  brand_voice: "",
  brand_categories: "",
  brand_value_props: "",
  brand_target_audience: "",
  brand_source_url: "",
  onboarding_completed: "0",
  poll_interval_seconds: "30",
  alert_tier_low_stock_enabled: "1",
  alert_tier_price_drop_enabled: "1",
  alert_tier_restock_enabled: "1",
  adaptive_polling_enabled: "1",
  auto_pause_threshold: "5",
  ad_copy_variants: "3",
  price_drop_min_pct: "5",
};

let settingsCache: Record<string, string> | null = null;
let cacheLoadedAt = 0;
const CACHE_TTL_MS = 3_000;

function rowToMonitor(r: any): Monitor {
  return {
    id: r.id,
    url: r.url,
    label: r.label,
    platform: r.platform,
    sku: r.sku,
    brand: r.brand,
    last_status: r.last_status,
    last_checked_at: r.last_checked_at,
    last_oos_at: r.last_oos_at,
    last_back_in_stock_at: r.last_back_in_stock_at,
    created_at: r.created_at,
    enabled: r.enabled ? 1 : 0,
    last_price: r.last_price ?? null,
    last_price_value:
      r.last_price_value === null || r.last_price_value === undefined
        ? null
        : Number(r.last_price_value),
    last_price_at: r.last_price_at ?? null,
    low_stock_since: r.low_stock_since ?? null,
    snooze_until: r.snooze_until ?? null,
    consecutive_failures: Number(r.consecutive_failures) || 0,
    auto_paused_at: r.auto_paused_at ?? null,
  };
}

async function loadSettings(force = false): Promise<Record<string, string>> {
  if (!force && settingsCache && Date.now() - cacheLoadedAt < CACHE_TTL_MS) {
    return settingsCache;
  }
  const { data, error } = await supabaseServer()
    .from("settings")
    .select("key, value");
  if (error) throw error;
  const out = { ...DEFAULT_SETTINGS };
  for (const r of data || []) out[r.key] = r.value ?? "";
  if (process.env.SLACK_WEBHOOK_URL && !out.slack_webhook_url) {
    out.slack_webhook_url = process.env.SLACK_WEBHOOK_URL;
  }
  if (process.env.POLL_INTERVAL_SECONDS) {
    out.poll_interval_seconds = String(process.env.POLL_INTERVAL_SECONDS);
  }
  settingsCache = out;
  cacheLoadedAt = Date.now();
  return out;
}

function invalidateSettings() {
  settingsCache = null;
  cacheLoadedAt = 0;
}

export async function getSettingAsync(key: string): Promise<string> {
  const s = await loadSettings();
  return s[key] ?? "";
}

export async function getAllSettingsAsync(): Promise<Record<string, string>> {
  return await loadSettings(true);
}

export async function setSettingAsync(
  key: string,
  value: string
): Promise<void> {
  const { error } = await supabaseServer()
    .from("settings")
    .upsert({ key, value }, { onConflict: "key" });
  if (error) throw error;
  invalidateSettings();
}

export function getSetting(key: string): string {
  if (settingsCache) return settingsCache[key] ?? DEFAULT_SETTINGS[key] ?? "";
  return DEFAULT_SETTINGS[key] ?? "";
}

export async function listMonitors(): Promise<Monitor[]> {
  const { data, error } = await supabaseServer()
    .from("monitors")
    .select("*")
    .order("id", { ascending: false });
  if (error) throw error;
  return (data || []).map(rowToMonitor);
}

export async function getMonitor(id: number): Promise<Monitor | undefined> {
  const { data, error } = await supabaseServer()
    .from("monitors")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? rowToMonitor(data) : undefined;
}

export async function insertMonitor(input: {
  url: string;
  label: string | null;
  platform: string;
  sku: string | null;
}): Promise<Monitor> {
  const { data, error } = await supabaseServer()
    .from("monitors")
    .insert({
      url: input.url,
      label: input.label,
      platform: input.platform,
      sku: input.sku,
      last_status: "unknown",
      enabled: true,
    })
    .select("*")
    .single();
  if (error) throw error;
  return rowToMonitor(data);
}

export async function updateMonitor(
  id: number,
  patch: Partial<Monitor>
): Promise<void> {
  const dbPatch: any = { ...patch };
  if (typeof dbPatch.enabled === "number") {
    dbPatch.enabled = dbPatch.enabled === 1;
  }
  const { error } = await supabaseServer()
    .from("monitors")
    .update(dbPatch)
    .eq("id", id);
  if (error) throw error;
}

export async function deleteMonitor(id: number): Promise<void> {
  const { error } = await supabaseServer()
    .from("monitors")
    .delete()
    .eq("id", id);
  if (error) throw error;
}

export async function dueMonitors(
  intervalSeconds: number,
  limit = 5
): Promise<Monitor[]> {
  const cutoff = new Date(Date.now() - intervalSeconds * 1000).toISOString();
  const nowIso = new Date().toISOString();
  const { data, error } = await supabaseServer()
    .from("monitors")
    .select("*")
    .eq("enabled", true)
    .is("auto_paused_at", null)
    .or(`snooze_until.is.null,snooze_until.lt.${nowIso}`)
    .or(`last_checked_at.is.null,last_checked_at.lt.${cutoff}`)
    .order("last_checked_at", { ascending: true, nullsFirst: true })
    .limit(limit);
  if (error) throw error;
  return (data || []).map(rowToMonitor);
}

// Adaptive polling: shorten interval for monitors with recent OOS history,
// lengthen it for stable ones. Returns the per-monitor interval in seconds.
export function adaptiveIntervalFor(
  base: number,
  m: Pick<Monitor, "last_oos_at" | "last_status">
): number {
  if (m.last_status === "out_of_stock") return Math.max(10, Math.floor(base / 2));
  if (m.last_oos_at) {
    const ageMs = Date.now() - new Date(m.last_oos_at).getTime();
    const day = 24 * 60 * 60 * 1000;
    if (ageMs < 7 * day) return Math.max(15, Math.floor(base * 0.6));
  }
  return base;
}

export async function dueMonitorsAdaptive(
  base: number,
  limit = 5
): Promise<Monitor[]> {
  const nowIso = new Date().toISOString();
  const { data, error } = await supabaseServer()
    .from("monitors")
    .select("*")
    .eq("enabled", true)
    .is("auto_paused_at", null)
    .or(`snooze_until.is.null,snooze_until.lt.${nowIso}`)
    .order("last_checked_at", { ascending: true, nullsFirst: true })
    .limit(limit * 4);
  if (error) throw error;
  const now = Date.now();
  const rows = (data || []).map(rowToMonitor).filter((m) => {
    if (!m.last_checked_at) return true;
    const age = (now - new Date(m.last_checked_at).getTime()) / 1000;
    return age >= adaptiveIntervalFor(base, m);
  });
  return rows.slice(0, limit);
}

export async function insertEvent(e: {
  monitor_id: number;
  kind: string;
  status?: string | null;
  message?: string | null;
  payload?: string | null;
}): Promise<void> {
  let payload: any = null;
  if (e.payload) {
    try {
      payload = JSON.parse(e.payload);
    } catch {
      payload = { raw: e.payload };
    }
  }
  const { error } = await supabaseServer().from("events").insert({
    monitor_id: e.monitor_id,
    kind: e.kind,
    status: e.status ?? null,
    message: e.message ?? null,
    payload,
  });
  if (error) throw error;
}

export async function listEvents(limit: number): Promise<EventWithMonitor[]> {
  const { data, error } = await supabaseServer()
    .from("events")
    .select(
      "id, monitor_id, kind, status, message, payload, created_at, monitors(label, platform, url)"
    )
    .order("id", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data || []).map((r: any) => ({
    id: r.id,
    monitor_id: r.monitor_id,
    kind: r.kind,
    status: r.status,
    message: r.message,
    payload: r.payload ? JSON.stringify(r.payload) : null,
    created_at: r.created_at,
    monitor_label: r.monitors?.label ?? null,
    monitor_platform: r.monitors?.platform ?? null,
    monitor_url: r.monitors?.url ?? null,
  }));
}

export async function primeSettingsCache(): Promise<void> {
  await loadSettings(true);
}

// ---------- Brand profile ----------

export type BrandProfile = {
  brand_name: string;
  brand_tagline: string;
  brand_description: string;
  brand_voice: string;
  brand_categories: string;
  brand_value_props: string;
  brand_target_audience: string;
  brand_website: string;
  brand_source_url: string;
  brand_marketplaces: string;
  brand_regions: string;
  brand_logo_url: string;
  brand_notes: string;
  source_type: string;
  confidence: string;
};

const EMPTY_BRAND: BrandProfile = {
  brand_name: "",
  brand_tagline: "",
  brand_description: "",
  brand_voice: "",
  brand_categories: "",
  brand_value_props: "",
  brand_target_audience: "",
  brand_website: "",
  brand_source_url: "",
  brand_marketplaces: "",
  brand_regions: "",
  brand_logo_url: "",
  brand_notes: "",
  source_type: "",
  confidence: "",
};

export async function getBrandProfile(): Promise<BrandProfile> {
  const { data, error } = await supabaseServer()
    .from("brand_profile")
    .select("*")
    .eq("id", 1)
    .maybeSingle();
  if (error) throw error;
  if (!data) return { ...EMPTY_BRAND };
  return {
    brand_name: data.brand_name || "",
    brand_tagline: data.brand_tagline || "",
    brand_description: data.brand_description || "",
    brand_voice: data.brand_voice || "",
    brand_categories: data.brand_categories || "",
    brand_value_props: data.brand_value_props || "",
    brand_target_audience: data.brand_target_audience || "",
    brand_website: data.brand_website || "",
    brand_source_url: data.brand_source_url || "",
    brand_marketplaces: data.brand_marketplaces || "",
    brand_regions: data.brand_regions || "",
    brand_logo_url: data.brand_logo_url || "",
    brand_notes: data.brand_notes || "",
    source_type: data.source_type || "",
    confidence: data.confidence || "",
  };
}

export async function saveBrandProfile(
  patch: Partial<BrandProfile>
): Promise<BrandProfile> {
  const { error } = await supabaseServer()
    .from("brand_profile")
    .upsert(
      { id: 1, ...patch, updated_at: new Date().toISOString() },
      { onConflict: "id" }
    );
  if (error) throw error;
  // Mirror brand_name into settings so the worker (which already reads
  // settings.brand_name for ad copy) keeps working without a refactor.
  if (typeof patch.brand_name === "string") {
    await setSettingAsync("brand_name", patch.brand_name);
  }
  return await getBrandProfile();
}

// ---------- Products ----------

export type Product = {
  id: number;
  url: string;
  platform: string;
  title: string | null;
  category: string | null;
  price: string | null;
  rating: string | null;
  review_count: string | null;
  seller: string | null;
  image_url: string | null;
  attributes: string[] | null;
  enrichment_status: string;
  enrichment_error: string | null;
  source: string;
  created_at: string;
};

function rowToProduct(r: any): Product {
  let attrs: string[] | null = null;
  if (Array.isArray(r.attributes)) attrs = r.attributes;
  else if (r.attributes && typeof r.attributes === "object") {
    attrs = Array.isArray(r.attributes.list) ? r.attributes.list : null;
  }
  return {
    id: r.id,
    url: r.url,
    platform: r.platform,
    title: r.title,
    category: r.category,
    price: r.price,
    rating: r.rating,
    review_count: r.review_count,
    seller: r.seller,
    image_url: r.image_url,
    attributes: attrs,
    enrichment_status: r.enrichment_status,
    enrichment_error: r.enrichment_error,
    source: r.source,
    created_at: r.created_at,
  };
}

export async function listProducts(): Promise<Product[]> {
  const { data, error } = await supabaseServer()
    .from("products")
    .select("*")
    .order("id", { ascending: false });
  if (error) throw error;
  return (data || []).map(rowToProduct);
}

export async function getProduct(id: number): Promise<Product | undefined> {
  const { data, error } = await supabaseServer()
    .from("products")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? rowToProduct(data) : undefined;
}

export async function insertProduct(input: {
  url: string;
  platform: string;
  title?: string | null;
  category?: string | null;
  source?: string;
}): Promise<Product> {
  const { data, error } = await supabaseServer()
    .from("products")
    .insert({
      url: input.url,
      platform: input.platform,
      title: input.title ?? null,
      category: input.category ?? null,
      enrichment_status: "pending",
      source: input.source || "manual",
    })
    .select("*")
    .single();
  if (error) throw error;
  return rowToProduct(data);
}

export async function updateProduct(
  id: number,
  patch: Partial<Product>
): Promise<void> {
  const dbPatch: any = { ...patch };
  if (Array.isArray(dbPatch.attributes)) {
    dbPatch.attributes = { list: dbPatch.attributes };
  }
  const { error } = await supabaseServer()
    .from("products")
    .update(dbPatch)
    .eq("id", id);
  if (error) throw error;
}

export async function deleteProduct(id: number): Promise<void> {
  const { error } = await supabaseServer()
    .from("products")
    .delete()
    .eq("id", id);
  if (error) throw error;
}

// ---------- Competitors ----------

export type Competitor = {
  id: number;
  product_id: number | null;
  url: string;
  platform: string;
  title: string | null;
  asin: string | null;
  price: string | null;
  rating: string | null;
  review_count: string | null;
  image_url: string | null;
  score: number;
  reasons: string[];
  status: string;
  priority: number;
  source: string;
  monitor_id: number | null;
  created_at: string;
};

function rowToCompetitor(r: any): Competitor {
  let reasons: string[] = [];
  if (Array.isArray(r.reasons)) reasons = r.reasons;
  else if (r.reasons && typeof r.reasons === "object") {
    reasons = Array.isArray(r.reasons.list) ? r.reasons.list : [];
  }
  return {
    id: r.id,
    product_id: r.product_id,
    url: r.url,
    platform: r.platform,
    title: r.title,
    asin: r.asin,
    price: r.price,
    rating: r.rating,
    review_count: r.review_count,
    image_url: r.image_url,
    score: Number(r.score) || 0,
    reasons,
    status: r.status,
    priority: r.priority || 0,
    source: r.source,
    monitor_id: r.monitor_id,
    created_at: r.created_at,
  };
}

export async function listCompetitors(productId?: number): Promise<Competitor[]> {
  let q = supabaseServer().from("competitors").select("*");
  if (typeof productId === "number") q = q.eq("product_id", productId);
  const { data, error } = await q.order("priority", { ascending: false }).order("score", { ascending: false });
  if (error) throw error;
  return (data || []).map(rowToCompetitor);
}

export async function getCompetitor(id: number): Promise<Competitor | undefined> {
  const { data, error } = await supabaseServer()
    .from("competitors")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? rowToCompetitor(data) : undefined;
}

export async function insertCompetitor(input: {
  product_id: number | null;
  url: string;
  platform: string;
  title?: string | null;
  asin?: string | null;
  price?: string | null;
  rating?: string | null;
  review_count?: string | null;
  image_url?: string | null;
  score?: number;
  reasons?: string[];
  status?: string;
  source?: string;
}): Promise<Competitor> {
  const { data, error } = await supabaseServer()
    .from("competitors")
    .insert({
      product_id: input.product_id,
      url: input.url,
      platform: input.platform,
      title: input.title ?? null,
      asin: input.asin ?? null,
      price: input.price ?? null,
      rating: input.rating ?? null,
      review_count: input.review_count ?? null,
      image_url: input.image_url ?? null,
      score: input.score ?? 0,
      reasons: { list: input.reasons || [] },
      status: input.status || "proposed",
      source: input.source || "rainforest",
    })
    .select("*")
    .single();
  if (error) throw error;
  return rowToCompetitor(data);
}

export async function updateCompetitor(
  id: number,
  patch: Partial<Competitor>
): Promise<void> {
  const dbPatch: any = { ...patch };
  if (Array.isArray(dbPatch.reasons)) {
    dbPatch.reasons = { list: dbPatch.reasons };
  }
  const { error } = await supabaseServer()
    .from("competitors")
    .update(dbPatch)
    .eq("id", id);
  if (error) throw error;
}

export async function deleteCompetitor(id: number): Promise<void> {
  const { error } = await supabaseServer()
    .from("competitors")
    .delete()
    .eq("id", id);
  if (error) throw error;
}

// ---------- Usage counters ----------

export type UsageRow = {
  day: string;
  anakin_scrapes: number;
  groq_tokens: number;
  slack_sent: number;
};

function utcDay(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

export async function bumpUsage(patch: {
  anakin?: number;
  groq?: number;
  slack?: number;
}): Promise<void> {
  const day = utcDay();
  const { error } = await supabaseServer().rpc("bump_usage", {
    p_day: day,
    p_anakin: patch.anakin || 0,
    p_groq: patch.groq || 0,
    p_slack: patch.slack || 0,
  });
  if (error) console.error("[usage] bump failed", error);
}

export async function getUsageWindow(days: number): Promise<UsageRow[]> {
  const start = new Date();
  start.setUTCDate(start.getUTCDate() - (days - 1));
  const { data, error } = await supabaseServer()
    .from("usage_daily")
    .select("day, anakin_scrapes, groq_tokens, slack_sent")
    .gte("day", utcDay(start))
    .order("day", { ascending: true });
  if (error) throw error;
  return (data || []) as UsageRow[];
}

// ---------- Alert action tokens (Slack interactive buttons) ----------

export async function createAlertActionToken(
  monitorId: number,
  action: string,
  payload?: any
): Promise<string> {
  const token = randomBytes(18).toString("base64url");
  const { error } = await supabaseServer().from("alert_actions").insert({
    token,
    monitor_id: monitorId,
    action,
    payload: payload || null,
  });
  if (error) throw error;
  return token;
}

export async function consumeAlertActionToken(
  token: string
): Promise<{
  monitor_id: number;
  action: string;
  payload: any;
} | null> {
  const { data, error } = await supabaseServer()
    .from("alert_actions")
    .select("monitor_id, action, payload, used_at")
    .eq("token", token)
    .maybeSingle();
  if (error || !data || data.used_at) return null;
  await supabaseServer()
    .from("alert_actions")
    .update({ used_at: new Date().toISOString() })
    .eq("token", token);
  return {
    monitor_id: data.monitor_id,
    action: data.action,
    payload: data.payload,
  };
}

// ---------- Playbooks ----------

export type PlaybookRow = {
  id: string;
  name: string;
  enabled: boolean;
  trigger: any;
  actions: any[];
  fire_count: number;
  last_fired_at: string | null;
  created_at: string;
  updated_at: string;
};

export async function listPlaybooks(opts: { enabledOnly?: boolean } = {}): Promise<
  PlaybookRow[]
> {
  let q = supabaseServer().from("playbooks").select("*");
  if (opts.enabledOnly) q = q.eq("enabled", true);
  const { data, error } = await q.order("created_at", { ascending: false });
  if (error) {
    // Table doesn't exist yet (migration not pushed). Treat as empty.
    if (
      typeof error === "object" &&
      (error as any).code === "42P01"
    )
      return [];
    console.error("[db] listPlaybooks error", error);
    return [];
  }
  return (data || []) as PlaybookRow[];
}

export async function upsertPlaybook(p: {
  id: string;
  name: string;
  enabled: boolean;
  trigger: any;
  actions: any[];
}): Promise<PlaybookRow | null> {
  const { data, error } = await supabaseServer()
    .from("playbooks")
    .upsert(
      {
        id: p.id,
        name: p.name,
        enabled: p.enabled,
        trigger: p.trigger,
        actions: p.actions,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    )
    .select("*")
    .maybeSingle();
  if (error) {
    console.error("[db] upsertPlaybook error", error);
    return null;
  }
  return data as PlaybookRow | null;
}

export async function deletePlaybook(id: string): Promise<void> {
  await supabaseServer().from("playbooks").delete().eq("id", id);
}

export async function bumpPlaybookFired(id: string): Promise<void> {
  const now = new Date().toISOString();
  // Two-step because Supabase JS lacks atomic increment without an RPC.
  const { data } = await supabaseServer()
    .from("playbooks")
    .select("fire_count")
    .eq("id", id)
    .maybeSingle();
  const next = ((data as any)?.fire_count || 0) + 1;
  await supabaseServer()
    .from("playbooks")
    .update({ fire_count: next, last_fired_at: now })
    .eq("id", id);
}

// ---------- Strike / event analytics ----------

export async function getEventCountsByDay(
  days: number,
  kinds: string[] = ["oos_detected"]
): Promise<{ day: string; count: number }[]> {
  const since = new Date(
    Date.now() - (days - 1) * 24 * 60 * 60 * 1000
  ).toISOString();
  const { data, error } = await supabaseServer()
    .from("events")
    .select("created_at")
    .in("kind", kinds)
    .gte("created_at", since);
  if (error) {
    console.error("[db] getEventCountsByDay error", error);
    return [];
  }
  const buckets: Record<string, number> = {};
  for (let i = 0; i < days; i++) {
    const d = new Date(Date.now() - (days - 1 - i) * 24 * 60 * 60 * 1000);
    buckets[d.toISOString().slice(0, 10)] = 0;
  }
  for (const r of data || []) {
    const day = ((r as any).created_at || "").slice(0, 10);
    if (day in buckets) buckets[day]++;
  }
  return Object.entries(buckets).map(([day, count]) => ({ day, count }));
}

export async function getDayHourHeatmap(
  days: number = 30,
  kinds: string[] = ["oos_detected"]
): Promise<number[][]> {
  const since = new Date(
    Date.now() - days * 24 * 60 * 60 * 1000
  ).toISOString();
  const { data, error } = await supabaseServer()
    .from("events")
    .select("created_at")
    .in("kind", kinds)
    .gte("created_at", since);
  if (error) {
    console.error("[db] getDayHourHeatmap error", error);
    return Array.from({ length: 7 }, () => new Array(24).fill(0));
  }
  const grid: number[][] = Array.from({ length: 7 }, () =>
    new Array(24).fill(0)
  );
  for (const r of data || []) {
    const d = new Date((r as any).created_at);
    if (isNaN(d.getTime())) continue;
    const jsDay = d.getDay(); // 0 Sun..6 Sat
    const row = jsDay === 0 ? 6 : jsDay - 1; // Mon..Sun
    grid[row][d.getHours()]++;
  }
  return grid;
}

export type CompetitorLeaderRow = {
  monitor_id: number;
  label: string | null;
  platform: string;
  url: string;
  strikes: number;
  avg_window_seconds: number;
  last_strike_at: string | null;
  trend: number[];
};

export async function getCompetitorLeaderboard(
  days: number = 30,
  limit: number = 10
): Promise<CompetitorLeaderRow[]> {
  const since = new Date(
    Date.now() - days * 24 * 60 * 60 * 1000
  ).toISOString();
  const { data, error } = await supabaseServer()
    .from("events")
    .select(
      "monitor_id, kind, created_at, monitors(id, label, platform, url, last_oos_at, last_back_in_stock_at)"
    )
    .in("kind", ["oos_detected", "back_in_stock"])
    .gte("created_at", since)
    .order("created_at", { ascending: true });
  if (error) {
    console.error("[db] getCompetitorLeaderboard error", error);
    return [];
  }
  type Row = {
    monitor_id: number;
    label: string | null;
    platform: string;
    url: string;
    starts: string[];
    durations: number[];
    perDay: Record<string, number>;
  };
  const byMonitor = new Map<number, Row>();
  // Track an open OOS start time so we can compute durations as restocks land.
  const openStart = new Map<number, number>();
  for (const r of data || []) {
    const id = (r as any).monitor_id as number;
    const meta = (r as any).monitors || {};
    const row =
      byMonitor.get(id) ||
      ({
        monitor_id: id,
        label: meta.label ?? null,
        platform: meta.platform ?? "unknown",
        url: meta.url ?? "",
        starts: [],
        durations: [],
        perDay: {},
      } as Row);
    if ((r as any).kind === "oos_detected") {
      row.starts.push((r as any).created_at);
      openStart.set(id, new Date((r as any).created_at).getTime());
      const day = ((r as any).created_at || "").slice(0, 10);
      row.perDay[day] = (row.perDay[day] || 0) + 1;
    } else if ((r as any).kind === "back_in_stock") {
      const s = openStart.get(id);
      if (s) {
        row.durations.push((new Date((r as any).created_at).getTime() - s) / 1000);
        openStart.delete(id);
      }
    }
    byMonitor.set(id, row);
  }
  const out: CompetitorLeaderRow[] = [];
  for (const row of byMonitor.values()) {
    if (row.starts.length === 0) continue;
    const avg =
      row.durations.length > 0
        ? row.durations.reduce((a, b) => a + b, 0) / row.durations.length
        : 0;
    const last = row.starts[row.starts.length - 1];
    const trend: number[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10);
      trend.push(row.perDay[d] || 0);
    }
    out.push({
      monitor_id: row.monitor_id,
      label: row.label,
      platform: row.platform,
      url: row.url,
      strikes: row.starts.length,
      avg_window_seconds: Math.round(avg),
      last_strike_at: last,
      trend,
    });
  }
  out.sort((a, b) => b.strikes - a.strikes);
  return out.slice(0, limit);
}

export type StrikeRecord = {
  monitor_id: number;
  label: string | null;
  platform: string;
  url: string;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number;
  is_live: boolean;
  est_aov_inr: number;
  est_capture_rate: number;
  est_impressions_per_hour: number;
  est_spend_per_hour_inr: number;
  last_price: string | null;
};

export async function listStrikes(
  days: number = 30,
  limit: number = 100
): Promise<StrikeRecord[]> {
  const since = new Date(
    Date.now() - days * 24 * 60 * 60 * 1000
  ).toISOString();
  const { data, error } = await supabaseServer()
    .from("events")
    .select(
      "monitor_id, kind, created_at, monitors(id, label, platform, url, last_status, est_aov_inr, est_capture_rate, est_impressions_per_hour, est_spend_per_hour_inr, last_price)"
    )
    .in("kind", ["oos_detected", "back_in_stock"])
    .gte("created_at", since)
    .order("created_at", { ascending: true });
  if (error) {
    console.error("[db] listStrikes error", error);
    return [];
  }
  // For each OOS, find the next back_in_stock for the same monitor.
  const rows = (data || []) as any[];
  const open = new Map<number, any>();
  const strikes: StrikeRecord[] = [];
  for (const r of rows) {
    const id = r.monitor_id as number;
    if (r.kind === "oos_detected") {
      open.set(id, r);
    } else if (r.kind === "back_in_stock" && open.has(id)) {
      const s = open.get(id);
      strikes.push(buildStrike(s, r.created_at, false));
      open.delete(id);
    }
  }
  for (const s of open.values()) {
    strikes.push(buildStrike(s, null, true));
  }
  strikes.sort(
    (a, b) =>
      new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
  );
  return strikes.slice(0, limit);
}

function buildStrike(
  startEvent: any,
  endedAt: string | null,
  isLive: boolean
): StrikeRecord {
  const m = startEvent.monitors || {};
  const start = new Date(startEvent.created_at).getTime();
  const end = endedAt ? new Date(endedAt).getTime() : Date.now();
  const duration = Math.max(0, Math.floor((end - start) / 1000));
  return {
    monitor_id: startEvent.monitor_id,
    label: m.label ?? null,
    platform: m.platform ?? "unknown",
    url: m.url ?? "",
    started_at: startEvent.created_at,
    ended_at: endedAt,
    duration_seconds: duration,
    is_live: isLive && m.last_status === "out_of_stock",
    est_aov_inr: Number(m.est_aov_inr) || 800,
    est_capture_rate: Number(m.est_capture_rate) || 0.08,
    est_impressions_per_hour: Number(m.est_impressions_per_hour) || 1200,
    est_spend_per_hour_inr: Number(m.est_spend_per_hour_inr) || 350,
    last_price: m.last_price ?? null,
  };
}

// ---------- Recent events for sparkline ----------

export async function recentOOSCountsForMonitor(
  monitorId: number,
  hours = 24
): Promise<number[]> {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabaseServer()
    .from("events")
    .select("created_at, kind")
    .eq("monitor_id", monitorId)
    .gte("created_at", since)
    .in("kind", ["oos_detected", "low_stock", "back_in_stock", "price_drop"]);
  if (error) throw error;
  const buckets = new Array(hours).fill(0);
  const now = Date.now();
  for (const r of data || []) {
    const ageHours = Math.floor(
      (now - new Date((r as any).created_at).getTime()) / (60 * 60 * 1000)
    );
    const idx = hours - 1 - ageHours;
    if (idx >= 0 && idx < hours) buckets[idx] += 1;
  }
  return buckets;
}
