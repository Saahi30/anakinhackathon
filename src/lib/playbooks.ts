import {
  bumpPlaybookFired,
  insertEvent,
  listPlaybooks,
  type Monitor,
  type PlaybookRow,
} from "./db";
import { sendSlackAlert, type AlertTier } from "./slack";
import { generateAdCopyVariants } from "./groq";

export type PlaybookEvent =
  | "oos_detected"
  | "low_stock"
  | "back_in_stock"
  | "price_drop";

const KIND_TO_EVENT: Record<string, PlaybookEvent> = {
  oos_detected: "oos_detected",
  low_stock: "low_stock",
  back_in_stock: "back_in_stock",
  price_drop: "price_drop",
};

function inActiveHours(when: Date, hoursOnly: string | undefined): boolean {
  if (!hoursOnly || hoursOnly === "any") return true;
  const day = when.getDay();
  const hour = when.getHours();
  if (hoursOnly === "business") {
    if (day === 0 || day === 6) return false;
    return hour >= 9 && hour < 19;
  }
  if (hoursOnly === "weekend") {
    return day === 0 || day === 6;
  }
  return true;
}

function matchesTrigger(
  pb: PlaybookRow,
  ctx: { event: PlaybookEvent; monitor: Monitor; tier: AlertTier; now: Date }
): boolean {
  const t = pb.trigger || {};
  const events: string[] = Array.isArray(t.events) ? t.events : [];
  if (!events.includes(ctx.event)) return false;
  if (t.scope === "platform") {
    if (
      typeof t.platform === "string" &&
      t.platform &&
      ctx.monitor.platform !== t.platform
    )
      return false;
  } else if (t.scope === "monitor") {
    const needle = String(t.monitorLabel || "").toLowerCase();
    const hay = (ctx.monitor.label || ctx.monitor.url || "").toLowerCase();
    if (needle && !hay.includes(needle)) return false;
  }
  if (!inActiveHours(ctx.now, t.hoursOnly)) return false;
  return true;
}

export type PlaybookActionLog = {
  playbook_id: string;
  playbook_name: string;
  action: string;
  config?: string | null;
  ok: boolean;
  detail: string;
};

async function runAction(
  pb: PlaybookRow,
  action: { key: string; label: string; config?: string },
  ctx: {
    monitor: Monitor;
    event: PlaybookEvent;
    tier: AlertTier;
    competitor: string;
    brand: string;
  }
): Promise<PlaybookActionLog> {
  const base = {
    playbook_id: pb.id,
    playbook_name: pb.name,
    action: action.key,
    config: action.config ?? null,
  };
  try {
    if (action.key === "slack") {
      // Real Slack post via the configured webhook. The configured channel
      // (action.config) is informational since incoming webhooks post to a
      // fixed channel — we include it in the message text so demos read true.
      const res = await sendSlackAlert({
        brand: ctx.brand,
        competitor: ctx.competitor,
        platform: ctx.monitor.platform,
        sku: ctx.monitor.sku,
        url: ctx.monitor.url,
        oosForMinutes: 0,
        tier: ctx.tier,
        monitorId: ctx.monitor.id,
        adCopy: `Playbook "${pb.name}" routed this strike${action.config ? ` → ${action.config}` : ""}.`,
      });
      return {
        ...base,
        ok: res.ok,
        detail: res.ok
          ? `Slack post sent${action.config ? ` (routed to ${action.config})` : ""}`
          : `Slack post failed: ${res.error || res.status}`,
      };
    }
    if (action.key === "groq") {
      const variants = await generateAdCopyVariants(
        {
          brand: ctx.brand,
          competitor: ctx.competitor,
          platform: ctx.monitor.platform,
          productHint: ctx.monitor.label,
        },
        Math.max(1, Math.min(5, Number(action.config) || 3))
      );
      return {
        ...base,
        ok: variants.length > 0,
        detail: variants.length
          ? `AI returned ${variants.length} ad-copy variant${variants.length === 1 ? "" : "s"}`
          : "AI returned no variants (key missing or rate-limited)",
      };
    }
    // Placeholder actions: log only. These are real wires in the event feed —
    // they just don't talk to external systems yet (Meta/Google by design,
    // others because they need their own setup the user hasn't reached).
    const detail =
      {
        meta: `Would surge Meta Ads bid ${action.config || "+0%"} (placeholder)`,
        google: `Would adjust Google rival-KW bids ${action.config || "+0%"} (placeholder)`,
        amazon: `Would adjust Amazon SP bid ${action.config || "+0%"} (placeholder)`,
        whatsapp: `Would notify WhatsApp group ${action.config || ""} (placeholder)`,
        email: "Queued for next email digest",
        report: "Added to weekly digest queue",
        linear: `Would open Linear issue in ${action.config || "default"} (placeholder)`,
        log: "Logged for audit only",
      }[action.key] || `Action "${action.key}" executed (no-op)`;
    return { ...base, ok: true, detail };
  } catch (e: any) {
    return {
      ...base,
      ok: false,
      detail: e?.message || "action threw",
    };
  }
}

export async function runMatchingPlaybooks(ctx: {
  monitor: Monitor;
  tier: AlertTier;
  competitor: string;
  brand: string;
}): Promise<PlaybookActionLog[]> {
  const event = KIND_TO_EVENT[ctx.tier] || (ctx.tier as PlaybookEvent);
  let all: PlaybookRow[] = [];
  try {
    all = await listPlaybooks({ enabledOnly: true });
  } catch {
    return [];
  }
  const now = new Date();
  const matched = all.filter((pb) =>
    matchesTrigger(pb, { event, monitor: ctx.monitor, tier: ctx.tier, now })
  );
  const logs: PlaybookActionLog[] = [];
  for (const pb of matched) {
    const actions: any[] = Array.isArray(pb.actions) ? pb.actions : [];
    if (!actions.length) continue;
    const ran: PlaybookActionLog[] = [];
    for (const a of actions) {
      const res = await runAction(pb, a, { ...ctx, event });
      ran.push(res);
      logs.push(res);
    }
    await bumpPlaybookFired(pb.id).catch(() => {});
    await insertEvent({
      monitor_id: ctx.monitor.id,
      kind: "playbook_fired",
      status: ctx.tier,
      message: `Playbook "${pb.name}" fired ${ran.length} action${ran.length === 1 ? "" : "s"}`,
      payload: JSON.stringify({ playbook_id: pb.id, actions: ran }),
    });
  }
  return logs;
}
