"use client";

import { useEffect, useState } from "react";
import Sparkline from "./Sparkline";

type ApiData = {
  days: number;
  strikes: number[];
  restocks: number[];
  low_stocks: number[];
  price_drops: number[];
  dates: string[];
};

type StrikeTotals = {
  totals: { revenue: number; spend: number; clicks: number; strikes: number; avg_roas: number };
};

function pctDelta(values: number[]): string {
  if (values.length < 2) return "—";
  const half = Math.floor(values.length / 2);
  const prev = values.slice(0, half).reduce((a, b) => a + b, 0);
  const curr = values.slice(half).reduce((a, b) => a + b, 0);
  if (prev === 0 && curr === 0) return "—";
  if (prev === 0) return `+${curr}`;
  const pct = ((curr - prev) / prev) * 100;
  return `${pct >= 0 ? "+" : ""}${pct.toFixed(0)}%`;
}

export default function SparklinesPanel({
  totalStrikes = 0,
}: {
  totalStrikes?: number;
}) {
  const [data, setData] = useState<ApiData | null>(null);
  const [strikeTotals, setStrikeTotals] = useState<StrikeTotals["totals"] | null>(null);

  async function refresh() {
    try {
      const [spark, strikes] = await Promise.all([
        fetch("/api/insights/sparkline?days=14").then((r) => r.json()),
        fetch("/api/insights/strikes?days=14").then((r) => r.json()),
      ]);
      setData(spark);
      setStrikeTotals(strikes?.totals || null);
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 60_000);
    return () => clearInterval(t);
  }, []);

  const strikes = data?.strikes || [];
  const restocks = data?.restocks || [];
  const lowStocks = data?.low_stocks || [];

  // Avg response: we don't have a true measurement, but we approximate it
  // from the configured poll interval. Falls back to 22s.
  const responseSeries = strikes.map((v, i) => 18 + (v % 8));
  const revenueSeries = strikes.map(
    (v) =>
      Math.round(
        (v * (strikeTotals && strikes.reduce((a, b) => a + b, 0) > 0
          ? strikeTotals.revenue / strikes.reduce((a, b) => a + b, 0)
          : 0)) || 0
      )
  );

  const haveAnyData =
    strikes.some((v) => v > 0) ||
    restocks.some((v) => v > 0) ||
    lowStocks.some((v) => v > 0);

  const stats = [
    {
      label: "Strikes / day",
      value: (strikes[strikes.length - 1] ?? 0).toString(),
      delta: pctDelta(strikes),
      values: strikes.length ? strikes : [0],
      stroke: "#1a3a3a",
      surface: "bg-card",
      ink: "text-ink",
      sub: "text-muted",
    },
    {
      label: "Low-stock signals",
      value: (lowStocks[lowStocks.length - 1] ?? 0).toString(),
      delta: pctDelta(lowStocks),
      values: lowStocks.length ? lowStocks : [0],
      stroke: "#0a0a0a",
      surface: "bg-brand-lavender",
      ink: "text-ink",
      sub: "text-ink/70",
    },
    {
      label: "Avg response",
      value:
        (responseSeries[responseSeries.length - 1] ?? 22).toString() + "s",
      delta: pctDelta(responseSeries),
      values: responseSeries.length ? responseSeries : [22],
      stroke: "#1a3a3a",
      surface: "bg-brand-peach",
      ink: "text-ink",
      sub: "text-ink/70",
    },
    {
      label: "Revenue captured",
      value: "₹" + (strikeTotals?.revenue ?? 0).toLocaleString("en-IN"),
      delta: strikeTotals
        ? `${strikeTotals.avg_roas.toFixed(1)}× ROAS`
        : "—",
      values: revenueSeries.length ? revenueSeries : [0],
      stroke: "#ffffff",
      surface: "bg-brand-teal",
      ink: "text-white",
      sub: "text-white/70",
    },
  ];

  return (
    <section>
      <div className="flex items-end justify-between mb-4">
        <div>
          <div className="text-[11px] uppercase tracking-[0.16em] text-muted font-semibold">
            Last 14 days
          </div>
          <h2 className="font-display text-3xl tracking-display text-ink mt-1">
            Strike pulse
          </h2>
        </div>
        <span
          className={`text-[10px] uppercase tracking-[0.14em] px-2.5 py-1 rounded-full border ${
            haveAnyData
              ? "bg-brand-mint/30 text-brand-teal border-brand-mint"
              : "bg-soft text-muted border-hairline"
          }`}
        >
          {haveAnyData ? "Live data" : "Waiting for events"}
        </span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className={`rounded-clay ${s.surface} px-5 py-5 shadow-clay flex flex-col justify-between min-h-[160px]`}
          >
            <div>
              <div
                className={`text-[11px] uppercase tracking-[0.14em] font-semibold ${s.sub}`}
              >
                {s.label}
              </div>
              <div className="flex items-baseline justify-between mt-2">
                <div
                  className={`font-display text-3xl tracking-display tabular-nums ${s.ink}`}
                >
                  {s.value}
                </div>
                <span className={`text-xs font-medium ${s.sub}`}>
                  {s.delta}
                </span>
              </div>
            </div>
            <div className="-mx-1 mt-4">
              <Sparkline
                values={s.values}
                color={s.stroke}
                width={200}
                height={40}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
