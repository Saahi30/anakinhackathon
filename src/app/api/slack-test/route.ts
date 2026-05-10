import { NextResponse } from "next/server";
import { sendSlackAlert } from "@/lib/slack";
import { getSettingAsync } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST() {
  const result = await sendSlackAlert({
    brand: (await getSettingAsync("brand_name")) || "Your Brand",
    competitor: "Test Competitor",
    platform: "Myntra",
    sku: "TEST-SKU",
    url: "https://www.myntra.com/test",
    oosForMinutes: 0,
    adCopy:
      "Out of stock? Not here.\nTheir bestseller just sold out — grab ours before it does.",
    whatsappEnabled: (await getSettingAsync("whatsapp_enabled")) === "1",
    adsBidSurgeEnabled:
      (await getSettingAsync("ads_bid_surge_enabled")) === "1",
  });
  return NextResponse.json(result, { status: result.ok ? 200 : 500 });
}
