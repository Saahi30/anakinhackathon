export type Platform =
  | "myntra"
  | "ajio"
  | "blinkit"
  | "zepto"
  | "amazon"
  | "unknown";

export type StockStatus = "in_stock" | "out_of_stock" | "unknown";

export type DetectionResult = {
  status: StockStatus;
  signal: string | null;
  confidence: "high" | "medium" | "low";
};

export function detectPlatform(url: string): Platform {
  try {
    const u = new URL(url);
    const h = u.hostname.toLowerCase();
    if (h.includes("myntra")) return "myntra";
    if (h.includes("ajio")) return "ajio";
    if (h.includes("blinkit")) return "blinkit";
    if (h.includes("zepto")) return "zepto";
    if (h.includes("amazon")) return "amazon";
    return "unknown";
  } catch {
    return "unknown";
  }
}

export function platformLabel(p: Platform): string {
  return (
    {
      myntra: "Myntra",
      ajio: "Ajio",
      blinkit: "Blinkit",
      zepto: "Zepto",
      amazon: "Amazon",
      unknown: "Unknown",
    } as const
  )[p];
}

const OOS_PATTERNS: Record<Platform, RegExp[]> = {
  myntra: [
    /\bsold\s*out\b/i,
    /\bout\s*of\s*stock\b/i,
    /\bnotify\s*me\b/i,
    /currently\s*unavailable/i,
  ],
  ajio: [
    /\bsold\s*out\b/i,
    /\bout\s*of\s*stock\b/i,
    /\bnotify\s*me\b/i,
    /currently\s*unavailable/i,
  ],
  blinkit: [
    /\bout\s*of\s*stock\b/i,
    /\bsold\s*out\b/i,
    /currently\s*unavailable/i,
    /not\s*available/i,
  ],
  zepto: [
    /\bout\s*of\s*stock\b/i,
    /\bsold\s*out\b/i,
    /currently\s*unavailable/i,
    /not\s*available/i,
  ],
  amazon: [
    /currently\s*unavailable/i,
    /out\s*of\s*stock/i,
    /we\s*don'?t\s*know\s*when/i,
    /temporarily\s*out\s*of\s*stock/i,
  ],
  unknown: [
    /\bout\s*of\s*stock\b/i,
    /\bsold\s*out\b/i,
    /currently\s*unavailable/i,
    /\bnotify\s*me\b/i,
  ],
};

const IN_STOCK_PATTERNS: Record<Platform, RegExp[]> = {
  myntra: [/add\s*to\s*bag/i, /\bbuy\s*now\b/i, /\bgo\s*to\s*bag\b/i],
  ajio: [/add\s*to\s*bag/i, /\bbuy\s*now\b/i, /\bgo\s*to\s*bag\b/i],
  blinkit: [/\badd\s*to\s*cart\b/i, /\badd\b/i],
  zepto: [/\badd\s*to\s*cart\b/i, /\badd\b/i],
  amazon: [/add\s*to\s*cart/i, /buy\s*now/i, /in\s*stock/i],
  unknown: [/add\s*to\s*cart/i, /add\s*to\s*bag/i, /buy\s*now/i, /in\s*stock/i],
};

export function detectStock(
  platform: Platform,
  text: string
): DetectionResult {
  if (!text || text.length < 20) {
    return { status: "unknown", signal: "empty content", confidence: "low" };
  }

  const oos = OOS_PATTERNS[platform];
  for (const p of oos) {
    const m = text.match(p);
    if (m) {
      return {
        status: "out_of_stock",
        signal: m[0].slice(0, 60),
        confidence: "high",
      };
    }
  }

  const inStock = IN_STOCK_PATTERNS[platform];
  for (const p of inStock) {
    const m = text.match(p);
    if (m) {
      return {
        status: "in_stock",
        signal: m[0].slice(0, 60),
        confidence: "medium",
      };
    }
  }

  return { status: "unknown", signal: null, confidence: "low" };
}

export function extractTitle(markdown: string): string | null {
  const h1 = markdown.match(/^#\s+(.+)$/m);
  if (h1) return h1[1].trim().slice(0, 120);
  const firstLine = markdown
    .split("\n")
    .map((l) => l.trim())
    .find((l) => l.length > 5 && !l.startsWith("!") && !l.startsWith("["));
  return firstLine ? firstLine.slice(0, 120) : null;
}
