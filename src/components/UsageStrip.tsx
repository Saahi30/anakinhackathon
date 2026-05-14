"use client";

import { useEffect, useState } from "react";

type UsagePayload = {
  today: { anakin_scrapes: number; groq_tokens: number; slack_sent: number };
  totals: { anakin_scrapes: number; groq_tokens: number; slack_sent: number };
  cost: { mtd_usd: number; projected_month_usd: number };
};

function formatNum(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "k";
  return String(n);
}

export default function UsageStrip() {
  const [data, setData] = useState<UsagePayload | null>(null);

  async function refresh() {
    try {
      const r = await fetch("/api/usage?days=30").then((r) => r.json());
      setData(r);
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 30_000);
    return () => clearInterval(t);
  }, []);

  if (!data) return null;
  return (
    <div className="rounded-clay bg-panel border border-hairline shadow-clay px-6 py-4 flex items-center justify-between gap-6 flex-wrap">
      <div className="flex items-center gap-3">
        <span className="text-[10px] uppercase tracking-[0.16em] text-muted font-semibold">
          Usage today
        </span>
      </div>
      <div className="flex items-center gap-6 text-sm flex-wrap">
        <div>
          <span className="text-muted text-xs">Scrapes</span>{" "}
          <span className="font-display tabular-nums text-ink">
            {formatNum(data.today.anakin_scrapes)}
          </span>
          <span className="text-muted text-xs ml-1">
            / {formatNum(data.totals.anakin_scrapes)} 30d
          </span>
        </div>
        <div>
          <span className="text-muted text-xs">AI tokens</span>{" "}
          <span className="font-display tabular-nums text-ink">
            {formatNum(data.today.groq_tokens)}
          </span>
          <span className="text-muted text-xs ml-1">
            / {formatNum(data.totals.groq_tokens)} 30d
          </span>
        </div>
        <div>
          <span className="text-muted text-xs">Slack alerts</span>{" "}
          <span className="font-display tabular-nums text-ink">
            {formatNum(data.today.slack_sent)}
          </span>
        </div>
        <div className="px-3 py-1 rounded-full bg-soft text-xs">
          <span className="text-muted">MTD</span>{" "}
          <span className="font-medium text-ink">
            ${data.cost.mtd_usd.toFixed(2)}
          </span>
          <span className="text-muted">
            {" "}
            · proj ${data.cost.projected_month_usd.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}
