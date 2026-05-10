"use client";

import { useMemo, useState } from "react";
import StrikeReplay, { type ReplayStrike } from "./StrikeReplay";
import StrikeROI, { mockROI } from "./StrikeROI";
import type { Event, Monitor } from "./Dashboard";

type StrikeRow = {
  monitorId: number;
  competitor: string;
  platform: string;
  startedAt: string;
  durationMinutes: number;
  isLive: boolean;
};

const platformBadge: Record<string, string> = {
  myntra: "bg-brand-pink/15 text-brand-pink border-brand-pink/40",
  ajio: "bg-brand-lavender/30 text-ink border-brand-lavender/60",
  blinkit: "bg-brand-ochre/25 text-brand-teal border-brand-ochre/50",
  zepto: "bg-brand-pink/10 text-brand-pink border-brand-pink/30",
  amazon: "bg-brand-peach/30 text-ink border-brand-peach/60",
  unknown: "bg-soft text-muted border-hairline",
};

const FALLBACK_STRIKES: StrikeRow[] = [
  {
    monitorId: 9001,
    competitor: "Mamaearth — Onion Hair Oil 250ml",
    platform: "myntra",
    startedAt: new Date(Date.now() - 2 * 86400 * 1000).toISOString(),
    durationMinutes: 184,
    isLive: false,
  },
  {
    monitorId: 9002,
    competitor: "BoAt Rockerz 450 — Black",
    platform: "amazon",
    startedAt: new Date(Date.now() - 3 * 86400 * 1000 - 4 * 3600 * 1000).toISOString(),
    durationMinutes: 96,
    isLive: false,
  },
  {
    monitorId: 9003,
    competitor: "Cadbury Silk 150g 4pk",
    platform: "blinkit",
    startedAt: new Date(Date.now() - 4 * 86400 * 1000).toISOString(),
    durationMinutes: 42,
    isLive: false,
  },
  {
    monitorId: 9004,
    competitor: "Plum Niacinamide Serum",
    platform: "ajio",
    startedAt: new Date(Date.now() - 6 * 86400 * 1000).toISOString(),
    durationMinutes: 226,
    isLive: false,
  },
  {
    monitorId: 9005,
    competitor: "Coca-Cola Zero 750ml × 6",
    platform: "zepto",
    startedAt: new Date(Date.now() - 7 * 86400 * 1000).toISOString(),
    durationMinutes: 38,
    isLive: false,
  },
];

const inr = (n: number) =>
  "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });

export default function StrikesPanel({
  events,
  monitors,
}: {
  events: Event[];
  monitors: Monitor[];
}) {
  const [replay, setReplay] = useState<ReplayStrike | null>(null);
  const [filter, setFilter] = useState<string>("All");

  // Build live strikes from events: each oos_detected becomes a row.
  const liveStrikes = useMemo<StrikeRow[]>(() => {
    return events
      .filter((e) => e.kind === "oos_detected")
      .map((e) => {
        const m = monitors.find((x) => x.id === e.monitor_id);
        const start = new Date(
          e.created_at + (e.created_at.endsWith("Z") ? "" : "Z")
        ).getTime();
        const restock = monitors
          .filter((x) => x.id === e.monitor_id && x.last_back_in_stock_at)
          .map((x) =>
            new Date(
              x.last_back_in_stock_at! +
                (x.last_back_in_stock_at!.endsWith("Z") ? "" : "Z")
            ).getTime()
          )[0];
        const isLive = m?.last_status === "out_of_stock";
        const ended = restock && restock > start ? restock : Date.now();
        const durationMinutes = Math.max(
          1,
          Math.floor((ended - start) / 60000)
        );
        return {
          monitorId: e.monitor_id,
          competitor:
            e.monitor_label ||
            m?.label ||
            m?.url ||
            `Monitor #${e.monitor_id}`,
          platform: e.monitor_platform || m?.platform || "unknown",
          startedAt: e.created_at,
          durationMinutes: isLive ? Math.max(1, durationMinutes) : durationMinutes,
          isLive,
        };
      });
  }, [events, monitors]);

  const all = [...liveStrikes, ...FALLBACK_STRIKES];
  const platforms = ["All", ...Array.from(new Set(all.map((s) => s.platform)))];
  const visible = all.filter((s) => filter === "All" || s.platform === filter);

  const totalRevenue = visible.reduce(
    (sum, s) => sum + mockROI(s.monitorId).revenue,
    0
  );
  const totalClicks = visible.reduce(
    (sum, s) => sum + mockROI(s.monitorId).clicks,
    0
  );
  const avgRoas =
    visible.reduce((sum, s) => sum + mockROI(s.monitorId).roas, 0) /
    Math.max(1, visible.length);

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
            Every captured OOS window. Click any row to replay.
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
        <Stat label="Strikes" value={visible.length.toString()} tone="neutral" />
        <Stat label="Live now" value={visible.filter((s) => s.isLive).length.toString()} tone="danger" />
        <Stat label="Revenue captured" value={inr(totalRevenue)} tone="good" />
        <Stat label="Avg ROAS" value={avgRoas.toFixed(1) + "×"} tone="violet" />
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
                <th className="text-right px-2 py-3 font-medium">Captured</th>
                <th className="text-right px-2 py-3 font-medium">ROAS</th>
                <th className="text-right px-5 py-3 font-medium">Replay</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((s, i) => {
                const roi = mockROI(s.monitorId);
                return (
                  <tr
                    key={`${s.monitorId}-${i}`}
                    className="border-b border-hairline/60 hover:bg-soft/60 cursor-pointer transition"
                    onClick={() => setReplay(s)}
                  >
                    <td className="px-5 py-3.5 max-w-[300px]">
                      <div className="font-medium text-ink truncate flex items-center gap-2">
                        {s.isLive && (
                          <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.14em] font-semibold text-white px-2 py-0.5 rounded-full bg-brand-coral shrink-0">
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                            Live
                          </span>
                        )}
                        {s.competitor}
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
                      {new Date(s.startedAt).toLocaleString()}
                    </td>
                    <td className="px-2 py-3 text-right font-mono text-ink">
                      {s.durationMinutes < 60
                        ? `${s.durationMinutes}m`
                        : `${(s.durationMinutes / 60).toFixed(1)}h`}
                    </td>
                    <td className="px-2 py-3 text-right font-mono text-brand-teal">
                      {inr(roi.revenue)}
                    </td>
                    <td className="px-2 py-3 text-right font-mono text-ink">
                      {roi.roas}×
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span className="text-xs text-brand-teal hover:underline font-medium">
                        ▶ Replay
                      </span>
                    </td>
                  </tr>
                );
              })}
              {!visible.length && (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-muted">
                    No strikes match this filter yet.
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
