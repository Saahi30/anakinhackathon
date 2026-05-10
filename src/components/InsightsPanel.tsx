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
    <div className="space-y-8">
      <div>
        <div className="text-[11px] uppercase tracking-[0.16em] text-muted font-semibold">
          Patterns
        </div>
        <h2 className="font-display text-4xl tracking-display text-ink mt-1">
          Insights
        </h2>
        <p className="text-sm text-muted mt-1.5">
          Patterns across competitors, platforms, and time.
        </p>
      </div>

      <CompetitorLeaderboard monitors={monitors} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <OOSHeatmap />
        <GeoMap />
      </div>

      <section className="rounded-clay bg-brand-lavender p-8 shadow-clay">
        <div className="text-[11px] uppercase tracking-[0.16em] text-ink/70 font-semibold">
          AI-generated narrative · weekly digest preview
        </div>
        <p className="font-display text-2xl tracking-tightish text-ink mt-3 leading-snug max-w-3xl">
          Your top rival{" "}
          <span className="font-semibold">Mamaearth Onion Hair Oil</span> went
          OOS <span className="text-brand-coral">32 times</span> in the last 30
          days, mostly on{" "}
          <span className="font-semibold">Monday evenings 7–10pm</span>. The
          quick-commerce hot zone is <span className="font-semibold">Mumbai</span>{" "}
          followed by Delhi NCR — Blinkit accounts for{" "}
          <span className="font-semibold">62%</span> of strikes captured. Total
          attributed revenue this week:{" "}
          <span className="text-brand-teal font-semibold">₹68,420</span> at{" "}
          <span className="font-semibold">5.4× ROAS</span>.
        </p>
      </section>
    </div>
  );
}
