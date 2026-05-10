"use client";

import { useEffect, useRef, useState } from "react";

type Aspect = "1:1" | "9:16" | "16:9" | "4:5";
type Style = "bold" | "minimalist" | "lifestyle" | "luxury";

type GeneratedCreative = {
  dataUrl: string;
  aspect: Aspect;
  style: Style;
  source: "gemini" | "mock";
  durationMs: number;
};

const ASPECTS: { key: Aspect; label: string; desc: string }[] = [
  { key: "1:1", label: "1:1", desc: "Feed" },
  { key: "9:16", label: "9:16", desc: "Reels / Story" },
  { key: "4:5", label: "4:5", desc: "Insta portrait" },
  { key: "16:9", label: "16:9", desc: "Display banner" },
];

const STYLES: { key: Style; label: string }[] = [
  { key: "bold", label: "Bold" },
  { key: "minimalist", label: "Minimalist" },
  { key: "lifestyle", label: "Lifestyle" },
  { key: "luxury", label: "Luxury" },
];

const aspectClass: Record<Aspect, string> = {
  "1:1": "aspect-square",
  "9:16": "aspect-[9/16]",
  "16:9": "aspect-video",
  "4:5": "aspect-[4/5]",
};

export default function AdCreativePanel({
  monitorId,
  competitor,
  platform,
  headline,
  subline,
}: {
  monitorId: number;
  competitor: string;
  platform: string;
  headline?: string | null;
  subline?: string | null;
}) {
  const [aspect, setAspect] = useState<Aspect>("1:1");
  const [style, setStyle] = useState<Style>("bold");
  const [busy, setBusy] = useState(false);
  const [creatives, setCreatives] = useState<GeneratedCreative[]>([]);
  const [error, setError] = useState<string | null>(null);
  const initialFetched = useRef(false);

  async function generate(overrides?: { aspect?: Aspect; style?: Style }) {
    if (busy) return;
    setBusy(true);
    setError(null);
    const reqAspect = overrides?.aspect || aspect;
    const reqStyle = overrides?.style || style;
    try {
      const r = await fetch("/api/ad-creative", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          monitor_id: monitorId,
          aspect: reqAspect,
          style: reqStyle,
          headline,
          subline,
        }),
      });
      const data = await r.json();
      if (!r.ok || !data?.dataUrl) {
        setError(data?.error || `failed (${r.status})`);
        return;
      }
      setCreatives((prev) => [
        {
          dataUrl: data.dataUrl,
          aspect: data.aspect,
          style: data.style,
          source: data.source,
          durationMs: data.durationMs,
        },
        ...prev,
      ].slice(0, 8));
    } catch (e: any) {
      setError(String(e?.message || e));
    } finally {
      setBusy(false);
    }
  }

  // Auto-generate the first creative when the panel mounts.
  useEffect(() => {
    if (initialFetched.current) return;
    initialFetched.current = true;
    generate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monitorId]);

  const latest = creatives[0];

  return (
    <section className="rounded-xl border border-border bg-panel">
      <div className="px-5 py-3 border-b border-border flex items-center justify-between gap-3">
        <div>
          <h3 className="text-xs uppercase tracking-wider text-muted font-semibold">
            Generated ad creative
          </h3>
          <div className="text-[10px] text-muted mt-0.5">
            Powered by{" "}
            <span className="text-yellow-300 font-mono">nano-banana</span> ·
            Gemini 2.5 Flash Image
          </div>
        </div>
        {latest && (
          <span
            className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded border ${
              latest.source === "gemini"
                ? "border-yellow-400/40 text-yellow-300"
                : "border-violet-500/30 text-violet-300"
            }`}
          >
            {latest.source === "gemini" ? "LIVE" : "MOCK"}
          </span>
        )}
      </div>

      <div className="p-4 space-y-3">
        {/* Preview */}
        <div
          className={`relative w-full ${aspectClass[latest?.aspect || aspect]} rounded-lg border border-border bg-bg/40 overflow-hidden`}
        >
          {latest ? (
            <img
              src={latest.dataUrl}
              alt={`${competitor} strike creative`}
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : busy ? (
            <div className="absolute inset-0 grid place-items-center text-xs text-muted">
              <div className="text-center space-y-2">
                <div className="inline-flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-yellow-300 animate-pulse" />
                  <span>nano-banana is painting…</span>
                </div>
                <div className="text-[10px] text-muted/70">
                  brand voice + competitor context → image
                </div>
              </div>
            </div>
          ) : (
            <div className="absolute inset-0 grid place-items-center text-xs text-muted">
              No creative yet. Click Generate.
            </div>
          )}

          {busy && latest && (
            <div className="absolute top-2 left-2 inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-black/70 text-yellow-300 border border-yellow-400/40">
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-300 animate-pulse" />
              regenerating
            </div>
          )}
        </div>

        {/* Aspect picker */}
        <div className="flex items-center gap-1 flex-wrap">
          <span className="text-[10px] uppercase tracking-wider text-muted mr-1">
            Aspect
          </span>
          {ASPECTS.map((a) => (
            <button
              key={a.key}
              onClick={() => {
                setAspect(a.key);
                generate({ aspect: a.key });
              }}
              disabled={busy}
              title={a.desc}
              className={`text-[10px] px-2 py-1 rounded border transition disabled:opacity-50 ${
                aspect === a.key
                  ? "border-yellow-400/50 text-yellow-300 bg-yellow-400/5"
                  : "border-border text-muted hover:text-gray-200"
              }`}
            >
              {a.label}
            </button>
          ))}
        </div>

        {/* Style picker */}
        <div className="flex items-center gap-1 flex-wrap">
          <span className="text-[10px] uppercase tracking-wider text-muted mr-1">
            Style
          </span>
          {STYLES.map((s) => (
            <button
              key={s.key}
              onClick={() => {
                setStyle(s.key);
                generate({ style: s.key });
              }}
              disabled={busy}
              className={`text-[10px] px-2 py-1 rounded border transition disabled:opacity-50 ${
                style === s.key
                  ? "border-yellow-400/50 text-yellow-300 bg-yellow-400/5"
                  : "border-border text-muted hover:text-gray-200"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => generate()}
            disabled={busy}
            className="text-xs px-3 py-1.5 rounded-md bg-yellow-400/15 border border-yellow-400/40 text-yellow-200 hover:bg-yellow-400/25 disabled:opacity-50"
          >
            {busy ? "Generating…" : "↻ Regenerate"}
          </button>
          <a
            href={latest?.dataUrl}
            download={`stockstrike-${platform}-${aspect.replace(":", "x")}.${latest?.source === "mock" ? "svg" : "png"}`}
            className={`text-xs px-3 py-1.5 rounded-md border border-border hover:border-accent/60 hover:text-accent ${
              latest ? "" : "pointer-events-none opacity-50"
            }`}
          >
            Download
          </a>
          <button
            onClick={() => latest && navigator.clipboard.writeText(latest.dataUrl)}
            disabled={!latest}
            className="text-xs px-3 py-1.5 rounded-md border border-border hover:border-accent/60 hover:text-accent disabled:opacity-50"
          >
            Copy URL
          </button>
        </div>

        {error && (
          <div className="text-xs text-danger">
            {error}
          </div>
        )}

        {/* History strip */}
        {creatives.length > 1 && (
          <div className="pt-2 border-t border-border">
            <div className="text-[10px] uppercase tracking-wider text-muted mb-2">
              History
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {creatives.slice(1).map((c, i) => (
                <div
                  key={i}
                  className="shrink-0 w-20 rounded border border-border overflow-hidden bg-bg/40"
                  title={`${c.aspect} · ${c.style} · ${c.source}`}
                >
                  <div className={`${aspectClass[c.aspect]} relative`}>
                    <img
                      src={c.dataUrl}
                      alt=""
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  </div>
                  <div className="px-1 py-0.5 text-[9px] text-muted text-center">
                    {c.aspect} · {c.style}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
