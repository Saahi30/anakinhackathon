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
  myntra: "bg-pink-500/15 text-pink-400 border-pink-500/30",
  ajio: "bg-violet-500/15 text-violet-400 border-violet-500/30",
  blinkit: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  zepto: "bg-fuchsia-500/15 text-fuchsia-400 border-fuchsia-500/30",
  amazon: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  unknown: "bg-border text-muted border-border",
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
          <h2 className="text-2xl font-semibold">Strikes</h2>
          <p className="text-sm text-muted mt-0.5">
            Every captured OOS window. Click any row to replay.
          </p>
        </div>
        <div className="flex items-center gap-1 flex-wrap">
          {platforms.map((p) => (
            <button
              key={p}
              onClick={() => setFilter(p)}
              className={`text-xs px-3 py-1.5 rounded-full transition capitalize ${
                filter === p
                  ? "bg-accent/15 text-accent border border-accent/40"
                  : "border border-border text-muted hover:text-gray-200"
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

      <section className="rounded-xl border border-border bg-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-[10px] uppercase tracking-wider text-muted border-b border-border">
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
                    className="border-b border-border/50 hover:bg-bg/40 cursor-pointer"
                    onClick={() => setReplay(s)}
                  >
                    <td className="px-5 py-3 max-w-[300px]">
                      <div className="font-medium text-gray-100 truncate flex items-center gap-2">
                        {s.isLive && (
                          <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-danger px-1.5 py-0.5 rounded border border-danger/40 bg-danger/10 shrink-0">
                            <span className="w-1.5 h-1.5 rounded-full bg-danger animate-pulse" />
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
                    <td className="px-2 py-3 text-right font-mono">
                      {s.durationMinutes < 60
                        ? `${s.durationMinutes}m`
                        : `${(s.durationMinutes / 60).toFixed(1)}h`}
                    </td>
                    <td className="px-2 py-3 text-right font-mono text-accent">
                      {inr(roi.revenue)}
                    </td>
                    <td className="px-2 py-3 text-right font-mono text-violet-300">
                      {roi.roas}×
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span className="text-xs text-violet-300 hover:underline">
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
      ? "text-danger border-danger/30 bg-danger/5"
      : tone === "good"
        ? "text-accent border-accent/30 bg-accent/5"
        : tone === "violet"
          ? "text-violet-300 border-violet-400/30 bg-violet-400/5"
          : "text-gray-100 border-border bg-panel";
  return (
    <div className={`rounded-lg border px-4 py-3 ${cls}`}>
      <div className="text-xs uppercase tracking-wide opacity-70">{label}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
    </div>
  );
}
