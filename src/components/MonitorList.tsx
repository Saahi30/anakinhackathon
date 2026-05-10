"use client";

import type { Monitor } from "./Dashboard";
import StrikeCountdown from "./StrikeCountdown";

function timeAgo(iso: string | null): string {
  if (!iso) return "never";
  const d = new Date(iso);
  const sec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (sec < 5) return "just now";
  if (sec < 60) return `${sec}s ago`;
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  return d.toLocaleDateString();
}

function statusPill(status: string | null) {
  if (status === "out_of_stock")
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-danger/15 text-danger text-xs font-medium">
        <span className="w-1.5 h-1.5 rounded-full bg-danger animate-pulse" />
        OUT OF STOCK
      </span>
    );
  if (status === "in_stock")
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-accent/15 text-accent text-xs font-medium">
        <span className="w-1.5 h-1.5 rounded-full bg-accent" />
        in stock
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-border text-muted text-xs">
      <span className="w-1.5 h-1.5 rounded-full bg-muted" />
      {status === "unknown" ? "checking…" : "—"}
    </span>
  );
}

const platformColors: Record<string, string> = {
  myntra: "bg-pink-500/15 text-pink-400 border-pink-500/30",
  ajio: "bg-violet-500/15 text-violet-400 border-violet-500/30",
  blinkit: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  zepto: "bg-fuchsia-500/15 text-fuchsia-400 border-fuchsia-500/30",
  amazon: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  unknown: "bg-border text-muted border-border",
};

export default function MonitorList({
  monitors,
  onChange,
  onOpenWarRoom,
}: {
  monitors: Monitor[];
  onChange: () => void;
  onOpenWarRoom?: (m: Monitor) => void;
}) {
  return (
    <section className="rounded-xl border border-border bg-panel">
      <div className="px-5 py-3 border-b border-border flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
          Monitored listings
        </h2>
        <span className="text-xs text-muted">{monitors.length} URLs</span>
      </div>
      {!monitors.length && (
        <div className="px-5 py-12 text-center text-muted text-sm">
          No URLs yet. Add a competitor product link above to start monitoring.
        </div>
      )}
      <ul className="divide-y divide-border">
        {monitors.map((m) => {
          const isOOS = m.last_status === "out_of_stock";
          return (
            <li
              key={m.id}
              className={`px-5 py-4 transition ${isOOS ? "bg-danger/5" : "hover:bg-bg/40"}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded border ${platformColors[m.platform] || platformColors.unknown}`}
                    >
                      {m.platform}
                    </span>
                    {statusPill(m.last_status)}
                    {m.sku && (
                      <span className="text-xs text-muted font-mono">
                        {m.sku}
                      </span>
                    )}
                  </div>
                  <div className="mt-1.5 font-medium truncate text-gray-100">
                    {m.label || m.url}
                  </div>
                  <a
                    href={m.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-muted hover:text-accent truncate block"
                  >
                    {m.url}
                  </a>
                  <div className="text-xs text-muted mt-1">
                    Last checked {timeAgo(m.last_checked_at)}
                    {m.last_oos_at && !isOOS && (
                      <>
                        {" · "}
                        <span className="text-danger">
                          last OOS {timeAgo(m.last_oos_at)}
                        </span>
                      </>
                    )}
                  </div>
                  {isOOS && m.last_oos_at && (
                    <StrikeCountdown
                      oosAt={m.last_oos_at}
                      onOpenWarRoom={
                        onOpenWarRoom ? () => onOpenWarRoom(m) : undefined
                      }
                    />
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={async () => {
                      await fetch(`/api/monitors/${m.id}/check`, {
                        method: "POST",
                      });
                      onChange();
                    }}
                    title="Run a scrape now"
                    className="text-xs px-2 py-1 rounded border border-border hover:border-accent/60 hover:text-accent"
                  >
                    Recheck
                  </button>
                  <button
                    onClick={async () => {
                      if (
                        !confirm(
                          "Fire a demo OOS alert for this URL? This pings Slack as if the competitor went out of stock."
                        )
                      )
                        return;
                      await fetch(`/api/monitors/${m.id}/demo-oos`, {
                        method: "POST",
                      });
                      onChange();
                    }}
                    title="Fire a fake OOS alert (demo mode)"
                    className="text-xs px-2 py-1 rounded border border-warn/30 text-warn hover:bg-warn/10"
                  >
                    Demo OOS
                  </button>
                  <button
                    onClick={async () => {
                      if (!confirm("Remove this monitor?")) return;
                      await fetch(`/api/monitors/${m.id}`, { method: "DELETE" });
                      onChange();
                    }}
                    title="Remove"
                    className="text-xs px-2 py-1 rounded border border-border hover:border-danger/60 hover:text-danger"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
