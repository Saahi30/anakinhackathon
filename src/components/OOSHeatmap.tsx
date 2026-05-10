"use client";

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function generateGrid(seed: number): number[][] {
  const grid: number[][] = [];
  for (let d = 0; d < 7; d++) {
    const row: number[] = [];
    for (let h = 0; h < 24; h++) {
      const x = Math.sin(seed * (d + 1) * (h + 1)) * 10000;
      const noise = Math.abs(x - Math.floor(x));
      let bias = 0;
      // Lunch / dinner peaks → quick-commerce OOS spikes
      if (h >= 12 && h <= 14) bias += 0.4;
      if (h >= 19 && h <= 22) bias += 0.55;
      // Weekend evenings strongest
      if (d >= 5 && h >= 18) bias += 0.3;
      // Late night near zero
      if (h >= 1 && h <= 6) bias -= 0.4;
      const val = Math.max(0, Math.min(1, noise * 0.5 + bias));
      row.push(Math.round(val * 9));
    }
    grid.push(row);
  }
  return grid;
}

function cellColor(v: number) {
  if (v === 0) return "bg-bg/40 border-border";
  if (v <= 2) return "bg-danger/10 border-danger/20";
  if (v <= 4) return "bg-danger/25 border-danger/30";
  if (v <= 6) return "bg-danger/45 border-danger/40";
  if (v <= 8) return "bg-danger/65 border-danger/50";
  return "bg-danger/85 border-danger/60";
}

export default function OOSHeatmap({
  seed = 7,
  title = "OOS frequency heatmap",
}: {
  seed?: number;
  title?: string;
}) {
  const grid = generateGrid(seed);
  const max = Math.max(...grid.flat());

  // Find peak slot
  let peakDay = 0,
    peakHour = 0;
  for (let d = 0; d < 7; d++)
    for (let h = 0; h < 24; h++)
      if (grid[d][h] === max) {
        peakDay = d;
        peakHour = h;
      }

  return (
    <section className="rounded-xl border border-border bg-panel">
      <div className="px-5 py-3 border-b border-border flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted">
          {title}
        </h3>
        <span className="text-[10px] px-1.5 py-0.5 rounded border border-violet-500/30 text-violet-300">
          MOCKED
        </span>
      </div>
      <div className="p-5">
        <div className="text-xs text-muted mb-3">
          Strikes captured per (day × hour) over last 30 days. Peak:{" "}
          <span className="text-danger font-medium">
            {DAYS[peakDay]} {String(peakHour).padStart(2, "0")}:00
          </span>
        </div>

        <div className="overflow-x-auto">
          <div className="inline-block min-w-full">
            {/* Hour axis */}
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

            {/* Grid rows */}
            <div className="space-y-0.5 mt-1">
              {grid.map((row, d) => (
                <div key={d} className="flex items-center">
                  <div className="w-10 text-xs text-muted">{DAYS[d]}</div>
                  {row.map((v, h) => (
                    <div
                      key={h}
                      title={`${DAYS[d]} ${String(h).padStart(2, "0")}:00 — ${v} strikes`}
                      className={`w-5 h-5 mx-px rounded border ${cellColor(v)}`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-end gap-2 text-[10px] text-muted">
          <span>fewer</span>
          {[0, 2, 4, 6, 8, 9].map((v) => (
            <div
              key={v}
              className={`w-4 h-4 rounded border ${cellColor(v)}`}
            />
          ))}
          <span>more</span>
        </div>
      </div>
    </section>
  );
}
