import { NextRequest, NextResponse } from "next/server";
import { getCompetitor, insertMonitor, updateCompetitor } from "@/lib/db";
import { detectPlatform, platformLabel } from "@/lib/platforms";

export const dynamic = "force-dynamic";

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = Number(params.id);
  const c = await getCompetitor(id);
  if (!c) return NextResponse.json({ error: "not found" }, { status: 404 });

  if (c.monitor_id) {
    return NextResponse.json({ ok: true, monitor_id: c.monitor_id });
  }

  const platform = c.platform || detectPlatform(c.url);
  const monitor = await insertMonitor({
    url: c.url,
    label: c.title || `Loading… (${platformLabel(platform as any)})`,
    platform,
    sku: c.asin || null,
  });
  await updateCompetitor(c.id, {
    status: "approved",
    monitor_id: monitor.id,
  });

  return NextResponse.json({ ok: true, monitor });
}
