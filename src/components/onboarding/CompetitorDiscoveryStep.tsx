"use client";

import { useEffect, useState } from "react";
import type { Product, Competitor } from "@/lib/db";

export default function CompetitorDiscoveryStep({
  onBack,
  onNext,
}: {
  onBack: () => void;
  onNext: () => void;
}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [competitorCounts, setCompetitorCounts] = useState<Record<number, number>>({});
  const [running, setRunning] = useState(false);
  const [discoveringId, setDiscoveringId] = useState<number | null>(null);
  const [errors, setErrors] = useState<Record<number, string>>({});
  const [needsManual, setNeedsManual] = useState<Set<number>>(new Set());

  async function refresh() {
    const r = await fetch("/api/products").then((r) => r.json());
    const ps: Product[] = r.products || [];
    setProducts(ps);
    const counts: Record<number, number> = {};
    for (const p of ps) {
      const cr = await fetch(`/api/products/${p.id}/competitors`).then((x) =>
        x.json()
      );
      counts[p.id] = (cr.competitors || []).length;
    }
    setCompetitorCounts(counts);
  }

  useEffect(() => {
    refresh();
  }, []);

  async function discover(p: Product) {
    setDiscoveringId(p.id);
    setErrors((e) => {
      const n = { ...e };
      delete n[p.id];
      return n;
    });
    try {
      const r = await fetch(`/api/products/${p.id}/competitors/discover`, {
        method: "POST",
      });
      const data = await r.json();
      if (!data.ok) {
        setErrors((e) => ({
          ...e,
          [p.id]: data.error || "discovery failed",
        }));
        if (data.needsManual) {
          setNeedsManual((s) => new Set(s).add(p.id));
        }
      }
      const competitors: Competitor[] = data.competitors || [];
      setCompetitorCounts((c) => ({ ...c, [p.id]: competitors.length }));
    } finally {
      setDiscoveringId(null);
    }
  }

  async function discoverAll() {
    setRunning(true);
    try {
      for (const p of products) {
        await discover(p);
      }
    } finally {
      setRunning(false);
    }
  }

  const totalCompetitors = Object.values(competitorCounts).reduce(
    (a, b) => a + b,
    0
  );

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        For each imported product, we'll search Amazon via the Rainforest API
        and rank candidate competitors using product title similarity, keyword
        overlap, category match, price band, and review profile.
      </p>

      <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-md border border-border bg-bg/40 text-xs">
        <div>
          <span className="text-accent">{totalCompetitors} candidates</span>
          <span className="text-muted">
            {" "}
            · across {products.length} products
          </span>
        </div>
        <button
          onClick={discoverAll}
          disabled={running || !products.length}
          className="px-3 py-1.5 rounded-md bg-accent text-black font-medium hover:bg-accent/90 disabled:opacity-50"
        >
          {running ? "Discovering…" : "Discover for all"}
        </button>
      </div>

      <ul className="space-y-2 max-h-80 overflow-y-auto">
        {products.map((p) => (
          <li
            key={p.id}
            className="px-3 py-2.5 rounded-md border border-border bg-bg/40"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="font-medium text-sm truncate">
                  {p.title || p.url}
                </div>
                <div className="text-xs text-muted">
                  {(competitorCounts[p.id] ?? 0) > 0 ? (
                    <span className="text-accent">
                      {competitorCounts[p.id]} candidates found
                    </span>
                  ) : (
                    <span>no candidates yet</span>
                  )}
                </div>
                {errors[p.id] && (
                  <div className="text-xs text-warn mt-1">
                    {errors[p.id]}
                    {needsManual.has(p.id) &&
                      " — you can add competitors manually in the next step."}
                  </div>
                )}
              </div>
              <button
                onClick={() => discover(p)}
                disabled={discoveringId === p.id}
                className="text-xs px-2 py-1 rounded-md border border-border hover:border-accent/60 hover:text-accent shrink-0"
              >
                {discoveringId === p.id ? "…" : "Discover"}
              </button>
            </div>
          </li>
        ))}
      </ul>

      <div className="flex gap-2 pt-2 border-t border-border">
        <button
          onClick={onBack}
          className="px-4 py-2.5 rounded-md border border-border text-sm hover:border-accent/60"
        >
          Back
        </button>
        <button
          onClick={onNext}
          className="flex-1 px-4 py-2.5 rounded-md bg-accent text-black font-medium text-sm hover:bg-accent/90"
        >
          {totalCompetitors > 0
            ? "Continue to review"
            : "Continue (add manually next)"}
        </button>
      </div>
    </div>
  );
}
