import { NextRequest, NextResponse } from "next/server";
import { deleteCompetitor, getCompetitor, updateCompetitor } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = Number(params.id);
  const c = await getCompetitor(id);
  if (!c) return NextResponse.json({ error: "not found" }, { status: 404 });
  const body = await req.json().catch(() => ({}));
  const patch: any = {};
  if (typeof body.status === "string") {
    if (!["proposed", "approved", "rejected"].includes(body.status)) {
      return NextResponse.json({ error: "invalid status" }, { status: 400 });
    }
    patch.status = body.status;
  }
  if (typeof body.title === "string") patch.title = body.title;
  if (typeof body.priority === "number") patch.priority = body.priority;
  await updateCompetitor(id, patch);
  return NextResponse.json({ ok: true, competitor: await getCompetitor(id) });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = Number(params.id);
  await deleteCompetitor(id);
  return NextResponse.json({ ok: true });
}
