"use client";

import { useEffect, useState } from "react";

export default function StrikeCountdown({
  oosAt,
  predictedRestockMinutes = 240,
  compact = false,
  onOpenWarRoom,
}: {
  oosAt: string;
  predictedRestockMinutes?: number;
  compact?: boolean;
  onOpenWarRoom?: () => void;
}) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const startedAt = new Date(oosAt + (oosAt.endsWith("Z") ? "" : "Z")).getTime();
  const elapsedSec = Math.max(0, Math.floor((now - startedAt) / 1000));
  const totalSec = predictedRestockMinutes * 60;
  const remainingSec = Math.max(0, totalSec - elapsedSec);
  const pct = Math.min(100, (elapsedSec / totalSec) * 100);

  const fmt = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${sec}s`;
    return `${sec}s`;
  };

  const tone =
    pct < 33
      ? "from-accent to-emerald-400"
      : pct < 66
        ? "from-warn to-yellow-300"
        : "from-danger to-rose-400";

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-xs">
        <div className="relative w-2 h-2">
          <span className="absolute inset-0 rounded-full bg-danger animate-ping" />
          <span className="absolute inset-0 rounded-full bg-danger" />
        </div>
        <span className="font-mono text-danger font-medium">
          {fmt(elapsedSec)}
        </span>
        <span className="text-muted">strike open</span>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-danger/40 bg-gradient-to-br from-danger/10 to-bg/40 p-3 mt-2">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="relative w-2 h-2">
            <span className="absolute inset-0 rounded-full bg-danger animate-ping" />
            <span className="absolute inset-0 rounded-full bg-danger" />
          </div>
          <span className="text-[10px] uppercase tracking-wider text-danger font-semibold">
            Strike window
          </span>
        </div>
        {onOpenWarRoom && (
          <button
            onClick={onOpenWarRoom}
            className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded border border-danger/50 text-danger hover:bg-danger/10 font-semibold"
          >
            Open War Room ↗
          </button>
        )}
      </div>
      <div className="flex items-baseline justify-between">
        <div>
          <div className="text-xs text-muted">Open for</div>
          <div className="font-mono text-lg font-semibold text-danger">
            {fmt(elapsedSec)}
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-muted">Est. restock in</div>
          <div className="font-mono text-sm text-gray-200">
            {fmt(remainingSec)}
          </div>
        </div>
      </div>
      <div className="mt-2 h-1.5 rounded-full bg-bg/60 overflow-hidden">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${tone} transition-all`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mt-1.5 text-[10px] text-muted flex items-center justify-between">
        <span>Capture window urgency</span>
        <span className="font-mono">
          {pct < 33 ? "FRESH" : pct < 66 ? "FADING" : "CLOSING"}
        </span>
      </div>
    </div>
  );
}
