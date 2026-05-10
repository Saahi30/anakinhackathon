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
