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
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => {
    setBrand(settings.brand_name || "");
    setWebhook(settings.slack_webhook_url || "");
    setInterval(settings.poll_interval_seconds || "30");
    setAutoAd(settings.auto_ad_copy === "1");
    setWhatsapp(settings.whatsapp_enabled === "1");
    setAdsBid(settings.ads_bid_surge_enabled === "1");
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
    });
  }

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

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-xs uppercase tracking-wider text-muted">
            Brand context for ad copy
          </div>
          <button
            onClick={async () => {
              await fetch("/api/settings", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ onboarding_completed: "0" }),
              });
              onChange();
              location.reload();
            }}
            className="text-xs text-accent hover:underline"
          >
            Re-run onboarding
          </button>
        </div>
        {settings.brand_description ? (
          <div className="text-xs text-gray-300 bg-bg border border-border rounded-md px-3 py-2 space-y-1">
            {settings.brand_tagline && (
              <div>
                <span className="text-muted">Tagline:</span>{" "}
                {settings.brand_tagline}
              </div>
            )}
            <div>
              <span className="text-muted">About:</span>{" "}
              {settings.brand_description}
            </div>
            {settings.brand_voice && (
              <div>
                <span className="text-muted">Voice:</span> {settings.brand_voice}
              </div>
            )}
            {settings.brand_value_props && (
              <div>
                <span className="text-muted">Props:</span>{" "}
                {settings.brand_value_props.split("|").join(" · ")}
              </div>
            )}
          </div>
        ) : (
          <div className="text-xs text-muted italic">
            No brand context yet — re-run onboarding to populate.
          </div>
        )}
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
