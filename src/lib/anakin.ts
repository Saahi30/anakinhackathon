import { bumpUsage } from "./db";

const BASE = "https://api.anakin.io/v1";

export type ScrapeResult = {
  status: "completed" | "failed" | "pending" | "processing";
  url: string;
  markdown?: string;
  html?: string;
  cleanedHtml?: string;
  error?: string | null;
  durationMs?: number;
};

function apiKey(): string {
  const k = process.env.ANAKIN_API_KEY;
  if (!k) throw new Error("ANAKIN_API_KEY missing");
  return k;
}

async function submitScrape(url: string): Promise<string> {
  const res = await fetch(`${BASE}/url-scraper`, {
    method: "POST",
    headers: {
      "X-API-Key": apiKey(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url,
      country: process.env.ANAKIN_COUNTRY || "in",
      useBrowser: process.env.ANAKIN_USE_BROWSER !== "false",
      generateJson: false,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`anakin submit failed ${res.status}: ${text}`);
  }
  const data = (await res.json()) as { jobId: string; status: string };
  if (!data.jobId) throw new Error("anakin submit returned no jobId");
  return data.jobId;
}

async function getJob(jobId: string): Promise<any> {
  const res = await fetch(`${BASE}/url-scraper/${jobId}`, {
    headers: { "X-API-Key": apiKey() },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`anakin poll failed ${res.status}: ${text}`);
  }
  return await res.json();
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function scrapeUrl(
  url: string,
  opts: { timeoutMs?: number; pollIntervalMs?: number } = {}
): Promise<ScrapeResult> {
  const timeoutMs = opts.timeoutMs ?? 90_000;
  const pollIntervalMs = opts.pollIntervalMs ?? 3_000;
  const jobId = await submitScrape(url);
  bumpUsage({ anakin: 1 }).catch(() => {});

  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const job = await getJob(jobId);
    if (job.status === "completed") {
      return {
        status: "completed",
        url,
        markdown: job.markdown ?? "",
        html: job.html ?? "",
        cleanedHtml: job.cleanedHtml ?? "",
        durationMs: job.durationMs,
      };
    }
    if (job.status === "failed") {
      return { status: "failed", url, error: job.error || "scrape failed" };
    }
    await sleep(pollIntervalMs);
  }
  return { status: "failed", url, error: "scrape timed out" };
}
