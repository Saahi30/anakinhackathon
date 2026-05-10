"use client";

import { useEffect, useState } from "react";
import StrikeROI, { mockROI } from "./StrikeROI";
import AdCreativePanel from "./AdCreativePanel";
import type { Monitor, Event } from "./Dashboard";

function fmtElapsed(sec: number) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  return `${m}m ${s}s`;
}

const ACTIONS: {
  key: string;
  label: string;
  desc: string;
  tone: "primary" | "secondary" | "danger";
}[] = [
  {
    key: "surge_meta",
    label: "Surge Meta Ads bid +40%",
    desc: "Capture homeless traffic on Instagram + FB",
    tone: "primary",
  },
  {
    key: "surge_google",
    label: "Surge Google Ads on rival keywords",
    desc: "Bid up brand-vs-rival queries",
    tone: "primary",
  },
  {
    key: "amazon_sp",
    label: "Increase Amazon Sponsored Products",
    desc: "Push our SKU higher in PDP carousel",
    tone: "primary",
  },
  {
    key: "slack_marketing",
    label: "Ping #marketing on Slack",
    desc: "Brief the team manually",
    tone: "secondary",
  },
  {
    key: "dismiss",
    label: "Dismiss strike",
    desc: "False alarm or low priority",
    tone: "danger",
  },
];

