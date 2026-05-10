"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import StrikeROI, { mockROI } from "./StrikeROI";

export type ReplayStrike = {
  monitorId: number;
  competitor: string;
  platform: string;
  startedAt: string;
  durationMinutes: number;
};

type ReplayStep = {
  t: number; // seconds since strike start
  kind: "oos" | "slack" | "groq" | "meta" | "google" | "amazon" | "click" | "conv" | "restock";
  label: string;
  detail?: string;
};

function buildSteps(durationMinutes: number): ReplayStep[] {
  const total = durationMinutes * 60;
  return [
    { t: 0, kind: "oos", label: "OOS detected by anakin", detail: "regex: out of stock · confidence 94%" },
    { t: 8, kind: "slack", label: "Slack alert sent", detail: "→ #stockstrike · 3 mentions" },
    { t: 14, kind: "groq", label: "Ad copy generated", detail: "Groq Llama 3.3 70B · 1.1s" },
    { t: 22, kind: "meta", label: "Meta Ads bid surge +40%", detail: "ad set ms-summer-2026" },
    { t: 28, kind: "google", label: "Google Ads keywords surged", detail: "12 rival-brand keywords · CPC cap +25%" },
    { t: 34, kind: "amazon", label: "Amazon Sponsored bid +30%", detail: "ASIN B0XXXXXX · top-of-search" },
    { t: 134, kind: "click", label: "First captured click", detail: "from Meta Reels · IN/MH" },
    { t: 287, kind: "conv", label: "First conversion attributed", detail: "₹1,840 · 1 unit" },
    { t: Math.min(total - 30, 1200), kind: "click", label: "Click rate peaks", detail: "CTR 7.4% · 3.2× baseline" },
    { t: Math.min(total - 10, 1800), kind: "conv", label: "ROAS crosses 5×", detail: "captured ₹14,400 on ₹2,800 spend" },
    { t: total, kind: "restock", label: "Competitor restocked — strike closed", detail: "window captured ✓" },
  ];
}

const stepTone: Record<ReplayStep["kind"], string> = {
  oos: "border-danger/50 bg-danger/15 text-danger",
  slack: "border-sky-400/50 bg-sky-400/15 text-sky-300",
  groq: "border-violet-400/50 bg-violet-400/15 text-violet-300",
  meta: "border-blue-400/50 bg-blue-400/15 text-blue-300",
  google: "border-yellow-400/50 bg-yellow-400/15 text-yellow-300",
  amazon: "border-orange-400/50 bg-orange-400/15 text-orange-300",
  click: "border-accent/50 bg-accent/15 text-accent",
  conv: "border-accent/50 bg-accent/15 text-accent",
  restock: "border-border bg-bg/50 text-muted",
};

const stepIcon: Record<ReplayStep["kind"], string> = {
  oos: "✕",
  slack: "💬",
  groq: "✨",
  meta: "Ⓜ",
  google: "G",
  amazon: "A",
  click: "→",
  conv: "₹",
  restock: "✓",
};

