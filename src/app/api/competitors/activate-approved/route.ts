import { NextRequest, NextResponse } from "next/server";
import { listCompetitors, insertMonitor, updateCompetitor } from "@/lib/db";
import { detectPlatform, platformLabel } from "@/lib/platforms";

export const dynamic = "force-dynamic";

export async function POST(_req: NextRequest) {
  const all = await listCompetitors();
  const approved = all.filter((c) => c.status === "approved" && !c.monitor_id);
  const created = [];
  for (const c of approved) {
    const platform = c.platform || detectPlatform(c.url);
    const monitor = await insertMonitor({
      url: c.url,
      label: c.title || `Loading… (${platformLabel(platform as any)})`,
      platform,
      sku: c.asin || null,
    });
    await updateCompetitor(c.id, { monitor_id: monitor.id });
    created.push({ competitor_id: c.id, monitor_id: monitor.id });
  }
  return NextResponse.json({ ok: true, activated: created.length, created });
}
