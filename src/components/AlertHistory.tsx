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

export default function AlertHistory({ events }: { events: Event[] }) {
  const oosEvents = events.filter((e) => e.kind === "oos_detected");

  return (
    <section className="rounded-xl border border-border bg-panel">
      <div className="px-5 py-3 border-b border-border flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
          Alert history
        </h2>
        <span className="text-xs text-muted">{oosEvents.length} OOS alerts</span>
      </div>
      {!oosEvents.length ? (
        <div className="px-5 py-8 text-center text-muted text-sm">
          No OOS alerts yet. When a competitor goes out of stock, Slack
          alerts appear here.
        </div>
      ) : (
        <ul className="divide-y divide-border max-h-72 overflow-y-auto">
          {oosEvents.map((e) => {
            const slackOk = parseSlack(e.payload);
            return (
              <li key={e.id} className="px-5 py-3 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] uppercase font-semibold tracking-wider px-1.5 py-0.5 rounded border border-danger/40 text-danger bg-danger/10">
                    OOS
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
