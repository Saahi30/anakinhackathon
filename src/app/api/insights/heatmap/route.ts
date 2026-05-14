import { NextRequest, NextResponse } from "next/server";
import { getDayHourHeatmap } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const days = Math.max(
    1,
    Math.min(120, Number(req.nextUrl.searchParams.get("days")) || 30)
  );
  const grid = await getDayHourHeatmap(days);
  return NextResponse.json({ days, grid });
}
