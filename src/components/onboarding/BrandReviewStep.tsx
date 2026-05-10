"use client";

import { useState } from "react";
import type { BrandDraft } from "../Onboarding";

export default function BrandReviewStep({
  brand,
  setBrand,
  onBack,
  onNext,
}: {
  brand: BrandDraft;
  setBrand: (b: BrandDraft) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function save() {
    setBusy(true);
    setErr(null);
    try {
      const patch = {
        brand_name: brand.brand_name,
        brand_tagline: brand.brand_tagline,
        brand_description: brand.brand_description,
        brand_voice: brand.brand_voice,
        brand_categories: brand.brand_categories.join(", "),
        brand_value_props: brand.brand_value_props.join(" | "),
        brand_target_audience: brand.brand_target_audience,
        brand_marketplaces: brand.brand_marketplaces,
        brand_regions: brand.brand_regions,
        brand_logo_url: brand.brand_logo_url,
        brand_notes: brand.brand_notes,
        brand_website: brand.brand_website,
        brand_source_url: brand.brand_source_url,
        source_type: brand.source_type,
        confidence: brand.confidence,
      };
      const r = await fetch("/api/brand", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!r.ok) {
        const data = await r.json().catch(() => ({}));
        setErr(data.error || "save failed");
        return;
      }
      onNext();
    } finally {
      setBusy(false);
    }
  }

  const lowConfidence = brand.confidence === "low";

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        Edit anything below — these fields shape monitoring and ad copy. Every
        AI-filled value is editable, and you must confirm before continuing.
      </p>
      {lowConfidence && (
        <div className="text-xs px-3 py-2 rounded-md border border-warn/40 bg-warn/10 text-warn">
          Extraction confidence is low — please double-check the fields below.
        </div>
      )}

      <Field
        label="Brand name *"
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
        placeholder="Premium cotton basics designed in India."
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
            brand_categories: v.split(",").map((s) => s.trim()).filter(Boolean),
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
            brand_value_props: v.split("\n").map((s) => s.trim()).filter(Boolean),
          })
        }
        placeholder={"100% organic cotton\nFree shipping over ₹999"}
        multiline
        rows={3}
      />
      <Field
        label="Target audience"
        value={brand.brand_target_audience}
        onChange={(v) => setBrand({ ...brand, brand_target_audience: v })}
        placeholder="urban millennials, 22-35"
      />
      <Field
        label="Marketplaces (comma-separated)"
        value={brand.brand_marketplaces}
        onChange={(v) => setBrand({ ...brand, brand_marketplaces: v })}
        placeholder="Amazon, Myntra, Ajio"
      />
      <Field
        label="Regions served"
        value={brand.brand_regions}
        onChange={(v) => setBrand({ ...brand, brand_regions: v })}
        placeholder="India, UAE"
      />
      <Field
        label="Logo URL (optional)"
        value={brand.brand_logo_url}
        onChange={(v) => setBrand({ ...brand, brand_logo_url: v })}
        placeholder="https://..."
      />
      <Field
        label="Notes (optional)"
        value={brand.brand_notes}
        onChange={(v) => setBrand({ ...brand, brand_notes: v })}
        placeholder="Anything the team should know about positioning"
        multiline
      />

      {err && (
        <div className="text-sm text-danger bg-danger/10 border border-danger/30 rounded-md px-3 py-2">
          {err}
        </div>
      )}

      <div className="flex gap-2 pt-2">
        <button
          onClick={onBack}
          disabled={busy}
          className="px-4 py-2.5 rounded-md border border-border text-sm hover:border-accent/60"
        >
          Back
        </button>
        <button
          onClick={save}
          disabled={busy || !brand.brand_name.trim()}
          className="flex-1 px-4 py-2.5 rounded-md bg-accent text-black font-medium text-sm hover:bg-accent/90 disabled:opacity-50"
        >
          {busy ? "Saving…" : "Save & continue to products"}
        </button>
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
