// Gemini 2.5 Flash Image ("nano banana") client for ad creative generation.
// Falls back to a procedural SVG mock when GEMINI_API_KEY is not configured,
// so the WarRoom always has something to show during a demo.

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

function model(): string {
  return process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image-preview";
}

function apiKey(): string | null {
  return process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || null;
}

export type Aspect = "1:1" | "9:16" | "16:9" | "4:5";

export type AdCreativeInput = {
  brand: string;
  brandTagline?: string;
  brandVoice?: string;
  brandValueProps?: string[];
  brandTargetAudience?: string;
  competitor: string;
  platform: string;
  productHint?: string | null;
  headline?: string | null;
  subline?: string | null;
  aspect: Aspect;
  style?: "minimalist" | "bold" | "lifestyle" | "luxury";
};

export type AdCreativeResult = {
  ok: boolean;
  source: "gemini" | "mock";
  mimeType: string;
  dataUrl: string;
  prompt: string;
  durationMs: number;
  error?: string;
};

function buildPrompt(input: AdCreativeInput): string {
  const props =
    input.brandValueProps && input.brandValueProps.length
      ? input.brandValueProps.slice(0, 3).join("; ")
      : "";
  const style = input.style || "bold";
  const headline =
    input.headline ||
    `${input.brand}: in stock, shipping today.`;
  const subline =
    input.subline ||
    `Don't wait for ${input.competitor} — get yours now.`;

  return [
    `You are a senior creative director. Generate a high-converting social-media ad creative for an Indian D2C brand.`,
    ``,
    `BRAND`,
    `- Name: ${input.brand}`,
    input.brandTagline ? `- Tagline: ${input.brandTagline}` : "",
    input.brandVoice ? `- Voice: ${input.brandVoice}` : "",
    props ? `- Value props: ${props}` : "",
    input.brandTargetAudience ? `- Audience: ${input.brandTargetAudience}` : "",
    ``,
    `STRIKE CONTEXT`,
    `- Competitor "${input.competitor}" just went OUT OF STOCK on ${input.platform}.`,
    input.productHint ? `- Product context: ${input.productHint}` : "",
    `- Goal: capture shoppers searching for the now-unavailable competitor.`,
    ``,
    `OVERLAY TEXT (must appear cleanly on the image, correctly spelled)`,
    `- Headline: "${headline}"`,
    `- Sub-line: "${subline}"`,
    `- Small CTA chip: "Shop now"`,
    ``,
    `VISUAL DIRECTION`,
    `- Style: ${style} — modern, premium, scroll-stopping.`,
    `- Photorealistic product photography or lifestyle moment, soft studio lighting.`,
    `- Aspect ratio: ${input.aspect}.`,
    `- Background: clean colorful gradient (warm peach/cream or saturated brand color), high contrast for legible typography.`,
    `- Typography: rounded sans-serif, large readable hierarchy. Headline must be perfectly legible.`,
    `- No watermarks, no logos of other brands, no fake reviews, no UI chrome.`,
    `- One single composition. No collage. No borders.`,
  ]
    .filter(Boolean)
    .join("\n");
}

const ASPECT_TO_SIZE: Record<Aspect, { w: number; h: number }> = {
  "1:1": { w: 1024, h: 1024 },
  "9:16": { w: 720, h: 1280 },
  "16:9": { w: 1280, h: 720 },
  "4:5": { w: 1024, h: 1280 },
};

