"use client";

import { useEffect, useState } from "react";
import OOSHeatmap from "./OOSHeatmap";
import GeoMap from "./GeoMap";
import CompetitorLeaderboard from "./CompetitorLeaderboard";
import type { Monitor } from "./Dashboard";

type Narrative = {
  narrative: string;
  generated: boolean;
  facts?: any;
};

export default function InsightsPanel({
  monitors,
}: {
  monitors: Monitor[];
}) {
  const [narrative, setNarrative] = useState<Narrative | null>(null);
  const [loading, setLoading] = useState(false);

  async function refresh() {
    setLoading(true);
    try {
      const r = await fetch("/api/insights/narrative").then((r) => r.json());
      setNarrative(r);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
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
        <button
          onClick={refresh}
          disabled={loading}
          className="text-xs px-4 py-2 rounded-full bg-soft text-muted hover:text-ink disabled:opacity-50"
        >
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      <CompetitorLeaderboard monitors={monitors} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <OOSHeatmap />
        <GeoMap />
      </div>

      <section className="rounded-clay bg-brand-lavender p-8 shadow-clay">
        <div className="flex items-center justify-between mb-3">
          <div className="text-[11px] uppercase tracking-[0.16em] text-ink/70 font-semibold">
            AI-generated narrative · weekly digest preview
          </div>
          <span
            className={`text-[10px] uppercase tracking-[0.14em] px-2 py-0.5 rounded-full border ${
              narrative?.generated
                ? "bg-ink/10 border-ink/20 text-ink"
                : "bg-canvas border-hairline text-muted"
            }`}
          >
            {loading
              ? "…"
              : narrative?.generated
                ? "AI · live"
                : "Templated"}
          </span>
        </div>
        <p className="font-display text-2xl tracking-tightish text-ink mt-3 leading-snug max-w-3xl">
          {narrative?.narrative ||
            "Loading insights from the last 7 days of strike events…"}
        </p>
        {narrative?.facts && narrative.facts.total_strikes > 0 && (
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <Fact
              label="Strikes (7d)"
              value={String(narrative.facts.total_strikes)}
            />
            <Fact
              label="Peak slot"
              value={narrative.facts.peak_slot || "—"}
            />
            <Fact
              label="Captured revenue"
              value={
                "₹" +
                Number(narrative.facts.total_revenue_inr || 0).toLocaleString(
                  "en-IN"
                )
              }
            />
            <Fact
              label="Avg ROAS"
              value={(narrative.facts.avg_roas ?? 0) + "×"}
            />
          </div>
        )}
      </section>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-canvas/40 border border-ink/10 px-4 py-3">
      <div className="text-[10px] uppercase tracking-wider text-ink/60 font-semibold">
        {label}
      </div>
      <div className="font-display text-xl tracking-display text-ink mt-0.5">
        {value}
      </div>
    </div>
  );
}