function fmt(sec: number) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function StrikeReplay({
  strike,
  onClose,
}: {
  strike: ReplayStrike;
  onClose: () => void;
}) {
  const total = strike.durationMinutes * 60;
  const steps = useMemo(() => buildSteps(strike.durationMinutes), [strike.durationMinutes]);
  const roi = useMemo(() => mockROI(strike.monitorId), [strike.monitorId]);

  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(60); // 1x = 1 sec real-time per second; we default to 60x
  const raf = useRef<number | null>(null);
  const last = useRef<number>(performance.now());

  useEffect(() => {
    if (!playing) return;
    last.current = performance.now();
    const loop = (now: number) => {
      const dt = (now - last.current) / 1000;
      last.current = now;
      setT((prev) => {
        const next = prev + dt * speed;
        if (next >= total) {
          setPlaying(false);
          return total;
        }
        return next;
      });
      raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [playing, speed, total]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === " ") {
        e.preventDefault();
        setPlaying((p) => !p);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const visible = steps.filter((s) => s.t <= t);
  const pct = Math.min(100, (t / total) * 100);

  // Cumulative metrics that grow with t
  const progress = t / total;
  const liveROI = {
    impressions: Math.floor(roi.impressions * progress),
    clicks: Math.floor(roi.clicks * progress),
    revenue: Math.floor(roi.revenue * progress),
    spend: Math.floor(roi.spend * progress),
    roas: progress > 0.05 ? +(roi.revenue * progress / Math.max(1, roi.spend * progress)).toFixed(1) : 0,
  };

  return (
    <div className="fixed inset-0 z-[60] bg-[#070809]/95 backdrop-blur-md overflow-y-auto">
      <div className="min-h-screen p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-violet-300 font-bold">
                STRIKE REPLAY
              </div>
              <div className="text-xs text-muted">
                Esc to close · space to play/pause
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-xs text-muted hover:text-gray-200 px-3 py-1.5 rounded border border-border"
            >
              Close ✕
            </button>
          </div>

          <div className="rounded-2xl border border-border bg-panel p-6 mb-6">
            <div className="flex items-end justify-between gap-4 flex-wrap">
              <div>
                <div className="text-xs text-muted">
                  {strike.platform.toUpperCase()} ·{" "}
                  {new Date(strike.startedAt).toLocaleString()}
                </div>
                <h2 className="text-2xl font-semibold text-gray-100">
                  {strike.competitor}
                </h2>
              </div>
              <div className="text-right">
                <div className="text-xs text-muted">Replay clock</div>
                <div className="font-mono text-3xl text-violet-300 tabular-nums">
                  {fmt(Math.floor(t))}
                </div>
                <div className="text-[10px] text-muted">
                  / {fmt(total)} · {speed}× speed
                </div>
              </div>
            </div>

            {/* Scrubber */}
            <div className="mt-6">
              <input
                type="range"
                min={0}
                max={total}
                step={1}
                value={Math.floor(t)}
                onChange={(e) => {
                  setT(Number(e.target.value));
                  setPlaying(false);
                }}
                className="w-full accent-violet-400"
              />
              <div className="relative mt-1 h-6">
                {steps.map((s) => (
                  <div
                    key={`${s.t}-${s.kind}`}
                    title={s.label}
                    className="absolute -translate-x-1/2"
                    style={{ left: `${(s.t / total) * 100}%` }}
                  >
                    <span
                      className={`block w-2.5 h-2.5 rounded-full border ${
                        s.t <= t
                          ? "bg-violet-400 border-violet-200"
                          : "bg-bg border-border"
                      }`}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Controls */}
            <div className="mt-4 flex items-center gap-3">
              <button
                onClick={() => {
                  setT(0);
                  setPlaying(true);
                }}
                className="text-xs px-3 py-1.5 rounded-md border border-border hover:border-accent/60"
              >
                ⏮ Restart
              </button>
              <button
                onClick={() => setPlaying((p) => !p)}
                className="text-xs px-4 py-1.5 rounded-md bg-violet-500/20 border border-violet-400/40 text-violet-200 hover:bg-violet-500/30"
              >
                {playing ? "⏸ Pause" : "▶ Play"}
              </button>
              <button
                onClick={() => {
                  setT(total);
                  setPlaying(false);
                }}
                className="text-xs px-3 py-1.5 rounded-md border border-border hover:border-accent/60"
              >
                ⏭ End
              </button>
              <div className="ml-auto flex items-center gap-1">
                {[15, 30, 60, 120, 300].map((s) => (
                  <button
                    key={s}
                    onClick={() => setSpeed(s)}
                    className={`text-[10px] px-2 py-1 rounded ${
                      speed === s
                        ? "bg-violet-500/20 text-violet-200 border border-violet-400/40"
                        : "text-muted hover:text-gray-200"
                    }`}
                  >
                    {s}×
                  </button>
                ))}
              </div>
            </div>

            {/* Progress fraction */}
            <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-2">
              <Tile label="Progress" value={`${pct.toFixed(0)}%`} />
              <Tile label="Impressions" value={liveROI.impressions.toLocaleString("en-IN")} />
              <Tile label="Clicks" value={liveROI.clicks.toLocaleString("en-IN")} />
              <Tile label="Revenue" value={"₹" + liveROI.revenue.toLocaleString("en-IN")} tone="good" />
              <Tile label="ROAS" value={liveROI.roas + "×"} tone="violet" />
            </div>
          </div>

          {/* Event stream */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6">
            <section className="rounded-xl border border-border bg-panel">
              <div className="px-5 py-3 border-b border-border">
                <h3 className="text-xs uppercase tracking-wider text-muted font-semibold">
                  Event stream
                </h3>
              </div>
              <ul className="p-4 space-y-2.5">
                {visible.map((s) => (
                  <li
                    key={`${s.t}-${s.kind}-${s.label}`}
                    className="flex items-start gap-3 animate-in fade-in slide-in-from-left-2 duration-300"
                  >
                    <div className="font-mono text-[10px] text-muted w-14 shrink-0 pt-1.5">
                      +{fmt(s.t)}
                    </div>
                    <div
                      className={`w-7 h-7 rounded-md border grid place-items-center font-bold text-xs shrink-0 ${stepTone[s.kind]}`}
                    >
                      {stepIcon[s.kind]}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm text-gray-100">{s.label}</div>
                      {s.detail && (
                        <div className="text-xs text-muted">{s.detail}</div>
                      )}
                    </div>
                  </li>
                ))}
                {visible.length === 0 && (
                  <li className="text-sm text-muted italic">
                    Hit Play to start the replay…
                  </li>
                )}
              </ul>
            </section>

            <div>
              <StrikeROI data={roi} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Tile({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "good" | "violet";
}) {
  const cls =
    tone === "good"
      ? "text-accent"
      : tone === "violet"
        ? "text-violet-300"
        : "text-gray-100";
  return (
    <div className="rounded-lg border border-border bg-bg/40 px-3 py-2">
      <div className="text-[10px] uppercase tracking-wider text-muted">
        {label}
      </div>
      <div className={`font-mono text-base mt-0.5 ${cls}`}>{value}</div>
    </div>
  );
}
