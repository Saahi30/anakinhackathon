"use client";

export default function Sparkline({
  values,
  color = "#10b981",
  height = 36,
  width = 120,
  fill = true,
  showDot = true,
}: {
  values: number[];
  color?: string;
  height?: number;
  width?: number;
  fill?: boolean;
  showDot?: boolean;
}) {
  if (!values.length) return null;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const stepX = width / Math.max(1, values.length - 1);
  const points = values.map((v, i) => {
    const x = i * stepX;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return [x, y] as const;
  });
  const path = points
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`)
    .join(" ");
  const fillPath = `${path} L${width},${height} L0,${height} Z`;
  const last = points[points.length - 1];
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {fill && (
        <>
          <defs>
            <linearGradient id={`g-${color.slice(1)}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.32" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={fillPath} fill={`url(#g-${color.slice(1)})`} />
        </>
      )}
      <path d={path} fill="none" stroke={color} strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
      {showDot && (
        <circle cx={last[0]} cy={last[1]} r="2.4" fill={color} />
      )}
    </svg>
  );
}
