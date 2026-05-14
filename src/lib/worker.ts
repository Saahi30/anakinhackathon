import {
  dueMonitors,
  dueMonitorsAdaptive,
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
  extractPrice,
  extractTitle,
  type Platform,
} from "./platforms";
import { sendSlackAlert, type AlertTier } from "./slack";
import { generateAdCopyVariants } from "./groq";
import { runMatchingPlaybooks } from "./playbooks";

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
  const adaptive = (await getSettingAsync("adaptive_polling_enabled")) !== "0";
  const due = adaptive
    ? await dueMonitorsAdaptive(interval, 5)
    : await dueMonitors(interval, 5);
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
      const fails = (m.consecutive_failures || 0) + 1;
      const autoPauseAt = Number(
        await getSettingAsync("auto_pause_threshold")
      ) || 5;
      const patch: Partial<Monitor> = {
        last_checked_at: now,
        consecutive_failures: fails,
      };
      if (fails >= autoPauseAt && !m.auto_paused_at) {
        patch.auto_paused_at = now;
      }
      await updateMonitor(m.id, patch);
      await insertEvent({
        monitor_id: m.id,
        kind: "scrape_failed",
        message: `${result.error || "scrape failed"} (failure #${fails})`,
      });
      if (fails >= autoPauseAt && !m.auto_paused_at) {
        await insertEvent({
          monitor_id: m.id,
          kind: "auto_paused",
          message: `Auto-paused after ${fails} consecutive scrape failures`,
        });
      }
      return;
    }

    const haystack = [result.markdown || "", result.cleanedHtml || ""].join(
      "\n"
    );
    const detection = detectStock(platform, haystack);
    const priceExtract = extractPrice(haystack);

    if (!m.label || m.label.startsWith("Loading")) {
      const title = extractTitle(result.markdown || "");
      if (title) {
        await updateMonitor(m.id, { label: title });
        m.label = title;
      }
    }

    const previous = m.last_status;
    const next = detection.status;

    const patch: Partial<Monitor> = {
      last_status: next,
      last_checked_at: now,
      consecutive_failures: 0,
    };
    if (priceExtract) {
      patch.last_price = priceExtract.display;
      patch.last_price_value = priceExtract.value as any;
      patch.last_price_at = now;
    }
    if (next === "low_stock" && previous !== "low_stock") {
      patch.low_stock_since = now;
    } else if (next !== "low_stock") {
      patch.low_stock_since = null;
    }
    await updateMonitor(m.id, patch);

    await insertEvent({
      monitor_id: m.id,
      kind: "check",
      status: next,
      message: detection.signal,
    });

    // Transitions
    const transitionedToOOS =
      next === "out_of_stock" && previous !== "out_of_stock";
    const transitionedToLowStock =
      next === "low_stock" &&
      previous !== "low_stock" &&
      previous !== "out_of_stock";
    const transitionedToInStock =
      (previous === "out_of_stock" || previous === "low_stock") &&
      next === "in_stock";

    if (transitionedToOOS) {
      await updateMonitor(m.id, { last_oos_at: now });
      await fireAlert(
        { ...m, last_oos_at: now, last_price: patch.last_price || m.last_price },
        "oos",
        result.markdown || ""
      );
    } else if (transitionedToLowStock) {
      if ((await getSettingAsync("alert_tier_low_stock_enabled")) === "1") {
        await fireAlert(
          {
            ...m,
            low_stock_since: now,
            last_price: patch.last_price || m.last_price,
          },
          "low_stock",
          result.markdown || "",
          { lowStockHint: detection.lowStockHint || null }
        );
      }
    } else if (transitionedToInStock) {
      await updateMonitor(m.id, { last_back_in_stock_at: now });
      if ((await getSettingAsync("alert_tier_restock_enabled")) === "1") {
        await fireAlert({ ...m }, "restock", result.markdown || "");
      } else {
        await insertEvent({
          monitor_id: m.id,
          kind: "back_in_stock",
          status: "in_stock",
          message: "Competitor restocked",
        });
      }
    }

    // Price drop, independent of stock transition: only fire if still in_stock
    // (an OOS drop doesn't matter — they have nothing to sell).
    if (
      priceExtract &&
      m.last_price_value != null &&
      priceExtract.value < m.last_price_value &&
      next === "in_stock" &&
      (await getSettingAsync("alert_tier_price_drop_enabled")) === "1"
    ) {
      const dropPct =
        ((m.last_price_value - priceExtract.value) / m.last_price_value) * 100;
      const minPct = Number(await getSettingAsync("price_drop_min_pct")) || 5;
      if (dropPct >= minPct) {
        await fireAlert(
          {
            ...m,
            last_price: priceExtract.display,
            last_price_value: priceExtract.value,
          },
          "price_drop",
          result.markdown || "",
          {
            priceFrom: m.last_price || `₹${m.last_price_value}`,
            priceTo: priceExtract.display,
            priceDropPct: dropPct,
          }
        );
      }
    }
  } finally {
    inFlight.delete(m.id);
  }
}

