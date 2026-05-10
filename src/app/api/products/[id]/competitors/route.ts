import { NextRequest, NextResponse } from "next/server";
import { listCompetitors } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = Number(params.id);
  return NextResponse.json({ competitors: await listCompetitors(id) });
}
