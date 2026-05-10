"use client";

import { useState } from "react";

type Trigger = {
  scope: "any" | "platform" | "monitor";
  platform?: string;
  monitorLabel?: string;
  minDurationSec: number;
  confidenceMin: number;
  hoursOnly?: "any" | "business" | "weekend";
};

type Action = {
  key: string;
  label: string;
  config?: string;
};

type Playbook = {
  id: string;
  name: string;
  enabled: boolean;
  trigger: Trigger;
  actions: Action[];
  lastFired?: string;
  fireCount: number;
};

const SAMPLE: Playbook[] = [
  {
    id: "pb-1",
    name: "High-priority Myntra strikes",
    enabled: true,
    trigger: {
      scope: "platform",
      platform: "myntra",
      minDurationSec: 300,
      confidenceMin: 80,
      hoursOnly: "business",
    },
    actions: [
      { key: "slack", label: "Post to #marketing-strikes" },
      { key: "meta", label: "Surge Meta Ads bid", config: "+40%" },
      { key: "google", label: "Bid up rival keywords", config: "12 KWs" },
      { key: "groq", label: "Generate ad copy with Groq" },
    ],
    lastFired: "2026-05-09T14:21:00Z",
    fireCount: 24,
  },
  {
    id: "pb-2",
    name: "Quick-commerce critical SKU",
    enabled: true,
    trigger: {
      scope: "platform",
      platform: "blinkit",
      minDurationSec: 120,
      confidenceMin: 70,
      hoursOnly: "any",
    },
    actions: [
      { key: "whatsapp", label: "WhatsApp ops group" },
      { key: "amazon", label: "Increase Amazon SP bid", config: "+30%" },
      { key: "slack", label: "Post to #strikes-zepto-blinkit" },
    ],
    lastFired: "2026-05-10T09:02:00Z",
    fireCount: 51,
  },
  {
    id: "pb-3",
    name: "Weekend low-priority audit",
    enabled: false,
    trigger: {
      scope: "any",
      minDurationSec: 1800,
      confidenceMin: 60,
      hoursOnly: "weekend",
    },
    actions: [
      { key: "log", label: "Log only (no alert)" },
      { key: "report", label: "Include in Monday digest" },
    ],
    fireCount: 0,
  },
];

const ACTION_CATALOG: { key: string; label: string; tone: string }[] = [
  { key: "slack", label: "Post to Slack", tone: "sky" },
  { key: "whatsapp", label: "WhatsApp group", tone: "accent" },
  { key: "meta", label: "Surge Meta Ads bid", tone: "blue" },
  { key: "google", label: "Bid up Google rival KWs", tone: "yellow" },
  { key: "amazon", label: "Increase Amazon SP", tone: "orange" },
  { key: "groq", label: "Generate Groq ad copy", tone: "violet" },
  { key: "report", label: "Add to weekly digest", tone: "muted" },
];

const toneClass: Record<string, string> = {
  sky: "border-sky-400/40 text-sky-300 bg-sky-400/5",
  accent: "border-accent/40 text-accent bg-accent/5",
  blue: "border-blue-400/40 text-blue-300 bg-blue-400/5",
  yellow: "border-yellow-400/40 text-yellow-300 bg-yellow-400/5",
  orange: "border-orange-400/40 text-orange-300 bg-orange-400/5",
  violet: "border-violet-400/40 text-violet-300 bg-violet-400/5",
  muted: "border-border text-muted bg-bg/40",
};

function fmtDuration(sec: number) {
  if (sec < 60) return `${sec}s`;
  if (sec < 3600) return `${Math.floor(sec / 60)}m`;
  return `${Math.floor(sec / 3600)}h`;
}

