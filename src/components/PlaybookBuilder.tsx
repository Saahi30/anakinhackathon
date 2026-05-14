"use client";

import { useEffect, useState } from "react";

export type PlaybookTriggerEvent =
  | "oos_detected"
  | "low_stock"
  | "back_in_stock"
  | "price_drop";

export type PlaybookTrigger = {
  events: PlaybookTriggerEvent[];
  scope: "any" | "platform" | "monitor";
  platform?: string;
  monitorLabel?: string;
  minDurationSec: number;
  confidenceMin: number;
  hoursOnly?: "any" | "business" | "weekend";
};

export type PlaybookAction = {
  key: string;
  label: string;
  config?: string;
};

export type Playbook = {
  id: string;
  name: string;
  enabled: boolean;
  trigger: PlaybookTrigger;
  actions: PlaybookAction[];
  lastFired?: string;
  fireCount: number;
};

export const ACTION_CATALOG: {
  key: string;
  label: string;
  tone: string;
  configHint?: string;
  configPlaceholder?: string;
}[] = [
  { key: "slack", label: "Post to Slack", tone: "sky", configHint: "Channel", configPlaceholder: "#marketing-strikes" },
  { key: "whatsapp", label: "WhatsApp group", tone: "accent", configHint: "Group name", configPlaceholder: "Ops War Room" },
  { key: "meta", label: "Surge Meta Ads bid", tone: "blue", configHint: "Bid lift", configPlaceholder: "+40%" },
  { key: "google", label: "Bid up Google rival KWs", tone: "yellow", configHint: "Adjustment", configPlaceholder: "+30%" },
  { key: "amazon", label: "Increase Amazon SP", tone: "orange", configHint: "Bid lift", configPlaceholder: "+25%" },
  { key: "groq", label: "Generate AI ad copy", tone: "violet", configHint: "Variants", configPlaceholder: "3" },
  { key: "email", label: "Send email digest entry", tone: "muted" },
  { key: "report", label: "Add to weekly digest", tone: "muted" },
  { key: "linear", label: "Open Linear issue", tone: "violet", configHint: "Project", configPlaceholder: "MKT" },
  { key: "log", label: "Log only (no alert)", tone: "muted" },
];

const EVENT_OPTIONS: { key: PlaybookTriggerEvent; label: string; tone: string }[] = [
  { key: "oos_detected", label: "Out of stock", tone: "danger" },
  { key: "low_stock", label: "Low stock", tone: "warn" },
  { key: "back_in_stock", label: "Back in stock", tone: "accent" },
  { key: "price_drop", label: "Price drop", tone: "violet" },
];

const PLATFORMS = ["amazon", "myntra", "ajio", "blinkit", "zepto"];

const toneClass: Record<string, string> = {
  sky: "border-sky-400/40 text-sky-700 bg-sky-50",
  accent: "border-brand-teal/40 text-brand-teal bg-brand-mint/30",
  blue: "border-blue-400/40 text-blue-700 bg-blue-50",
  yellow: "border-yellow-400/50 text-yellow-800 bg-yellow-50",
  orange: "border-orange-400/40 text-orange-700 bg-orange-50",
  violet: "border-violet-400/40 text-violet-700 bg-violet-50",
  danger: "border-brand-coral/40 text-brand-coral bg-brand-coral/10",
  warn: "border-warn/40 text-warn bg-warn/10",
  muted: "border-hairline text-muted bg-soft",
};

function fmtDuration(sec: number) {
  if (sec < 60) return `${sec}s`;
  if (sec < 3600) return `${Math.floor(sec / 60)}m`;
  return `${Math.floor(sec / 3600)}h`;
}

type Step = "name" | "trigger" | "conditions" | "actions" | "review";
const STEPS: { key: Step; label: string }[] = [
  { key: "name", label: "Name" },
  { key: "trigger", label: "Trigger" },
  { key: "conditions", label: "Conditions" },
  { key: "actions", label: "Actions" },
  { key: "review", label: "Review" },
];

export const EMPTY_PLAYBOOK: Playbook = {
  id: "",
  name: "",
  enabled: true,
  trigger: {
    events: ["oos_detected"],
    scope: "any",
    minDurationSec: 60,
    confidenceMin: 70,
    hoursOnly: "any",
  },
  actions: [],
  fireCount: 0,
};

