"use client";

import Sparkline from "./Sparkline";

function seedSeries(seed: number, n: number, base: number, vol: number): number[] {
  const out: number[] = [];
  let v = base;
  for (let i = 0; i < n; i++) {
    const x = Math.sin(seed * (i + 1)) * 10000;
    const r = Math.abs(x - Math.floor(x)) - 0.5;
    v = Math.max(0, v + r * vol + base * 0.02);
    out.push(Math.round(v));
  }
  return out;
}

export default function SparklinesPanel({
  totalStrikes = 0,
}: {
  totalStrikes?: number;
}) {
  const strikesSeries = seedSeries(7, 14, 4 + totalStrikes / 4, 4);
  const captureSeries = seedSeries(11, 14, 65, 18).map((v) => Math.min(98, v));
  const responseSeries = seedSeries(13, 14, 22, 10).map((v) => Math.max(6, v));
  const revenueSeries = seedSeries(17, 14, 9000, 5500);

  const stats = [
    {
      label: "Strikes / day",
      value: strikesSeries[strikesSeries.length - 1].toString(),
      delta: "+18%",
      tone: "good" as const,
      values: strikesSeries,
      color: "#10b981",
    },
    {
      label: "Capture rate",
      value: captureSeries[captureSeries.length - 1] + "%",
      delta: "+4.2%",
      tone: "good" as const,
      values: captureSeries,
      color: "#a78bfa",
    },
    {
      label: "Avg response",
      value: responseSeries[responseSeries.length - 1] + "s",
      delta: "−3s",
      tone: "good" as const,
      values: responseSeries,
      color: "#f59e0b",
    },
    {
      label: "Revenue captured",
      value:
        "₹" +
        (revenueSeries[revenueSeries.length - 1] * 7).toLocaleString("en-IN"),
      delta: "+₹12.4k",
      tone: "good" as const,
      values: revenueSeries,
      color: "#22d3ee",
    },
  ];

  return (
    <section className="rounded-xl border border-border bg-panel">
      <div className="px-5 py-3 border-b border-border flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
          Last 14 days
        </h2>
        <span className="text-[10px] px-1.5 py-0.5 rounded border border-violet-500/30 text-violet-300">
          MOCKED
        </span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4">
        {stats.map((s, i) => (
          <div
            key={s.label}
            className={`px-5 py-4 ${i < stats.length - 1 ? "md:border-r md:border-border" : ""} ${i % 2 === 0 ? "border-r border-border md:border-r" : ""} ${i < 2 ? "border-b border-border md:border-b-0" : ""}`}
          >
            <div className="text-xs text-muted">{s.label}</div>
            <div className="flex items-baseline justify-between mt-1">
              <div className="text-2xl font-semibold tabular-nums">
                {s.value}
              </div>
              <span className="text-xs text-accent">{s.delta}</span>
            </div>
            <div className="mt-2">
              <Sparkline
                values={s.values}
                color={s.color}
                width={160}
                height={36}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
