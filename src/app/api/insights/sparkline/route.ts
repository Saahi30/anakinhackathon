import { NextRequest, NextResponse } from "next/server";
import { getEventCountsByDay } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const days = Math.max(
    1,
    Math.min(60, Number(req.nextUrl.searchParams.get("days")) || 14)
  );
  const [strikes, restocks, lowStocks, priceDrops] = await Promise.all([
    getEventCountsByDay(days, ["oos_detected"]),
    getEventCountsByDay(days, ["back_in_stock"]),
    getEventCountsByDay(days, ["low_stock"]),
    getEventCountsByDay(days, ["price_drop"]),
  ]);
  return NextResponse.json({
    days,
    strikes: strikes.map((x) => x.count),
    restocks: restocks.map((x) => x.count),
    low_stocks: lowStocks.map((x) => x.count),
    price_drops: priceDrops.map((x) => x.count),
    dates: strikes.map((x) => x.day),
  });
}
