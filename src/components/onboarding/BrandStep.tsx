"use client";

import { useState } from "react";
import type { BrandDraft } from "../Onboarding";

type Mode = "choose" | "auto_website" | "auto_listing" | "manual";

export default function BrandStep({
  brand,
  setBrand,
  onNext,
}: {
  brand: BrandDraft;
  setBrand: (b: BrandDraft) => void;
  onNext: () => void;
}) {
  const [mode, setMode] = useState<Mode>("choose");
  const [url, setUrl] = useState(brand.brand_source_url || "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function extract(sourceType: "website" | "listing") {
    setBusy(true);
    setErr(null);
    try {
      const r = await fetch("/api/onboard/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          sourceType: sourceType === "listing" ? "marketplace" : "website",
        }),
      });
      const data = await r.json();
      if (!r.ok || data.error) {
        setErr(data.error || "extraction failed — try fill manually");
        return;
      }
      setBrand({
        ...brand,
        brand_name: data.brand.brand_name || brand.brand_name,
        brand_tagline: data.brand.brand_tagline || "",
        brand_description: data.brand.brand_description || "",
        brand_voice: data.brand.brand_voice || "",
        brand_categories: Array.isArray(data.brand.brand_categories)
          ? data.brand.brand_categories
          : [],
        brand_value_props: Array.isArray(data.brand.brand_value_props)
          ? data.brand.brand_value_props
          : [],
        brand_target_audience: data.brand.brand_target_audience || "",
        brand_source_url: data.sourceUrl,
        brand_website: sourceType === "website" ? data.sourceUrl : "",
        source_type: sourceType,
        confidence: data.confidence || "",
      });
      onNext();
    } catch (e: any) {
      setErr(e?.message || "request failed");
    } finally {
      setBusy(false);
    }
  }

  if (mode === "choose") {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted">
          How would you like to set up your brand? Auto-fill saves time but
          you can always edit before continuing.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Card
            title="Auto-fill from website"
            desc="Paste your brand homepage. We scrape it and use AI to extract brand identity, products, and voice."
            badge="Recommended"
            onClick={() => setMode("auto_website")}
          />
          <Card
            title="Auto-fill from product listing"
            desc="No website yet? Paste any of your marketplace listings — we'll infer the brand from there."
            onClick={() => setMode("auto_listing")}
          />
          <Card
            title="Manual setup"
            desc="Enter every detail yourself. Best when scraping fails or you want full control."
            onClick={() => {
              setBrand({ ...brand, source_type: "manual" });
              setMode("manual");
              onNext();
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <button
        onClick={() => setMode("choose")}
        className="text-xs text-muted hover:text-gray-200"
      >
        ← change setup method
      </button>
      <p className="text-sm text-muted">
        {mode === "auto_website"
          ? "Paste your brand homepage URL. We scrape it and use AI to extract your brand profile."
          : "Paste one of your marketplace product listing URLs. We scrape it and infer brand identity."}
      </p>
      <div>
        <label className="text-xs text-muted">
          {mode === "auto_website"
            ? "Brand homepage URL"
            : "Product listing URL"}
        </label>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder={
            mode === "auto_website"
              ? "https://yourbrand.com"
              : "https://www.amazon.in/your-product/dp/..."
          }
          className="mt-1 w-full bg-bg border border-border rounded-md px-3 py-2.5 text-sm focus:border-accent focus:outline-none"
        />
      </div>
      {err && (
        <div className="text-sm text-danger bg-danger/10 border border-danger/30 rounded-md px-3 py-2">
          {err}
        </div>
      )}
      <div className="flex gap-2">
        <button
          onClick={() =>
            extract(mode === "auto_website" ? "website" : "listing")
          }
          disabled={busy || !url}
          className="flex-1 px-4 py-2.5 rounded-md bg-accent text-black font-medium text-sm hover:bg-accent/90 disabled:opacity-50"
        >
          {busy ? "Scraping & extracting…" : "Extract brand info"}
        </button>
        <button
          onClick={() => {
            setBrand({ ...brand, source_type: "manual", brand_source_url: "" });
            onNext();
          }}
          disabled={busy}
          className="px-4 py-2.5 rounded-md border border-border text-sm hover:border-accent/60"
        >
          Fill manually instead
        </button>
      </div>
      <div className="text-xs text-muted">
        Real-time scrape + AI extraction. Takes ~5–15s.
      </div>
    </div>
  );
}

function Card({
  title,
  desc,
  onClick,
  badge,
}: {
  title: string;
  desc: string;
  onClick: () => void;
  badge?: string;
}) {
  return (
    <button
      onClick={onClick}
      className="text-left p-4 rounded-lg border border-border bg-bg/40 hover:border-accent/60 hover:bg-bg transition group"
    >
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="font-medium text-sm group-hover:text-accent">{title}</div>
        {badge && (
          <span className="text-[10px] px-1.5 py-0.5 rounded border border-accent/40 text-accent">
            {badge}
          </span>
        )}
      </div>
      <div className="text-xs text-muted">{desc}</div>
    </button>
  );
}
