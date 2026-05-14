import { NextResponse } from "next/server";
import {
  getCompetitorLeaderboard,
  getDayHourHeatmap,
  getEventCountsByDay,
  listStrikes,
} from "@/lib/db";

export const dynamic = "force-dynamic";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export async function GET() {
  // Pull a compact snapshot of the last week.
  const [leaders, strikes, daily, grid] = await Promise.all([
    getCompetitorLeaderboard(7, 5),
    listStrikes(7, 80),
    getEventCountsByDay(7, ["oos_detected"]),
    getDayHourHeatmap(7),
  ]);

  // Find peak day-hour
  let peak = { day: 0, hour: 0, count: 0 };
  for (let d = 0; d < 7; d++) {
    for (let h = 0; h < 24; h++) {
      if (grid[d][h] > peak.count)
        peak = { day: d, hour: h, count: grid[d][h] };
    }
  }

  const totalStrikes = strikes.length;
  const totalRevenue = strikes.reduce((acc, s) => {
    const hours = Math.min(12, s.duration_seconds / 3600);
    const impressions = hours * s.est_impressions_per_hour;
    const clicks = impressions * 0.06;
    const conv = clicks * s.est_capture_rate;
    return acc + conv * s.est_aov_inr;
  }, 0);
  const totalSpend = strikes.reduce(
    (acc, s) => acc + Math.min(12, s.duration_seconds / 3600) * s.est_spend_per_hour_inr,
    0
  );
  const roas = totalSpend > 0 ? totalRevenue / totalSpend : 0;

  const facts = {
    total_strikes: totalStrikes,
    total_strikes_per_day: daily.map((d) => d.count),
    peak_slot:
      peak.count > 0
        ? `${DAYS[peak.day]} ${String(peak.hour).padStart(2, "0")}:00`
        : null,
    top_competitors: leaders.map((l) => ({
      name: l.label || l.url,
      platform: l.platform,
      strikes: l.strikes,
      avg_window_min: Math.round(l.avg_window_seconds / 60),
    })),
    total_revenue_inr: Math.round(totalRevenue),
    avg_roas: Number(roas.toFixed(1)),
    days: 7,
  };

  // If we have no real data, return a neutral message — the panel handles
  // the empty state. Don't fake-narrate empty data.
  if (totalStrikes === 0) {
    return NextResponse.json({
      narrative:
        "No strikes captured in the last 7 days yet. Once competitors start going out of stock, this section will summarize the patterns automatically.",
      facts,
      generated: false,
    });
  }

  const key = process.env.GROQ_API_KEY;
  if (!key) {
    // Without Groq we still want a useful summary — render a templated one.
    const top = facts.top_competitors[0];
    return NextResponse.json({
      narrative: `${facts.total_strikes} competitor strike${facts.total_strikes === 1 ? "" : "s"} captured in the last 7 days${
        top ? `, led by ${top.name} on ${top.platform} (${top.strikes} OOS events).` : "."
      }${facts.peak_slot ? ` Peak slot: ${facts.peak_slot}.` : ""} Estimated ₹${facts.total_revenue_inr.toLocaleString("en-IN")} of attributed revenue at ${facts.avg_roas}× ROAS.`,
      facts,
      generated: false,
    });
  }

  const system = `You write a concise weekly insights paragraph for a D2C brand team.
Use ONLY the data in the JSON below. Plain prose, 3-5 sentences, no bullet points, no markdown, no quotes.
Highlight: most-striked competitor, peak day/time, total strikes, attributed revenue at ROAS.
If a number is zero or missing, just omit it rather than saying "0".`;

  const user = `JSON snapshot:\n${JSON.stringify(facts, null, 2)}\n\nWrite the paragraph.`;

  let narrative: string | null = null;
  try {
    const res = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
        temperature: 0.4,
        max_tokens: 350,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });
    if (res.ok) {
      const data = await res.json();
      narrative = data?.choices?.[0]?.message?.content?.trim() || null;
    }
  } catch (e) {
    console.error("[insights/narrative] groq fetch failed", e);
  }

  return NextResponse.json({
    narrative:
      narrative ||
      `${facts.total_strikes} strikes captured in the last 7 days.${
        facts.peak_slot ? ` Peak: ${facts.peak_slot}.` : ""
      } Estimated ₹${facts.total_revenue_inr.toLocaleString("en-IN")} captured at ${facts.avg_roas}× ROAS.`,
    facts,
    generated: !!narrative,
  });
}
