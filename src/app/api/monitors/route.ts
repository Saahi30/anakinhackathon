import { NextRequest, NextResponse } from "next/server";
import { listMonitors, insertMonitor } from "@/lib/db";
import { detectPlatform, platformLabel } from "@/lib/platforms";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ monitors: await listMonitors() });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const url: string | undefined = body?.url?.trim();
  const sku: string | null = body?.sku?.trim() || null;
  const label: string | null = body?.label?.trim() || null;
  if (!url || !/^https?:\/\//.test(url)) {
    return NextResponse.json({ error: "valid url required" }, { status: 400 });
  }
  const platform = detectPlatform(url);
  const m = await insertMonitor({
    url,
    label: label || `Loading… (${platformLabel(platform)})`,
    platform,
    sku,
  });
  return NextResponse.json({ monitor: m });
}
