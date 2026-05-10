import { NextRequest, NextResponse } from "next/server";
import { getAllSettingsAsync, setSettingAsync } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ settings: await getAllSettingsAsync() });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }
  for (const [k, v] of Object.entries(body)) {
    if (
      typeof v === "string" ||
      typeof v === "number" ||
      typeof v === "boolean"
    ) {
      await setSettingAsync(k, String(v));
    }
  }
  return NextResponse.json({ settings: await getAllSettingsAsync() });
}
