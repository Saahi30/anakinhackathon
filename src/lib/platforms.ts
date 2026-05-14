export type Platform =
  | "myntra"
  | "ajio"
  | "blinkit"
  | "zepto"
  | "amazon"
  | "unknown";

export type StockStatus =
  | "in_stock"
  | "low_stock"
  | "out_of_stock"
  | "unknown";

export type DetectionResult = {
  status: StockStatus;
  signal: string | null;
  confidence: "high" | "medium" | "low";
  lowStockHint?: string | null;
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

// "Almost gone" / "Only X left" / "selling fast" — pre-OOS warning tier.
const LOW_STOCK_PATTERNS: RegExp[] = [
  /only\s+(\d{1,2})\s+(?:left|remaining|in\s+stock)/i,
  /hurry,?\s*only\s+(\d{1,2})\s+left/i,
  /(\d{1,2})\s+left\s+in\s+stock/i,
  /selling\s+fast/i,
  /\balmost\s+gone\b/i,
  /low\s+stock/i,
  /limited\s+stock/i,
  /few\s+left/i,
];

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

  // Pre-OOS: low-stock signal. Only fires if there's no add-to-cart on the
  // page (otherwise it's just "selling fast" marketing copy on an in-stock SKU).
  for (const p of LOW_STOCK_PATTERNS) {
    const m = text.match(p);
    if (m) {
      return {
        status: "low_stock",
        signal: m[0].slice(0, 60),
        confidence: "medium",
        lowStockHint: m[1] ? `${m[1]} left` : m[0].slice(0, 40),
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

// Lift a price from the scraped page. We deliberately keep this simple — first
// ₹/Rs/INR amount on the page is usually the active sell price. Returns both
// the raw string (for display) and a numeric value (for comparison).
const PRICE_PATTERNS: RegExp[] = [
  /₹\s*([\d]{2,3}(?:[,\s]\d{3})*(?:\.\d{1,2})?)/,
  /\bRs\.?\s*([\d]{2,3}(?:[,\s]\d{3})*(?:\.\d{1,2})?)/i,
  /\bINR\s*([\d]{2,3}(?:[,\s]\d{3})*(?:\.\d{1,2})?)/i,
];

export type PriceExtract = { display: string; value: number } | null;

export function extractPrice(text: string): PriceExtract {
  if (!text) return null;
  for (const p of PRICE_PATTERNS) {
    const m = text.match(p);
    if (m) {
      const cleaned = m[1].replace(/[,\s]/g, "");
      const value = Number(cleaned);
      if (!isFinite(value) || value <= 0) continue;
      return { display: m[0].trim(), value };
    }
  }
  return null;
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
