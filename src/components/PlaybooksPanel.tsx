"use client";

import { useEffect, useState } from "react";
import PlaybookBuilder, {
  ACTION_CATALOG,
  type Playbook,
  type PlaybookTriggerEvent,
} from "./PlaybookBuilder";

const SAMPLE: Playbook[] = [
  {
    id: "pb-sample-1",
    name: "High-priority Myntra strikes",
    enabled: true,
    trigger: {
      events: ["oos_detected"],
      scope: "platform",
      platform: "myntra",
      minDurationSec: 300,
      confidenceMin: 80,
      hoursOnly: "business",
    },
    actions: [
      { key: "slack", label: "Post to Slack", config: "#marketing-strikes" },
      { key: "meta", label: "Surge Meta Ads bid", config: "+40%" },
      { key: "google", label: "Bid up Google rival KWs", config: "+30%" },
      { key: "groq", label: "Generate AI ad copy", config: "3" },
    ],
    lastFired: "2026-05-09T14:21:00Z",
    fireCount: 24,
  },
  {
    id: "pb-sample-2",
    name: "Quick-commerce critical SKU",
    enabled: true,
    trigger: {
      events: ["oos_detected", "low_stock"],
      scope: "platform",
      platform: "blinkit",
      minDurationSec: 120,
      confidenceMin: 70,
      hoursOnly: "any",
    },
    actions: [
      { key: "whatsapp", label: "WhatsApp group", config: "Ops War Room" },
      { key: "amazon", label: "Increase Amazon SP", config: "+30%" },
      { key: "slack", label: "Post to Slack", config: "#strikes-zepto-blinkit" },
    ],
    lastFired: "2026-05-10T09:02:00Z",
    fireCount: 51,
  },
  {
    id: "pb-sample-3",
    name: "Pull bid surge on restock",
    enabled: true,
    trigger: {
      events: ["back_in_stock"],
      scope: "any",
      minDurationSec: 0,
      confidenceMin: 70,
      hoursOnly: "any",
    },
    actions: [
      { key: "meta", label: "Surge Meta Ads bid", config: "−40%" },
      { key: "google", label: "Bid up Google rival KWs", config: "−30%" },
      { key: "slack", label: "Post to Slack", config: "#marketing-strikes" },
    ],
    fireCount: 8,
  },
];

const EVENT_TONE: Record<PlaybookTriggerEvent, string> = {
  oos_detected: "border-brand-coral/40 text-brand-coral bg-brand-coral/10",
  low_stock: "border-warn/40 text-warn bg-warn/10",
  back_in_stock: "border-brand-teal/40 text-brand-teal bg-brand-mint/30",
  price_drop: "border-violet-400/40 text-violet-700 bg-violet-50",
};

const EVENT_LABEL: Record<PlaybookTriggerEvent, string> = {
  oos_detected: "OOS",
  low_stock: "Low stock",
  back_in_stock: "Restock",
  price_drop: "Price drop",
};

const ACTION_TONE: Record<string, string> = {
  sky: "border-sky-400/40 text-sky-700 bg-sky-50",
  accent: "border-brand-teal/40 text-brand-teal bg-brand-mint/30",
  blue: "border-blue-400/40 text-blue-700 bg-blue-50",
  yellow: "border-yellow-400/50 text-yellow-800 bg-yellow-50",
  orange: "border-orange-400/40 text-orange-700 bg-orange-50",
  violet: "border-violet-400/40 text-violet-700 bg-violet-50",
  muted: "border-hairline text-muted bg-soft",
};

function fmtDuration(sec: number) {
  if (sec < 60) return `${sec}s`;
  if (sec < 3600) return `${Math.floor(sec / 60)}m`;
  return `${Math.floor(sec / 3600)}h`;
}

