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
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-brand-coral text-white text-xs font-semibold">
        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
        OUT OF STOCK
      </span>
    );
  if (status === "in_stock")
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-brand-mint text-brand-teal text-xs font-semibold">
        <span className="w-1.5 h-1.5 rounded-full bg-brand-teal" />
        in stock
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-soft text-muted text-xs">
      <span className="w-1.5 h-1.5 rounded-full bg-muted-soft" />
      {status === "unknown" ? "checking…" : "—"}
    </span>
  );
}

const platformColors: Record<string, string> = {
  myntra: "bg-brand-pink/15 text-brand-pink border-brand-pink/40",
  ajio: "bg-brand-lavender/30 text-ink border-brand-lavender/60",
  blinkit: "bg-brand-ochre/25 text-brand-teal border-brand-ochre/50",
  zepto: "bg-brand-pink/10 text-brand-pink border-brand-pink/30",
  amazon: "bg-brand-peach/30 text-ink border-brand-peach/60",
  unknown: "bg-soft text-muted border-hairline",
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
    <section className="rounded-clay bg-panel border border-hairline shadow-clay overflow-hidden">
      <div className="px-7 py-5 border-b border-hairline flex items-center justify-between bg-soft">
        <div>
          <div className="text-[11px] uppercase tracking-[0.16em] text-muted font-semibold">
            Listings
          </div>
          <h2 className="font-display text-2xl tracking-display text-ink mt-0.5">
            Monitored listings
          </h2>
        </div>
        <span className="text-xs text-muted px-3 py-1 rounded-full bg-canvas border border-hairline">
          {monitors.length} URLs
        </span>
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
              className={`px-7 py-5 transition ${isOOS ? "bg-brand-coral/5" : "hover:bg-soft/60"}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-[10px] uppercase tracking-[0.14em] font-semibold px-2 py-0.5 rounded-full border ${platformColors[m.platform] || platformColors.unknown}`}
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
                  <div className="mt-2 font-display text-lg tracking-tightish truncate text-ink">
                    {m.label || m.url}
                  </div>
                  <a
                    href={m.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-muted hover:text-brand-teal truncate block"
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
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={async () => {
                      await fetch(`/api/monitors/${m.id}/check`, {
                        method: "POST",
                      });
                      onChange();
                    }}
                    title="Run a scrape now"
                    className="text-xs px-3 py-1.5 rounded-full bg-soft hover:bg-strong text-ink"
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
                    className="text-xs px-3 py-1.5 rounded-full bg-brand-ochre/30 text-brand-teal hover:bg-brand-ochre/50"
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
                    className="text-xs w-8 h-8 rounded-full bg-soft hover:bg-brand-coral/15 text-muted hover:text-brand-coral grid place-items-center"
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
