import { bumpUsage } from "./db";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

function model(): string {
  return process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
}

async function chat(
  messages: { role: "system" | "user"; content: string }[],
  opts: { temperature?: number; maxTokens?: number; jsonMode?: boolean } = {}
): Promise<string | null> {
  const key = process.env.GROQ_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model(),
        temperature: opts.temperature ?? 0.6,
        max_tokens: opts.maxTokens ?? 600,
        messages,
        ...(opts.jsonMode
          ? { response_format: { type: "json_object" } }
          : {}),
      }),
    });
    if (!res.ok) {
      console.error("[groq] error", res.status, await res.text());
      return null;
    }
    const data = await res.json();
    const tokens = Number(data?.usage?.total_tokens) || 0;
    if (tokens) bumpUsage({ groq: tokens }).catch(() => {});
    return data?.choices?.[0]?.message?.content?.trim() || null;
  } catch (e) {
    console.error("[groq] fetch failed", e);
    return null;
  }
}

export type BrandInfo = {
  brand_name: string;
  brand_tagline: string;
  brand_description: string;
  brand_voice: string;
  brand_categories: string[];
  brand_value_props: string[];
  brand_target_audience: string;
};

export async function extractBrandInfo(
  pageMarkdown: string,
  sourceType: string
): Promise<BrandInfo | null> {
  const system = `You extract structured brand information from website or marketplace listing content.
Return STRICT JSON only with these exact keys (no extras, no commentary, no markdown fences):
{
  "brand_name": "string",
  "brand_tagline": "string (max 12 words, empty string if unknown)",
  "brand_description": "string (1-2 sentences, max 40 words, what the brand sells and why)",
  "brand_voice": "string (max 8 words describing tone, e.g. 'premium minimalist', 'youthful energetic')",
  "brand_categories": ["array of 1-5 short product category strings"],
  "brand_value_props": ["array of 2-4 short bullet strings, max 8 words each"],
  "brand_target_audience": "string (max 12 words)"
}
Use only information present in the source content. Do not invent facts. If a field cannot be determined, return an empty string or empty array.`;

  const user = `Source type: ${sourceType}

Source content:
"""
${pageMarkdown}
"""

Return the JSON now.`;

  const raw = await chat(
    [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    { temperature: 0.2, maxTokens: 700, jsonMode: true }
  );
  if (!raw) return null;

  try {
    const cleaned = raw
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();
    const parsed = JSON.parse(cleaned);
    return {
      brand_name: String(parsed.brand_name || "").trim(),
      brand_tagline: String(parsed.brand_tagline || "").trim(),
      brand_description: String(parsed.brand_description || "").trim(),
      brand_voice: String(parsed.brand_voice || "").trim(),
      brand_categories: Array.isArray(parsed.brand_categories)
        ? parsed.brand_categories.map((x: any) => String(x).trim()).filter(Boolean)
        : [],
      brand_value_props: Array.isArray(parsed.brand_value_props)
        ? parsed.brand_value_props.map((x: any) => String(x).trim()).filter(Boolean)
        : [],
      brand_target_audience: String(parsed.brand_target_audience || "").trim(),
    };
  } catch (e) {
    console.error("[groq] failed to parse JSON:", raw.slice(0, 200));
    return null;
  }
}

export type ProductInfo = {
  title: string;
  category: string;
  price: string;
  rating: string;
  review_count: string;
  seller: string;
  attributes: string[];
};

export async function extractProductInfo(
  pageMarkdown: string,
  url: string
): Promise<ProductInfo | null> {
  const system = `You extract structured product information from a marketplace product page.
Return STRICT JSON only with these exact keys (no extras, no commentary, no markdown fences):
{
  "title": "string (product title, max 140 chars)",
  "category": "string (single short category, e.g. 't-shirts', 'protein powder', empty if unknown)",
  "price": "string (price as shown, e.g. '₹1,499', empty if unknown)",
  "rating": "string (e.g. '4.3', empty if unknown)",
  "review_count": "string (e.g. '1,204', empty if unknown)",
  "seller": "string (seller or platform hint, e.g. 'Cloudtail', empty if unknown)",
  "attributes": ["array of 0-6 short attribute strings, max 6 words each, e.g. '100% cotton', 'pack of 3'"]
}
Use only information present in the source content. Do not invent facts.`;

  const user = `URL: ${url}

Source content:
"""
${pageMarkdown}
"""

Return the JSON now.`;

  const raw = await chat(
    [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    { temperature: 0.2, maxTokens: 600, jsonMode: true }
  );
  if (!raw) return null;

  try {
    const cleaned = raw
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();
    const parsed = JSON.parse(cleaned);
    return {
      title: String(parsed.title || "").trim(),
      category: String(parsed.category || "").trim(),
      price: String(parsed.price || "").trim(),
      rating: String(parsed.rating || "").trim(),
      review_count: String(parsed.review_count || "").trim(),
      seller: String(parsed.seller || "").trim(),
      attributes: Array.isArray(parsed.attributes)
        ? parsed.attributes.map((x: any) => String(x).trim()).filter(Boolean)
        : [],
    };
  } catch (e) {
    console.error("[groq] product extract parse fail:", raw.slice(0, 200));
    return null;
  }
}

export async function explainCompetitorMatch(
  brandProductTitle: string,
  candidateTitle: string,
  reasonHints: string[]
): Promise<string | null> {
  const system = `You write one short sentence (max 18 words) explaining why a candidate Amazon product is likely a competitor for a brand's own product. Plain text. No quotes. No emojis.`;
  const user = `Our product: ${brandProductTitle}
Candidate: ${candidateTitle}
Signals: ${reasonHints.join(", ") || "loose match"}
Write the one-line reason now.`;
  return await chat(
    [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    { temperature: 0.4, maxTokens: 60 }
  );
}

export type AdCopyInput = {
  brand: string;
  competitor: string;
  platform: string;
  productHint?: string | null;
  brandTagline?: string;
  brandDescription?: string;
  brandVoice?: string;
  brandValueProps?: string[];
  brandTargetAudience?: string;
};

export async function generateAdCopy(
  input: AdCopyInput
): Promise<string | null> {
  const variants = await generateAdCopyVariants(input, 1);
  return variants[0] || null;
}

export async function generateAdCopyVariants(
  input: AdCopyInput,
  count: number = 3
): Promise<string[]> {
  const n = Math.max(1, Math.min(5, count));
  const hasContext =
    input.brandDescription ||
    input.brandVoice ||
    (input.brandValueProps && input.brandValueProps.length);

  const system = `You write punchy, conversion-focused ad copy for D2C brands.
Return STRICT JSON: { "variants": ["headline\\nsupporting line", ...] }
Each variant is exactly two lines separated by a single \\n:
  Line 1: short headline (max 8 words).
  Line 2: supporting line (max 18 words).
Each variant must take a distinctly different angle (e.g. value, urgency, social proof, voice). No emojis, no quotes, no hashtags, no labels.`;

  const brandContext = hasContext
    ? `Our brand: ${input.brand}
${input.brandTagline ? `Tagline: ${input.brandTagline}` : ""}
${input.brandDescription ? `What we sell: ${input.brandDescription}` : ""}
${input.brandVoice ? `Voice: ${input.brandVoice}` : ""}
${input.brandValueProps && input.brandValueProps.length ? `Value props: ${input.brandValueProps.join("; ")}` : ""}
${input.brandTargetAudience ? `Audience: ${input.brandTargetAudience}` : ""}`.trim()
    : `Our brand: ${input.brand}`;

  const user = `${brandContext}

Competitor "${input.competitor}" just went OUT OF STOCK on ${input.platform}${
    input.productHint ? ` (${input.productHint})` : ""
  }.

Write ${n} distinct ad-copy variants that capture shoppers searching for the now-unavailable competitor. Lean into our brand voice and value props.`;

  const raw = await chat(
    [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    { temperature: 0.85, maxTokens: 60 + 120 * n, jsonMode: true }
  );
  if (!raw) return [];
  try {
    const cleaned = raw
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();
    const parsed = JSON.parse(cleaned);
    const arr: any[] = Array.isArray(parsed?.variants) ? parsed.variants : [];
    return arr
      .map((v) => String(v || "").trim())
      .filter((v) => v.length > 0)
      .slice(0, n);
  } catch (e) {
    console.error("[groq] ad-copy variants parse fail:", raw.slice(0, 200));
    return [];
  }
}
