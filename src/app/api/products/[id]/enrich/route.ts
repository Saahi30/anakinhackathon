import { NextRequest, NextResponse } from "next/server";
import { getProduct, updateProduct } from "@/lib/db";
import { scrapeUrl } from "@/lib/anakin";
import { extractProductInfo } from "@/lib/groq";
import { extractTitle } from "@/lib/platforms";

export const dynamic = "force-dynamic";
export const maxDuration = 90;

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = Number(params.id);
  const p = await getProduct(id);
  if (!p) return NextResponse.json({ error: "not found" }, { status: 404 });

  await updateProduct(id, {
    enrichment_status: "running",
    enrichment_error: null,
  });

  const scrape = await scrapeUrl(p.url);
  if (scrape.status !== "completed") {
    await updateProduct(id, {
      enrichment_status: "failed",
      enrichment_error: scrape.error || "scrape failed",
    });
    return NextResponse.json({ ok: false, error: scrape.error || "scrape failed" });
  }

  const md = (scrape.markdown || "").slice(0, 12_000);
  const info = await extractProductInfo(md, p.url);

  const fallbackTitle = info?.title || extractTitle(scrape.markdown || "") || p.title;
  await updateProduct(id, {
    title: fallbackTitle || null,
    category: info?.category || p.category || null,
    price: info?.price || null,
    rating: info?.rating || null,
    review_count: info?.review_count || null,
    seller: info?.seller || null,
    attributes: info?.attributes || [],
    enrichment_status: info ? "enriched" : "partial",
    enrichment_error: info ? null : "AI returned no JSON",
  });

  return NextResponse.json({
    ok: true,
    product: await getProduct(id),
    info,
  });
}
