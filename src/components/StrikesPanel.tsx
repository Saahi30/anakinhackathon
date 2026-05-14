"use client";

import { useEffect, useMemo, useState } from "react";
import StrikeReplay, { type ReplayStrike } from "./StrikeReplay";
import type { Event, Monitor } from "./Dashboard";

export type ScoredStrike = {
  monitor_id: number;
  label: string | null;
  platform: string;
  url: string;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number;
  is_live: boolean;
  est_impressions: number;
  est_clicks: number;
  est_conversions: number;
  est_revenue_inr: number;
  est_spend_inr: number;
  est_roas: number;
  last_price: string | null;
};

type Totals = {
  revenue: number;
  spend: number;
  clicks: number;
  impressions: number;
  strikes: number;
  live: number;
  avg_roas: number;
};

const platformBadge: Record<string, string> = {
  myntra: "bg-brand-pink/15 text-brand-pink border-brand-pink/40",
  ajio: "bg-brand-lavender/30 text-ink border-brand-lavender/60",
  blinkit: "bg-brand-ochre/25 text-brand-teal border-brand-ochre/50",
  zepto: "bg-brand-pink/10 text-brand-pink border-brand-pink/30",
  amazon: "bg-brand-peach/30 text-ink border-brand-peach/60",
  unknown: "bg-soft text-muted border-hairline",
};

const inr = (n: number) =>
  "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });

export default function StrikesPanel({
  events,
  monitors,
}: {
  events: Event[];
  monitors: Monitor[];
}) {
  const [strikes, setStrikes] = useState<ScoredStrike[]>([]);
  const [totals, setTotals] = useState<Totals | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [replay, setReplay] = useState<ReplayStrike | null>(null);
  const [filter, setFilter] = useState<string>("All");

  async function refresh() {
    try {
      const r = await fetch("/api/insights/strikes?days=30&limit=200").then((r) =>
        r.json()
      );
      setStrikes(r.strikes || []);
      setTotals(r.totals || null);
    } catch {
      // ignore
    } finally {
      setLoaded(true);
    }
  }

  useEffect(() => {
    refresh();
    // refresh when new events land so the table stays live
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events.length, monitors.length]);

  const platforms = useMemo(() => {
    return ["All", ...Array.from(new Set(strikes.map((s) => s.platform)))];
  }, [strikes]);
  const visible = strikes.filter((s) => filter === "All" || s.platform === filter);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <div className="text-[11px] uppercase tracking-[0.16em] text-muted font-semibold">
            Captured windows
          </div>
          <h2 className="font-display text-4xl tracking-display text-ink mt-1">
            Strikes
          </h2>
          <p className="text-sm text-muted mt-1.5">
            Every captured OOS window over the last 30 days. Click a row to
            replay.
          </p>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {platforms.map((p) => (
            <button
              key={p}
              onClick={() => setFilter(p)}
              className={`text-xs px-3.5 py-1.5 rounded-full transition capitalize ${
                filter === p
                  ? "bg-ink text-white"
                  : "bg-soft text-muted hover:text-ink"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Strikes" value={(totals?.strikes ?? 0).toString()} tone="neutral" />
        <Stat label="Live now" value={(totals?.live ?? 0).toString()} tone="danger" />
        <Stat
          label="Revenue captured"
          value={inr(totals?.revenue ?? 0)}
          tone="good"
        />
        <Stat
          label="Avg ROAS"
          value={(totals?.avg_roas ?? 0).toFixed(1) + "×"}
          tone="violet"
        />
      </div>

      <section className="rounded-clay bg-panel border border-hairline shadow-clay overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-[10px] uppercase tracking-[0.14em] text-muted bg-soft border-b border-hairline font-semibold">
              <tr>
                <th className="text-left px-5 py-3 font-medium">Competitor</th>
                <th className="text-left px-2 py-3 font-medium">Platform</th>
                <th className="text-left px-2 py-3 font-medium">Started</th>
                <th className="text-right px-2 py-3 font-medium">Window</th>
                <th className="text-right px-2 py-3 font-medium">Est. revenue</th>
                <th className="text-right px-2 py-3 font-medium">ROAS</th>
                <th className="text-right px-5 py-3 font-medium">Replay</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((s, i) => (
                <tr
                  key={`${s.monitor_id}-${i}-${s.started_at}`}
                  className="border-b border-hairline/60 hover:bg-soft/60 cursor-pointer transition"
                  onClick={() =>
                    setReplay({
                      monitorId: s.monitor_id,
                      competitor: s.label || s.url,
                      platform: s.platform,
                      startedAt: s.started_at,
                      durationMinutes: Math.max(1, Math.round(s.duration_seconds / 60)),
                    })
                  }
                >
                  <td className="px-5 py-3.5 max-w-[300px]">
                    <div className="font-medium text-ink truncate flex items-center gap-2">
                      {s.is_live && (
                        <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.14em] font-semibold text-white px-2 py-0.5 rounded-full bg-brand-coral shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                          Live
                        </span>
                      )}
                      {s.label || s.url}
                    </div>
                  </td>
                  <td className="px-2 py-3">
                    <span
                      className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded border ${platformBadge[s.platform] || platformBadge.unknown}`}
                    >
                      {s.platform}
                    </span>
                  </td>
                  <td className="px-2 py-3 text-xs text-muted">
                    {new Date(s.started_at).toLocaleString()}
                  </td>
                  <td className="px-2 py-3 text-right font-mono text-ink">
                    {s.duration_seconds < 60
                      ? `${s.duration_seconds}s`
                      : s.duration_seconds < 3600
                        ? `${Math.round(s.duration_seconds / 60)}m`
                        : `${(s.duration_seconds / 3600).toFixed(1)}h`}
                  </td>
                  <td className="px-2 py-3 text-right font-mono text-brand-teal">
                    {inr(s.est_revenue_inr)}
                  </td>
                  <td className="px-2 py-3 text-right font-mono text-ink">
                    {s.est_roas}×
                  </td>
                  <td className="px-5 py-3 text-right">
                    <span className="text-xs text-brand-teal hover:underline font-medium">
                      ▶ Replay
                    </span>
                  </td>
                </tr>
              ))}
              {loaded && visible.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-muted">
                    {strikes.length === 0
                      ? "No captured strike windows yet. They'll appear here as competitors go OOS."
                      : "No strikes match this filter."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {replay && (
        <StrikeReplay strike={replay} onClose={() => setReplay(null)} />
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "neutral" | "danger" | "good" | "violet";
}) {
  const cls =
    tone === "danger"
      ? "bg-brand-coral text-white"
      : tone === "good"
        ? "bg-brand-mint text-brand-teal"
        : tone === "violet"
          ? "bg-brand-lavender text-ink"
          : "bg-card text-ink";
  return (
    <div className={`rounded-clay px-5 py-4 shadow-clay ${cls}`}>
      <div className="text-[11px] uppercase tracking-[0.14em] font-semibold opacity-80">
        {label}
      </div>
      <div className="font-display text-3xl tracking-display mt-1.5">
        {value}
      </div>
    </div>
  );
}
