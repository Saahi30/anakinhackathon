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
      values: strikesSeries,
      stroke: "#1a3a3a",
      surface: "bg-card",
      ink: "text-ink",
      sub: "text-muted",
    },
    {
      label: "Capture rate",
      value: captureSeries[captureSeries.length - 1] + "%",
      delta: "+4.2%",
      values: captureSeries,
      stroke: "#0a0a0a",
      surface: "bg-brand-lavender",
      ink: "text-ink",
      sub: "text-ink/70",
    },
    {
      label: "Avg response",
      value: responseSeries[responseSeries.length - 1] + "s",
      delta: "−3s",
      values: responseSeries,
      stroke: "#1a3a3a",
      surface: "bg-brand-peach",
      ink: "text-ink",
      sub: "text-ink/70",
    },
    {
      label: "Revenue captured",
      value:
        "₹" +
        (revenueSeries[revenueSeries.length - 1] * 7).toLocaleString("en-IN"),
      delta: "+₹12.4k",
      values: revenueSeries,
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
        <span className="text-[10px] uppercase tracking-[0.14em] px-2.5 py-1 rounded-full bg-soft text-muted border border-hairline">
          Mocked
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
