import { NextRequest, NextResponse } from "next/server";
import { listStrikes, type StrikeRecord } from "@/lib/db";

export const dynamic = "force-dynamic";

export type ScoredStrike = StrikeRecord & {
  est_impressions: number;
  est_clicks: number;
  est_conversions: number;
  est_revenue_inr: number;
  est_spend_inr: number;
  est_roas: number;
};

function scoreStrike(s: StrikeRecord): ScoredStrike {
  // Capped at 12h: strikes longer than that are usually long-tail SKUs where
  // attribution drops off. Anything shorter is fully attributed.
  const hours = Math.min(12, s.duration_seconds / 3600);
  const impressions = Math.round(hours * s.est_impressions_per_hour);
  // 6% baseline CTR — high because these are commercial-intent searches
  // (someone hit the OOS PDP and bounced).
  const clicks = Math.round(impressions * 0.06);
  const conversions = Math.round(clicks * s.est_capture_rate);
  const revenue = conversions * s.est_aov_inr;
  const spend = Math.round(hours * s.est_spend_per_hour_inr);
  const roas = spend > 0 ? Number((revenue / spend).toFixed(1)) : 0;
  return {
    ...s,
    est_impressions: impressions,
    est_clicks: clicks,
    est_conversions: conversions,
    est_revenue_inr: revenue,
    est_spend_inr: spend,
    est_roas: roas,
  };
}

export async function GET(req: NextRequest) {
  const days = Math.max(
    1,
    Math.min(120, Number(req.nextUrl.searchParams.get("days")) || 30)
  );
  const limit = Math.max(
    1,
    Math.min(500, Number(req.nextUrl.searchParams.get("limit")) || 100)
  );
  const raw = await listStrikes(days, limit);
  const scored = raw.map(scoreStrike);
  const totals = scored.reduce(
    (acc, s) => {
      acc.revenue += s.est_revenue_inr;
      acc.spend += s.est_spend_inr;
      acc.clicks += s.est_clicks;
      acc.impressions += s.est_impressions;
      return acc;
    },
    { revenue: 0, spend: 0, clicks: 0, impressions: 0 }
  );
  const live = scored.filter((s) => s.is_live).length;
  return NextResponse.json({
    strikes: scored,
    totals: {
      ...totals,
      strikes: scored.length,
      live,
      avg_roas:
        scored.length > 0
          ? Number(
              (scored.reduce((a, s) => a + s.est_roas, 0) / scored.length).toFixed(1)
            )
          : 0,
    },
  });
}
