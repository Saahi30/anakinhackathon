const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

export type AdCopyInput = {
  brand: string;
  competitor: string;
  platform: string;
  productHint?: string | null;
};

export async function generateAdCopy(
  input: AdCopyInput
): Promise<string | null> {
  const key = process.env.GROQ_API_KEY;
  if (!key) return null;
  const model = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

  const system =
    "You write punchy, conversion-focused ad copy for D2C brands. Output 1 short headline (max 8 words) and 1 supporting line (max 18 words). No emojis. No quotes. No hashtags. Plain text, two lines.";

  const user = `Competitor "${input.competitor}" just went OUT OF STOCK on ${input.platform}. We are "${input.brand}" and we sell a competing product${
    input.productHint ? ` (${input.productHint})` : ""
  }. Write ad copy that captures customers searching for the OOS competitor right now.`;

  try {
    const res = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.8,
        max_tokens: 120,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });
    if (!res.ok) {
      const t = await res.text();
      console.error("[groq] error", res.status, t);
      return null;
    }
    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content?.trim();
    return text || null;
  } catch (e) {
    console.error("[groq] fetch failed", e);
    return null;
  }
}
