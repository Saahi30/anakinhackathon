"use client";

import { useEffect, useState } from "react";
import type { Product, Competitor } from "@/lib/db";

export default function CompetitorReviewStep({
  onBack,
  onNext,
}: {
  onBack: () => void;
  onNext: () => void;
}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [byProduct, setByProduct] = useState<Record<number, Competitor[]>>({});
  const [busy, setBusy] = useState(false);
  const [manualUrl, setManualUrl] = useState("");
  const [manualForId, setManualForId] = useState<number | null>(null);

  async function refresh() {
    const r = await fetch("/api/products").then((r) => r.json());
    const ps: Product[] = r.products || [];
    setProducts(ps);
    const map: Record<number, Competitor[]> = {};
    for (const p of ps) {
      const cr = await fetch(`/api/products/${p.id}/competitors`).then((x) =>
        x.json()
      );
      map[p.id] = cr.competitors || [];
    }
    setByProduct(map);
  }

  useEffect(() => {
    refresh();
  }, []);

  async function patchCompetitor(id: number, patch: Partial<Competitor>) {
    await fetch(`/api/competitors/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    await refresh();
  }

  async function removeCompetitor(id: number) {
    await fetch(`/api/competitors/${id}`, { method: "DELETE" });
    await refresh();
  }

  async function addManual(productId: number) {
    if (!manualUrl) return;
    setBusy(true);
    try {
      await fetch("/api/competitors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: manualUrl, product_id: productId }),
      });
      setManualUrl("");
      setManualForId(null);
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  const approvedCount = Object.values(byProduct)
    .flat()
    .filter((c) => c.status === "approved").length;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        Approve, edit, or reject each candidate. Manual fallback available — if
        discovery missed someone, paste the URL directly. Only approved
        competitors will be monitored.
      </p>

      <div className="text-xs px-3 py-2 rounded-md border border-border bg-bg/40">
        <span className="text-accent">{approvedCount} approved</span>
        <span className="text-muted"> · approve at least one to activate</span>
      </div>

      <div className="space-y-3 max-h-[28rem] overflow-y-auto">
        {products.map((p) => {
          const items = byProduct[p.id] || [];
          return (
            <div
              key={p.id}
              className="rounded-md border border-border bg-bg/40 p-3"
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">
                    {p.title || p.url}
                  </div>
                  <div className="text-xs text-muted">
                    {items.length} candidates
                  </div>
                </div>
                <button
                  onClick={() =>
                    setManualForId(manualForId === p.id ? null : p.id)
                  }
                  className="text-xs px-2 py-1 rounded-md border border-border hover:border-accent/60 hover:text-accent shrink-0"
                >
                  + Add manually
                </button>
              </div>

              {manualForId === p.id && (
                <div className="flex gap-2 mb-2">
                  <input
                    type="url"
                    placeholder="https://www.amazon.in/competitor/dp/..."
                    value={manualUrl}
                    onChange={(e) => setManualUrl(e.target.value)}
                    className="flex-1 bg-bg border border-border rounded-md px-3 py-2 text-xs focus:border-accent focus:outline-none"
                  />
                  <button
                    onClick={() => addManual(p.id)}
                    disabled={busy || !manualUrl}
                    className="text-xs px-3 py-2 rounded-md bg-accent text-black hover:bg-accent/90 disabled:opacity-50"
                  >
                    Add
                  </button>
                </div>
              )}

              {!items.length && (
                <div className="text-xs text-muted italic px-2 py-3">
                  No candidates. Use "Add manually" above.
                </div>
              )}

              <ul className="space-y-1.5">
                {items.map((c) => (
                  <CompetitorRow
                    key={c.id}
                    c={c}
                    onPatch={(patch) => patchCompetitor(c.id, patch)}
                    onDelete={() => removeCompetitor(c.id)}
                  />
                ))}
              </ul>
            </div>
          );
        })}
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
          disabled={!approvedCount}
          className="flex-1 px-4 py-2.5 rounded-md bg-accent text-black font-medium text-sm hover:bg-accent/90 disabled:opacity-50"
        >
          {approvedCount
            ? `Continue with ${approvedCount} approved`
            : "Approve at least one to continue"}
        </button>
      </div>
    </div>
  );
}

function CompetitorRow({
  c,
  onPatch,
  onDelete,
}: {
  c: Competitor;
  onPatch: (patch: Partial<Competitor>) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(c.title || "");

  const statusStyle = (() => {
    switch (c.status) {
      case "approved":
        return "bg-accent/15 text-accent border-accent/30";
      case "rejected":
        return "bg-danger/10 text-danger border-danger/30 line-through opacity-70";
      default:
        return "bg-bg text-muted border-border";
    }
  })();

  return (
    <li className={`px-3 py-2 rounded border text-xs ${statusStyle}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          {editing ? (
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              onBlur={() => {
                onPatch({ title: label });
                setEditing(false);
              }}
              autoFocus
              className="w-full bg-bg border border-border rounded px-2 py-1 text-xs"
            />
          ) : (
            <div
              className="font-medium truncate cursor-pointer"
              onClick={() => setEditing(true)}
              title="Click to edit"
            >
              {c.title || c.url}
            </div>
          )}
          <a
            href={c.url}
            target="_blank"
            rel="noreferrer"
            className="block truncate text-[10px] opacity-70 hover:underline"
          >
            {c.url}
          </a>
          <div className="flex flex-wrap items-center gap-2 mt-1 text-[10px] opacity-80">
            <span className="uppercase tracking-wider">{c.platform}</span>
            {c.score > 0 && <span>match {Math.round(c.score * 100)}%</span>}
            {c.price && <span>{c.price}</span>}
            {c.rating && <span>★ {c.rating}</span>}
            {c.priority > 0 && (
              <span className="text-warn">priority</span>
            )}
          </div>
          {c.reasons && c.reasons.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1">
              {c.reasons.map((r, i) => (
                <span
                  key={i}
                  className="text-[10px] px-1.5 py-0.5 rounded border border-current opacity-70"
                >
                  {r}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {c.status !== "approved" && (
            <button
              onClick={() => onPatch({ status: "approved" })}
              className="text-[10px] px-1.5 py-0.5 rounded bg-accent/20 text-accent hover:bg-accent/30"
              title="Approve"
            >
              ✓
            </button>
          )}
          {c.status !== "rejected" && (
            <button
              onClick={() => onPatch({ status: "rejected" })}
              className="text-[10px] px-1.5 py-0.5 rounded border border-border hover:border-danger/60 hover:text-danger"
              title="Reject"
            >
              ✗
            </button>
          )}
          <button
            onClick={() =>
              onPatch({ priority: c.priority > 0 ? 0 : 1 })
            }
            className="text-[10px] px-1.5 py-0.5 rounded border border-border hover:border-warn/60 hover:text-warn"
            title="Toggle priority"
          >
            ★
          </button>
          <button
            onClick={onDelete}
            className="text-[10px] px-1.5 py-0.5 rounded border border-border hover:border-danger/60 hover:text-danger"
            title="Remove"
          >
            🗑
          </button>
        </div>
      </div>
    </li>
  );
}
