import { bumpUsage, createAlertActionToken, getSettingAsync } from "./db";

export type AlertTier = "oos" | "low_stock" | "restock" | "price_drop";

export type SlackAlert = {
  brand: string;
  competitor: string;
  platform: string;
  sku: string | null;
  url: string;
  oosForMinutes: number;
  adCopy?: string | null;
  adCopyVariants?: string[];
  whatsappEnabled?: boolean;
  adsBidSurgeEnabled?: boolean;
  webhookOverride?: string | null;
  tier?: AlertTier;
  lowStockHint?: string | null;
  priceFrom?: string | null;
  priceTo?: string | null;
  priceDropPct?: number | null;
  monitorId?: number;
};

function tierMeta(tier: AlertTier): { icon: string; headline: (a: SlackAlert) => string } {
  switch (tier) {
    case "low_stock":
      return {
        icon: ":hourglass_flowing_sand:",
        headline: (a) =>
          `Low stock — ${a.competitor} on ${a.platform}${a.lowStockHint ? ` (${a.lowStockHint})` : ""}`,
      };
    case "restock":
      return {
        icon: ":arrows_counterclockwise:",
        headline: (a) => `Back in stock — ${a.competitor} on ${a.platform}`,
      };
    case "price_drop":
      return {
        icon: ":chart_with_downwards_trend:",
        headline: (a) =>
          `Price drop — ${a.competitor} on ${a.platform}${
            a.priceFrom && a.priceTo ? ` (${a.priceFrom} → ${a.priceTo})` : ""
          }`,
      };
    case "oos":
    default:
      return {
        icon: ":rotating_light:",
        headline: (a) => `OOS detected — ${a.competitor} on ${a.platform}`,
      };
  }
}

async function actionLink(
  monitorId: number | undefined,
  action: string,
  payload?: any
): Promise<string | null> {
  if (!monitorId) return null;
  const base =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    process.env.VERCEL_URL ||
    "http://localhost:3000";
  const host = base.startsWith("http") ? base : `https://${base}`;
  try {
    const token = await createAlertActionToken(monitorId, action, payload);
    return `${host}/api/alerts/action?token=${token}`;
  } catch (e) {
    console.error("[slack] failed to mint action token", e);
    return null;
  }
}

export async function sendSlackAlert(alert: SlackAlert): Promise<{
  ok: boolean;
  status?: number;
  error?: string;
}> {
  const webhook =
    (alert.webhookOverride && alert.webhookOverride.trim()) ||
    (await getSettingAsync("slack_webhook_url")) ||
    process.env.SLACK_WEBHOOK_URL;
  if (!webhook) return { ok: false, error: "no slack webhook configured" };
  if (!/^https:\/\/hooks\.slack\.com\//.test(webhook)) {
    return { ok: false, error: "invalid Slack webhook URL" };
  }

  const tier: AlertTier = alert.tier || "oos";
  const meta = tierMeta(tier);

  const oosLabel =
    alert.oosForMinutes < 1
      ? "just now"
      : alert.oosForMinutes < 60
        ? `${alert.oosForMinutes} min`
        : `${Math.round(alert.oosForMinutes / 60)}h`;

  const blocks: any[] = [
    {
      type: "header",
      text: { type: "plain_text", text: `${meta.icon} ${meta.headline(alert)}` },
    },
  ];

  const fields: any[] = [
    { type: "mrkdwn", text: `*Brand:*\n${alert.brand}` },
    { type: "mrkdwn", text: `*Platform:*\n${alert.platform}` },
    { type: "mrkdwn", text: `*SKU:*\n${alert.sku || "—"}` },
  ];
  if (tier === "oos") {
    fields.push({ type: "mrkdwn", text: `*OOS for:*\n${oosLabel}` });
  } else if (tier === "price_drop" && alert.priceDropPct != null) {
    fields.push({
      type: "mrkdwn",
      text: `*Drop:*\n${alert.priceDropPct.toFixed(1)}%`,
    });
  } else if (tier === "low_stock" && alert.lowStockHint) {
    fields.push({ type: "mrkdwn", text: `*Signal:*\n${alert.lowStockHint}` });
  }
  blocks.push({ type: "section", fields });

  blocks.push({
    type: "section",
    text: { type: "mrkdwn", text: `<${alert.url}|View competitor listing>` },
  });

  const variants =
    alert.adCopyVariants && alert.adCopyVariants.length
      ? alert.adCopyVariants
      : alert.adCopy
        ? [alert.adCopy]
        : [];
  if (variants.length === 1) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Suggested ad copy:*\n>${variants[0].replace(/\n/g, "\n>")}`,
      },
    });
  } else if (variants.length > 1) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: variants
          .map(
            (v, i) =>
              `*Variant ${String.fromCharCode(65 + i)}*\n>${v.replace(/\n/g, "\n>")}`
          )
          .join("\n\n"),
      },
    });
  }

  // Interactive buttons (as link buttons that hit our own webhook route).
  const buttons: any[] = [];
  if (alert.monitorId) {
    const adLive = await actionLink(alert.monitorId, "ad_live");
    const snooze1h = await actionLink(alert.monitorId, "snooze", { hours: 1 });
    const resolve = await actionLink(alert.monitorId, "resolve");
    if (adLive)
      buttons.push({
        type: "button",
        text: { type: "plain_text", text: "Ad live ✅" },
        url: adLive,
        style: "primary",
      });
    if (snooze1h)
      buttons.push({
        type: "button",
        text: { type: "plain_text", text: "Snooze 1h" },
        url: snooze1h,
      });
    if (resolve)
      buttons.push({
        type: "button",
        text: { type: "plain_text", text: "Mark resolved" },
        url: resolve,
      });
  }
  if (buttons.length) {
    blocks.push({ type: "actions", elements: buttons });
  }

  const actions: string[] = [];
  if (alert.adsBidSurgeEnabled)
    actions.push(":rocket: Ads bid surge triggered (mocked)");
  if (alert.whatsappEnabled)
    actions.push(":envelope: WhatsApp alert (coming soon)");
  if (actions.length) {
    blocks.push({
      type: "context",
      elements: actions.map((t) => ({ type: "mrkdwn", text: t })),
    });
  }

  const body = {
    text: meta.headline(alert),
    blocks,
  };

  try {
    const res = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const t = await res.text();
      return { ok: false, status: res.status, error: t };
    }
    bumpUsage({ slack: 1 }).catch(() => {});
    return { ok: true, status: res.status };
  } catch (e: any) {
    return { ok: false, error: e?.message || "fetch failed" };
  }
}
