"use client";

export type StrikeROIData = {
  impressions: number;
  clicks: number;
  ctr: number;
  conversions: number;
  revenue: number;
  spend: number;
  roas: number;
  responseSeconds: number;
};

// Deterministic mock generator so the same monitor always shows the same ROI
export function mockROI(seed: number): StrikeROIData {
  const r = (n: number) => {
    const x = Math.sin(seed * (n + 1)) * 10000;
    return Math.abs(x - Math.floor(x));
  };
  const impressions = Math.floor(1800 + r(1) * 7400);
  const ctr = 0.04 + r(2) * 0.08;
  const clicks = Math.floor(impressions * ctr);
  const convRate = 0.05 + r(3) * 0.09;
  const conversions = Math.floor(clicks * convRate);
  const aov = 480 + Math.floor(r(4) * 1900);
  const revenue = conversions * aov;
  const spend = Math.floor(800 + r(5) * 3000);
  const roas = +(revenue / Math.max(1, spend)).toFixed(1);
  const responseSeconds = 6 + Math.floor(r(6) * 18);
  return {
    impressions,
    clicks,
    ctr,
    conversions,
    revenue,
    spend,
    roas,
    responseSeconds,
  };
}

const inr = (n: number) =>
  "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });

export default function StrikeROI({
  data,
  variant = "card",
}: {
  data: StrikeROIData;
  variant?: "card" | "compact" | "wide";
}) {
  const tiles = [
    { label: "Impressions", value: data.impressions.toLocaleString("en-IN"), tone: "neutral" },
    { label: "Clicks", value: data.clicks.toLocaleString("en-IN"), tone: "neutral" },
    { label: "CTR", value: (data.ctr * 100).toFixed(1) + "%", tone: "accent" },
    { label: "Conversions", value: data.conversions.toString(), tone: "accent" },
    { label: "Revenue captured", value: inr(data.revenue), tone: "good" },
    { label: "Ad spend", value: inr(data.spend), tone: "neutral" },
    { label: "ROAS", value: data.roas + "×", tone: "good" },
    { label: "Response time", value: data.responseSeconds + "s", tone: "warn" },
  ];

  const toneClass = (t: string) =>
    t === "good"
      ? "text-accent"
      : t === "warn"
        ? "text-warn"
        : t === "accent"
          ? "text-violet-300"
          : "text-gray-100";

  if (variant === "compact") {
    return (
      <div className="flex items-center gap-3 text-xs">
        <span className="text-muted">Captured</span>
        <span className="font-mono text-accent font-semibold">
          {inr(data.revenue)}
        </span>
        <span className="text-muted">·</span>
        <span className="font-mono text-violet-300">{data.roas}× ROAS</span>
        <span className="text-muted">·</span>
        <span className="font-mono text-gray-100">{data.clicks} clicks</span>
      </div>
    );
  }

  if (variant === "wide") {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {tiles.map((t) => (
          <div
            key={t.label}
            className="rounded-lg border border-border bg-bg/40 px-3 py-2"
          >
            <div className="text-[10px] uppercase tracking-wider text-muted">
              {t.label}
            </div>
            <div className={`font-mono text-base mt-1 ${toneClass(t.tone)}`}>
              {t.value}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-panel">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <h3 className="text-xs uppercase tracking-wider text-muted font-semibold">
          Strike ROI · attributed
        </h3>
        <span className="text-[10px] px-1.5 py-0.5 rounded border border-violet-500/30 text-violet-300">
          MOCKED
        </span>
      </div>
      <div className="p-3 grid grid-cols-2 gap-2">
        {tiles.map((t) => (
          <div
            key={t.label}
            className="rounded-md border border-border bg-bg/40 px-3 py-2"
          >
            <div className="text-[10px] uppercase tracking-wider text-muted">
              {t.label}
            </div>
            <div className={`font-mono text-base mt-1 ${toneClass(t.tone)}`}>
              {t.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
