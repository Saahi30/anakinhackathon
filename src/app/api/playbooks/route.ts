import { NextRequest, NextResponse } from "next/server";
import { listPlaybooks, upsertPlaybook } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await listPlaybooks();
  return NextResponse.json({
    playbooks: rows.map((r) => ({
      id: r.id,
      name: r.name,
      enabled: r.enabled,
      trigger: r.trigger,
      actions: Array.isArray(r.actions) ? r.actions : [],
      fireCount: r.fire_count,
      lastFired: r.last_fired_at,
    })),
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }
  const id: string = body.id || `pb-${Date.now()}`;
  const name: string = (body.name || "Untitled playbook").toString();
  const enabled: boolean = !!body.enabled;
  const trigger = body.trigger && typeof body.trigger === "object" ? body.trigger : {};
  const actions = Array.isArray(body.actions) ? body.actions : [];
  const row = await upsertPlaybook({ id, name, enabled, trigger, actions });
  return NextResponse.json({ playbook: row });
}
