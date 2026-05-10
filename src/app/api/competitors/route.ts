import { NextRequest, NextResponse } from "next/server";
import { insertCompetitor, listCompetitors } from "@/lib/db";
import { detectPlatform } from "@/lib/platforms";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ competitors: await listCompetitors() });
}

// Manual competitor add — used when discovery misses one or fails entirely.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const url: string | undefined = body?.url?.trim();
  const productId: number | null =
    typeof body?.product_id === "number" ? body.product_id : null;
  const title: string | null = body?.title?.trim() || null;
  if (!url || !/^https?:\/\//.test(url)) {
    return NextResponse.json({ error: "valid url required" }, { status: 400 });
  }
  const c = await insertCompetitor({
    product_id: productId,
    url,
    platform: detectPlatform(url),
    title,
    status: "approved", // manual adds are pre-approved
    source: "manual",
    reasons: ["manually added"],
  });
  return NextResponse.json({ competitor: c });
}