export default function PlaybooksPanel() {
  const [books, setBooks] = useState<Playbook[]>(SAMPLE);
  const [editing, setEditing] = useState<string | null>(null);

  const toggle = (id: string) =>
    setBooks((bs) =>
      bs.map((b) => (b.id === id ? { ...b, enabled: !b.enabled } : b))
    );

  const remove = (id: string) =>
    setBooks((bs) => bs.filter((b) => b.id !== id));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Playbooks</h2>
          <p className="text-sm text-muted mt-0.5">
            Automated rules that fire when a competitor goes out of stock.
          </p>
        </div>
        <button
          onClick={() => {
            const nb: Playbook = {
              id: `pb-${Date.now()}`,
              name: "New playbook",
              enabled: false,
              trigger: {
                scope: "any",
                minDurationSec: 60,
                confidenceMin: 70,
                hoursOnly: "any",
              },
              actions: [],
              fireCount: 0,
            };
            setBooks((bs) => [nb, ...bs]);
            setEditing(nb.id);
          }}
          className="text-sm px-4 py-2 rounded-md bg-accent text-black font-medium hover:bg-accent/90"
        >
          + New playbook
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {books.map((b) => {
          const isEditing = editing === b.id;
          return (
            <section
              key={b.id}
              className={`rounded-xl border ${b.enabled ? "border-accent/30" : "border-border"} bg-panel overflow-hidden`}
            >
              <div className="px-5 py-3 border-b border-border flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    onClick={() => toggle(b.id)}
                    className={`shrink-0 w-9 h-5 rounded-full transition relative ${b.enabled ? "bg-accent" : "bg-border"}`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${b.enabled ? "translate-x-4" : ""}`}
                    />
                  </button>
                  {isEditing ? (
                    <input
                      autoFocus
                      value={b.name}
                      onChange={(e) =>
                        setBooks((bs) =>
                          bs.map((x) =>
                            x.id === b.id ? { ...x, name: e.target.value } : x
                          )
                        )
                      }
                      onBlur={() => setEditing(null)}
                      onKeyDown={(e) => e.key === "Enter" && setEditing(null)}
                      className="bg-bg border border-border rounded px-2 py-1 text-sm font-medium"
                    />
                  ) : (
                    <button
                      onClick={() => setEditing(b.id)}
                      className="font-medium text-sm truncate text-left"
                    >
                      {b.name}
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-muted">
                    Fired {b.fireCount}× ·{" "}
                    {b.lastFired
                      ? new Date(b.lastFired).toLocaleDateString()
                      : "never"}
                  </span>
                  <button
                    onClick={() => remove(b.id)}
                    className="text-xs text-muted hover:text-danger"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="p-5 space-y-4">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-muted mb-2">
                    When
                  </div>
                  <div className="rounded-lg border border-border bg-bg/40 p-3 text-sm space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Pill>Competitor goes</Pill>
                      <Pill tone="danger">OUT OF STOCK</Pill>
                      <Pill>on</Pill>
                      <Pill tone="accent">
                        {b.trigger.scope === "platform"
                          ? b.trigger.platform?.toUpperCase()
                          : b.trigger.scope === "monitor"
                            ? b.trigger.monitorLabel
                            : "any platform"}
                      </Pill>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Pill>for at least</Pill>
                      <Pill tone="warn">
                        {fmtDuration(b.trigger.minDurationSec)}
                      </Pill>
                      <Pill>with confidence ≥</Pill>
                      <Pill tone="warn">{b.trigger.confidenceMin}%</Pill>
                    </div>
                    {b.trigger.hoursOnly && b.trigger.hoursOnly !== "any" && (
                      <div className="flex items-center gap-2 flex-wrap">
                        <Pill>during</Pill>
                        <Pill tone="violet">
                          {b.trigger.hoursOnly === "business"
                            ? "Mon–Fri 9am–7pm"
                            : "Weekend hours"}
                        </Pill>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] uppercase tracking-wider text-muted mb-2 flex items-center justify-between">
                    <span>Then</span>
                    <span className="text-muted normal-case tracking-normal">
                      {b.actions.length} action
                      {b.actions.length === 1 ? "" : "s"}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {b.actions.map((a, i) => {
                      const cat = ACTION_CATALOG.find((c) => c.key === a.key);
                      return (
                        <div
                          key={i}
                          className={`rounded-md border px-3 py-2 text-sm flex items-center justify-between ${toneClass[cat?.tone || "muted"]}`}
                        >
                          <span className="font-medium">{a.label}</span>
                          {a.config && (
                            <span className="font-mono text-xs">
                              {a.config}
                            </span>
                          )}
                        </div>
                      );
                    })}
                    {b.actions.length === 0 && (
                      <div className="text-xs text-muted italic">
                        No actions yet — add one below.
                      </div>
                    )}
                  </div>
                  <div className="mt-3 flex items-center gap-1.5 flex-wrap">
                    {ACTION_CATALOG.map((c) => (
                      <button
                        key={c.key}
                        onClick={() =>
                          setBooks((bs) =>
                            bs.map((x) =>
                              x.id === b.id
                                ? {
                                    ...x,
                                    actions: [
                                      ...x.actions,
                                      { key: c.key, label: c.label },
                                    ],
                                  }
                                : x
                            )
                          )
                        }
                        className="text-[10px] px-2 py-1 rounded border border-border text-muted hover:text-gray-200 hover:border-accent/50"
                      >
                        + {c.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          );
        })}
      </div>

      {!books.length && (
        <div className="rounded-xl border border-dashed border-border p-12 text-center text-muted">
          No playbooks yet. Click "New playbook" to create your first rule.
        </div>
      )}
    </div>
  );
}

function Pill({
  children,
  tone = "default",
}: {
  children: React.ReactNode;
  tone?: "default" | "danger" | "accent" | "warn" | "violet";
}) {
  const cls =
    tone === "danger"
      ? "bg-danger/10 text-danger border-danger/30"
      : tone === "accent"
        ? "bg-accent/10 text-accent border-accent/30"
        : tone === "warn"
          ? "bg-warn/10 text-warn border-warn/30"
          : tone === "violet"
            ? "bg-violet-400/10 text-violet-300 border-violet-400/30"
            : "bg-bg text-gray-300 border-border";
  return (
    <span
      className={`text-xs px-2 py-0.5 rounded border font-medium ${cls}`}
    >
      {children}
    </span>
  );
}
