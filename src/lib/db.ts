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
  const { data, error } = await supabaseServer()
    .from("monitors")
    .select("*")
    .eq("enabled", true)
    .or(`last_checked_at.is.null,last_checked_at.lt.${cutoff}`)
    .order("last_checked_at", { ascending: true, nullsFirst: true })
    .limit(limit);
  if (error) throw error;
  return (data || []).map(rowToMonitor);
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
