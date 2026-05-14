import { NextRequest, NextResponse } from "next/server";
import { recentOOSCountsForMonitor } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = Number(params.id);
  if (!id) return NextResponse.json({ error: "invalid id" }, { status: 400 });
  const hours = Math.max(
    1,
    Math.min(168, Number(req.nextUrl.searchParams.get("hours")) || 24)
  );
  const buckets = await recentOOSCountsForMonitor(id, hours);
  return NextResponse.json({ buckets, hours });
}
