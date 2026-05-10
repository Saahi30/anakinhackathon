import { NextRequest, NextResponse } from "next/server";
import {
  getBrandProfile,
  getMonitor,
  getSettingAsync,
  insertEvent,
} from "@/lib/db";
import {
  generateAdCreative,
  type Aspect,
  type AdCreativeInput,
} from "@/lib/nanobanana";

export const dynamic = "force-dynamic";
// Image generation can take 10–20s; bump beyond default lambda timeout.
export const maxDuration = 60;

const ASPECTS = new Set<Aspect>(["1:1", "9:16", "16:9", "4:5"]);
const STYLES = new Set(["minimalist", "bold", "lifestyle", "luxury"]);

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const monitorId: number | undefined = body?.monitor_id
    ? Number(body.monitor_id)
    : undefined;

  const aspectRaw: string = body?.aspect || "1:1";
  const aspect: Aspect = (ASPECTS.has(aspectRaw as Aspect)
    ? aspectRaw
    : "1:1") as Aspect;

  const styleRaw: string | undefined = body?.style;
  const style = STYLES.has(styleRaw || "")
    ? (styleRaw as AdCreativeInput["style"])
    : "bold";

  // Brand context: prefer the brand_profile table, fall back to settings.
  const brandProfile = await getBrandProfile();
  const brandSetting = await getSettingAsync("brand_name");
  const brand =
    brandProfile.brand_name ||
    brandSetting ||
    body?.brand ||
    "Your Brand";
  const brandTagline = brandProfile.brand_tagline || (await getSettingAsync("brand_tagline"));
  const brandVoice = brandProfile.brand_voice || (await getSettingAsync("brand_voice"));
  const brandTargetAudience =
    brandProfile.brand_target_audience ||
    (await getSettingAsync("brand_target_audience"));
  const brandValuePropsRaw =
    brandProfile.brand_value_props ||
    (await getSettingAsync("brand_value_props"));
  const brandValueProps = brandValuePropsRaw
    ? brandValuePropsRaw
        .split("|")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  let competitor: string = body?.competitor || "the competitor";
  let platform: string = body?.platform || "amazon";
  let productHint: string | null = body?.product_hint || null;

  if (monitorId) {
    const m = await getMonitor(monitorId);
    if (m) {
      competitor = m.label || m.url || competitor;
      platform = m.platform || platform;
      productHint = m.label || productHint;
    }
  }

  const input: AdCreativeInput = {
    brand,
    brandTagline,
    brandVoice,
    brandValueProps,
    brandTargetAudience,
    competitor,
    platform,
    productHint,
    headline: body?.headline || null,
    subline: body?.subline || null,
    aspect,
    style,
  };

  const result = await generateAdCreative(input);

  // Log a lightweight event so the strike timeline can show "creative generated".
  if (monitorId) {
    try {
      await insertEvent({
        monitor_id: monitorId,
        kind: "ad_creative",
        status: "out_of_stock",
        message: `Ad creative generated · ${aspect} · ${style} · ${result.source}`,
        payload: JSON.stringify({
          aspect,
          style,
          source: result.source,
          mimeType: result.mimeType,
          durationMs: result.durationMs,
          // Don't store the base64 in the events table — too large.
        }),
      });
    } catch (e) {
      console.error("[ad-creative] failed to log event", e);
    }
  }

  return NextResponse.json({
    ok: result.ok,
    source: result.source,
    mimeType: result.mimeType,
    dataUrl: result.dataUrl,
    aspect,
    style,
    durationMs: result.durationMs,
    error: result.error || null,
  });
}
