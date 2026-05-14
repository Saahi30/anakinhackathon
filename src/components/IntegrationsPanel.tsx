"use client";

import { useEffect, useState } from "react";
import AdPlatformSetup, {
  META_ADS_CONFIG,
  GOOGLE_ADS_CONFIG,
  type AdPlatformConfig,
} from "./AdPlatformSetup";

type Integration = {
  key: string;
  name: string;
  category: "Channels" | "Ad platforms" | "Automation" | "Analytics";
  description: string;
  logo: string; // emoji or text mark
  logoBg: string;
  logoColor: string;
  defaultConnected?: boolean;
  badge?: string;
};

const ITEMS: Integration[] = [
  // Channels
  {
    key: "slack",
    name: "Slack",
    category: "Channels",
    description: "Receive OOS alerts in any channel. Includes interactive action buttons.",
    logo: "#",
    logoBg: "bg-[#4A154B]",
    logoColor: "text-white",
  },
  {
    key: "discord",
    name: "Discord",
    category: "Channels",
    description: "Post strikes to a Discord server with role mentions.",
    logo: "D",
    logoBg: "bg-[#5865F2]",
    logoColor: "text-white",
  },
  {
    key: "teams",
    name: "Microsoft Teams",
    category: "Channels",
    description: "Adaptive cards posted to a Teams channel on each strike.",
    logo: "T",
    logoBg: "bg-[#5059C9]",
    logoColor: "text-white",
  },
  {
    key: "whatsapp",
    name: "WhatsApp",
    category: "Channels",
    description: "Notify a WhatsApp Business group via Cloud API.",
    logo: "W",
    logoBg: "bg-[#25D366]",
    logoColor: "text-white",
    badge: "BETA",
  },
  {
    key: "email",
    name: "Email digest",
    category: "Channels",
    description: "Daily and weekly digests of strikes captured.",
    logo: "@",
    logoBg: "bg-bg border border-border",
    logoColor: "text-gray-200",
  },
  {
    key: "sms",
    name: "SMS (Twilio)",
    category: "Channels",
    description: "Critical-only SMS to on-call when ROI ≥ ₹50k.",
    logo: "S",
    logoBg: "bg-[#F22F46]",
    logoColor: "text-white",
  },
  // Ads
  {
    key: "meta_ads",
    name: "Meta Ads",
    category: "Ad platforms",
    description: "Auto-surge ad set bids on rival OOS. Pause when restocked.",
    logo: "Ⓜ",
    logoBg: "bg-[#0866FF]",
    logoColor: "text-white",
  },
  {
    key: "google_ads",
    name: "Google Ads",
    category: "Ad platforms",
    description: "Bid up rival-brand keywords during the strike window.",
    logo: "G",
    logoBg: "bg-white",
    logoColor: "text-[#4285F4]",
  },
  {
    key: "amazon_ads",
    name: "Amazon Ads",
    category: "Ad platforms",
    description: "Push Sponsored Products on competing ASINs.",
    logo: "a",
    logoBg: "bg-[#FF9900]",
    logoColor: "text-black",
  },
  {
    key: "flipkart_ads",
    name: "Flipkart PLA",
    category: "Ad platforms",
    description: "Surge product listing ads on Flipkart.",
    logo: "F",
    logoBg: "bg-[#2874F0]",
    logoColor: "text-white",
    badge: "WAITLIST",
  },
  // Automation
  {
    key: "zapier",
    name: "Zapier",
    category: "Automation",
    description: "Trigger 6,000+ apps when a strike opens or closes.",
    logo: "Z",
    logoBg: "bg-[#FF4A00]",
    logoColor: "text-white",
  },
  {
    key: "webhook",
    name: "Generic webhook",
    category: "Automation",
    description: "POST every event to your endpoint with HMAC signing.",
    logo: "↗",
    logoBg: "bg-bg border border-border",
    logoColor: "text-gray-200",
  },
  {
    key: "n8n",
    name: "n8n",
    category: "Automation",
    description: "Self-hosted workflow automation node.",
    logo: "n",
    logoBg: "bg-[#EA4B71]",
    logoColor: "text-white",
  },
  // Analytics
  {
    key: "ga4",
    name: "Google Analytics 4",
    category: "Analytics",
    description: "Send strike events to GA4 for attribution analysis.",
    logo: "G",
    logoBg: "bg-[#F9AB00]",
    logoColor: "text-black",
  },
  {
    key: "mixpanel",
    name: "Mixpanel",
    category: "Analytics",
    description: "Track strike-driven user journeys.",
    logo: "Mx",
    logoBg: "bg-[#7856FF]",
    logoColor: "text-white",
  },
  {
    key: "linear",
    name: "Linear",
    category: "Analytics",
    description: "Open a Linear issue when capture rate drops below threshold.",
    logo: "L",
    logoBg: "bg-[#5E6AD2]",
    logoColor: "text-white",
  },
];

