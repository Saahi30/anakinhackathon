import { NextResponse } from "next/server";
import { sendSlackAlert } from "@/lib/slack";
import { getSettingAsync } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let webhookOverride: string | null = null;
  try {
    const body = await req.json().catch(() => ({}));
    if (typeof body?.webhook_url === "string" && body.webhook_url.trim()) {
      webhookOverride = body.webhook_url.trim();
    }
  } catch {}

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
    webhookOverride,
  });
  return NextResponse.json(result, { status: result.ok ? 200 : 500 });
}
