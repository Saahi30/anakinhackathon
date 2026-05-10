import {
  dueMonitors,
  getMonitor,
  getSettingAsync,
  insertEvent,
  primeSettingsCache,
  updateMonitor,
  type Monitor,
} from "./db";
import { scrapeUrl } from "./anakin";
import {
  detectPlatform,
  detectStock,
  extractTitle,
  type Platform,
} from "./platforms";
import { sendSlackAlert } from "./slack";
import { generateAdCopy } from "./groq";

let started = false;
let timer: NodeJS.Timeout | null = null;
const inFlight = new Set<number>();

export function startWorker() {
  if (started) return;
  started = true;
  console.log("[worker] starting StockStrike polling worker");
  const tick = async () => {
    try {
      await runOnce();
    } catch (e) {
      console.error("[worker] tick error", e);
    } finally {
      const interval =
        Number(await getSettingAsync("poll_interval_seconds")) || 30;
      timer = setTimeout(tick, Math.max(5_000, (interval * 1000) / 4));
    }
  };
  setTimeout(tick, 2_000);
}

export async function runOnce() {
  const interval = Number(await getSettingAsync("poll_interval_seconds")) || 30;
  const due = await dueMonitors(interval, 5);
  if (!due.length) return;
  await Promise.all(
    due.map((m) =>
      checkMonitor(m).catch((e) => {
        console.error(`[worker] monitor ${m.id} error`, e);
      })
    )
  );
}

export async function checkMonitor(m: Monitor): Promise<void> {
  if (inFlight.has(m.id)) return;
  inFlight.add(m.id);
  const now = new Date().toISOString();

  try {
    const platform = (m.platform as Platform) || detectPlatform(m.url);
    console.log(`[worker] scraping monitor ${m.id} (${platform}) ${m.url}`);

    const result = await scrapeUrl(m.url);

    if (result.status !== "completed") {
      await updateMonitor(m.id, { last_checked_at: now });
      await insertEvent({
        monitor_id: m.id,
        kind: "scrape_failed",
        message: result.error || "scrape failed",
      });
      return;
    }

    const haystack = [result.markdown || "", result.cleanedHtml || ""].join(
      "\n"
    );
    const detection = detectStock(platform, haystack);

    if (!m.label || m.label.startsWith("Loading")) {
      const title = extractTitle(result.markdown || "");
      if (title) {
        await updateMonitor(m.id, { label: title });
        m.label = title;
      }
    }

    const previous = m.last_status;
    const next = detection.status;

    await updateMonitor(m.id, { last_status: next, last_checked_at: now });
    await insertEvent({
      monitor_id: m.id,
      kind: "check",
      status: next,
      message: detection.signal,
    });

    const transitionedToOOS =
      next === "out_of_stock" && previous !== "out_of_stock";
    const transitionedToInStock =
      next === "in_stock" && previous === "out_of_stock";

    if (transitionedToOOS) {
      await updateMonitor(m.id, { last_oos_at: now });
      await fireOOSAlert({ ...m, last_oos_at: now }, result.markdown || "");
    }

    if (transitionedToInStock) {
      await updateMonitor(m.id, { last_back_in_stock_at: now });
      await insertEvent({
        monitor_id: m.id,
        kind: "back_in_stock",
        status: "in_stock",
        message: "Competitor restocked",
      });
    }
  } finally {
    inFlight.delete(m.id);
  }
}

export async function fireOOSAlert(
  m: Monitor,
  markdown: string
): Promise<void> {
  const brand = (await getSettingAsync("brand_name")) || "Your Brand";
  const autoAd = (await getSettingAsync("auto_ad_copy")) === "1";
  const whatsapp = (await getSettingAsync("whatsapp_enabled")) === "1";
  const adsBid = (await getSettingAsync("ads_bid_surge_enabled")) === "1";
  const competitor = m.label || extractTitle(markdown) || m.url;

  let adCopy: string | null = null;
  if (autoAd) {
    const [tagline, description, voice, valuePropsRaw, audience] =
      await Promise.all([
        getSettingAsync("brand_tagline"),
        getSettingAsync("brand_description"),
        getSettingAsync("brand_voice"),
        getSettingAsync("brand_value_props"),
        getSettingAsync("brand_target_audience"),
      ]);
    const valueProps = valuePropsRaw
      ? valuePropsRaw
          .split("|")
          .map((s) => s.trim())
          .filter(Boolean)
      : [];
    adCopy = await generateAdCopy({
      brand,
      competitor,
      platform: m.platform,
      productHint: m.label,
      brandTagline: tagline,
      brandDescription: description,
      brandVoice: voice,
      brandValueProps: valueProps,
      brandTargetAudience: audience,
    });
  }

  const slack = await sendSlackAlert({
    brand,
    competitor,
    platform: m.platform,
    sku: m.sku,
    url: m.url,
    oosForMinutes: 0,
    adCopy,
    whatsappEnabled: whatsapp,
    adsBidSurgeEnabled: adsBid,
  });

  await insertEvent({
    monitor_id: m.id,
    kind: "oos_detected",
    status: "out_of_stock",
    message: `OOS detected on ${m.platform}. Slack: ${slack.ok ? "sent" : "failed"}`,
    payload: JSON.stringify({ slack, adCopy, whatsapp, adsBid }),
  });

  if (adCopy) {
    await insertEvent({
      monitor_id: m.id,
      kind: "ad_copy",
      status: "out_of_stock",
      message: adCopy,
    });
  }
}

export async function fireDemoAlert(monitorId: number): Promise<void> {
  const m = await getMonitor(monitorId);
  if (!m) throw new Error("monitor not found");
  const now = new Date().toISOString();
  await updateMonitor(m.id, {
    last_status: "out_of_stock",
    last_oos_at: now,
    last_checked_at: now,
  });
  await fireOOSAlert({ ...m, last_status: "in_stock" }, m.label || "");
}

// Used by instrumentation to warm caches before the first tick.
export { primeSettingsCache };
