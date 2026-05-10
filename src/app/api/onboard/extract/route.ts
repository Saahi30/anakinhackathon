import { NextRequest, NextResponse } from "next/server";
import { scrapeUrl } from "@/lib/anakin";
import { extractBrandInfo } from "@/lib/groq";

export const dynamic = "force-dynamic";
export const maxDuration = 90;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const url: string | undefined = body?.url?.trim();
  const sourceType: string = body?.sourceType || "website";
  if (!url || !/^https?:\/\//.test(url)) {
    return NextResponse.json({ error: "valid url required" }, { status: 400 });
  }

  const scrape = await scrapeUrl(url);
  if (scrape.status !== "completed" || !scrape.markdown) {
    return NextResponse.json(
      { error: scrape.error || "scrape failed" },
      { status: 502 }
    );
  }

  const trimmed = (scrape.markdown || "").slice(0, 12_000);
  const extracted = await extractBrandInfo(trimmed, sourceType);
  if (!extracted) {
    return NextResponse.json(
      { error: "extraction failed (Groq returned no usable JSON)" },
      { status: 502 }
    );
  }

  return NextResponse.json({
    ok: true,
    sourceUrl: url,
    sourceType,
    brand: extracted,
  });
}