export default function PlaybookBuilder({
  initial,
  onClose,
  onSave,
}: {
  initial: Playbook | null;
  onClose: () => void;
  onSave: (p: Playbook) => void;
}) {
  const [step, setStep] = useState<Step>("name");
  const [draft, setDraft] = useState<Playbook>(() =>
    initial
      ? JSON.parse(JSON.stringify(initial))
      : { ...EMPTY_PLAYBOOK, id: `pb-${Date.now()}` }
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const canAdvance = (() => {
    if (step === "name") return draft.name.trim().length > 0;
    if (step === "trigger") return draft.trigger.events.length > 0;
    if (step === "actions") return draft.actions.length > 0;
    return true;
  })();

  function updateTrigger(patch: Partial<PlaybookTrigger>) {
    setDraft((d) => ({ ...d, trigger: { ...d.trigger, ...patch } }));
  }

  function toggleEvent(ev: PlaybookTriggerEvent) {
    setDraft((d) => {
      const has = d.trigger.events.includes(ev);
      const events = has
        ? d.trigger.events.filter((x) => x !== ev)
        : [...d.trigger.events, ev];
      return { ...d, trigger: { ...d.trigger, events } };
    });
  }

  function addAction(cat: (typeof ACTION_CATALOG)[number]) {
    setDraft((d) => ({
      ...d,
      actions: [
        ...d.actions,
        {
          key: cat.key,
          label: cat.label,
          config: cat.configPlaceholder || undefined,
        },
      ],
    }));
  }

  function removeAction(idx: number) {
    setDraft((d) => ({
      ...d,
      actions: d.actions.filter((_, i) => i !== idx),
    }));
  }

  function updateAction(idx: number, patch: Partial<PlaybookAction>) {
    setDraft((d) => ({
      ...d,
      actions: d.actions.map((a, i) => (i === idx ? { ...a, ...patch } : a)),
    }));
  }

  const currentIdx = STEPS.findIndex((s) => s.key === step);
  function next() {
    if (currentIdx < STEPS.length - 1) setStep(STEPS[currentIdx + 1].key);
  }
  function back() {
    if (currentIdx > 0) setStep(STEPS[currentIdx - 1].key);
  }

  function save() {
    onSave({ ...draft, name: draft.name.trim() || "Untitled playbook" });
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm grid place-items-center p-6"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-panel rounded-clay border border-hairline shadow-clay-lift w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-7 py-5 border-b border-hairline bg-soft">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[11px] uppercase tracking-[0.16em] text-muted font-semibold">
                {initial ? "Edit playbook" : "New playbook"}
              </div>
              <div className="font-display text-2xl tracking-display text-ink mt-0.5">
                Playbook builder
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-muted hover:text-ink w-8 h-8 grid place-items-center rounded-full hover:bg-canvas"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
          <div className="mt-5 flex items-center gap-2 flex-wrap">
            {STEPS.map((s, i) => {
              const isActive = s.key === step;
              const isDone = i < currentIdx;
              return (
                <button
                  key={s.key}
                  onClick={() => setStep(s.key)}
                  className={`text-xs px-3 py-1 rounded-full transition inline-flex items-center gap-1.5 ${
                    isActive
                      ? "bg-ink text-white"
                      : isDone
                        ? "bg-brand-mint/40 text-brand-teal"
                        : "bg-canvas text-muted hover:text-ink border border-hairline"
                  }`}
                >
                  <span className="text-[10px] font-mono opacity-70">
                    {i + 1}
                  </span>
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-7 py-6 space-y-4">
          {step === "name" && (
            <div className="space-y-4">
              <div>
                <label className="text-xs text-muted">Playbook name</label>
                <input
                  autoFocus
                  value={draft.name}
                  onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                  placeholder="e.g. High-priority Myntra strikes"
                  className="mt-1 w-full bg-canvas border border-hairline rounded-2xl px-4 py-3 text-base text-ink focus:border-ink focus:outline-none"
                />
                <div className="text-[10px] text-muted mt-1">
                  Names are shown in the live feed and Slack messages when this
                  playbook fires.
                </div>
              </div>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={draft.enabled}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, enabled: e.target.checked }))
                  }
                  className="mt-1 w-4 h-4 accent-accent"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-ink">
                    Enabled on save
                  </div>
                  <div className="text-xs text-muted mt-0.5">
                    Uncheck to save as a draft. You can flip it on later.
                  </div>
                </div>
              </label>
            </div>
          )}

          {step === "trigger" && (
            <div className="space-y-5">
              <div>
                <div className="text-xs text-muted mb-2">
                  Fire when any of these events happen
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {EVENT_OPTIONS.map((ev) => {
                    const on = draft.trigger.events.includes(ev.key);
                    return (
                      <button
                        key={ev.key}
                        onClick={() => toggleEvent(ev.key)}
                        className={`text-xs px-3 py-1.5 rounded-full border transition ${
                          on
                            ? toneClass[ev.tone]
                            : "border-hairline text-muted bg-canvas hover:text-ink"
                        }`}
                      >
                        {on ? "✓ " : "+ "}
                        {ev.label}
                      </button>
                    );
                  })}
                </div>
                {draft.trigger.events.length === 0 && (
                  <div className="text-[10px] text-brand-coral mt-1">
                    Select at least one event.
                  </div>
                )}
              </div>

              <div>
                <div className="text-xs text-muted mb-2">Scope</div>
                <div className="flex items-center gap-2">
                  {(["any", "platform", "monitor"] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => updateTrigger({ scope: s })}
                      className={`text-xs px-3 py-1.5 rounded-full transition ${
                        draft.trigger.scope === s
                          ? "bg-ink text-white"
                          : "bg-canvas text-muted hover:text-ink border border-hairline"
                      }`}
                    >
                      {s === "any"
                        ? "Any monitor"
                        : s === "platform"
                          ? "Specific platform"
                          : "Specific monitor"}
                    </button>
                  ))}
                </div>
                {draft.trigger.scope === "platform" && (
                  <select
                    value={draft.trigger.platform || ""}
                    onChange={(e) => updateTrigger({ platform: e.target.value })}
                    className="mt-3 bg-canvas border border-hairline rounded-2xl px-4 py-2 text-sm text-ink focus:border-ink focus:outline-none"
                  >
                    <option value="">— pick a platform —</option>
                    {PLATFORMS.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                )}
                {draft.trigger.scope === "monitor" && (
                  <input
                    value={draft.trigger.monitorLabel || ""}
                    onChange={(e) =>
                      updateTrigger({ monitorLabel: e.target.value })
                    }
                    placeholder="Match by monitor label substring (e.g. 'protein powder')"
                    className="mt-3 w-full bg-canvas border border-hairline rounded-2xl px-4 py-2 text-sm text-ink focus:border-ink focus:outline-none"
                  />
                )}
              </div>
            </div>
          )}

          {step === "conditions" && (
            <div className="space-y-5">
              <div>
                <div className="text-xs text-muted mb-2">
                  Minimum signal duration before firing
                </div>
                <input
                  type="range"
                  min={0}
                  max={3600}
                  step={30}
                  value={draft.trigger.minDurationSec}
                  onChange={(e) =>
                    updateTrigger({ minDurationSec: Number(e.target.value) })
                  }
                  className="w-full accent-ink"
                />
                <div className="text-xs text-muted mt-1">
                  {draft.trigger.minDurationSec === 0
                    ? "Fire immediately"
                    : `Wait at least ${fmtDuration(draft.trigger.minDurationSec)} after the signal — avoids flapping listings.`}
                </div>
              </div>

              <div>
                <div className="text-xs text-muted mb-2">
                  Minimum detection confidence
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={draft.trigger.confidenceMin}
                  onChange={(e) =>
                    updateTrigger({ confidenceMin: Number(e.target.value) })
                  }
                  className="w-full accent-ink"
                />
                <div className="text-xs text-muted mt-1">
                  {draft.trigger.confidenceMin}% — higher numbers mean fewer
                  false positives but you'll miss some real strikes.
                </div>
              </div>

              <div>
                <div className="text-xs text-muted mb-2">Active hours</div>
                <div className="flex items-center gap-2">
                  {(
                    [
                      { k: "any", label: "Always" },
                      { k: "business", label: "Business hours (Mon-Fri 9-7)" },
                      { k: "weekend", label: "Weekend" },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.k}
                      onClick={() => updateTrigger({ hoursOnly: opt.k })}
                      className={`text-xs px-3 py-1.5 rounded-full transition ${
                        (draft.trigger.hoursOnly || "any") === opt.k
                          ? "bg-ink text-white"
                          : "bg-canvas text-muted hover:text-ink border border-hairline"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === "actions" && (
            <div className="space-y-4">
              <div className="text-xs text-muted">
                Add one or more actions. They run in order when the trigger
                fires.
              </div>
              <div className="space-y-2">
                {draft.actions.map((a, i) => {
                  const cat = ACTION_CATALOG.find((c) => c.key === a.key);
                  return (
                    <div
                      key={i}
                      className={`rounded-2xl border px-4 py-3 ${toneClass[cat?.tone || "muted"]} flex items-center gap-2`}
                    >
                      <span className="text-[10px] font-mono opacity-70 shrink-0">
                        {i + 1}
                      </span>
                      <span className="font-medium text-sm flex-1 truncate">
                        {a.label}
                      </span>
                      {cat?.configHint && (
                        <input
                          value={a.config || ""}
                          onChange={(e) =>
                            updateAction(i, { config: e.target.value })
                          }
                          placeholder={cat.configPlaceholder}
                          className="text-xs font-mono px-2 py-1 rounded bg-canvas/70 border border-hairline w-32 focus:outline-none focus:border-ink"
                        />
                      )}
                      <button
                        onClick={() => removeAction(i)}
                        className="text-xs text-muted hover:text-brand-coral w-6 h-6 grid place-items-center rounded-full"
                        aria-label="Remove action"
                      >
                        ✕
                      </button>
                    </div>
                  );
                })}
                {draft.actions.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-hairline px-4 py-6 text-center text-xs text-muted">
                    No actions yet — pick one below.
                  </div>
                )}
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted mb-2">
                  Add action
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {ACTION_CATALOG.map((c) => (
                    <button
                      key={c.key}
                      onClick={() => addAction(c)}
                      className={`text-xs px-3 py-2 rounded-2xl border text-left transition ${toneClass[c.tone]} hover:shadow-clay`}
                    >
                      <div className="font-medium">+ {c.label}</div>
                      {c.configHint && (
                        <div className="opacity-70 text-[10px] mt-0.5">
                          {c.configHint}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === "review" && (
            <div className="space-y-4">
              <div className="rounded-clay bg-soft border border-hairline p-5">
                <div className="text-[10px] uppercase tracking-[0.14em] text-muted">
                  Name
                </div>
                <div className="font-display text-xl text-ink mt-1">
                  {draft.name || "(unnamed)"}
                </div>
                <div className="text-xs text-muted mt-1">
                  {draft.enabled ? "Will be enabled on save." : "Saved as draft."}
                </div>
              </div>
              <div className="rounded-clay bg-soft border border-hairline p-5 space-y-2">
                <div className="text-[10px] uppercase tracking-[0.14em] text-muted">
                  When
                </div>
                <div className="flex items-center gap-2 flex-wrap text-sm text-ink">
                  <span>Events:</span>
                  {draft.trigger.events.map((ev) => {
                    const opt = EVENT_OPTIONS.find((o) => o.key === ev);
                    return (
                      <span
                        key={ev}
                        className={`text-xs px-2 py-0.5 rounded border ${toneClass[opt?.tone || "muted"]}`}
                      >
                        {opt?.label || ev}
                      </span>
                    );
                  })}
                </div>
                <div className="text-sm text-ink">
                  Scope:{" "}
                  <span className="font-mono text-xs">
                    {draft.trigger.scope === "platform"
                      ? `platform=${draft.trigger.platform || "?"}`
                      : draft.trigger.scope === "monitor"
                        ? `monitor~${draft.trigger.monitorLabel || "?"}`
                        : "any"}
                  </span>
                </div>
                <div className="text-sm text-ink">
                  After {fmtDuration(draft.trigger.minDurationSec)} · confidence
                  ≥ {draft.trigger.confidenceMin}% ·{" "}
                  {draft.trigger.hoursOnly === "business"
                    ? "Mon–Fri 9–7"
                    : draft.trigger.hoursOnly === "weekend"
                      ? "weekends"
                      : "always"}
                </div>
              </div>
              <div className="rounded-clay bg-soft border border-hairline p-5">
                <div className="text-[10px] uppercase tracking-[0.14em] text-muted mb-2">
                  Then
                </div>
                <ol className="space-y-1.5 text-sm text-ink">
                  {draft.actions.map((a, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-muted">
                        {i + 1}.
                      </span>
                      <span>{a.label}</span>
                      {a.config && (
                        <span className="text-xs font-mono text-muted">
                          ({a.config})
                        </span>
                      )}
                    </li>
                  ))}
                  {draft.actions.length === 0 && (
                    <li className="text-xs text-brand-coral">
                      No actions — playbook will do nothing.
                    </li>
                  )}
                </ol>
              </div>
            </div>
          )}
        </div>

        <div className="px-7 py-4 border-t border-hairline flex items-center justify-between gap-2 bg-soft/60">
          <button
            onClick={back}
            disabled={currentIdx === 0}
            className="text-xs px-4 py-2 rounded-full bg-canvas text-ink border border-hairline hover:bg-soft disabled:opacity-30"
          >
            ← Back
          </button>
          <div className="text-[10px] text-muted">
            Step {currentIdx + 1} / {STEPS.length}
          </div>
          {step === "review" ? (
            <button
              onClick={save}
              disabled={draft.actions.length === 0}
              className="text-sm px-5 py-2 rounded-full bg-ink text-white font-medium hover:bg-ink/90 disabled:opacity-50"
            >
              {initial ? "Save changes" : "Create playbook"}
            </button>
          ) : (
            <button
              onClick={next}
              disabled={!canAdvance}
              className="text-sm px-5 py-2 rounded-full bg-ink text-white font-medium hover:bg-ink/90 disabled:opacity-50"
            >
              Next →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
