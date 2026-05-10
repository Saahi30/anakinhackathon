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
      <section className="rounded-xl border border-border bg-panel p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
            Quick-add competitor URL
          </h2>
          <span className="text-[10px] uppercase tracking-wider text-muted">
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
            className="w-full bg-bg border border-border rounded-md px-3 py-2.5 text-sm focus:border-accent focus:outline-none"
          />
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="SKU / label (optional)"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              className="flex-1 bg-bg border border-border rounded-md px-3 py-2.5 text-sm focus:border-accent focus:outline-none"
            />
            <button
              type="submit"
              disabled={busy}
              className="px-5 py-2.5 rounded-md bg-accent text-black font-medium text-sm hover:bg-accent/90 disabled:opacity-50"
            >
              {busy ? "Adding…" : "Monitor"}
            </button>
          </div>
          {error && <div className="text-danger text-xs">{error}</div>}
          <div className="text-xs text-muted">
            Skips discovery — useful when you already know the exact competitor
            URL. Watch the live anakin scrape stream when you submit.
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
