"use client";

import { useEffect, useState } from "react";

export default function SettingsPanel({
  settings,
  onChange,
}: {
  settings: Record<string, string>;
  onChange: () => void;
}) {
  const [brand, setBrand] = useState(settings.brand_name || "");
  const [webhook, setWebhook] = useState(settings.slack_webhook_url || "");
  const [interval, setInterval] = useState(
    settings.poll_interval_seconds || "30"
  );
  const [autoAd, setAutoAd] = useState(settings.auto_ad_copy === "1");
  const [whatsapp, setWhatsapp] = useState(settings.whatsapp_enabled === "1");
  const [adsBid, setAdsBid] = useState(settings.ads_bid_surge_enabled === "1");
  const [quietEnabled, setQuietEnabled] = useState(
    settings.quiet_hours_enabled === "1"
  );
  const [quietStart, setQuietStart] = useState(
    settings.quiet_hours_start || "23:00"
  );
  const [quietEnd, setQuietEnd] = useState(settings.quiet_hours_end || "07:00");
  const [quietBypassCritical, setQuietBypassCritical] = useState(
    settings.quiet_bypass_critical !== "0"
  );
  const [criticalThreshold, setCriticalThreshold] = useState(
    settings.critical_revenue_threshold || "50000"
  );
  const [tierLowStock, setTierLowStock] = useState(
    settings.alert_tier_low_stock_enabled !== "0"
  );
  const [tierRestock, setTierRestock] = useState(
    settings.alert_tier_restock_enabled !== "0"
  );
  const [tierPriceDrop, setTierPriceDrop] = useState(
    settings.alert_tier_price_drop_enabled !== "0"
  );
  const [adaptivePolling, setAdaptivePolling] = useState(
    settings.adaptive_polling_enabled !== "0"
  );
  const [autoPauseThreshold, setAutoPauseThreshold] = useState(
    settings.auto_pause_threshold || "5"
  );
  const [priceDropMinPct, setPriceDropMinPct] = useState(
    settings.price_drop_min_pct || "5"
  );
  const [adCopyVariants, setAdCopyVariants] = useState(
    settings.ad_copy_variants || "3"
  );
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => {
    setBrand(settings.brand_name || "");
    setWebhook(settings.slack_webhook_url || "");
    setInterval(settings.poll_interval_seconds || "30");
    setAutoAd(settings.auto_ad_copy === "1");
    setWhatsapp(settings.whatsapp_enabled === "1");
    setAdsBid(settings.ads_bid_surge_enabled === "1");
    setQuietEnabled(settings.quiet_hours_enabled === "1");
    setQuietStart(settings.quiet_hours_start || "23:00");
    setQuietEnd(settings.quiet_hours_end || "07:00");
    setQuietBypassCritical(settings.quiet_bypass_critical !== "0");
    setCriticalThreshold(settings.critical_revenue_threshold || "50000");
    setTierLowStock(settings.alert_tier_low_stock_enabled !== "0");
    setTierRestock(settings.alert_tier_restock_enabled !== "0");
    setTierPriceDrop(settings.alert_tier_price_drop_enabled !== "0");
    setAdaptivePolling(settings.adaptive_polling_enabled !== "0");
    setAutoPauseThreshold(settings.auto_pause_threshold || "5");
    setPriceDropMinPct(settings.price_drop_min_pct || "5");
    setAdCopyVariants(settings.ad_copy_variants || "3");
  }, [settings]);

  async function save(patch: Record<string, string>) {
    await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    setSavedAt(Date.now());
    onChange();
  }

  async function saveAll() {
    await save({
      brand_name: brand,
      slack_webhook_url: webhook,
      poll_interval_seconds: interval,
      auto_ad_copy: autoAd ? "1" : "0",
      whatsapp_enabled: whatsapp ? "1" : "0",
      ads_bid_surge_enabled: adsBid ? "1" : "0",
      quiet_hours_enabled: quietEnabled ? "1" : "0",
      quiet_hours_start: quietStart,
      quiet_hours_end: quietEnd,
      quiet_bypass_critical: quietBypassCritical ? "1" : "0",
      critical_revenue_threshold: criticalThreshold,
      alert_tier_low_stock_enabled: tierLowStock ? "1" : "0",
      alert_tier_restock_enabled: tierRestock ? "1" : "0",
      alert_tier_price_drop_enabled: tierPriceDrop ? "1" : "0",
      adaptive_polling_enabled: adaptivePolling ? "1" : "0",
      auto_pause_threshold: autoPauseThreshold,
      price_drop_min_pct: priceDropMinPct,
      ad_copy_variants: adCopyVariants,
    });
  }

  // Live evaluation of whether right now is in quiet hours
  const inQuietNow = (() => {
    if (!quietEnabled) return false;
    const now = new Date();
    const [sh, sm] = quietStart.split(":").map(Number);
    const [eh, em] = quietEnd.split(":").map(Number);
    const cur = now.getHours() * 60 + now.getMinutes();
    const start = sh * 60 + sm;
    const end = eh * 60 + em;
    return start <= end ? cur >= start && cur < end : cur >= start || cur < end;
  })();

  const toggle = (
    label: string,
    desc: string,
    value: boolean,
    onChange: (v: boolean) => void,
    badge?: string
  ) => (
    <label className="flex items-start gap-3 cursor-pointer py-2.5">
      <input
        type="checkbox"
        checked={value}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 w-4 h-4 accent-accent"
      />
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{label}</span>
          {badge && (
            <span className="text-[10px] px-1.5 py-0.5 rounded border border-warn/40 text-warn">
              {badge}
            </span>
          )}
        </div>
        <div className="text-xs text-muted mt-0.5">{desc}</div>
      </div>
    </label>
  );

  return (
    <section className="rounded-clay bg-panel border border-hairline p-7 shadow-clay">
      <div className="mb-5">
        <div className="text-[11px] uppercase tracking-[0.16em] text-muted font-semibold">
          Configuration
        </div>
        <h2 className="font-display text-2xl tracking-display text-ink mt-0.5">
          Settings
        </h2>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-xs text-muted">Your brand name</label>
          <input
            type="text"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            placeholder="Your Brand"
            className="mt-1 w-full bg-canvas border border-hairline rounded-2xl px-4 py-2.5 text-sm text-ink placeholder:text-muted-soft focus:border-ink focus:outline-none transition"
          />
        </div>

        <div>
          <label className="text-xs text-muted">Slack webhook URL</label>
          <input
            type="url"
            value={webhook}
            onChange={(e) => setWebhook(e.target.value)}
            placeholder="https://hooks.slack.com/services/..."
            className="mt-1 w-full bg-canvas border border-hairline rounded-2xl px-4 py-2.5 text-sm font-mono text-ink placeholder:text-muted-soft focus:border-ink focus:outline-none transition"
          />
        </div>

        <div>
          <label className="text-xs text-muted">
            Poll interval (seconds)
          </label>
          <input
            type="number"
            min={10}
            max={3600}
            value={interval}
            onChange={(e) => setInterval(e.target.value)}
            className="mt-1 w-full bg-canvas border border-hairline rounded-2xl px-4 py-2.5 text-sm text-ink focus:border-ink focus:outline-none transition"
          />
        </div>
      </div>

      <hr className="my-4 border-border" />

      <div className="space-y-1">
        <div className="text-xs uppercase tracking-wider text-muted mb-1">
          Actions on OOS
        </div>
        {toggle(
          "Auto-generate ad copy",
          "When OOS detected, our AI ad-copy engine writes the copy and includes it in the Slack alert.",
          autoAd,
          setAutoAd
        )}
        {toggle(
          "Google/Meta ads bid surge",
          "Increases your ad bids on competing keywords. Mocked — Slack message will note it as triggered.",
          adsBid,
          setAdsBid,
          "MOCKED"
        )}
        {toggle(
          "WhatsApp alert",
          "Pings the brand team's WhatsApp group on OOS detection.",
          whatsapp,
          setWhatsapp,
          "COMING SOON"
        )}
      </div>

      <hr className="my-4 border-border" />

      <div className="space-y-1">
        <div className="text-xs uppercase tracking-wider text-muted mb-1">
          Alert tiers
        </div>
        {toggle(
          "Low-stock pre-warning",
          "Fire a separate alert when a competitor shows 'Only X left' or 'Selling fast' (pre-OOS).",
          tierLowStock,
          setTierLowStock
        )}
        {toggle(
          "Back-in-stock alert",
          "Ping when a competitor recovers from OOS, so the team can pull bid surges.",
          tierRestock,
          setTierRestock
        )}
        {toggle(
          "Price-drop alert",
          "Notify when a competitor drops their price by more than the threshold below.",
          tierPriceDrop,
          setTierPriceDrop
        )}
        <div className="grid grid-cols-2 gap-2 mt-2">
          <div>
            <label className="text-[10px] uppercase tracking-wider text-muted">
              Price-drop threshold (%)
            </label>
            <input
              type="number"
              min={1}
              max={90}
              value={priceDropMinPct}
              onChange={(e) => setPriceDropMinPct(e.target.value)}
              className="mt-1 w-full bg-canvas border border-hairline rounded-2xl px-3 py-2 text-sm font-mono text-ink focus:border-ink focus:outline-none"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wider text-muted">
              Ad-copy variants
            </label>
            <input
              type="number"
              min={1}
              max={5}
              value={adCopyVariants}
              onChange={(e) => setAdCopyVariants(e.target.value)}
              className="mt-1 w-full bg-canvas border border-hairline rounded-2xl px-3 py-2 text-sm font-mono text-ink focus:border-ink focus:outline-none"
            />
          </div>
        </div>
      </div>

      <hr className="my-4 border-border" />

      <div className="space-y-1">
        <div className="text-xs uppercase tracking-wider text-muted mb-1">
          Polling intelligence
        </div>
        {toggle(
          "Adaptive polling",
          "Poll OOS-prone listings more often and stable ones less often. Spends scrape credits where they matter.",
          adaptivePolling,
          setAdaptivePolling
        )}
        <div>
          <label className="text-[10px] uppercase tracking-wider text-muted">
            Auto-pause after N consecutive scrape failures
          </label>
          <input
            type="number"
            min={2}
            max={20}
            value={autoPauseThreshold}
            onChange={(e) => setAutoPauseThreshold(e.target.value)}
            className="mt-1 w-full bg-canvas border border-hairline rounded-2xl px-3 py-2 text-sm font-mono text-ink focus:border-ink focus:outline-none"
          />
          <div className="text-[10px] text-muted mt-1">
            Dead listings stop burning credits. Resume them manually from the
            monitor row.
          </div>
        </div>
      </div>

      <hr className="my-4 border-border" />

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-xs uppercase tracking-wider text-muted">
            Quiet hours / DND
          </div>
          {quietEnabled && (
            <span
              className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded border ${
                inQuietNow
                  ? "border-violet-400/40 text-violet-300 bg-violet-400/10"
                  : "border-accent/40 text-accent bg-accent/5"
              }`}
            >
              {inQuietNow ? "🌙 Quiet now" : "Active"}
            </span>
          )}
        </div>

        <label className="flex items-start gap-3 cursor-pointer py-2">
          <input
            type="checkbox"
            checked={quietEnabled}
            onChange={(e) => setQuietEnabled(e.target.checked)}
            className="mt-1 w-4 h-4 accent-accent"
          />
          <div className="flex-1">
            <div className="text-sm font-medium">Suppress non-critical alerts</div>
            <div className="text-xs text-muted mt-0.5">
              During the window below, Slack/WhatsApp pings are batched into a digest instead of firing live.
            </div>
          </div>
        </label>

        {quietEnabled && (
          <>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] uppercase tracking-wider text-muted">
                  From
                </label>
                <input
                  type="time"
                  value={quietStart}
                  onChange={(e) => setQuietStart(e.target.value)}
                  className="mt-1 w-full bg-bg border border-border rounded-md px-3 py-2 text-sm font-mono focus:border-accent focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-muted">
                  Until
                </label>
                <input
                  type="time"
                  value={quietEnd}
                  onChange={(e) => setQuietEnd(e.target.value)}
                  className="mt-1 w-full bg-bg border border-border rounded-md px-3 py-2 text-sm font-mono focus:border-accent focus:outline-none"
                />
              </div>
            </div>

            <label className="flex items-start gap-3 cursor-pointer py-2">
              <input
                type="checkbox"
                checked={quietBypassCritical}
                onChange={(e) => setQuietBypassCritical(e.target.checked)}
                className="mt-1 w-4 h-4 accent-accent"
              />
              <div className="flex-1">
                <div className="text-sm font-medium">
                  Bypass for critical strikes
                </div>
                <div className="text-xs text-muted mt-0.5">
                  Always page if attributed revenue is projected ≥ ₹{Number(criticalThreshold).toLocaleString("en-IN")}.
                </div>
              </div>
            </label>

            {quietBypassCritical && (
              <div>
                <label className="text-[10px] uppercase tracking-wider text-muted">
                  Critical revenue threshold (₹)
                </label>
                <input
                  type="number"
                  min={0}
                  step={1000}
                  value={criticalThreshold}
                  onChange={(e) => setCriticalThreshold(e.target.value)}
                  className="mt-1 w-full bg-bg border border-border rounded-md px-3 py-2 text-sm font-mono focus:border-accent focus:outline-none"
                />
              </div>
            )}
          </>
        )}
      </div>

      <button
        onClick={saveAll}
        className="mt-5 w-full px-4 py-3 text-sm rounded-full bg-ink text-white font-medium hover:bg-ink/90 transition"
      >
        Save settings
      </button>
      {savedAt && (
        <div className="text-xs text-brand-teal text-center mt-2 font-medium">
          Saved ✓ {new Date(savedAt).toLocaleTimeString()}
        </div>
      )}
    </section>
  );
}
