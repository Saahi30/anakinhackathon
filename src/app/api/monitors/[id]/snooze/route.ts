import { NextRequest, NextResponse } from "next/server";
import { insertEvent, updateMonitor } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = Number(params.id);
  if (!id) return NextResponse.json({ error: "invalid id" }, { status: 400 });
  const body = await req.json().catch(() => ({}));
  const hours = Math.max(0, Math.min(168, Number(body?.hours) || 1));
  if (hours === 0) {
    await updateMonitor(id, { snooze_until: null, auto_paused_at: null });
    await insertEvent({
      monitor_id: id,
      kind: "resumed",
      message: "Monitor resumed",
    });
    return NextResponse.json({ ok: true, snooze_until: null });
  }
  const until = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
  await updateMonitor(id, { snooze_until: until, auto_paused_at: null });
  await insertEvent({
    monitor_id: id,
    kind: "snoozed",
    message: `Snoozed for ${hours}h`,
  });
  return NextResponse.json({ ok: true, snooze_until: until });
}