const CATEGORIES = ["Channels", "Ad platforms", "Automation", "Analytics"] as const;

function isSlackWebhook(url: string): boolean {
  if (!url) return false;
  try {
    const u = new URL(url.trim());
    return (
      u.protocol === "https:" &&
      (u.hostname === "hooks.slack.com" || u.hostname.endsWith(".slack.com"))
    );
  } catch {
    return false;
  }
}

export default function IntegrationsPanel() {
  const [connected, setConnected] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(ITEMS.map((i) => [i.key, !!i.defaultConnected]))
  );
  const [filter, setFilter] = useState<string>("All");
  const [slackWebhook, setSlackWebhook] = useState<string>("");
  const [slackPromptOpen, setSlackPromptOpen] = useState(false);
  const [slackDraft, setSlackDraft] = useState("");
  const [slackError, setSlackError] = useState<string | null>(null);
  const [slackSaving, setSlackSaving] = useState(false);
  const [adSetup, setAdSetup] = useState<AdPlatformConfig | null>(null);

  // Load saved Slack webhook + ad-platform connection state on mount.
  function refreshFromSettings() {
    return fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        const s = d?.settings || {};
        const saved = (s.slack_webhook_url || "").trim();
        setSlackWebhook(saved);
        setConnected((c) => ({
          ...c,
          slack: !!saved,
          meta_ads: s.meta_connected === "1",
          google_ads: s.google_connected === "1",
        }));
      })
      .catch(() => {});
  }

  useEffect(() => {
    let cancelled = false;
    refreshFromSettings().then(() => {
      if (cancelled) return;
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!slackPromptOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSlackPromptOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [slackPromptOpen]);

  async function saveSlackWebhook() {
    const url = slackDraft.trim();
    if (!url) {
      setSlackError("Slack webhook URL is required to connect.");
      return;
    }
    if (!isSlackWebhook(url)) {
      setSlackError("Must be an https://hooks.slack.com/... URL.");
      return;
    }
    setSlackSaving(true);
    setSlackError(null);
    try {
      const r = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slack_webhook_url: url }),
      });
      if (!r.ok) {
        setSlackError("Failed to save webhook. Try again.");
        return;
      }
      setSlackWebhook(url);
      setConnected((c) => ({ ...c, slack: true }));
      setSlackPromptOpen(false);
      setSlackDraft("");
    } finally {
      setSlackSaving(false);
    }
  }

  async function disconnectSlack() {
    setSlackSaving(true);
    setSlackError(null);
    try {
      await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slack_webhook_url: "" }),
      });
      setSlackWebhook("");
      setConnected((c) => ({ ...c, slack: false }));
    } finally {
      setSlackSaving(false);
    }
  }

  function handleToggle(itemKey: string) {
    if (itemKey === "slack") {
      if (connected.slack) {
        disconnectSlack();
      } else {
        setSlackDraft(slackWebhook || "");
        setSlackError(null);
        setSlackPromptOpen(true);
      }
      return;
    }
    if (itemKey === "meta_ads") {
      setAdSetup(META_ADS_CONFIG);
      return;
    }
    if (itemKey === "google_ads") {
      setAdSetup(GOOGLE_ADS_CONFIG);
      return;
    }
    setConnected((c) => ({ ...c, [itemKey]: !c[itemKey] }));
  }

  const visible = ITEMS.filter((i) => filter === "All" || i.category === filter);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <div className="text-[11px] uppercase tracking-[0.16em] text-muted font-semibold">
            Connections
          </div>
          <h2 className="font-display text-4xl tracking-display text-ink mt-1">
            Integrations
          </h2>
          <p className="text-sm text-muted mt-1.5">
            Connect channels, ad platforms, and automation tools.
          </p>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {(["All", ...CATEGORIES] as string[]).map((c) => (
            <button
              key={c}
              onClick={() => setFilter(c)}
              className={`text-xs px-3.5 py-1.5 rounded-full transition ${
                filter === c
                  ? "bg-ink text-white"
                  : "bg-soft text-muted hover:text-ink"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {adSetup && (
        <AdPlatformSetup
          config={adSetup}
          onClose={() => setAdSetup(null)}
          onSaved={refreshFromSettings}
        />
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {visible.map((item) => {
          const isOn = connected[item.key];
          return (
            <div
              key={item.key}
              className={`rounded-clay ${isOn ? "bg-card" : "bg-panel"} border border-hairline p-6 transition shadow-clay hover:shadow-clay-lift group`}
            >
              <div className="flex items-start justify-between gap-3">
                <div
                  className={`w-12 h-12 rounded-lg ${item.logoBg} ${item.logoColor} grid place-items-center font-bold text-lg shrink-0`}
                >
                  {item.logo}
                </div>
                {item.badge && (
                  <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-warn/15 text-warn border border-warn/30">
                    {item.badge}
                  </span>
                )}
              </div>
              <div className="mt-4">
                <div className="flex items-center gap-2">
                  <h3 className="font-display tracking-tightish text-lg text-ink">
                    {item.name}
                  </h3>
                  {isOn && (
                    <span className="text-[10px] uppercase tracking-[0.14em] text-brand-teal font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-teal" />
                      Connected
                    </span>
                  )}
                </div>
                <div className="text-[10px] uppercase tracking-[0.14em] text-muted mt-1">
                  {item.category}
                </div>
              </div>
              <p className="text-sm text-muted mt-2 leading-relaxed">
                {item.description}
              </p>
              {item.key === "slack" && isOn && slackWebhook && (
                <div className="mt-3 text-[10px] text-muted font-mono truncate" title={slackWebhook}>
                  {slackWebhook.replace(/(\/services\/.{4}).+/, "$1•••")}
                </div>
              )}
              <button
                onClick={() => handleToggle(item.key)}
                disabled={item.key === "slack" && slackSaving}
                className={`mt-5 w-full text-sm py-2.5 rounded-full font-medium transition disabled:opacity-50 ${
                  isOn
                    ? "bg-canvas border border-hairline text-ink hover:border-brand-coral hover:text-brand-coral"
                    : "bg-ink text-white hover:bg-ink/90"
                }`}
              >
                {item.key === "slack" && slackSaving
                  ? "Saving…"
                  : isOn
                    ? item.key === "meta_ads" || item.key === "google_ads"
                      ? "Configure"
                      : "Disconnect"
                    : "Connect"}
              </button>

              {item.key === "slack" && slackPromptOpen && !isOn && (
                <div className="mt-4 rounded-2xl bg-soft border border-hairline p-4 space-y-2">
                  <label className="text-[10px] uppercase tracking-[0.14em] text-muted font-semibold">
                    Slack webhook URL
                  </label>
                  <input
                    type="url"
                    autoFocus
                    required
                    value={slackDraft}
                    onChange={(e) => {
                      setSlackDraft(e.target.value);
                      setSlackError(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        saveSlackWebhook();
                      }
                    }}
                    placeholder="https://hooks.slack.com/services/..."
                    className="w-full bg-canvas border border-hairline rounded-2xl px-3 py-2 text-xs font-mono text-ink placeholder:text-muted-soft focus:border-ink focus:outline-none transition"
                  />
                  <div className="text-[10px] text-muted leading-relaxed">
                    Required to connect Slack. Create one in your Slack app
                    under <span className="font-mono">Incoming Webhooks</span>.
                  </div>
                  {slackError && (
                    <div className="text-[11px] text-brand-coral">
                      {slackError}
                    </div>
                  )}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={saveSlackWebhook}
                      disabled={slackSaving}
                      className="flex-1 text-xs px-3 py-2 rounded-full bg-ink text-white hover:bg-ink/90 disabled:opacity-50 transition"
                    >
                      {slackSaving ? "Connecting…" : "Connect Slack"}
                    </button>
                    <button
                      onClick={() => {
                        setSlackPromptOpen(false);
                        setSlackError(null);
                      }}
                      disabled={slackSaving}
                      className="text-xs px-3 py-2 rounded-full bg-canvas text-ink border border-hairline hover:bg-soft transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
