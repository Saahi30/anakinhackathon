"use client";

import { useEffect, useMemo, useState } from "react";

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function cellColor(v: number, max: number) {
  if (v === 0) return "bg-soft border-hairline";
  const ratio = max > 0 ? v / max : 0;
  if (ratio <= 0.2) return "bg-brand-coral/15 border-brand-coral/25";
  if (ratio <= 0.4) return "bg-brand-coral/30 border-brand-coral/35";
  if (ratio <= 0.6) return "bg-brand-coral/50 border-brand-coral/45";
  if (ratio <= 0.8) return "bg-brand-coral/70 border-brand-coral/55";
  return "bg-brand-coral border-brand-coral";
}

export default function OOSHeatmap({
  title = "OOS frequency heatmap",
  days = 30,
}: {
  title?: string;
  days?: number;
}) {
  const [grid, setGrid] = useState<number[][] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/insights/heatmap?days=${days}`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        if (Array.isArray(d?.grid)) setGrid(d.grid);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [days]);

  const { max, peakDay, peakHour, total } = useMemo(() => {
    if (!grid) return { max: 0, peakDay: 0, peakHour: 0, total: 0 };
    let max = 0;
    let peakDay = 0;
    let peakHour = 0;
    let total = 0;
    for (let d = 0; d < 7; d++) {
      for (let h = 0; h < 24; h++) {
        total += grid[d][h];
        if (grid[d][h] > max) {
          max = grid[d][h];
          peakDay = d;
          peakHour = h;
        }
      }
    }
    return { max, peakDay, peakHour, total };
  }, [grid]);

  return (
    <section className="rounded-clay bg-panel border border-hairline shadow-clay overflow-hidden">
      <div className="px-5 py-3 border-b border-hairline flex items-center justify-between bg-soft">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-muted">
            {title}
          </h3>
          <div className="text-[10px] text-muted mt-0.5">
            Last {days} days · {total} strike{total === 1 ? "" : "s"}
          </div>
        </div>
        <span
          className={`text-[10px] px-1.5 py-0.5 rounded border ${
            total > 0
              ? "border-brand-teal/40 text-brand-teal bg-brand-mint/30"
              : "border-hairline text-muted bg-canvas"
          }`}
        >
          {total > 0 ? "Live" : "No data yet"}
        </span>
      </div>
      <div className="p-5">
        <div className="text-xs text-muted mb-3">
          Strikes captured per (day × hour) over the last {days} days.{" "}
          {max > 0 ? (
            <>
              Peak:{" "}
              <span className="text-brand-coral font-medium">
                {DAYS[peakDay]} {String(peakHour).padStart(2, "0")}:00
              </span>
            </>
          ) : (
            "Waiting for strikes."
          )}
        </div>

        <div className="overflow-x-auto">
          <div className="inline-block min-w-full">
            <div className="flex items-center pl-10">
              {HOURS.map((h) => (
                <div
                  key={h}
                  className="w-5 text-center text-[9px] text-muted"
                >
                  {h % 3 === 0 ? h : ""}
                </div>
              ))}
            </div>

            <div className="space-y-0.5 mt-1">
              {DAYS.map((dayLabel, d) => (
                <div key={d} className="flex items-center">
                  <div className="w-10 text-xs text-muted">{dayLabel}</div>
                  {HOURS.map((h) => {
                    const v = grid ? grid[d][h] : 0;
                    return (
                      <div
                        key={h}
                        title={`${dayLabel} ${String(h).padStart(2, "0")}:00 — ${v} strike${v === 1 ? "" : "s"}`}
                        className={`w-5 h-5 mx-px rounded border ${cellColor(v, max)}`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-end gap-2 text-[10px] text-muted">
          <span>fewer</span>
          {[0, 0.2, 0.4, 0.6, 0.8, 1].map((r) => (
            <div
              key={r}
              className={`w-4 h-4 rounded border ${cellColor(Math.round(r * max), max)}`}
            />
          ))}
          <span>more</span>
        </div>
      </div>
    </section>
  );
}
