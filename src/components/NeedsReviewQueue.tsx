"use client";

import { useEffect, useState } from "react";
import type { Product, Competitor, BrandProfile } from "@/lib/db";
import type { Event } from "./Dashboard";

type ReviewItem = {
  id: string;
  kind: string;
  message: string;
  href?: string;
  severity: "warn" | "danger" | "info";
};

export default function NeedsReviewQueue({ events }: { events: Event[] }) {
  const [items, setItems] = useState<ReviewItem[]>([]);

  async function refresh() {
    const [bRes, pRes, cRes] = await Promise.all([
      fetch("/api/brand").then((r) => r.json()),
      fetch("/api/products").then((r) => r.json()),
      fetch("/api/competitors").then((r) => r.json()),
    ]);
    const brand: BrandProfile | null = bRes.brand || null;
    const products: Product[] = pRes.products || [];
    const competitors: Competitor[] = cRes.competitors || [];

    const out: ReviewItem[] = [];

    if (brand && brand.confidence === "low" && brand.brand_name) {
      out.push({
        id: "brand-low-conf",
        kind: "brand",
        severity: "warn",
        message: "Brand profile extraction had low confidence — review fields",
      });
    }

    for (const p of products) {
      if (p.enrichment_status === "failed") {
        out.push({
          id: `product-failed-${p.id}`,
          kind: "product",
          severity: "danger",
          message: `Enrichment failed: ${p.title || p.url} — ${p.enrichment_error || "scrape error"}`,
          href: p.url,
        });
      } else if (p.enrichment_status === "partial") {
        out.push({
          id: `product-partial-${p.id}`,
          kind: "product",
          severity: "warn",
          message: `Partial enrichment: ${p.title || p.url} — AI returned no JSON`,
          href: p.url,
        });
      }
    }

    for (const c of competitors) {
      if (c.status === "proposed" && c.score < 0.2) {
        out.push({
          id: `competitor-weak-${c.id}`,
          kind: "competitor",
          severity: "warn",
          message: `Weak match: ${c.title || c.url} (${Math.round(c.score * 100)}%)`,
          href: c.url,
        });
      }
    }

    for (const e of events.slice(0, 30)) {
      if (e.kind === "scrape_failed") {
        out.push({
          id: `event-${e.id}`,
          kind: "scrape",
          severity: "danger",
          message: `Scrape failed: ${e.monitor_label || e.monitor_url || "monitor"}`,
          href: e.monitor_url || undefined,
        });
      }
    }

    setItems(out);
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events.length]);

  return (
    <section className="rounded-clay bg-panel border border-hairline shadow-clay overflow-hidden">
      <div className="px-6 py-4 border-b border-hairline flex items-center justify-between bg-soft">
        <div>
          <div className="text-[11px] uppercase tracking-[0.16em] text-muted font-semibold">
            Queue
          </div>
          <h2 className="font-display text-xl tracking-tightish text-ink mt-0.5">
            Needs review
          </h2>
        </div>
        <span className="text-xs text-muted px-2.5 py-0.5 rounded-full bg-canvas border border-hairline">
          {items.length}
        </span>
      </div>
      {!items.length ? (
        <div className="px-5 py-8 text-center text-muted text-sm">
          All clear. No items need attention.
        </div>
      ) : (
        <ul className="divide-y divide-border max-h-72 overflow-y-auto">
          {items.map((it) => (
            <li
              key={it.id}
              className="px-5 py-3 text-sm flex items-start gap-3"
            >
              <span
                className={`text-[10px] uppercase font-semibold tracking-wider px-1.5 py-0.5 rounded border shrink-0 ${
                  it.severity === "danger"
                    ? "border-danger/40 text-danger bg-danger/10"
                    : it.severity === "warn"
                      ? "border-warn/40 text-warn bg-warn/10"
                      : "border-border text-muted bg-bg/40"
                }`}
              >
                {it.kind}
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-gray-200 break-words">{it.message}</div>
                {it.href && (
                  <a
                    href={it.href}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-muted hover:text-accent truncate block"
                  >
                    {it.href}
                  </a>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
