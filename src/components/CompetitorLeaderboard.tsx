"use client";

import { useEffect, useState } from "react";
import Sparkline from "./Sparkline";
import type { Monitor } from "./Dashboard";

type Row = {
  monitor_id: number;
  label: string | null;
  platform: string;
  url: string;
  strikes: number;
  avg_window_seconds: number;
  last_strike_at: string | null;
  trend: number[];
};

const platformBadge: Record<string, string> = {
  myntra: "bg-brand-pink/15 text-brand-pink border-brand-pink/40",
  ajio: "bg-brand-lavender/30 text-ink border-brand-lavender/60",
  blinkit: "bg-brand-ochre/25 text-brand-teal border-brand-ochre/50",
  zepto: "bg-brand-pink/10 text-brand-pink border-brand-pink/30",
  amazon: "bg-brand-peach/30 text-ink border-brand-peach/60",
  unknown: "bg-soft text-muted border-hairline",
};

function fmtWindow(sec: number) {
  if (sec === 0) return "—";
  if (sec < 60) return `${sec}s`;
  const min = Math.round(sec / 60);
  if (min < 60) return `${min}m`;
  return `${(min / 60).toFixed(1)}h`;
}

function fmtAgo(iso: string | null): string {
  if (!iso) return "—";
  const sec = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (sec < 60) return `${sec}s ago`;
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  return `${Math.floor(sec / 86400)}d ago`;
}

export default function CompetitorLeaderboard({
  monitors = [],
}: {
  monitors?: Monitor[];
}) {
  const [rows, setRows] = useState<Row[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/insights/leaderboard?days=30&limit=10")
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        if (Array.isArray(d?.rows)) setRows(d.rows);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [monitors.length]);

  const max =
    rows && rows.length ? Math.max(...rows.map((r) => r.strikes), 1) : 1;

  return (
    <section className="rounded-clay bg-panel border border-hairline shadow-clay overflow-hidden">
      <div className="px-5 py-3 border-b border-hairline flex items-center justify-between bg-soft">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-muted">
            Competitor leaderboard
          </h3>
          <p className="text-xs text-muted mt-0.5">
            Most-striked rivals over the last 30 days.
          </p>
        </div>
        <span
          className={`text-[10px] px-1.5 py-0.5 rounded border ${
            rows && rows.length
              ? "border-brand-teal/40 text-brand-teal bg-brand-mint/30"
              : "border-hairline text-muted bg-canvas"
          }`}
        >
          {rows === null
            ? "Loading…"
            : rows.length === 0
              ? "No data yet"
              : "Live"}
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-[10px] uppercase tracking-[0.14em] text-muted border-b border-hairline">
            <tr>
              <th className="text-left px-5 py-2 font-medium">#</th>
              <th className="text-left px-5 py-2 font-medium">Competitor</th>
              <th className="text-left px-2 py-2 font-medium">Platform</th>
              <th className="text-right px-2 py-2 font-medium">Strikes</th>
              <th className="text-right px-2 py-2 font-medium">Avg window</th>
              <th className="text-left px-2 py-2 font-medium">Last</th>
              <th className="text-left px-5 py-2 font-medium">7-day trend</th>
            </tr>
          </thead>
          <tbody>
            {(rows || []).map((r, i) => {
              const pct = (r.strikes / max) * 100;
              return (
                <tr
                  key={`${r.monitor_id}-${i}`}
                  className="border-b border-hairline/60 hover:bg-soft/60"
                >
                  <td className="px-5 py-3 text-muted font-mono text-xs">
                    {String(i + 1).padStart(2, "0")}
                  </td>
                  <td className="px-5 py-3 max-w-[260px]">
                    <div className="font-medium text-ink truncate">
                      {r.label || r.url}
                    </div>
                    <div className="mt-1 h-1 rounded-full bg-soft overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-brand-coral to-rose-400"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </td>
                  <td className="px-2 py-3">
                    <span
                      className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded border ${platformBadge[r.platform] || platformBadge.unknown}`}
                    >
                      {r.platform}
                    </span>
                  </td>
                  <td className="px-2 py-3 text-right font-mono text-ink">
                    {r.strikes}
                  </td>
                  <td className="px-2 py-3 text-right font-mono text-warn">
                    {fmtWindow(r.avg_window_seconds)}
                  </td>
                  <td className="px-2 py-3 text-xs text-muted whitespace-nowrap">
                    {fmtAgo(r.last_strike_at)}
                  </td>
                  <td className="px-5 py-3">
                    <Sparkline
                      values={r.trend && r.trend.length ? r.trend : [0]}
                      color="#c14a4a"
                      width={80}
                      height={24}
                      fill={false}
                      showDot={false}
                    />
                  </td>
                </tr>
              );
            })}
            {rows !== null && rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center text-muted text-sm">
                  No competitor strikes captured yet. Add monitors and watch
                  this fill up.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
