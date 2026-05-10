// Competitor scoring: rank candidate Amazon search results against a user's product.
import type { RainforestSearchResult } from "./rainforest";

export type ProductSeed = {
  title?: string | null;
  category?: string | null;
  price?: string | null;
  rating?: string | null;
};

export type ScoredCandidate = {
  candidate: RainforestSearchResult;
  score: number;
  reasons: string[];
};

const STOP = new Set([
  "the", "a", "an", "and", "or", "of", "for", "with", "in", "on", "to",
  "by", "at", "from", "is", "are", "this", "that", "pack", "set", "pcs",
  "size", "color", "colour", "ml", "g", "kg", "x", "xl", "xxl", "xxxl",
]);

function tokens(s: string | null | undefined): Set<string> {
  if (!s) return new Set();
  return new Set(
    s
      .toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .filter((t) => t.length > 2 && !STOP.has(t))
  );
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (!a.size || !b.size) return 0;
  let inter = 0;
  for (const t of a) if (b.has(t)) inter++;
  return inter / (a.size + b.size - inter);
}

function parsePrice(raw?: string | null): number | null {
  if (!raw) return null;
  const m = String(raw).replace(/[^0-9.]/g, "");
  const n = Number(m);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function priceBandScore(seed: number | null, cand: number | null): number {
  if (seed === null || cand === null) return 0;
  const ratio = cand / seed;
  if (ratio >= 0.7 && ratio <= 1.4) return 1;
  if (ratio >= 0.5 && ratio <= 1.7) return 0.6;
  if (ratio >= 0.3 && ratio <= 2.5) return 0.3;
  return 0;
}

function ratingScore(seed: string | null | undefined, cand: number | undefined): number {
  if (cand === undefined) return 0;
  if (cand >= 4.0) return 1;
  if (cand >= 3.5) return 0.6;
  return 0.3;
}

export function scoreCandidates(
  seed: ProductSeed,
  candidates: RainforestSearchResult[]
): ScoredCandidate[] {
  const seedTokens = tokens(seed.title);
  const seedCategory = (seed.category || "").toLowerCase();
  const seedPrice = parsePrice(seed.price);

  return candidates
    .map((c) => {
      const candTokens = tokens(c.title);
      const titleSim = jaccard(seedTokens, candTokens);
      const candPrice = c.price?.value ?? parsePrice(c.price?.raw);
      const priceFit = priceBandScore(seedPrice, candPrice);
      const ratingFit = ratingScore(seed.rating, c.rating);

      const candCats = (c.categories || [])
        .map((x) => x.name.toLowerCase())
        .join(" ");
      const categoryMatch = seedCategory && candCats.includes(seedCategory) ? 1 : 0;

      const score =
        titleSim * 0.55 +
        priceFit * 0.2 +
        ratingFit * 0.15 +
        categoryMatch * 0.1;

      const reasons: string[] = [];
      if (titleSim > 0.25) reasons.push("similar product keywords");
      if (priceFit >= 0.6) reasons.push("similar price band");
      if (ratingFit >= 0.6) reasons.push("strong rating profile");
      if (categoryMatch) reasons.push("same category");
      if (!reasons.length) reasons.push("loose match — review carefully");

      return { candidate: c, score, reasons };
    })
    .sort((a, b) => b.score - a.score);
}
