import { NextRequest, NextResponse } from "next/server";
import { deleteProduct, getProduct, updateProduct } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = Number(params.id);
  const p = await getProduct(id);
  if (!p) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ product: p });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = Number(params.id);
  const body = await req.json().catch(() => ({}));
  const patch: any = {};
  for (const k of [
    "title",
    "category",
    "price",
    "rating",
    "review_count",
    "seller",
    "image_url",
  ]) {
    if (typeof body[k] === "string") patch[k] = body[k];
  }
  if (Array.isArray(body.attributes)) patch.attributes = body.attributes;
  await updateProduct(id, patch);
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = Number(params.id);
  await deleteProduct(id);
  return NextResponse.json({ ok: true });
}
