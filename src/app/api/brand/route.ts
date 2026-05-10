import { NextRequest, NextResponse } from "next/server";
import { getBrandProfile, saveBrandProfile, type BrandProfile } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ brand: await getBrandProfile() });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }
  const allowed: (keyof BrandProfile)[] = [
    "brand_name",
    "brand_tagline",
    "brand_description",
    "brand_voice",
    "brand_categories",
    "brand_value_props",
    "brand_target_audience",
    "brand_website",
    "brand_source_url",
    "brand_marketplaces",
    "brand_regions",
    "brand_logo_url",
    "brand_notes",
    "source_type",
    "confidence",
  ];
  const patch: Partial<BrandProfile> = {};
  for (const k of allowed) {
    if (typeof body[k] === "string") (patch as any)[k] = body[k];
  }
  const brand = await saveBrandProfile(patch);
  return NextResponse.json({ ok: true, brand });
}
