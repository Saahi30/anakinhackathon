"use client";

import { useEffect, useState } from "react";
import type { BrandProfile } from "@/lib/db";

export default function BrandSummary({
  onReRun,
  onChange,
}: {
  onReRun: () => void;
  onChange?: () => void;
}) {
  const [brand, setBrand] = useState<BrandProfile | null>(null);

  async function refresh() {
    const r = await fetch("/api/brand").then((r) => r.json());
    setBrand(r.brand || null);
  }

  useEffect(() => {
    refresh();
  }, []);

  if (!brand || !brand.brand_name) {
    return (
      <section className="rounded-clay bg-panel border border-hairline p-6 shadow-clay">
        <div className="flex items-center justify-between gap-2 mb-2">
          <h2 className="text-[11px] uppercase tracking-[0.16em] text-muted font-semibold">
            Brand profile
          </h2>
          <button
            onClick={onReRun}
            className="text-xs text-brand-teal hover:underline font-medium"
          >
            Run onboarding
          </button>
        </div>
        <div className="text-sm text-muted">
          No brand set up yet. Run onboarding to populate.
        </div>
      </section>
    );
  }

  const cats = (brand.brand_categories || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const props = (brand.brand_value_props || "")
    .split("|")
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <section className="rounded-clay bg-card p-6 space-y-3 shadow-clay">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-[11px] uppercase tracking-[0.16em] text-muted font-semibold">
            Brand
          </div>
          <h2 className="font-display text-xl tracking-tightish text-ink mt-0.5">
            {brand.brand_name}
          </h2>
        </div>
        <button
          onClick={onReRun}
          className="text-xs text-brand-teal hover:underline font-medium shrink-0"
        >
          Re-run
        </button>
      </div>
      {brand.brand_tagline && (
        <div className="font-display text-base italic text-ink leading-snug">
          "{brand.brand_tagline}"
        </div>
      )}
      {brand.brand_description && (
        <div className="text-xs text-body-text leading-relaxed">
          {brand.brand_description}
        </div>
      )}
      <div className="grid grid-cols-2 gap-3 text-xs">
        {brand.brand_voice && (
          <KV label="Voice" value={brand.brand_voice} />
        )}
        {brand.brand_target_audience && (
          <KV label="Audience" value={brand.brand_target_audience} />
        )}
        {brand.brand_marketplaces && (
          <KV label="Marketplaces" value={brand.brand_marketplaces} />
        )}
        {brand.brand_regions && (
          <KV label="Regions" value={brand.brand_regions} />
        )}
      </div>
      {cats.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {cats.map((c) => (
            <span
              key={c}
              className="text-[10px] px-1.5 py-0.5 rounded border border-border text-muted"
            >
              {c}
            </span>
          ))}
        </div>
      )}
      {props.length > 0 && (
        <ul className="text-xs text-gray-300 space-y-0.5">
          {props.map((p) => (
            <li key={p}>· {p}</li>
          ))}
        </ul>
      )}
    </section>
  );
}

function KV({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-muted">
        {label}
      </div>
      <div className="text-gray-200 truncate">{value}</div>
    </div>
  );
}
