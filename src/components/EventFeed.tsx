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

function kindStyle(kind: string) {
  switch (kind) {
    case "oos_detected":
      return "border-danger/60 bg-danger/10 text-danger";
    case "back_in_stock":
      return "border-accent/60 bg-accent/10 text-accent";
    case "scrape_failed":
      return "border-warn/60 bg-warn/10 text-warn";
    case "ad_copy":
      return "border-violet-500/60 bg-violet-500/10 text-violet-300";
    default:
      return "border-border bg-bg/40 text-gray-300";
  }
}

function kindLabel(kind: string) {
  return (
    {
      oos_detected: "OOS DETECTED",
      back_in_stock: "BACK IN STOCK",
      scrape_failed: "SCRAPE FAILED",
      ad_copy: "AD COPY",
      check: "CHECK",
    } as Record<string, string>
  )[kind] || kind.toUpperCase();
}

export default function EventFeed({ events }: { events: Event[] }) {
  return (
    <section className="rounded-xl border border-border bg-panel">
      <div className="px-5 py-3 border-b border-border flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
          Live event feed
        </h2>
        <span className="inline-flex items-center gap-1.5 text-xs text-accent">
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
          realtime
        </span>
      </div>
      <div className="max-h-[680px] overflow-y-auto">
        {!events.length && (
          <div className="px-5 py-12 text-center text-muted text-sm">
            No events yet. Events appear here as URLs are scraped.
          </div>
        )}
        <ul className="divide-y divide-border">
          {events.map((e) => (
            <li key={e.id} className="px-5 py-3 text-sm">
              <div className="flex items-center justify-between gap-2">
                <span
                  className={`text-[10px] font-semibold tracking-wider px-2 py-0.5 rounded border ${kindStyle(e.kind)}`}
                >
                  {kindLabel(e.kind)}
                </span>
                <span className="text-xs text-muted">
                  {timeAgo(e.created_at)} ago
                </span>
              </div>
              <div className="mt-1.5 text-gray-200 truncate">
                {e.monitor_label || e.monitor_url || `monitor #${e.monitor_id}`}
              </div>
              {e.message && (
                <div className="text-xs text-muted mt-0.5 break-words">
                  {e.message}
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
