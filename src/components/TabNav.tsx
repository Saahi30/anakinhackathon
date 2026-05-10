"use client";

export type TabKey =
  | "live"
  | "strikes"
  | "playbooks"
  | "integrations"
  | "insights";

const TABS: { key: TabKey; label: string; hint: string; badge?: string }[] = [
  { key: "live", label: "Live", hint: "Realtime monitors and strike feed" },
  { key: "strikes", label: "Strikes", hint: "Past OOS captures with ROI + replay" },
  { key: "playbooks", label: "Playbooks", hint: "Automated rules on OOS detection" },
  { key: "integrations", label: "Integrations", hint: "Channels and ad platforms" },
  { key: "insights", label: "Insights", hint: "Heatmap, geo, leaderboard" },
];

export default function TabNav({
  current,
  onChange,
}: {
  current: TabKey;
  onChange: (k: TabKey) => void;
}) {
  return (
    <div className="border-b border-border bg-panel/40">
      <div className="max-w-7xl mx-auto px-6 flex items-end gap-1 overflow-x-auto">
        {TABS.map((t) => {
          const active = current === t.key;
          return (
            <button
              key={t.key}
              onClick={() => onChange(t.key)}
              title={t.hint}
              className={`relative px-4 py-3 text-sm font-medium transition whitespace-nowrap ${
                active
                  ? "text-accent"
                  : "text-muted hover:text-gray-200"
              }`}
            >
              {t.label}
              {t.badge && (
                <span className="ml-1.5 text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-warn/15 text-warn border border-warn/30">
                  {t.badge}
                </span>
              )}
              {active && (
                <span className="absolute left-3 right-3 -bottom-px h-0.5 bg-accent rounded-t" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