type AlertExtras = {
  lowStockHint?: string | null;
  priceFrom?: string | null;
  priceTo?: string | null;
  priceDropPct?: number | null;
};

export async function fireAlert(
  m: Monitor,
  tier: AlertTier,
  markdown: string,
  extras: AlertExtras = {}
): Promise<void> {
  const brand = (await getSettingAsync("brand_name")) || "Your Brand";
  const autoAd = (await getSettingAsync("auto_ad_copy")) === "1";
  const whatsapp = (await getSettingAsync("whatsapp_enabled")) === "1";
  const adsBid = (await getSettingAsync("ads_bid_surge_enabled")) === "1";
  const competitor = m.label || extractTitle(markdown) || m.url;

  // Only OOS alerts get auto-generated ad copy (restock is a "pull bid surge"
  // alert; low-stock is a heads-up; price drop is just info).
  let adCopyVariants: string[] = [];
  if (autoAd && tier === "oos") {
    const variantCount = Math.max(
      1,
      Number(await getSettingAsync("ad_copy_variants")) || 3
    );
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
    adCopyVariants = await generateAdCopyVariants(
      {
        brand,
        competitor,
        platform: m.platform,
        productHint: m.label,
        brandTagline: tagline,
        brandDescription: description,
        brandVoice: voice,
        brandValueProps: valueProps,
        brandTargetAudience: audience,
      },
      variantCount
    );
  }

  const slack = await sendSlackAlert({
    brand,
    competitor,
    platform: m.platform,
    sku: m.sku,
    url: m.url,
    oosForMinutes: 0,
    adCopy: adCopyVariants[0] || null,
    adCopyVariants,
    whatsappEnabled: whatsapp,
    adsBidSurgeEnabled: adsBid,
    tier,
    monitorId: m.id,
    lowStockHint: extras.lowStockHint,
    priceFrom: extras.priceFrom,
    priceTo: extras.priceTo,
    priceDropPct: extras.priceDropPct ?? null,
  });

  const kind =
    tier === "oos"
      ? "oos_detected"
      : tier === "low_stock"
        ? "low_stock"
        : tier === "restock"
          ? "back_in_stock"
          : "price_drop";
  const status =
    tier === "oos"
      ? "out_of_stock"
      : tier === "low_stock"
        ? "low_stock"
        : tier === "restock"
          ? "in_stock"
          : "in_stock";

  await insertEvent({
    monitor_id: m.id,
    kind,
    status,
    message: `${tier} on ${m.platform}. Slack: ${slack.ok ? "sent" : "failed"}`,
    payload: JSON.stringify({
      slack,
      adCopyVariants,
      whatsapp,
      adsBid,
      tier,
      ...extras,
    }),
  });

  if (adCopyVariants.length) {
    await insertEvent({
      monitor_id: m.id,
      kind: "ad_copy",
      status: "out_of_stock",
      message: adCopyVariants.join("\n---\n"),
    });
  }

  // Fire any playbook whose trigger matches this alert. Errors here are
  // intentionally swallowed — the core alert already shipped, playbooks are
  // a side-channel.
  await runMatchingPlaybooks({
    monitor: m,
    tier,
    competitor,
    brand,
  }).catch((e) => console.error("[playbooks] runMatching failed", e));
}

// Backwards-compatible wrapper kept for any older callers.
export async function fireOOSAlert(m: Monitor, markdown: string): Promise<void> {
  return fireAlert(m, "oos", markdown);
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
  await fireAlert({ ...m, last_status: "in_stock" }, "oos", m.label || "");
}

// Used by instrumentation to warm caches before the first tick.
export { primeSettingsCache };
