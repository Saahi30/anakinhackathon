"use client";

import { useEffect, useState } from "react";

// Approximate (x%, y%) positions on a stylised India map (not a real geo projection).
type City = {
  name: string;
  state: string;
  x: number; // 0..100
  y: number; // 0..100
  intensity: number; // 0..1, used for size + pulse
  oosCount: number;
  topPlatform: "blinkit" | "zepto" | "instamart";
  darkStores: number;
};

const CITIES: City[] = [
  { name: "Delhi NCR", state: "DL", x: 47, y: 24, intensity: 0.95, oosCount: 142, topPlatform: "blinkit", darkStores: 38 },
  { name: "Mumbai", state: "MH", x: 33, y: 56, intensity: 0.9, oosCount: 121, topPlatform: "zepto", darkStores: 41 },
  { name: "Bengaluru", state: "KA", x: 46, y: 78, intensity: 0.82, oosCount: 98, topPlatform: "blinkit", darkStores: 33 },
  { name: "Hyderabad", state: "TG", x: 50, y: 70, intensity: 0.74, oosCount: 81, topPlatform: "zepto", darkStores: 24 },
  { name: "Chennai", state: "TN", x: 55, y: 84, intensity: 0.6, oosCount: 64, topPlatform: "instamart", darkStores: 22 },
  { name: "Pune", state: "MH", x: 38, y: 60, intensity: 0.65, oosCount: 70, topPlatform: "zepto", darkStores: 19 },
  { name: "Ahmedabad", state: "GJ", x: 32, y: 44, intensity: 0.55, oosCount: 51, topPlatform: "blinkit", darkStores: 16 },
  { name: "Kolkata", state: "WB", x: 70, y: 47, intensity: 0.5, oosCount: 47, topPlatform: "blinkit", darkStores: 14 },
  { name: "Jaipur", state: "RJ", x: 41, y: 35, intensity: 0.42, oosCount: 32, topPlatform: "instamart", darkStores: 9 },
  { name: "Lucknow", state: "UP", x: 55, y: 32, intensity: 0.38, oosCount: 28, topPlatform: "blinkit", darkStores: 7 },
  { name: "Chandigarh", state: "CH", x: 46, y: 18, intensity: 0.32, oosCount: 22, topPlatform: "zepto", darkStores: 6 },
  { name: "Kochi", state: "KL", x: 44, y: 88, intensity: 0.3, oosCount: 18, topPlatform: "instamart", darkStores: 5 },
];

const platformColor: Record<City["topPlatform"], string> = {
  blinkit: "#facc15",
  zepto: "#a855f7",
  instamart: "#22d3ee",
};

