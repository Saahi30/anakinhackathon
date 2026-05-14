import { NextRequest, NextResponse } from "next/server";
import { deletePlaybook, upsertPlaybook } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  const body = await req.json().catch(() => ({}));
  const row = await upsertPlaybook({
    id,
    name: body.name || "Untitled playbook",
    enabled: !!body.enabled,
    trigger: body.trigger && typeof body.trigger === "object" ? body.trigger : {},
    actions: Array.isArray(body.actions) ? body.actions : [],
  });
  return NextResponse.json({ playbook: row });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  await deletePlaybook(params.id);
  return NextResponse.json({ ok: true });
}
