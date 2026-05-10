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
    <section className="rounded-xl border border-border bg-panel p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted mb-4">
        Settings
      </h2>

      <div className="space-y-3">
        <div>
          <label className="text-xs text-muted">Your brand name</label>
          <input
            type="text"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            placeholder="Your Brand"
            className="mt-1 w-full bg-bg border border-border rounded-md px-3 py-2 text-sm focus:border-accent focus:outline-none"
          />
        </div>

        <div>
          <label className="text-xs text-muted">Slack webhook URL</label>
          <input
            type="url"
            value={webhook}
            onChange={(e) => setWebhook(e.target.value)}
            placeholder="https://hooks.slack.com/services/..."
            className="mt-1 w-full bg-bg border border-border rounded-md px-3 py-2 text-sm font-mono focus:border-accent focus:outline-none"
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
            className="mt-1 w-full bg-bg border border-border rounded-md px-3 py-2 text-sm focus:border-accent focus:outline-none"
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
          "When OOS detected, Groq Llama 3.3 70B writes ad copy and includes it in the Slack alert.",
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
        className="mt-4 w-full px-3 py-2 text-sm rounded-md bg-accent text-black font-medium hover:bg-accent/90"
      >
        Save settings
      </button>
      {savedAt && (
        <div className="text-xs text-accent text-center mt-2">
          Saved ✓ {new Date(savedAt).toLocaleTimeString()}
        </div>
      )}
    </section>
  );
}