export default function GeoMap() {
  const [hover, setHover] = useState<string | null>(null);
  const [pulse, setPulse] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setPulse((p) => p + 1), 2200);
    return () => clearInterval(t);
  }, []);

  const top = [...CITIES].sort((a, b) => b.oosCount - a.oosCount).slice(0, 5);

  return (
    <section className="rounded-xl border border-border bg-panel overflow-hidden">
      <div className="px-5 py-3 border-b border-border flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted">
          Quick-commerce OOS · India
        </h3>
        <div className="flex items-center gap-3 text-[10px]">
          <Legend color={platformColor.blinkit} label="Blinkit" />
          <Legend color={platformColor.zepto} label="Zepto" />
          <Legend color={platformColor.instamart} label="Instamart" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-[1fr_240px]">
        {/* Map */}
        <div className="relative aspect-[4/5] md:aspect-auto md:min-h-[420px] bg-soft">
          <svg
            viewBox="0 0 100 100"
            className="absolute inset-0 w-full h-full"
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Stylised India outline (rough approximation) */}
            <path
              d="M30,20 Q35,15 42,16 L52,14 Q60,18 64,22 L72,28 Q78,38 75,46 L72,52 Q70,58 67,58 L70,66 Q72,76 64,82 L58,90 Q52,96 48,94 Q44,92 40,86 Q34,82 32,72 Q28,64 30,58 Q26,52 28,44 Q26,36 30,28 Z"
              fill="rgba(184,164,237,0.35)"
              stroke="rgba(26,58,58,0.35)"
              strokeWidth="0.3"
              strokeLinejoin="round"
            />
            {/* Grid lines */}
            {[20, 40, 60, 80].map((y) => (
              <line
                key={y}
                x1="0"
                y1={y}
                x2="100"
                y2={y}
                stroke="rgba(26,58,58,0.08)"
                strokeWidth="0.2"
              />
            ))}

            {/* Pulses + dots */}
            {CITIES.map((c) => {
              const r = 1.4 + c.intensity * 2.6;
              const color = platformColor[c.topPlatform];
              const isHover = hover === c.name;
              return (
                <g
                  key={c.name}
                  onMouseEnter={() => setHover(c.name)}
                  onMouseLeave={() => setHover((h) => (h === c.name ? null : h))}
                  className="cursor-pointer"
                >
                  {/* Outer pulse */}
                  <circle
                    cx={c.x}
                    cy={c.y}
                    r={r * 2.5}
                    fill={color}
                    opacity={0.12}
                  >
                    <animate
                      attributeName="r"
                      values={`${r * 1.5};${r * 4};${r * 1.5}`}
                      dur={`${2 + (1 - c.intensity) * 1.5}s`}
                      repeatCount="indefinite"
                      begin={`${pulse * 0.1}s`}
                    />
                    <animate
                      attributeName="opacity"
                      values="0.4;0;0.4"
                      dur={`${2 + (1 - c.intensity) * 1.5}s`}
                      repeatCount="indefinite"
                    />
                  </circle>
                  <circle
                    cx={c.x}
                    cy={c.y}
                    r={r}
                    fill={color}
                    opacity={isHover ? 1 : 0.85}
                    stroke="white"
                    strokeWidth={isHover ? 0.4 : 0.2}
                  />
                  {(c.intensity > 0.7 || isHover) && (
                    <text
                      x={c.x + r + 1.2}
                      y={c.y + 0.7}
                      fontSize="2.2"
                      fill={isHover ? "#0a0a0a" : "rgba(10,10,10,0.78)"}
                      fontFamily="Inter, sans-serif"
                      fontWeight="600"
                    >
                      {c.name}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
          {hover && (
            <Tooltip city={CITIES.find((c) => c.name === hover)!} />
          )}
        </div>

        {/* Side list */}
        <div className="border-t md:border-t-0 md:border-l border-border p-4 space-y-2">
          <div className="text-[10px] uppercase tracking-wider text-muted">
            Top hot zones · 30d
          </div>
          {top.map((c, i) => (
            <div
              key={c.name}
              onMouseEnter={() => setHover(c.name)}
              onMouseLeave={() => setHover(null)}
              className={`rounded-lg border ${hover === c.name ? "border-accent/50 bg-accent/5" : "border-border bg-bg/40"} px-3 py-2 cursor-pointer transition`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs text-muted font-mono">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="font-medium text-sm truncate">{c.name}</span>
                </div>
                <span className="text-xs font-mono text-danger">
                  {c.oosCount}
                </span>
              </div>
              <div className="flex items-center justify-between mt-0.5 text-[10px] text-muted">
                <span>{c.darkStores} dark stores</span>
                <span
                  className="uppercase tracking-wider font-semibold"
                  style={{ color: platformColor[c.topPlatform] }}
                >
                  {c.topPlatform}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-muted">
      <span
        className="inline-block w-2 h-2 rounded-full"
        style={{ background: color }}
      />
      {label}
    </span>
  );
}

function Tooltip({ city }: { city: City }) {
  return (
    <div
      className="absolute pointer-events-none rounded-2xl bg-canvas shadow-clay-lift border border-hairline px-3.5 py-2 text-xs"
      style={{
        left: `${city.x}%`,
        top: `${city.y}%`,
        transform: "translate(-50%, -130%)",
      }}
    >
      <div className="font-display tracking-tightish text-base text-ink">
        {city.name}
      </div>
      <div className="text-muted">{city.darkStores} dark stores</div>
      <div className="text-brand-coral font-mono">
        {city.oosCount} strikes / 30d
      </div>
    </div>
  );
}
