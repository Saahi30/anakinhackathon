import { NextRequest, NextResponse } from "next/server";
import { getProduct, insertCompetitor, listCompetitors } from "@/lib/db";
import { rainforestConfigured, searchAmazon } from "@/lib/rainforest";
import { scoreCandidates } from "@/lib/scoring";

export const dynamic = "force-dynamic";
export const maxDuration = 90;

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = Number(params.id);
  const product = await getProduct(id);
  if (!product) {
    return NextResponse.json({ error: "product not found" }, { status: 404 });
  }
  if (!rainforestConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "RAINFOREST_API_KEY not set — add it to .env or use manual competitor add",
        needsManual: true,
      },
      { status: 200 }
    );
  }

  const query = (product.title || "")
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 8)
    .join(" ");
  if (!query || query.length < 3) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "no usable product title to search — enrich the product first or add competitors manually",
        needsManual: true,
      },
      { status: 200 }
    );
  }

  let candidates;
  try {
    candidates = await searchAmazon(query, { limit: 12 });
  } catch (e: any) {
    return NextResponse.json(
      {
        ok: false,
        error: e?.message || "rainforest search failed",
        needsManual: true,
      },
      { status: 200 }
    );
  }
  if (!candidates.length) {
    return NextResponse.json({
      ok: true,
      inserted: 0,
      message: "no candidates returned",
      competitors: await listCompetitors(id),
    });
  }

  const scored = scoreCandidates(
    {
      title: product.title,
      category: product.category,
      price: product.price,
      rating: product.rating,
    },
    candidates
  );

  const existing = await listCompetitors(id);
  const existingAsins = new Set(existing.map((c) => c.asin).filter(Boolean));

  let insertedCount = 0;
  for (const sc of scored.slice(0, 8)) {
    if (existingAsins.has(sc.candidate.asin)) continue;
    await insertCompetitor({
      product_id: id,
      url: sc.candidate.link,
      platform: "amazon",
      title: sc.candidate.title,
      asin: sc.candidate.asin,
      price: sc.candidate.price?.raw || null,
      rating: sc.candidate.rating?.toString() || null,
      review_count: sc.candidate.ratings_total?.toString() || null,
      image_url: sc.candidate.image || null,
      score: sc.score,
      reasons: sc.reasons,
      status: "proposed",
      source: "rainforest",
    });
    insertedCount++;
  }

  return NextResponse.json({
    ok: true,
    inserted: insertedCount,
    competitors: await listCompetitors(id),
  });
}
