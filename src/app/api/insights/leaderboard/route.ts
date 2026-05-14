import { NextRequest, NextResponse } from "next/server";
import { getCompetitorLeaderboard } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const days = Math.max(
    1,
    Math.min(120, Number(req.nextUrl.searchParams.get("days")) || 30)
  );
  const limit = Math.max(
    1,
    Math.min(50, Number(req.nextUrl.searchParams.get("limit")) || 10)
  );
  const rows = await getCompetitorLeaderboard(days, limit);
  return NextResponse.json({ rows });
}
