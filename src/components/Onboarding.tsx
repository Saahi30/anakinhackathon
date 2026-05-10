"use client";

import { useState } from "react";

type SourceType = "website" | "marketplace";

type BrandInfo = {
  brand_name: string;
  brand_tagline: string;
  brand_description: string;
  brand_voice: string;
  brand_categories: string[];
  brand_value_props: string[];
  brand_target_audience: string;
};

const EMPTY: BrandInfo = {
  brand_name: "",
  brand_tagline: "",
  brand_description: "",
  brand_voice: "",
  brand_categories: [],
  brand_value_props: [],
  brand_target_audience: "",
};

export default function Onboarding({
  onDone,
  onSkip,
}: {
  onDone: () => void;
  onSkip: () => void;
}) {
  const [step, setStep] = useState<"source" | "review">("source");
  const [sourceType, setSourceType] = useState<SourceType>("website");
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [brand, setBrand] = useState<BrandInfo>(EMPTY);
  const [sourceUrl, setSourceUrl] = useState("");

  async function extract(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const r = await fetch("/api/onboard/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, sourceType }),
      });
      const data = await r.json();
      if (!r.ok) {
        setError(data.error || "extraction failed");
        return;
      }
      setBrand({ ...EMPTY, ...data.brand });
      setSourceUrl(data.sourceUrl);
      setStep("review");
    } catch (err: any) {
      setError(err?.message || "request failed");
    } finally {
      setBusy(false);
    }
  }

  function manual() {
    setBrand(EMPTY);
    setSourceUrl("");
    setStep("review");
  }

  async function save() {
    setBusy(true);
    setError(null);
    try {
      const patch = {
        brand_name: brand.brand_name,
        brand_tagline: brand.brand_tagline,
        brand_description: brand.brand_description,
        brand_voice: brand.brand_voice,
        brand_categories: brand.brand_categories.join(", "),
        brand_value_props: brand.brand_value_props.join(" | "),
        brand_target_audience: brand.brand_target_audience,
        brand_source_url: sourceUrl,
        brand_website: sourceType === "website" ? sourceUrl : "",
        onboarding_completed: "1",
      };
      const r = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!r.ok) {
        const data = await r.json().catch(() => ({}));
        setError(data.error || "save failed");
        return;
      }
      onDone();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-2xl rounded-2xl border border-border bg-panel shadow-2xl my-8">
        <div className="px-6 py-5 border-b border-border flex items-center justify-between">
          <div>
            <div className="text-xs text-accent uppercase tracking-wider font-semibold">
              {step === "source" ? "Step 1 of 2" : "Step 2 of 2"}
            </div>
            <h1 className="text-xl font-semibold mt-0.5">
              {step === "source"
                ? "Tell StockStrike about your brand"
                : "Review brand info"}
            </h1>
          </div>
          <button
            onClick={onSkip}
            className="text-xs text-muted hover:text-gray-200"
          >
            Skip for now
          </button>
        </div>

        {step === "source" && (
          <form onSubmit={extract} className="p-6 space-y-5">
            <p className="text-sm text-muted">
              Paste your brand website or one of your marketplace listings — we
              scrape it via anakin and auto-fill brand details so ad copy stays
              on-voice when competitors go OOS.
            </p>

            <div className="flex gap-2">
              {(["website", "marketplace"] as SourceType[]).map((t) => (
                <button
                  type="button"
                  key={t}
                  onClick={() => setSourceType(t)}
                  className={`flex-1 px-3 py-2 text-sm rounded-md border transition ${
                    sourceType === t
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-border text-muted hover:text-gray-200"
                  }`}
                >
                  {t === "website" ? "Brand website" : "Marketplace listing"}
                </button>
              ))}
            </div>

            <div>
              <label className="text-xs text-muted">
                {sourceType === "website" ? "Brand homepage URL" : "Your product listing URL"}
              </label>
              <input
                required
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder={
                  sourceType === "website"
                    ? "https://yourbrand.com"
                    : "https://www.amazon.in/your-product/dp/..."
                }
                className="mt-1 w-full bg-bg border border-border rounded-md px-3 py-2.5 text-sm focus:border-accent focus:outline-none"
              />
            </div>

            {error && (
              <div className="text-sm text-danger bg-danger/10 border border-danger/30 rounded-md px-3 py-2">
                {error}
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={busy || !url}
                className="flex-1 px-4 py-2.5 rounded-md bg-accent text-black font-medium text-sm hover:bg-accent/90 disabled:opacity-50"
              >
                {busy ? "Scraping & extracting…" : "Extract brand info"}
              </button>
              <button
                type="button"
                onClick={manual}
                disabled={busy}
                className="px-4 py-2.5 rounded-md border border-border text-sm hover:border-accent/60"
              >
                Fill manually
              </button>
            </div>
            <div className="text-xs text-muted">
              Takes ~5–15s. Uses anakin.io to scrape, Groq Llama 3.3 70B to
              extract structured brand info.
            </div>
          </form>
        )}

        {step === "review" && (
          <div className="p-6 space-y-4">
            <p className="text-sm text-muted">
              Edit anything below — these fields shape ad copy whenever a
              competitor is detected as OOS.
            </p>

            <Field
              label="Brand name"
              value={brand.brand_name}
              onChange={(v) => setBrand({ ...brand, brand_name: v })}
              placeholder="Acme Co."
            />
            <Field
              label="Tagline"
              value={brand.brand_tagline}
              onChange={(v) => setBrand({ ...brand, brand_tagline: v })}
              placeholder="Move faster, look better."
            />
            <Field
              label="What you sell (1–2 sentences)"
              value={brand.brand_description}
              onChange={(v) => setBrand({ ...brand, brand_description: v })}
              placeholder="Premium cotton basics for everyday wear, designed in India."
              multiline
            />
            <Field
              label="Brand voice"
              value={brand.brand_voice}
              onChange={(v) => setBrand({ ...brand, brand_voice: v })}
              placeholder="premium minimalist"
            />
            <Field
              label="Categories (comma-separated)"
              value={brand.brand_categories.join(", ")}
              onChange={(v) =>
                setBrand({
                  ...brand,
                  brand_categories: v
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean),
                })
              }
              placeholder="t-shirts, hoodies, joggers"
            />
            <Field
              label="Value props (one per line)"
              value={brand.brand_value_props.join("\n")}
              onChange={(v) =>
                setBrand({
                  ...brand,
                  brand_value_props: v
                    .split("\n")
                    .map((s) => s.trim())
                    .filter(Boolean),
                })
              }
              placeholder={"100% organic cotton\nFree shipping over ₹999\nMade in India"}
              multiline
              rows={3}
            />
            <Field
              label="Target audience"
              value={brand.brand_target_audience}
              onChange={(v) =>
                setBrand({ ...brand, brand_target_audience: v })
              }
              placeholder="urban millennials, 22-35, fashion-conscious"
            />

            {error && (
              <div className="text-sm text-danger bg-danger/10 border border-danger/30 rounded-md px-3 py-2">
                {error}
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setStep("source")}
                disabled={busy}
                className="px-4 py-2.5 rounded-md border border-border text-sm hover:border-accent/60"
              >
                Back
              </button>
              <button
                onClick={save}
                disabled={busy || !brand.brand_name}
                className="flex-1 px-4 py-2.5 rounded-md bg-accent text-black font-medium text-sm hover:bg-accent/90 disabled:opacity-50"
              >
                {busy ? "Saving…" : "Save & start monitoring"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  multiline,
  rows,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
}) {
  return (
    <div>
      <label className="text-xs text-muted">{label}</label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows || 2}
          className="mt-1 w-full bg-bg border border-border rounded-md px-3 py-2 text-sm focus:border-accent focus:outline-none resize-none"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="mt-1 w-full bg-bg border border-border rounded-md px-3 py-2 text-sm focus:border-accent focus:outline-none"
        />
      )}
    </div>
  );
}
