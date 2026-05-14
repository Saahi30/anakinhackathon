"use client";

import type { Event } from "./Dashboard";

function timeAgo(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso + (iso.endsWith("Z") ? "" : "Z"));
  const sec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (sec < 5) return "now";
  if (sec < 60) return `${sec}s`;
  if (sec < 3600) return `${Math.floor(sec / 60)}m`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h`;
  return d.toLocaleDateString();
}

const KIND_DISPLAY: Record<string, { label: string; tone: string; description: string }> = {
  oos_detected: {
    label: "OOS detected",
    tone: "border-danger/60 bg-danger/10 text-danger",
    description: "Slack alert fired",
  },
  back_in_stock: {
    label: "Back in stock",
    tone: "border-accent/60 bg-accent/10 text-accent",
    description: "Pull bid surge — competitor restocked",
  },
  low_stock: {
    label: "Low stock",
    tone: "border-warn/60 bg-warn/10 text-warn",
    description: "Pre-OOS warning",
  },
  price_drop: {
    label: "Price drop",
    tone: "border-brand-pink/60 bg-brand-pink/10 text-brand-pink",
    description: "Competitor cut price",
  },
  scrape_failed: {
    label: "Scrape failed",
    tone: "border-warn/60 bg-warn/10 text-warn",
    description: "Will retry next tick",
  },
  auto_paused: {
    label: "Auto-paused",
    tone: "border-warn/60 bg-warn/10 text-warn",
    description: "Too many consecutive failures",
  },
  snoozed: {
    label: "Snoozed",
    tone: "border-border bg-bg/40 text-gray-300",
    description: "Monitor paused",
  },
  resumed: {
    label: "Resumed",
    tone: "border-accent/60 bg-accent/10 text-accent",
    description: "Monitor active again",
  },
  resolved: {
    label: "Resolved",
    tone: "border-accent/60 bg-accent/10 text-accent",
    description: "Marked resolved via Slack",
  },
  ad_live: {
    label: "Ad live",
    tone: "border-accent/60 bg-accent/10 text-accent",
    description: "Confirmed via Slack",
  },
  ad_copy: {
    label: "Ad copy generated",
    tone: "border-violet-500/60 bg-violet-500/10 text-violet-300",
    description: "AI ad-copy engine",
  },
  check: {
    label: "Scrape completed",
    tone: "border-border bg-bg/40 text-gray-300",
    description: "URL scraper",
  },
};

export default function MonitoringFeed({ events }: { events: Event[] }) {
  return (
    <section className="rounded-clay bg-panel border border-hairline shadow-clay overflow-hidden">
      <div className="px-7 py-5 border-b border-hairline flex items-center justify-between bg-soft">
        <div>
          <div className="text-[11px] uppercase tracking-[0.16em] text-muted font-semibold">
            Realtime
          </div>
          <h2 className="font-display text-2xl tracking-display text-ink mt-0.5">
            Live monitoring feed
          </h2>
        </div>
        <span className="inline-flex items-center gap-1.5 text-xs text-brand-teal px-3 py-1 rounded-full bg-brand-mint/40">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-teal animate-pulse" />
          realtime
        </span>
      </div>
      <div className="max-h-[680px] overflow-y-auto">
        {!events.length && (
          <div className="px-5 py-12 text-center text-muted text-sm">
            Timeline appears here as products are imported, competitors
            approved, scrapes complete, and OOS events fire.
          </div>
        )}
        <ul className="relative">
          {events.map((e, i) => {
            const meta = KIND_DISPLAY[e.kind] || {
              label: e.kind.replace(/_/g, " "),
              tone: "border-border bg-bg/40 text-gray-300",
              description: "",
            };
            const isLast = i === events.length - 1;
            return (
              <li
                key={e.id}
                className="relative px-5 py-3 text-sm flex gap-3"
              >
                <div className="flex flex-col items-center shrink-0">
                  <span
                    className={`w-2 h-2 mt-1.5 rounded-full border ${meta.tone}`}
                  />
                  {!isLast && (
                    <span className="flex-1 w-px bg-border my-1" />
                  )}
                </div>
                <div className="min-w-0 flex-1 pb-1">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded border ${meta.tone}`}
                    >
                      {meta.label}
                    </span>
                    <span className="text-xs text-muted">
                      {timeAgo(e.created_at)} ago
                    </span>
                  </div>
                  <div className="mt-1 text-gray-200 truncate">
                    {e.monitor_label || e.monitor_url || `monitor #${e.monitor_id}`}
                  </div>
                  <div className="text-xs text-muted">
                    {meta.description && <span>{meta.description}</span>}
                    {e.message && meta.description && " · "}
                    {e.message}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
