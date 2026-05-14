"use client";

type Variant = "lavender" | "mint" | "coral" | "ochre";

const variantClass: Record<Variant, { bg: string; ink: string; sub: string }> = {
  lavender: {
    bg: "bg-brand-lavender",
    ink: "text-ink",
    sub: "text-ink/70",
  },
  mint: {
    bg: "bg-brand-mint",
    ink: "text-brand-teal",
    sub: "text-brand-teal/70",
  },
  coral: {
    bg: "bg-brand-coral",
    ink: "text-white",
    sub: "text-white/80",
  },
  ochre: {
    bg: "bg-brand-ochre",
    ink: "text-ink",
    sub: "text-ink/70",
  },
};

export default function StatsBar({
  stats,
}: {
  stats: {
    total: number;
    oos: number;
    inStock: number;
    recentOos: number;
    lowStock?: number;
  };
}) {
  const cards: {
    label: string;
    value: number;
    variant: Variant;
    hint: string;
  }[] = [
    {
      label: "Monitoring",
      value: stats.total,
      variant: "lavender",
      hint: "URLs under watch",
    },
    {
      label: "In stock",
      value: stats.inStock,
      variant: "mint",
      hint: "Rivals available now",
    },
    {
      label: "Low stock",
      value: stats.lowStock || 0,
      variant: "ochre",
      hint: "Pre-OOS warning",
    },
    {
      label: "Out of stock",
      value: stats.oos,
      variant: "coral",
      hint: "Strike windows open",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map((c) => {
        const v = variantClass[c.variant];
        return (
          <div
            key={c.label}
            className={`rounded-clay ${v.bg} px-6 py-5 shadow-clay`}
          >
            <div
              className={`text-[11px] uppercase tracking-[0.14em] font-semibold ${v.sub}`}
            >
              {c.label}
            </div>
            <div
              className={`font-display text-5xl tracking-display mt-2 ${v.ink}`}
            >
              {c.value}
            </div>
            <div className={`text-xs mt-1 ${v.sub}`}>{c.hint}</div>
          </div>
        );
      })}
    </div>
  );
}