export default function WarRoom({
  monitor,
  event,
  onClose,
}: {
  monitor: Monitor;
  event: Event | null;
  onClose: () => void;
}) {
  const [now, setNow] = useState(() => Date.now());
  const [fired, setFired] = useState<Record<string, boolean>>({});
  const [adCopy, setAdCopy] = useState<string | null>(null);
  const [adCopyLoading, setAdCopyLoading] = useState(false);

  const oosAt = monitor.last_oos_at || event?.created_at || new Date().toISOString();
  const startedAt = new Date(oosAt + (oosAt.endsWith("Z") ? "" : "Z")).getTime();
  const elapsedSec = Math.max(0, Math.floor((now - startedAt) / 1000));
  const totalSec = 240 * 60;
  const pct = Math.min(100, (elapsedSec / totalSec) * 100);
  const roi = mockROI(monitor.id);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Try to surface ad copy from related events when available
  useEffect(() => {
    setAdCopy(null);
    fetch(`/api/events?limit=20`)
      .then((r) => r.json())
      .then((d) => {
        const ev = (d.events || []).find(
          (e: Event) =>
            e.kind === "ad_copy" && e.monitor_id === monitor.id && e.message
        );
        if (ev?.message) setAdCopy(ev.message);
      })
      .catch(() => {});
  }, [monitor.id]);

  async function regenerateAdCopy() {
    setAdCopyLoading(true);
    try {
      // Simulated regenerate — small delay then a deterministic new variant
      await new Promise((r) => setTimeout(r, 900));
      const variants = [
        `Don't wait — get the same ${monitor.platform} drop, in stock now. Ships today.`,
        `Out at the other guys? We've got it, fully stocked. Tap to grab yours.`,
        `Their loss, your win. The ${monitor.label || "product"} you want — available right now.`,
      ];
      setAdCopy(variants[Math.floor(Math.random() * variants.length)]);
    } finally {
      setAdCopyLoading(false);
    }
  }

  const fire = (key: string) => setFired((s) => ({ ...s, [key]: true }));

  const tone =
    pct < 33
      ? "from-accent to-emerald-400"
      : pct < 66
        ? "from-warn to-yellow-300"
        : "from-danger to-rose-400";

  return (
    <div className="fixed inset-0 z-[60] bg-[#070809]/95 backdrop-blur-md overflow-y-auto">
      <div className="min-h-screen p-6">
        <div className="max-w-7xl mx-auto">
          {/* Top bar */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-3 h-3 rounded-full bg-danger animate-ping absolute inset-0" />
                <div className="w-3 h-3 rounded-full bg-danger relative" />
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-widest text-danger font-bold">
                  WAR ROOM · ACTIVE STRIKE
                </div>
                <div className="text-xs text-muted">
                  Esc to close · {monitor.platform.toUpperCase()} · monitor #{monitor.id}
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-xs text-muted hover:text-gray-200 px-3 py-1.5 rounded border border-border"
            >
              Close ✕
            </button>
          </div>

          {/* Hero countdown */}
          <div className="rounded-2xl border border-danger/40 bg-gradient-to-br from-danger/10 via-bg/30 to-transparent p-8 mb-6">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-6 items-end">
              <div>
                <div className="text-xs uppercase tracking-widest text-danger font-semibold mb-3">
                  Competitor out of stock
                </div>
                <h2 className="text-3xl font-semibold text-gray-100 mb-1 break-words">
                  {monitor.label || monitor.url}
                </h2>
                <a
                  href={monitor.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-muted hover:text-accent break-all"
                >
                  {monitor.url}
                </a>
              </div>
              <div className="text-right">
                <div className="text-xs uppercase tracking-widest text-muted">
                  Strike open for
                </div>
                <div className="font-mono text-5xl font-semibold text-danger tabular-nums">
                  {fmtElapsed(elapsedSec)}
                </div>
                <div className="text-xs text-muted mt-1">
                  Est. restock in ~{Math.max(0, Math.floor((totalSec - elapsedSec) / 60))}m
                </div>
              </div>
            </div>
            <div className="mt-6 h-2 rounded-full bg-bg/60 overflow-hidden">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${tone} transition-all`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between text-[10px] uppercase tracking-wider">
              <span className="text-accent">Fresh window</span>
              <span className="text-warn">Fading</span>
              <span className="text-danger">Closing</span>
            </div>
          </div>

          {/* Two columns */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6">
            {/* LEFT: Actions + Ad copy */}
            <div className="space-y-6">
              {/* Ad copy */}
              <section className="rounded-xl border border-violet-500/30 bg-gradient-to-br from-violet-500/5 to-transparent">
                <div className="px-5 py-3 border-b border-violet-500/20 flex items-center justify-between">
                  <h3 className="text-xs uppercase tracking-wider text-violet-300 font-semibold">
                    Suggested ad copy · Groq Llama 3.3 70B
                  </h3>
                  <button
                    onClick={regenerateAdCopy}
                    disabled={adCopyLoading}
                    className="text-[10px] uppercase tracking-wider text-violet-300 hover:text-violet-200 disabled:opacity-50"
                  >
                    {adCopyLoading ? "Generating…" : "↻ Regenerate"}
                  </button>
                </div>
                <div className="p-5">
                  {adCopy ? (
                    <p className="text-base leading-relaxed text-gray-100">
                      "{adCopy}"
                    </p>
                  ) : (
                    <p className="text-sm text-muted italic">
                      No ad copy yet — click Regenerate or enable Auto-generate in Settings.
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-4">
                    <button
                      onClick={() => {
                        if (adCopy) navigator.clipboard.writeText(adCopy);
                      }}
                      disabled={!adCopy}
                      className="text-xs px-3 py-1.5 rounded-md border border-border hover:border-violet-400/60 hover:text-violet-200 disabled:opacity-50"
                    >
                      Copy
                    </button>
                    <button
                      onClick={() => fire("push_meta_creative")}
                      className="text-xs px-3 py-1.5 rounded-md border border-border hover:border-violet-400/60 hover:text-violet-200"
                    >
                      {fired["push_meta_creative"] ? "✓ Pushed to Meta" : "Push to Meta Ads"}
                    </button>
                    <button
                      onClick={() => fire("push_google_creative")}
                      className="text-xs px-3 py-1.5 rounded-md border border-border hover:border-violet-400/60 hover:text-violet-200"
                    >
                      {fired["push_google_creative"] ? "✓ Pushed to Google" : "Push to Google Ads"}
                    </button>
                  </div>
                </div>
              </section>

              {/* Quick actions */}
              <section className="rounded-xl border border-border bg-panel">
                <div className="px-5 py-3 border-b border-border">
                  <h3 className="text-xs uppercase tracking-wider text-muted font-semibold">
                    Quick actions
                  </h3>
                </div>
                <div className="p-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                  {ACTIONS.map((a) => {
                    const isFired = !!fired[a.key];
                    const base =
                      a.tone === "primary"
                        ? "border-accent/40 bg-accent/5 hover:bg-accent/10 text-accent"
                        : a.tone === "danger"
                          ? "border-danger/30 bg-danger/5 hover:bg-danger/10 text-danger"
                          : "border-border bg-bg/40 hover:bg-bg/60 text-gray-200";
                    return (
                      <button
                        key={a.key}
                        onClick={() => fire(a.key)}
                        className={`text-left px-4 py-3 rounded-lg border transition ${base} ${
                          isFired ? "opacity-70" : ""
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="font-medium text-sm">{a.label}</div>
                          {isFired && (
                            <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-accent/15 text-accent border border-accent/30">
                              Fired ✓
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted mt-0.5">
                          {a.desc}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Live audit log */}
              <section className="rounded-xl border border-border bg-panel">
                <div className="px-5 py-3 border-b border-border">
                  <h3 className="text-xs uppercase tracking-wider text-muted font-semibold">
                    Strike timeline
                  </h3>
                </div>
                <ul className="p-4 space-y-2 text-xs">
                  <TimelineItem
                    t="00:00"
                    label="OOS detected by anakin"
                    tone="danger"
                  />
                  <TimelineItem
                    t="00:08"
                    label="Slack alert sent → #stockstrike"
                    tone="info"
                  />
                  <TimelineItem
                    t="00:12"
                    label="Ad copy generated by Groq Llama 3.3 70B"
                    tone="violet"
                  />
                  {Object.keys(fired).map((k, i) => {
                    const action = ACTIONS.find((a) => a.key === k);
                    const label =
                      action?.label ||
                      (k === "push_meta_creative"
                        ? "Pushed creative → Meta Ads"
                        : "Pushed creative → Google Ads");
                    return (
                      <TimelineItem
                        key={k}
                        t={`+${(i + 1) * 6}s`}
                        label={label}
                        tone="accent"
                      />
                    );
                  })}
                </ul>
              </section>
            </div>

            {/* RIGHT: ROI + generated creative */}
            <div className="space-y-6">
              <StrikeROI data={roi} />
              <AdCreativePanel
                monitorId={monitor.id}
                competitor={monitor.label || monitor.url}
                platform={monitor.platform}
                headline={adCopy?.split("\n")[0] || null}
                subline={adCopy?.split("\n").slice(1).join(" ") || null}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TimelineItem({
  t,
  label,
  tone,
}: {
  t: string;
  label: string;
  tone: "danger" | "info" | "violet" | "accent";
}) {
  const dot =
    tone === "danger"
      ? "bg-danger"
      : tone === "info"
        ? "bg-sky-400"
        : tone === "violet"
          ? "bg-violet-400"
          : "bg-accent";
  return (
    <li className="flex items-start gap-3">
      <span className="font-mono text-[10px] text-muted w-12 shrink-0 pt-1">
        {t}
      </span>
      <span className={`w-2 h-2 rounded-full ${dot} mt-1.5 shrink-0`} />
      <span className="text-gray-200">{label}</span>
    </li>
  );
}
