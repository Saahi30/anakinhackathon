"use client";

import { useEffect, useRef, useState } from "react";

type Line = {
  text: string;
  tone: "info" | "good" | "warn" | "danger" | "muted" | "accent";
  delay: number;
};

function buildScript(url: string, platform: string): Line[] {
  const host = (() => {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  })();
  const sessionId = "sess_" + Math.random().toString(36).slice(2, 10);
  return [
    { text: `→ POST /v1/scrape`, tone: "muted", delay: 60 },
    { text: `  X-API-Key: sk_live_••••••••••••${Math.floor(Math.random() * 9999)}`, tone: "muted", delay: 80 },
    { text: `  body: { url: "${url}", render: true, anti_bot: true }`, tone: "muted", delay: 90 },
    { text: `← 202 Accepted · job ${sessionId}`, tone: "info", delay: 120 },
    { text: `[scraper] spinning up stealth Chromium 131…`, tone: "info", delay: 250 },
    { text: `[scraper] residential proxy · region in-mum-1 · IP 103.×.×.42`, tone: "info", delay: 200 },
    { text: `[scraper] navigating to ${host}`, tone: "info", delay: 320 },
    { text: `[anti-bot] cloudflare turnstile detected`, tone: "warn", delay: 200 },
    { text: `[anti-bot] solving challenge… `, tone: "warn", delay: 350 },
    { text: `[anti-bot] ✓ challenge passed in 1.2s`, tone: "good", delay: 280 },
    { text: `[render] DOMContentLoaded`, tone: "muted", delay: 180 },
    { text: `[render] networkidle reached (3 XHR settled)`, tone: "muted", delay: 240 },
    { text: `[extract] reading product schema.org JSON-LD`, tone: "info", delay: 200 },
    { text: `[extract] platform=${platform} · variant=default`, tone: "info", delay: 160 },
    { text: `[extract] price · title · sku · stock signals → captured`, tone: "good", delay: 220 },
    { text: `[stock] regex match: "Add to ${platform === "myntra" || platform === "ajio" ? "Bag" : "Cart"}" · in-stock signal`, tone: "good", delay: 200 },
    { text: `[markdown] 4.2 KB cleaned · 0 ads stripped`, tone: "muted", delay: 160 },
    { text: `← 200 OK · ${(Math.random() * 1.4 + 1.6).toFixed(2)}s · status=completed`, tone: "good", delay: 220 },
    { text: `[stockstrike] persisted · realtime push → dashboard`, tone: "accent", delay: 180 },
    { text: `✓ MONITOR READY`, tone: "good", delay: 200 },
  ];
}

const toneClass: Record<Line["tone"], string> = {
  info: "text-sky-300",
  good: "text-accent",
  warn: "text-warn",
  danger: "text-danger",
  muted: "text-muted",
  accent: "text-violet-300",
};

export default function ScrapePreview({
  url,
  platform,
  onClose,
  onComplete,
}: {
  url: string;
  platform: string;
  onClose: () => void;
  onComplete?: () => void;
}) {
  const [lines, setLines] = useState<Line[]>([]);
  const [done, setDone] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    const script = buildScript(url, platform);
    let i = 0;
    const tick = () => {
      if (cancelled) return;
      if (i >= script.length) {
        setDone(true);
        onComplete?.();
        return;
      }
      const line = script[i++];
      setLines((prev) => [...prev, line]);
      setTimeout(tick, line.delay);
    };
    setTimeout(tick, 100);
    return () => {
      cancelled = true;
    };
  }, [url, platform, onComplete]);

  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [lines.length]);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 backdrop-blur-md p-4">
      <div className="w-full max-w-2xl rounded-clay bg-canvas shadow-clay-lift overflow-hidden border border-hairline">
        <div className="px-5 py-3.5 border-b border-hairline bg-soft flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-brand-coral" />
              <div className="w-3 h-3 rounded-full bg-brand-ochre" />
              <div className="w-3 h-3 rounded-full bg-brand-mint" />
            </div>
            <span className="text-xs text-muted ml-2 font-mono">
              scraper · live
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-xs text-ink hover:bg-canvas px-3 py-1 rounded-full border border-hairline"
          >
            {done ? "Close" : "Hide"}
          </button>
        </div>
        <div
          ref={ref}
          className="bg-surface-dark font-mono text-xs p-4 h-80 overflow-y-auto overflow-x-hidden"
        >
          {lines.map((l, i) => (
            <div key={i} className={`${toneClass[l.tone]} leading-relaxed break-all`}>
              {l.text}
            </div>
          ))}
          {!done && (
            <span className="inline-block w-2 h-4 bg-brand-mint animate-pulse" />
          )}
        </div>
        <div className="px-5 py-3 border-t border-hairline bg-soft flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-[0.14em] text-muted">
            Stealth Chromium · residential proxy
          </span>
          {done && (
            <span className="text-xs text-brand-teal flex items-center gap-1.5 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-teal" />
              monitor active
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
