import { NextRequest, NextResponse } from "next/server";
import { deleteMonitor, updateMonitor } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = Number(params.id);
  if (!id) return NextResponse.json({ error: "invalid id" }, { status: 400 });
  const body = await req.json().catch(() => ({}));
  const patch: any = {};
  if (typeof body.enabled === "boolean") patch.enabled = body.enabled ? 1 : 0;
  if (typeof body.sku === "string") patch.sku = body.sku;
  if (typeof body.label === "string") patch.label = body.label;
  await updateMonitor(id, patch);
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = Number(params.id);
  if (!id) return NextResponse.json({ error: "invalid id" }, { status: 400 });
  await deleteMonitor(id);
  return NextResponse.json({ ok: true });
}
