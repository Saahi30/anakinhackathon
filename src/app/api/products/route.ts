import { NextRequest, NextResponse } from "next/server";
import { insertProduct, listProducts } from "@/lib/db";
import { detectPlatform } from "@/lib/platforms";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ products: await listProducts() });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const url: string | undefined = body?.url?.trim();
  const title: string | null = body?.title?.trim() || null;
  const category: string | null = body?.category?.trim() || null;
  if (!url || !/^https?:\/\//.test(url)) {
    return NextResponse.json({ error: "valid url required" }, { status: 400 });
  }
  const platform = detectPlatform(url);
  const p = await insertProduct({
    url,
    platform,
    title,
    category,
    source: body?.source || "manual",
  });
  return NextResponse.json({ product: p });
}
