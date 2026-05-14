import { NextRequest, NextResponse } from "next/server";
import { consumeAlertActionToken, insertEvent, updateMonitor } from "@/lib/db";

export const dynamic = "force-dynamic";

function htmlResponse(title: string, body: string, ok = true) {
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title>
<style>
  body{font-family:-apple-system,Segoe UI,Roboto,sans-serif;background:#faf6f1;color:#0a0a0a;
    min-height:100vh;display:grid;place-items:center;margin:0;padding:40px}
  .card{background:#fff;border:1px solid #ece6dd;border-radius:24px;padding:40px 48px;
    box-shadow:0 8px 24px rgba(0,0,0,0.04);max-width:480px;text-align:center}
  h1{font-size:24px;margin:0 0 8px;letter-spacing:-0.02em}
  p{color:#666;line-height:1.5;margin:0 0 24px;font-size:14px}
  .ok{color:#0a8a5f}.fail{color:#c14a4a}
  a{color:#1a3a3a;text-decoration:none;font-weight:600;font-size:13px}
</style></head><body><div class="card">
  <h1 class="${ok ? "ok" : "fail"}">${title}</h1>
  <p>${body}</p>
  <a href="/">← Back to StockStrike</a>
</div></body></html>`;
  return new NextResponse(html, {
    status: ok ? 200 : 400,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) return htmlResponse("Invalid link", "No token supplied.", false);
  const claim = await consumeAlertActionToken(token);
  if (!claim) {
    return htmlResponse(
      "Link already used",
      "This action link has already been used or has expired.",
      false
    );
  }

  const { monitor_id, action, payload } = claim;
  const now = new Date().toISOString();

  if (action === "snooze") {
    const hours = Number(payload?.hours) || 1;
    const until = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
    await updateMonitor(monitor_id, { snooze_until: until });
    await insertEvent({
      monitor_id,
      kind: "snoozed",
      message: `Snoozed via Slack for ${hours}h`,
    });
    return htmlResponse("Snoozed", `Monitor paused for ${hours} hour(s).`);
  }
  if (action === "resolve") {
    await insertEvent({
      monitor_id,
      kind: "resolved",
      message: "Marked resolved via Slack",
    });
    return htmlResponse(
      "Marked resolved",
      "The alert has been marked resolved. Monitoring continues."
    );
  }
  if (action === "ad_live") {
    await insertEvent({
      monitor_id,
      kind: "ad_live",
      message: "Ad confirmed live via Slack",
    });
    return htmlResponse(
      "Ad marked live",
      "Logged. The team will see this in the live feed."
    );
  }
  return htmlResponse("Unknown action", `Action "${action}" not handled.`, false);
}
