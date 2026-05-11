import { getSettingAsync } from "./db";

export type SlackAlert = {
  brand: string;
  competitor: string;
  platform: string;
  sku: string | null;
  url: string;
  oosForMinutes: number;
  adCopy?: string | null;
  whatsappEnabled?: boolean;
  adsBidSurgeEnabled?: boolean;
  webhookOverride?: string | null;
};

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

  const oosLabel =
    alert.oosForMinutes < 1
      ? "just now"
      : alert.oosForMinutes < 60
        ? `${alert.oosForMinutes} min`
        : `${Math.round(alert.oosForMinutes / 60)}h`;

  const blocks: any[] = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: `OOS detected — ${alert.competitor} on ${alert.platform}`,
      },
    },
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: `*Brand:*\n${alert.brand}` },
        { type: "mrkdwn", text: `*Platform:*\n${alert.platform}` },
        { type: "mrkdwn", text: `*SKU:*\n${alert.sku || "—"}` },
        { type: "mrkdwn", text: `*OOS for:*\n${oosLabel}` },
      ],
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `<${alert.url}|View competitor listing>`,
      },
    },
  ];

  if (alert.adCopy) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Suggested ad copy:*\n>${alert.adCopy.replace(/\n/g, "\n>")}`,
      },
    });
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
    text: `OOS: ${alert.competitor} on ${alert.platform} — capture the traffic`,
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
    return { ok: true, status: res.status };
  } catch (e: any) {
    return { ok: false, error: e?.message || "fetch failed" };
  }
}
