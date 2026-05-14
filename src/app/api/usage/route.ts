import { NextRequest, NextResponse } from "next/server";
import { getUsageWindow } from "@/lib/db";

export const dynamic = "force-dynamic";

// Rough public-rate-card estimates so the demo shows a believable projected cost.
// Override via env if you have a real contract.
const ANAKIN_USD_PER_SCRAPE = Number(process.env.ANAKIN_USD_PER_SCRAPE || "0.005");
const GROQ_USD_PER_1M_TOKENS = Number(
  process.env.GROQ_USD_PER_1M_TOKENS || "0.59"
);

export async function GET(req: NextRequest) {
  const days = Math.max(
    1,
    Math.min(60, Number(req.nextUrl.searchParams.get("days")) || 30)
  );
  const rows = await getUsageWindow(days);
  const today = new Date().toISOString().slice(0, 10);
  const todayRow = rows.find((r) => r.day === today) || {
    day: today,
    anakin_scrapes: 0,
    groq_tokens: 0,
    slack_sent: 0,
  };
  const totalAnakin = rows.reduce((a, r) => a + r.anakin_scrapes, 0);
  const totalGroq = rows.reduce((a, r) => a + r.groq_tokens, 0);
  const totalSlack = rows.reduce((a, r) => a + r.slack_sent, 0);

  // Project the current month: scale today's pace × days-in-month, plus
  // already-incurred MTD spend.
  const now = new Date();
  const dayOfMonth = now.getUTCDate();
  const daysInMonth = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0)
  ).getUTCDate();
  const mtdRows = rows.filter(
    (r) =>
      new Date(r.day + "T00:00:00Z").getUTCMonth() === now.getUTCMonth() &&
      new Date(r.day + "T00:00:00Z").getUTCFullYear() === now.getUTCFullYear()
  );
  const mtdAnakin = mtdRows.reduce((a, r) => a + r.anakin_scrapes, 0);
  const mtdGroqTokens = mtdRows.reduce((a, r) => a + r.groq_tokens, 0);
  const mtdCostUsd =
    mtdAnakin * ANAKIN_USD_PER_SCRAPE +
    (mtdGroqTokens / 1_000_000) * GROQ_USD_PER_1M_TOKENS;
  const projectedMonthUsd = (mtdCostUsd / Math.max(1, dayOfMonth)) * daysInMonth;

  return NextResponse.json({
    today: todayRow,
    rows,
    totals: {
      anakin_scrapes: totalAnakin,
      groq_tokens: totalGroq,
      slack_sent: totalSlack,
    },
    cost: {
      anakin_per_scrape_usd: ANAKIN_USD_PER_SCRAPE,
      groq_per_1m_tokens_usd: GROQ_USD_PER_1M_TOKENS,
      mtd_usd: Number(mtdCostUsd.toFixed(2)),
      projected_month_usd: Number(projectedMonthUsd.toFixed(2)),
    },
  });
}
