"use client";

import { useState } from "react";
import ScrapePreview from "./ScrapePreview";

function detectPlatformClient(url: string): string {
  try {
    const h = new URL(url).hostname.toLowerCase();
    if (h.includes("myntra")) return "myntra";
    if (h.includes("ajio")) return "ajio";
    if (h.includes("blinkit")) return "blinkit";
    if (h.includes("zepto")) return "zepto";
    if (h.includes("amazon")) return "amazon";
  } catch {}
  return "unknown";
}

export default function AddMonitor({ onAdded }: { onAdded: () => void }) {
  const [url, setUrl] = useState("");
  const [sku, setSku] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ url: string; platform: string } | null>(
    null
  );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const platform = detectPlatformClient(url);
    setPreview({ url, platform });
    try {
      const r = await fetch("/api/monitors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, sku: sku || null }),
      });
      const data = await r.json();
      if (!r.ok) {
        setError(data.error || "failed");
        setPreview(null);
        return;
      }
      setUrl("");
      setSku("");
      onAdded();
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <section className="rounded-clay bg-panel border border-hairline p-7 shadow-clay">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-[11px] uppercase tracking-[0.16em] text-muted font-semibold">
              Quick add
            </div>
            <h2 className="font-display text-2xl tracking-display text-ink mt-1">
              Drop a competitor URL
            </h2>
          </div>
          <span className="text-[10px] uppercase tracking-[0.14em] px-2.5 py-1 rounded-full bg-soft text-muted">
            manual fallback
          </span>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <input
            type="url"
            required
            placeholder="https://www.myntra.com/... or amazon.in/... or zepto/blinkit/ajio"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full bg-canvas border border-hairline rounded-2xl px-4 py-3 text-sm text-ink placeholder:text-muted-soft focus:border-ink focus:outline-none transition"
          />
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="SKU / label (optional)"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              className="flex-1 bg-canvas border border-hairline rounded-2xl px-4 py-3 text-sm text-ink placeholder:text-muted-soft focus:border-ink focus:outline-none transition"
            />
            <button
              type="submit"
              disabled={busy}
              className="px-6 py-3 rounded-2xl bg-ink text-white font-medium text-sm hover:bg-ink/90 disabled:opacity-50 transition"
            >
              {busy ? "Adding…" : "Monitor"}
            </button>
          </div>
          {error && <div className="text-brand-coral text-xs">{error}</div>}
          <div className="text-xs text-muted leading-relaxed">
            Skips discovery — useful when you already know the exact competitor
            URL. Watch the live scrape stream when you submit.
          </div>
        </form>
      </section>

      {preview && (
        <ScrapePreview
          url={preview.url}
          platform={preview.platform}
          onClose={() => setPreview(null)}
        />
      )}
    </>
  );
}
