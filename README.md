# StockStrike

Monitor competitor product listings on Myntra, Ajio, Blinkit, Zepto, and Amazon. The moment one of them goes out of stock, fire a Slack alert with auto-generated ad copy so the brand team can capture the homeless traffic before anyone else.

Built for a hackathon — uses [anakin.io](https://anakin.io) for scraping and [Groq](https://console.groq.com) (Llama 3.3 70B) for ad copy generation.

## Stack

- Next.js 14 (App Router) + TypeScript + Tailwind
- Supabase (Postgres + Realtime) — schema in `supabase/migrations/`
- Polling worker started via `instrumentation.ts` — runs in-process with the Next.js server
- anakin.io URL Scraper (`POST /v1/url-scraper` + poll `/v1/url-scraper/{id}`)
- Slack incoming webhooks
- Groq Chat Completions API

## Setup

```bash
npm install
cp .env.example .env
# fill in:
#   NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
#   ANAKIN_API_KEY, SLACK_WEBHOOK_URL, GROQ_API_KEY
npx supabase db push     # apply schema to your linked Supabase project
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The "realtime" pill in the header turns green when the dashboard has subscribed to Supabase Realtime.

## How it works

1. Add competitor product URLs from the dashboard.
2. The polling worker (`src/lib/worker.ts`) wakes every `POLL_INTERVAL_SECONDS` and picks up to 5 due monitors per tick.
3. For each, it calls `scrapeUrl()` which submits the URL to anakin and polls until the job completes.
4. Per-platform regex rules in `src/lib/platforms.ts` detect `out_of_stock` / `in_stock` from the markdown + cleaned HTML.
5. On a transition into `out_of_stock`, we fire a Slack alert. If `auto_ad_copy` is on, Groq writes a 2-line ad copy and we attach it to the Slack message.

## Demo flow for judges

1. Pre-stage a real OOS URL — verify a Myntra/Amazon product currently shows "Notify Me" / "Currently Unavailable" before the demo.
2. Hit "Send Slack test" once at the start to prove the webhook is wired up.
3. Add the OOS URL via the dashboard — first scrape fires within ~2s of being picked up.
4. Within 30–60s, the dashboard flips it to `OUT OF STOCK`, the live feed shows the event, and Slack pings.
5. Backup: every monitor row has a **Demo OOS** button that fires a fake transition straight to Slack — useful if the live URL fails or the network is flaky.

## File map

- `src/app/page.tsx` — entry, renders `Dashboard`
- `src/components/*` — UI: dashboard, monitor list, event feed, settings, add monitor
- `src/app/api/*` — REST endpoints for monitors, events, settings, slack-test
- `src/lib/supabase.ts` — Supabase client (service-role for server, anon for browser/Realtime)
- `src/lib/db.ts` — Supabase queries (monitors, events, settings)
- `supabase/migrations/` — schema migrations (`npx supabase db push` to apply)
- `src/lib/anakin.ts` — anakin URL Scraper client
- `src/lib/platforms.ts` — platform detection + OOS regex rules
- `src/lib/worker.ts` — polling loop, OOS transition logic, alert firing
- `src/lib/slack.ts` — Slack webhook formatter
- `src/lib/groq.ts` — Groq ad-copy generator
- `src/instrumentation.ts` — boots the worker on Next.js startup

## Notes on detection

OOS detection runs simple per-platform regex against the page markdown + cleaned HTML returned by anakin. It looks for explicit OOS phrases (`Sold Out`, `Out of Stock`, `Notify Me`, `Currently Unavailable`) before checking for in-stock signals (`Add to Bag`, `Add to Cart`, `Buy Now`). Confidence is "high" when an OOS phrase matches. For tricky listings you can swap to AI extraction by setting `generateJson: true` in the anakin call and parsing the structured result.

## Mocked actions

- **Google/Meta ads bid surge** — toggle in UI, included as a noted action in the Slack alert. No real ad API call.
- **WhatsApp alert** — toggle in UI, marked "coming soon", included as a noted action in the Slack alert.
