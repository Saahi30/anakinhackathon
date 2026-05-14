"use client";

import { useEffect, useState } from "react";
import Sparkline from "./Sparkline";

export default function MonitorSparkline({
  monitorId,
  hours = 24,
}: {
  monitorId: number;
  hours?: number;
}) {
  const [buckets, setBuckets] = useState<number[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/monitors/${monitorId}/sparkline?hours=${hours}`)
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setBuckets(d.buckets || []);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [monitorId, hours]);

  if (!buckets) return null;
  const total = buckets.reduce((a, b) => a + b, 0);
  if (!total) {
    return (
      <span className="text-[10px] text-muted-soft uppercase tracking-wider">
        no events 24h
      </span>
    );
  }
  return (
    <div className="flex items-center gap-2">
      <Sparkline
        values={buckets}
        color="#c14a4a"
        width={120}
        height={24}
        fill={true}
        showDot={false}
      />
      <span className="text-[10px] text-muted whitespace-nowrap">
        {total} ev / 24h
      </span>
    </div>
  );
}