export async function generateAdCreative(
  input: AdCreativeInput
): Promise<AdCreativeResult> {
  const start = Date.now();
  const prompt = buildPrompt(input);
  const key = apiKey();

  if (!key) {
    return {
      ok: true,
      source: "mock",
      mimeType: "image/svg+xml",
      dataUrl: mockSvgDataUrl(input),
      prompt,
      durationMs: Date.now() - start,
    };
  }

  try {
    const url = `${GEMINI_BASE}/${model()}:generateContent?key=${encodeURIComponent(key)}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          responseModalities: ["IMAGE", "TEXT"],
          imageConfig: { aspectRatio: input.aspect },
        },
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("[nanobanana] error", res.status, text.slice(0, 400));
      return {
        ok: true,
        source: "mock",
        mimeType: "image/svg+xml",
        dataUrl: mockSvgDataUrl(input),
        prompt,
        durationMs: Date.now() - start,
        error: `gemini ${res.status}`,
      };
    }

    const data = await res.json();
    const parts: any[] = data?.candidates?.[0]?.content?.parts ?? [];
    const imgPart = parts.find((p) => p?.inlineData?.data);
    if (!imgPart) {
      console.error("[nanobanana] no image in response", JSON.stringify(data).slice(0, 400));
      return {
        ok: true,
        source: "mock",
        mimeType: "image/svg+xml",
        dataUrl: mockSvgDataUrl(input),
        prompt,
        durationMs: Date.now() - start,
        error: "no image in response",
      };
    }
    const mimeType: string = imgPart.inlineData.mimeType || "image/png";
    const b64: string = imgPart.inlineData.data;
    return {
      ok: true,
      source: "gemini",
      mimeType,
      dataUrl: `data:${mimeType};base64,${b64}`,
      prompt,
      durationMs: Date.now() - start,
    };
  } catch (e: any) {
    console.error("[nanobanana] fetch failed", e);
    return {
      ok: true,
      source: "mock",
      mimeType: "image/svg+xml",
      dataUrl: mockSvgDataUrl(input),
      prompt,
      durationMs: Date.now() - start,
      error: String(e?.message || e),
    };
  }
}

// --- Mock fallback ----------------------------------------------------------

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function pickPalette(seed: string): { from: string; to: string; ink: string } {
  const palettes = [
    { from: "#ffb084", to: "#ff6b5a", ink: "#0a0a0a" }, // peach → coral
    { from: "#ff4d8b", to: "#b8a4ed", ink: "#ffffff" }, // pink → lavender
    { from: "#1a3a3a", to: "#0a1a1a", ink: "#a4d4c5" }, // teal → dark
    { from: "#e8b94a", to: "#ffb084", ink: "#0a0a0a" }, // ochre → peach
    { from: "#a4d4c5", to: "#1a3a3a", ink: "#0a0a0a" }, // mint → teal
    { from: "#fffaf0", to: "#f5f0e0", ink: "#0a0a0a" }, // cream → cream
  ];
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return palettes[Math.abs(h) % palettes.length];
}

function mockSvgDataUrl(input: AdCreativeInput): string {
  const { w, h } = ASPECT_TO_SIZE[input.aspect];
  const palette = pickPalette(input.brand + input.competitor);
  const headline = escapeXml(
    input.headline || `${input.brand}: in stock now`
  );
  const subline = escapeXml(
    input.subline || `Don't wait for ${input.competitor}`
  );
  const brand = escapeXml(input.brand);
  const tagline = escapeXml(input.brandTagline || "Free shipping · ships today");

  const headlineSize = Math.round(w * 0.062);
  const sublineSize = Math.round(w * 0.028);
  const brandSize = Math.round(w * 0.026);

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${palette.from}"/>
      <stop offset="100%" stop-color="${palette.to}"/>
    </linearGradient>
    <radialGradient id="glow" cx="80%" cy="20%" r="60%">
      <stop offset="0%" stop-color="rgba(255,255,255,0.35)"/>
      <stop offset="100%" stop-color="rgba(255,255,255,0)"/>
    </radialGradient>
    <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="22"/>
    </filter>
  </defs>

  <rect width="${w}" height="${h}" fill="url(#bg)"/>
  <rect width="${w}" height="${h}" fill="url(#glow)"/>

  <!-- Decorative blobs -->
  <circle cx="${w * 0.18}" cy="${h * 0.78}" r="${w * 0.22}" fill="rgba(255,255,255,0.12)" filter="url(#soft)"/>
  <circle cx="${w * 0.85}" cy="${h * 0.18}" r="${w * 0.16}" fill="rgba(0,0,0,0.10)" filter="url(#soft)"/>

  <!-- Brand chip -->
  <rect x="${w * 0.05}" y="${h * 0.06}" rx="${brandSize * 0.6}" ry="${brandSize * 0.6}"
        width="${brand.length * brandSize * 0.6 + brandSize * 1.6}" height="${brandSize * 1.9}"
        fill="rgba(255,255,255,0.85)"/>
  <text x="${w * 0.05 + brandSize * 0.8}" y="${h * 0.06 + brandSize * 1.35}"
        font-family="Inter, Arial, sans-serif" font-weight="700" font-size="${brandSize}"
        fill="#0a0a0a" letter-spacing="0.5">${brand.toUpperCase()}</text>

  <!-- Headline -->
  <text x="${w * 0.06}" y="${h * 0.5}" font-family="Inter, Arial, sans-serif"
        font-weight="700" font-size="${headlineSize}" fill="${palette.ink}"
        style="letter-spacing:-2px">
    ${wrapText(headline, w * 0.88, headlineSize, 3)
      .map(
        (line, i) =>
          `<tspan x="${w * 0.06}" dy="${i === 0 ? 0 : headlineSize * 1.05}">${line}</tspan>`
      )
      .join("")}
  </text>

  <!-- Sub-line -->
  <text x="${w * 0.06}" y="${h * 0.78}" font-family="Inter, Arial, sans-serif"
        font-weight="500" font-size="${sublineSize}" fill="${palette.ink}" opacity="0.9">
    ${wrapText(subline, w * 0.88, sublineSize, 2)
      .map(
        (line, i) =>
          `<tspan x="${w * 0.06}" dy="${i === 0 ? 0 : sublineSize * 1.25}">${line}</tspan>`
      )
      .join("")}
  </text>

  <!-- CTA chip -->
  <g transform="translate(${w * 0.06}, ${h * 0.88})">
    <rect width="${w * 0.32}" height="${sublineSize * 2.4}" rx="${sublineSize * 1.2}"
          fill="${palette.ink}"/>
    <text x="${w * 0.16}" y="${sublineSize * 1.55}" text-anchor="middle"
          font-family="Inter, Arial, sans-serif" font-weight="700" font-size="${sublineSize}"
          fill="${palette.ink === "#ffffff" ? "#0a0a0a" : "#ffffff"}">Shop now →</text>
  </g>

  <!-- Tagline corner -->
  <text x="${w - w * 0.05}" y="${h - h * 0.04}" text-anchor="end"
        font-family="Inter, Arial, sans-serif" font-weight="500"
        font-size="${sublineSize * 0.75}" fill="${palette.ink}" opacity="0.6">
    ${tagline}
  </text>
</svg>`;

  // base64 to keep parity with gemini path
  const b64 = Buffer.from(svg, "utf-8").toString("base64");
  return `data:image/svg+xml;base64,${b64}`;
}

function wrapText(text: string, maxWidth: number, fontSize: number, maxLines: number): string[] {
  // Rough avg-char width estimate at the chosen size
  const charW = fontSize * 0.55;
  const maxChars = Math.max(8, Math.floor(maxWidth / charW));
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w;
    if (next.length > maxChars && cur) {
      lines.push(cur);
      cur = w;
      if (lines.length === maxLines - 1) break;
    } else {
      cur = next;
    }
  }
  if (cur && lines.length < maxLines) lines.push(cur);
  return lines.length ? lines : [text.slice(0, maxChars)];
}
