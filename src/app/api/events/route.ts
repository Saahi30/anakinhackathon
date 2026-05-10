import { NextRequest, NextResponse } from "next/server";
import { listEvents } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const limit = Math.min(
    Number(req.nextUrl.searchParams.get("limit") || 50),
    200
  );
  return NextResponse.json({ events: await listEvents(limit) });
}
