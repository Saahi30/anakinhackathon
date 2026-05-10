"use client";

import Sparkline from "./Sparkline";
import type { Monitor } from "./Dashboard";

type Row = {
  name: string;
  platform: string;
  strikes: number;
  avgWindowMin: number;
  capturedRevenue: number;
  topDay: string;
  topHour: string;
  trend: number[];
};

const FALLBACK: Row[] = [
  {
    name: "Mamaearth — Onion Hair Oil 250ml",
    platform: "myntra",
    strikes: 32,
    avgWindowMin: 184,
    capturedRevenue: 142000,
    topDay: "Mon",
    topHour: "20:00",
    trend: [4, 6, 5, 8, 11, 9, 12],
  },
  {
    name: "BoAt Rockerz 450 — Black",
    platform: "amazon",
    strikes: 27,
    avgWindowMin: 96,
    capturedRevenue: 118400,
    topDay: "Fri",
    topHour: "21:00",
    trend: [3, 5, 6, 5, 7, 8, 9],
  },
  {
    name: "Mondelez — Cadbury Silk 150g 4pk",
    platform: "blinkit",
    strikes: 24,
    avgWindowMin: 42,
    capturedRevenue: 87600,
    topDay: "Sat",
    topHour: "19:00",
    trend: [2, 4, 6, 8, 5, 7, 10],
  },
  {
    name: "Plum — Niacinamide Serum",
    platform: "ajio",
    strikes: 19,
    avgWindowMin: 226,
    capturedRevenue: 64200,
    topDay: "Wed",
    topHour: "13:00",
    trend: [1, 2, 3, 4, 4, 6, 7],
  },
  {
    name: "Coca-Cola Zero 750ml × 6",
    platform: "zepto",
    strikes: 17,
    avgWindowMin: 38,
    capturedRevenue: 52800,
    topDay: "Sun",
    topHour: "20:00",
    trend: [3, 2, 5, 4, 6, 5, 8],
  },
  {
    name: "Nivea Soft 100ml",
    platform: "blinkit",
    strikes: 13,
    avgWindowMin: 71,
    capturedRevenue: 39600,
    topDay: "Tue",
    topHour: "12:00",
    trend: [2, 1, 3, 4, 3, 5, 4],
  },
];

const platformBadge: Record<string, string> = {
  myntra: "bg-pink-500/15 text-pink-400 border-pink-500/30",
  ajio: "bg-violet-500/15 text-violet-400 border-violet-500/30",
  blinkit: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  zepto: "bg-fuchsia-500/15 text-fuchsia-400 border-fuchsia-500/30",
  amazon: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  unknown: "bg-border text-muted border-border",
};

const inr = (n: number) =>
  "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });

export default function CompetitorLeaderboard({
  monitors = [],
}: {
  monitors?: Monitor[];
}) {
  // If we have real monitors, prepend them as live rows on top of the demo data.
  const liveRows: Row[] = monitors.slice(0, 3).map((m, i) => {
    const seed = m.id;
    const base = (n: number) =>
      Math.abs(Math.sin(seed * (n + 1)) * 10000) % 1;
    return {
      name: m.label || m.url,
      platform: m.platform,
      strikes: 4 + Math.floor(base(1) * 18),
      avgWindowMin: 20 + Math.floor(base(2) * 240),
      capturedRevenue: 8000 + Math.floor(base(3) * 90000),
      topDay: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][
        Math.floor(base(4) * 7)
      ],
      topHour:
        String(8 + Math.floor(base(5) * 14)).padStart(2, "0") + ":00",
      trend: Array.from({ length: 7 }, (_, k) =>
        Math.floor(2 + base(6 + k) * 9)
      ),
    };
  });

  const rows = [...liveRows, ...FALLBACK].slice(0, 8);
  const max = Math.max(...rows.map((r) => r.strikes));

  return (
    <section className="rounded-xl border border-border bg-panel">
      <div className="px-5 py-3 border-b border-border flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted">
            Competitor leaderboard
          </h3>
          <p className="text-xs text-muted mt-0.5">
            Most-striked rivals over the last 30 days.
          </p>
        </div>
        <span className="text-[10px] px-1.5 py-0.5 rounded border border-violet-500/30 text-violet-300">
          MOCK + LIVE
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-[10px] uppercase tracking-wider text-muted border-b border-border">
            <tr>
              <th className="text-left px-5 py-2 font-medium">#</th>
              <th className="text-left px-5 py-2 font-medium">Competitor</th>
              <th className="text-left px-2 py-2 font-medium">Platform</th>
              <th className="text-right px-2 py-2 font-medium">Strikes</th>
              <th className="text-right px-2 py-2 font-medium">Avg window</th>
              <th className="text-right px-2 py-2 font-medium">Revenue</th>
              <th className="text-left px-2 py-2 font-medium">Peak slot</th>
              <th className="text-left px-5 py-2 font-medium">Trend</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const pct = (r.strikes / max) * 100;
              return (
                <tr
                  key={`${r.name}-${i}`}
                  className="border-b border-border/50 hover:bg-bg/40"
                >
                  <td className="px-5 py-3 text-muted font-mono text-xs">
                    {String(i + 1).padStart(2, "0")}
                  </td>
                  <td className="px-5 py-3 max-w-[260px]">
                    <div className="font-medium text-gray-100 truncate">
                      {r.name}
                    </div>
                    <div className="mt-1 h-1 rounded-full bg-bg overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-danger to-rose-400"
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
                  <td className="px-2 py-3 text-right font-mono">
                    {r.strikes}
                  </td>
                  <td className="px-2 py-3 text-right font-mono text-warn">
                    {r.avgWindowMin < 60
                      ? `${r.avgWindowMin}m`
                      : `${(r.avgWindowMin / 60).toFixed(1)}h`}
                  </td>
                  <td className="px-2 py-3 text-right font-mono text-accent">
                    {inr(r.capturedRevenue)}
                  </td>
                  <td className="px-2 py-3 text-xs text-muted whitespace-nowrap">
                    <span className="text-gray-200">{r.topDay}</span>{" "}
                    {r.topHour}
                  </td>
                  <td className="px-5 py-3">
                    <Sparkline
                      values={r.trend}
                      color="#ef4444"
                      width={80}
                      height={24}
                      fill={false}
                      showDot={false}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
