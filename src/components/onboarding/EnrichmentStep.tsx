"use client";

import { useEffect, useState } from "react";
import type { Product } from "@/lib/db";

export default function EnrichmentStep({
  onBack,
  onNext,
}: {
  onBack: () => void;
  onNext: () => void;
}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [running, setRunning] = useState(false);
  const [enrichingIds, setEnrichingIds] = useState<Set<number>>(new Set());

  async function refresh() {
    const r = await fetch("/api/products").then((r) => r.json());
    setProducts(r.products || []);
  }

  useEffect(() => {
    refresh();
  }, []);

  async function enrich(id: number) {
    setEnrichingIds((s) => new Set(s).add(id));
    try {
      await fetch(`/api/products/${id}/enrich`, { method: "POST" });
      await refresh();
    } finally {
      setEnrichingIds((s) => {
        const n = new Set(s);
        n.delete(id);
        return n;
      });
    }
  }

  async function enrichAll() {
    setRunning(true);
    try {
      const pending = products.filter(
        (p) => p.enrichment_status === "pending" || p.enrichment_status === "failed"
      );
      // Run sequentially — Anakin is rate-sensitive and runs scrape jobs.
      for (const p of pending) {
        await enrich(p.id);
      }
    } finally {
      setRunning(false);
    }
  }

  const allEnriched =
    products.length > 0 &&
    products.every(
      (p) =>
        p.enrichment_status === "enriched" ||
        p.enrichment_status === "partial" ||
        p.enrichment_status === "failed"
    );
  const pendingCount = products.filter(
    (p) => p.enrichment_status === "pending" || p.enrichment_status === "running"
  ).length;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        StockStrike scrapes each product page and normalizes the result with
        AI — pulling title, price, category, rating, review count, and seller
        hints. All AI fields are editable afterward.
      </p>

      <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-md border border-border bg-bg/40 text-xs">
        <div>
          <span className="text-accent">
            {products.filter((p) => p.enrichment_status === "enriched").length}{" "}
            enriched
          </span>
          <span className="text-muted">
            {" "}
            · {pendingCount} pending · {products.length} total
          </span>
        </div>
        <button
          onClick={enrichAll}
          disabled={running || !pendingCount}
          className="px-3 py-1.5 rounded-md bg-accent text-black font-medium hover:bg-accent/90 disabled:opacity-50"
        >
          {running ? "Enriching…" : "Enrich all pending"}
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
                <div className="text-xs text-muted truncate">{p.url}</div>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider ${statusStyle(p.enrichment_status)}`}>
                    {p.enrichment_status}
                  </span>
                  {p.category && (
                    <span className="text-muted">cat: {p.category}</span>
                  )}
                  {p.price && (
                    <span className="text-muted">price: {p.price}</span>
                  )}
                  {p.rating && (
                    <span className="text-muted">★ {p.rating}</span>
                  )}
                  {p.review_count && (
                    <span className="text-muted">({p.review_count})</span>
                  )}
                </div>
                {p.attributes && p.attributes.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {p.attributes.map((a) => (
                      <span
                        key={a}
                        className="text-[10px] px-1.5 py-0.5 rounded border border-border text-muted"
                      >
                        {a}
                      </span>
                    ))}
                  </div>
                )}
                {p.enrichment_error && (
                  <div className="text-xs text-warn mt-1">
                    {p.enrichment_error}
                  </div>
                )}
              </div>
              <button
                onClick={() => enrich(p.id)}
                disabled={enrichingIds.has(p.id)}
                className="text-xs px-2 py-1 rounded-md border border-border hover:border-accent/60 hover:text-accent shrink-0"
              >
                {enrichingIds.has(p.id) ? "…" : p.enrichment_status === "enriched" ? "Re-enrich" : "Enrich"}
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
          disabled={!products.length}
          className="flex-1 px-4 py-2.5 rounded-md bg-accent text-black font-medium text-sm hover:bg-accent/90 disabled:opacity-50"
        >
          {allEnriched
            ? "Continue to competitor discovery"
            : "Skip remaining & continue"}
        </button>
      </div>
    </div>
  );
}

function statusStyle(s: string): string {
  switch (s) {
    case "enriched":
      return "bg-accent/15 text-accent border border-accent/30";
    case "running":
      return "bg-bg text-muted border border-border animate-pulse";
    case "failed":
      return "bg-danger/15 text-danger border border-danger/30";
    case "partial":
      return "bg-warn/15 text-warn border border-warn/30";
    default:
      return "bg-bg text-muted border border-border";
  }
}
