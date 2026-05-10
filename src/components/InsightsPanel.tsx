"use client";

import OOSHeatmap from "./OOSHeatmap";
import GeoMap from "./GeoMap";
import CompetitorLeaderboard from "./CompetitorLeaderboard";
import type { Monitor } from "./Dashboard";

export default function InsightsPanel({
  monitors,
}: {
  monitors: Monitor[];
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Insights</h2>
        <p className="text-sm text-muted mt-0.5">
          Patterns across competitors, platforms, and time.
        </p>
      </div>

      <CompetitorLeaderboard monitors={monitors} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <OOSHeatmap />
        <GeoMap />
      </div>

      <section className="rounded-xl border border-border bg-gradient-to-br from-violet-500/5 to-transparent p-5">
        <div className="text-[10px] uppercase tracking-wider text-violet-300 font-semibold">
          AI-generated narrative · weekly digest preview
        </div>
        <p className="text-sm text-gray-200 mt-2 leading-relaxed max-w-3xl">
          Your top rival{" "}
          <span className="text-gray-100 font-medium">
            Mamaearth Onion Hair Oil
          </span>{" "}
          went OOS{" "}
          <span className="text-danger font-mono">32 times</span> in the last 30
          days, mostly on{" "}
          <span className="text-gray-100">Monday evenings 7–10pm</span>. The
          quick-commerce hot zone is{" "}
          <span className="text-gray-100">Mumbai</span> followed by Delhi NCR —
          Blinkit accounts for{" "}
          <span className="text-gray-100">62%</span> of strikes captured. Total
          attributed revenue this week:{" "}
          <span className="text-accent font-mono font-semibold">
            ₹68,420
          </span>{" "}
          at <span className="text-violet-300 font-mono">5.4× ROAS</span>.
        </p>
      </section>
    </div>
  );
}
