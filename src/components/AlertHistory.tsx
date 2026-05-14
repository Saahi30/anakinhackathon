"use client";

import type { Event } from "./Dashboard";

function timeAgo(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso + (iso.endsWith("Z") ? "" : "Z"));
  const sec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (sec < 60) return `${sec}s ago`;
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  return d.toLocaleString();
}

const TIER_META: Record<
  string,
  { label: string; pill: string; tone: "danger" | "warn" | "accent" | "muted" }
> = {
  oos_detected: {
    label: "OOS",
    pill: "border-danger/40 text-danger bg-danger/10",
    tone: "danger",
  },
  low_stock: {
    label: "LOW",
    pill: "border-warn/40 text-warn bg-warn/10",
    tone: "warn",
  },
  back_in_stock: {
    label: "RESTOCK",
    pill: "border-brand-teal/40 text-brand-teal bg-brand-mint/30",
    tone: "accent",
  },
  price_drop: {
    label: "PRICE",
    pill: "border-brand-pink/40 text-brand-pink bg-brand-pink/10",
    tone: "muted",
  },
};

const ALERT_KINDS = Object.keys(TIER_META);

export default function AlertHistory({ events }: { events: Event[] }) {
  const alerts = events.filter((e) => ALERT_KINDS.includes(e.kind));

  return (
    <section className="rounded-clay bg-panel border border-hairline shadow-clay overflow-hidden">
      <div className="px-7 py-5 border-b border-hairline flex items-center justify-between bg-soft">
        <div>
          <div className="text-[11px] uppercase tracking-[0.16em] text-muted font-semibold">
            History
          </div>
          <h2 className="font-display text-2xl tracking-display text-ink mt-0.5">
            Alert history
          </h2>
        </div>
        <span className="text-xs text-muted px-3 py-1 rounded-full bg-canvas border border-hairline">
          {alerts.length} alerts
        </span>
      </div>
      {!alerts.length ? (
        <div className="px-5 py-8 text-center text-muted text-sm">
          No alerts yet. OOS, restock, low-stock, and price-drop alerts will
          land here.
        </div>
      ) : (
        <ul className="divide-y divide-border max-h-72 overflow-y-auto">
          {alerts.map((e) => {
            const slackOk = parseSlack(e.payload);
            const meta = TIER_META[e.kind] || TIER_META.oos_detected;
            return (
              <li key={e.id} className="px-5 py-3 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`text-[10px] uppercase font-semibold tracking-wider px-1.5 py-0.5 rounded border ${meta.pill}`}
                  >
                    {meta.label}
                  </span>
                  <span className="text-xs text-muted">
                    {timeAgo(e.created_at)}
                  </span>
                </div>
                <div className="mt-1 text-gray-200 truncate">
                  {e.monitor_label || e.monitor_url || `monitor #${e.monitor_id}`}
                </div>
                <div className="mt-0.5 text-xs text-muted">
                  {e.monitor_platform} ·{" "}
                  {slackOk === null ? (
                    "—"
                  ) : slackOk ? (
                    <span className="text-accent">Slack sent ✓</span>
                  ) : (
                    <span className="text-danger">Slack failed</span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function parseSlack(payload: string | null): boolean | null {
  if (!payload) return null;
  try {
    const obj = JSON.parse(payload);
    return Boolean(obj?.slack?.ok);
  } catch {
    return null;
  }
}
