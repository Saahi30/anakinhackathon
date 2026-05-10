"use client";

import { useEffect, useState } from "react";
import type { Product } from "@/lib/db";

type Tab = "individual" | "csv";

type Preview = {
  row: number;
  url: string;
  label: string;
  sku: string;
  category: string;
  notes: string;
  platform: string;
  issues: string[];
};

export default function ProductImportStep({
  onBack,
  onNext,
}: {
  onBack: () => void;
  onNext: () => void;
}) {
  const [tab, setTab] = useState<Tab>("individual");
  const [products, setProducts] = useState<Product[]>([]);
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [csvText, setCsvText] = useState("");
  const [preview, setPreview] = useState<{
    rows: Preview[];
    validCount: number;
    invalidCount: number;
    parseErrors: { row: number; message: string }[];
  } | null>(null);

  async function refresh() {
    const r = await fetch("/api/products").then((r) => r.json());
    setProducts(r.products || []);
  }

  useEffect(() => {
    refresh();
  }, []);

  async function addOne() {
    setBusy(true);
    setErr(null);
    try {
      const r = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, title }),
      });
      const data = await r.json();
      if (!r.ok) {
        setErr(data.error || "failed");
        return;
      }
      setUrl("");
      setTitle("");
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: number) {
    await fetch(`/api/products/${id}`, { method: "DELETE" });
    await refresh();
  }

  async function previewCsv() {
    setBusy(true);
    setErr(null);
    try {
      const r = await fetch("/api/products/import-csv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv: csvText, commit: false }),
      });
      const data = await r.json();
      if (!r.ok) {
        setErr(data.error || "preview failed");
        setPreview(null);
        return;
      }
      setPreview({
        rows: data.rows || [],
        validCount: data.validCount,
        invalidCount: data.invalidCount,
        parseErrors: data.parseErrors || [],
      });
    } finally {
      setBusy(false);
    }
  }

  async function commitCsv() {
    setBusy(true);
    setErr(null);
    try {
      const r = await fetch("/api/products/import-csv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv: csvText, commit: true }),
      });
      const data = await r.json();
      if (!r.ok) {
        setErr(data.error || "import failed");
        return;
      }
      setCsvText("");
      setPreview(null);
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  function onCsvFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCsvText(String(reader.result || ""));
      setPreview(null);
    };
    reader.readAsText(f);
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        Import the products you want StockStrike to protect. Each product
        becomes a protected record we'll use to find competitors.
      </p>

      <div className="flex gap-2">
        {(["individual", "csv"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-1.5 text-sm rounded-md border transition ${
              tab === t
                ? "border-accent bg-accent/10 text-accent"
                : "border-border text-muted hover:text-gray-200"
            }`}
          >
            {t === "individual" ? "Add one URL" : "Bulk CSV upload"}
          </button>
        ))}
      </div>

      {tab === "individual" && (
        <div className="space-y-3">
          <input
            type="url"
            placeholder="https://www.amazon.in/your-product/dp/..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full bg-bg border border-border rounded-md px-3 py-2.5 text-sm focus:border-accent focus:outline-none"
          />
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Optional label (e.g. Cotton crew tee – navy)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="flex-1 bg-bg border border-border rounded-md px-3 py-2.5 text-sm focus:border-accent focus:outline-none"
            />
            <button
              onClick={addOne}
              disabled={busy || !url}
              className="px-4 py-2.5 rounded-md bg-accent text-black font-medium text-sm hover:bg-accent/90 disabled:opacity-50"
            >
              {busy ? "Adding…" : "Add product"}
            </button>
          </div>
          {err && <div className="text-danger text-xs">{err}</div>}
        </div>
      )}

      {tab === "csv" && (
        <div className="space-y-3">
          <div className="text-xs text-muted">
            Need a starting point?{" "}
            <a
              href="/api/products/import-csv"
              className="text-accent hover:underline"
            >
              Download CSV template
            </a>
            . Required column: <code>url</code>. Optional: <code>label</code>,
            <code>sku</code>, <code>category</code>, <code>notes</code>.
          </div>
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={onCsvFile}
            className="block text-xs text-muted file:mr-3 file:px-3 file:py-2 file:rounded-md file:border file:border-border file:bg-bg file:text-gray-200 file:text-xs hover:file:border-accent/60"
          />
          <textarea
            value={csvText}
            onChange={(e) => {
              setCsvText(e.target.value);
              setPreview(null);
            }}
            placeholder="Or paste CSV content here…"
            rows={5}
            className="w-full bg-bg border border-border rounded-md px-3 py-2 text-xs font-mono focus:border-accent focus:outline-none resize-none"
          />
          <div className="flex gap-2">
            <button
              onClick={previewCsv}
              disabled={busy || !csvText.trim()}
              className="px-4 py-2 rounded-md border border-border text-sm hover:border-accent/60 disabled:opacity-50"
            >
              {busy ? "Validating…" : "Validate & preview"}
            </button>
            <button
              onClick={commitCsv}
              disabled={busy || !preview || preview.validCount === 0}
              className="px-4 py-2 rounded-md bg-accent text-black font-medium text-sm hover:bg-accent/90 disabled:opacity-50"
            >
              Import {preview?.validCount || 0} valid rows
            </button>
          </div>
          {preview && <CsvPreview preview={preview} />}
          {err && <div className="text-danger text-xs">{err}</div>}
        </div>
      )}

      <div className="border-t border-border pt-4">
        <div className="text-xs uppercase tracking-wider text-muted mb-2">
          Imported products ({products.length})
        </div>
        {!products.length && (
          <div className="text-sm text-muted">
            None yet. Add at least one to continue.
          </div>
        )}
        <ul className="space-y-1.5 max-h-56 overflow-y-auto">
          {products.map((p) => (
            <li
              key={p.id}
              className="flex items-start justify-between gap-2 text-xs px-3 py-2 rounded-md border border-border bg-bg/40"
            >
              <div className="min-w-0">
                <div className="font-medium truncate">
                  {p.title || p.url}
                </div>
                <div className="text-muted truncate">{p.url}</div>
                <div className="mt-0.5 text-[10px] uppercase tracking-wider text-muted">
                  {p.platform} · {p.source}
                </div>
              </div>
              <button
                onClick={() => remove(p.id)}
                className="text-muted hover:text-danger shrink-0"
                title="Remove"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      </div>

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
          Continue to enrichment
        </button>
      </div>
    </div>
  );
}

function CsvPreview({
  preview,
}: {
  preview: {
    rows: Preview[];
    validCount: number;
    invalidCount: number;
    parseErrors: { row: number; message: string }[];
  };
}) {
  return (
    <div className="rounded-md border border-border bg-bg/40 p-3 space-y-2">
      <div className="flex items-center gap-3 text-xs">
        <span className="text-accent">{preview.validCount} valid</span>
        {preview.invalidCount > 0 && (
          <span className="text-danger">{preview.invalidCount} invalid</span>
        )}
      </div>
      <div className="max-h-48 overflow-y-auto">
        <table className="w-full text-xs">
          <thead className="text-muted">
            <tr>
              <th className="text-left p-1">#</th>
              <th className="text-left p-1">Platform</th>
              <th className="text-left p-1">Label / URL</th>
              <th className="text-left p-1">Issues</th>
            </tr>
          </thead>
          <tbody>
            {preview.rows.map((r) => (
              <tr key={r.row} className="border-t border-border/60">
                <td className="p-1 text-muted">{r.row}</td>
                <td className="p-1">{r.platform}</td>
                <td className="p-1 truncate max-w-[200px]">
                  {r.label || r.url}
                </td>
                <td className="p-1">
                  {r.issues.length ? (
                    <span className="text-danger">{r.issues.join(", ")}</span>
                  ) : (
                    <span className="text-accent">ok</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {preview.parseErrors.length > 0 && (
        <div className="text-xs text-warn">
          {preview.parseErrors.length} parse errors
        </div>
      )}
    </div>
  );
}
