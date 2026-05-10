import { NextRequest, NextResponse } from "next/server";
import { getMonitor } from "@/lib/db";
import { checkMonitor } from "@/lib/worker";

export const dynamic = "force-dynamic";

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = Number(params.id);
  if (!id) return NextResponse.json({ error: "invalid id" }, { status: 400 });
  const m = await getMonitor(id);
  if (!m) return NextResponse.json({ error: "not found" }, { status: 404 });
  checkMonitor(m).catch((e) => console.error("manual check failed", e));
  return NextResponse.json({ ok: true, queued: true });
}