export default function PlaybooksPanel() {
  const [books, setBooks] = useState<Playbook[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [tableMissing, setTableMissing] = useState(false);
  const [builder, setBuilder] = useState<Playbook | null | undefined>(
    undefined
  ); // undefined = closed, null = new, Playbook = edit

  async function refresh() {
    try {
      const r = await fetch("/api/playbooks").then((r) => r.json());
      const list: Playbook[] = (r?.playbooks || []) as Playbook[];
      setBooks(list);
      // If we have an empty list AND have never seeded, surface the samples
      // as a one-click "Load sample playbooks" affordance below — but keep
      // the panel functional even if the table doesn't exist yet.
      setTableMissing(false);
    } catch {
      setTableMissing(true);
    } finally {
      setLoaded(true);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function upsert(p: Playbook) {
    setBooks((bs) => {
      const idx = bs.findIndex((b) => b.id === p.id);
      if (idx === -1) return [p, ...bs];
      const out = [...bs];
      out[idx] = p;
      return out;
    });
    await fetch("/api/playbooks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(p),
    }).catch(() => {});
    refresh();
  }

  async function toggle(id: string) {
    const b = books.find((x) => x.id === id);
    if (!b) return;
    const next = { ...b, enabled: !b.enabled };
    setBooks((bs) => bs.map((x) => (x.id === id ? next : x)));
    await fetch(`/api/playbooks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(next),
    }).catch(() => {});
  }

  async function remove(id: string) {
    if (!confirm("Delete this playbook?")) return;
    setBooks((bs) => bs.filter((b) => b.id !== id));
    await fetch(`/api/playbooks/${id}`, { method: "DELETE" }).catch(() => {});
  }

  async function duplicate(b: Playbook) {
    const copy: Playbook = {
      ...b,
      id: `pb-${Date.now()}`,
      name: `${b.name} (copy)`,
      enabled: false,
      fireCount: 0,
      lastFired: undefined,
    };
    await upsert(copy);
  }

  async function loadSamples() {
    for (const s of SAMPLE) {
      await fetch("/api/playbooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(s),
      }).catch(() => {});
    }
    refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <div className="text-[11px] uppercase tracking-[0.16em] text-muted font-semibold">
            Automation
          </div>
          <h2 className="font-display text-4xl tracking-display text-ink mt-1">
            Playbooks
          </h2>
          <p className="text-sm text-muted mt-1.5">
            Automated rules that fire when a competitor goes out of stock, back
            in stock, low-stock, or drops price.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {books.length === 0 && loaded && (
            <button
              onClick={loadSamples}
              className="text-xs px-4 py-2 rounded-full bg-soft text-muted hover:text-ink"
            >
              Load sample playbooks
            </button>
          )}
          <button
            onClick={() => setBuilder(null)}
            className="text-sm px-5 py-2.5 rounded-full bg-ink text-white font-medium hover:bg-ink/90"
          >
            + New playbook
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {books.map((b) => (
          <section
            key={b.id}
            className={`rounded-clay border ${b.enabled ? "border-brand-teal/30 bg-card" : "border-hairline bg-panel"} overflow-hidden shadow-clay`}
          >
            <div className="px-5 py-3.5 border-b border-hairline flex items-center justify-between gap-3 bg-soft/60">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  onClick={() => toggle(b.id)}
                  className={`shrink-0 w-9 h-5 rounded-full transition relative ${b.enabled ? "bg-brand-teal" : "bg-hairline"}`}
                  aria-label={b.enabled ? "Disable" : "Enable"}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${b.enabled ? "translate-x-4" : ""}`}
                  />
                </button>
                <button
                  onClick={() => setBuilder(b)}
                  className="font-display text-base tracking-tightish truncate text-left text-ink hover:underline"
                >
                  {b.name}
                </button>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-muted">
                  Fired {b.fireCount}× ·{" "}
                  {b.lastFired
                    ? new Date(b.lastFired).toLocaleDateString()
                    : "never"}
                </span>
                <button
                  onClick={() => duplicate(b)}
                  title="Duplicate"
                  className="text-xs text-muted hover:text-ink w-7 h-7 grid place-items-center rounded-full hover:bg-canvas"
                >
                  ⎘
                </button>
                <button
                  onClick={() => setBuilder(b)}
                  title="Edit"
                  className="text-xs text-muted hover:text-ink w-7 h-7 grid place-items-center rounded-full hover:bg-canvas"
                >
                  ✎
                </button>
                <button
                  onClick={() => remove(b.id)}
                  title="Delete"
                  className="text-xs text-muted hover:text-brand-coral w-7 h-7 grid place-items-center rounded-full hover:bg-canvas"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <div className="text-[10px] uppercase tracking-[0.14em] text-muted mb-2">
                  When
                </div>
                <div className="rounded-2xl bg-soft border border-hairline p-3 text-sm space-y-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {b.trigger.events.map((ev) => (
                      <span
                        key={ev}
                        className={`text-[11px] px-2 py-0.5 rounded border font-medium ${EVENT_TONE[ev]}`}
                      >
                        {EVENT_LABEL[ev] || ev}
                      </span>
                    ))}
                    <span className="text-muted text-xs">on</span>
                    <span className="text-xs px-2 py-0.5 rounded border border-hairline bg-canvas text-ink font-medium">
                      {b.trigger.scope === "platform"
                        ? b.trigger.platform || "—"
                        : b.trigger.scope === "monitor"
                          ? `~${b.trigger.monitorLabel || "?"}`
                          : "any monitor"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap text-xs text-muted">
                    <span>after</span>
                    <span className="text-ink font-medium">
                      {fmtDuration(b.trigger.minDurationSec)}
                    </span>
                    <span>· confidence ≥</span>
                    <span className="text-ink font-medium">
                      {b.trigger.confidenceMin}%
                    </span>
                    {b.trigger.hoursOnly && b.trigger.hoursOnly !== "any" && (
                      <>
                        <span>·</span>
                        <span className="text-ink font-medium">
                          {b.trigger.hoursOnly === "business"
                            ? "Mon–Fri 9–7"
                            : "weekend"}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <div className="text-[10px] uppercase tracking-[0.14em] text-muted mb-2 flex items-center justify-between">
                  <span>Then</span>
                  <span className="text-muted normal-case tracking-normal">
                    {b.actions.length} action
                    {b.actions.length === 1 ? "" : "s"}
                  </span>
                </div>
                <ol className="space-y-1.5">
                  {b.actions.map((a, i) => {
                    const cat = ACTION_CATALOG.find((c) => c.key === a.key);
                    return (
                      <li
                        key={i}
                        className={`rounded-2xl border px-3 py-2 text-sm flex items-center justify-between gap-2 ${ACTION_TONE[cat?.tone || "muted"]}`}
                      >
                        <span className="font-medium flex items-center gap-2">
                          <span className="text-[10px] font-mono opacity-60">
                            {i + 1}
                          </span>
                          {a.label}
                        </span>
                        {a.config && (
                          <span className="font-mono text-xs">{a.config}</span>
                        )}
                      </li>
                    );
                  })}
                  {b.actions.length === 0 && (
                    <li className="text-xs text-muted italic px-3 py-2">
                      No actions yet —{" "}
                      <button
                        onClick={() => setBuilder(b)}
                        className="underline hover:text-ink"
                      >
                        edit playbook
                      </button>
                      .
                    </li>
                  )}
                </ol>
              </div>
            </div>
          </section>
        ))}
      </div>

      {!books.length && loaded && (
        <div className="rounded-clay border border-dashed border-hairline p-12 text-center text-muted">
          {tableMissing
            ? "Playbooks table not found — push the latest Supabase migration to enable persistence."
            : "No playbooks yet. Click \"New playbook\" or \"Load sample playbooks\"."}
        </div>
      )}

      {builder !== undefined && (
        <PlaybookBuilder
          initial={builder}
          onClose={() => setBuilder(undefined)}
          onSave={upsert}
        />
      )}
    </div>
  );
}
