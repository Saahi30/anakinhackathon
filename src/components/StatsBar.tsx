"use client";

export default function StatsBar({
  stats,
}: {
  stats: { total: number; oos: number; inStock: number; recentOos: number };
}) {
  const cards = [
    { label: "Monitoring", value: stats.total, tone: "neutral" },
    { label: "In stock", value: stats.inStock, tone: "ok" },
    { label: "Out of stock now", value: stats.oos, tone: "danger" },
    { label: "OOS events captured", value: stats.recentOos, tone: "warn" },
  ];
  const tone = (t: string) =>
    t === "danger"
      ? "text-danger border-danger/30 bg-danger/5"
      : t === "ok"
        ? "text-accent border-accent/30 bg-accent/5"
        : t === "warn"
          ? "text-warn border-warn/30 bg-warn/5"
          : "text-gray-200 border-border bg-panel";
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {cards.map((c) => (
        <div
          key={c.label}
          className={`rounded-lg border px-4 py-3 ${tone(c.tone)}`}
        >
          <div className="text-xs uppercase tracking-wide opacity-70">
            {c.label}
          </div>
          <div className="text-2xl font-semibold mt-1">{c.value}</div>
        </div>
      ))}
    </div>
  );
}
