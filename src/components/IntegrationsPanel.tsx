"use client";

import { useState } from "react";

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
    defaultConnected: true,
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
    defaultConnected: true,
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

export default function IntegrationsPanel() {
  const [connected, setConnected] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(ITEMS.map((i) => [i.key, !!i.defaultConnected]))
  );
  const [filter, setFilter] = useState<string>("All");

  const visible = ITEMS.filter((i) => filter === "All" || i.category === filter);

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-semibold">Integrations</h2>
          <p className="text-sm text-muted mt-0.5">
            Connect channels, ad platforms, and automation tools.
          </p>
        </div>
        <div className="flex items-center gap-1 flex-wrap">
          {(["All", ...CATEGORIES] as string[]).map((c) => (
            <button
              key={c}
              onClick={() => setFilter(c)}
              className={`text-xs px-3 py-1.5 rounded-full transition ${
                filter === c
                  ? "bg-accent/15 text-accent border border-accent/40"
                  : "border border-border text-muted hover:text-gray-200"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {visible.map((item) => {
          const isOn = connected[item.key];
          return (
            <div
              key={item.key}
              className={`rounded-xl border ${isOn ? "border-accent/40" : "border-border"} bg-panel p-5 hover:border-gray-500/50 transition group`}
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
              <div className="mt-3">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium">{item.name}</h3>
                  {isOn && (
                    <span className="text-[10px] uppercase tracking-wider text-accent flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                      Connected
                    </span>
                  )}
                </div>
                <div className="text-[10px] uppercase tracking-wider text-muted mt-0.5">
                  {item.category}
                </div>
              </div>
              <p className="text-sm text-muted mt-2 leading-relaxed">
                {item.description}
              </p>
              <button
                onClick={() =>
                  setConnected((c) => ({ ...c, [item.key]: !c[item.key] }))
                }
                className={`mt-4 w-full text-sm py-2 rounded-md font-medium transition ${
                  isOn
                    ? "bg-bg border border-border text-gray-200 hover:border-danger/60 hover:text-danger"
                    : "bg-accent text-black hover:bg-accent/90"
                }`}
              >
                {isOn ? "Disconnect" : "Connect"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
