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

## Product flow

The end-to-end flow is a 7-step onboarding wizard followed by continuous monitoring.

1. **Brand setup** — choose manual entry, auto-fill from a brand website, or auto-fill from a marketplace listing. Auto-fill uses **Anakin URL Scraper API** to scrape the page and **Groq** to extract a brand profile draft.
2. **Brand review** — every AI-filled field is editable. The user must confirm before continuing (mandatory because scraping/AI can be wrong).
3. **Product import** — add product listings individually OR upload a CSV. CSV is validated and previewed before commit. Template is downloadable from `/api/products/import-csv`.
4. **Enrichment** — each imported product is scraped via **Anakin** and normalized with **Groq** into title, price, category, rating, review count, seller, and attributes. Re-runnable per product.
5. **Competitor discovery** — for each product, **Rainforest API** searches Amazon for likely competitors. Internal scoring ranks them by title similarity, keyword overlap, category match, price band, and rating profile.
6. **Competitor review** — approve, reject, edit, prioritize, or remove each candidate. Manual fallback at every product (paste a URL directly) for when discovery misses or fails.
7. **Activation** — approved competitors become monitors. The polling worker scrapes them via **Anakin** repeatedly; Slack pings on every real `in_stock → out_of_stock` transition. Optional Groq ad-copy is attached to each alert.

External tools used:

- **Anakin URL Scraper API** — brand site scrape, product enrichment scrape, repeated competitor monitoring scrape
- **Groq API** — brand profile synthesis, product field normalization, ad-copy generation
- **Rainforest API** — Amazon competitor discovery (search + product data in JSON)
- **Slack Incoming Webhooks** — real-time OOS alert delivery

## Dashboard

After onboarding, the dashboard has five tabs:
- **Monitoring** — competitor monitor list with current stock state, plus a quick-add manual fallback
- **Live feed** — timeline of brand setup, product import, competitor approval, scrape complete, OOS detected, Slack alert sent
- **Alert history** — past OOS events and Slack delivery status
- **Needs review** — low-confidence brand extraction, failed enrichments, weak competitor matches, scrape errors
- **Settings** — Slack webhook, poll interval, ad-copy toggle, brand context

## Demo flow for judges

1. Pre-stage a real OOS URL — verify a Myntra/Amazon product currently shows "Notify Me" / "Currently Unavailable" before the demo.
2. Hit "Send Slack test" once at the start to prove the webhook is wired up.
3. Add the OOS URL via the dashboard — first scrape fires within ~2s of being picked up.
4. Within 30–60s, the dashboard flips it to `OUT OF STOCK`, the live feed shows the event, and Slack pings.
5. Backup: every monitor row has a **Demo OOS** button that fires a fake transition straight to Slack — useful if the live URL fails or the network is flaky.

## File map

- `src/app/page.tsx` — entry, renders `Dashboard`
- `src/components/Onboarding.tsx` + `src/components/onboarding/*` — 7-step wizard
- `src/components/Dashboard.tsx` — tabbed dashboard (monitoring / feed / alerts / review / settings)
- `src/components/{MonitoringFeed,AlertHistory,NeedsReviewQueue,BrandSummary}.tsx` — dashboard widgets
- `src/app/api/brand/*` — brand profile read/update
- `src/app/api/onboard/extract/*` — Anakin + Groq brand draft extraction
- `src/app/api/products/*` — product CRUD, CSV import, enrichment
- `src/app/api/competitors/*` — competitor list, manual add, approve/reject, activate-as-monitor
- `src/app/api/monitors/*` — existing monitor endpoints
- `src/lib/anakin.ts` — Anakin URL Scraper client
- `src/lib/rainforest.ts` — Rainforest Amazon search/product client
- `src/lib/scoring.ts` — competitor scoring (title sim · price band · category · rating)
- `src/lib/csv.ts` — CSV parser + product template
- `src/lib/groq.ts` — Groq brand-profile, product-info, and ad-copy helpers
- `src/lib/db.ts` — Supabase queries (brand_profile, products, competitors, monitors, events, settings)
- `src/lib/worker.ts` — polling loop, OOS transition logic, alert firing
- `src/lib/slack.ts` — Slack webhook formatter
- `src/instrumentation.ts` — boots the worker on Next.js startup
- `supabase/migrations/` — schema migrations (`npx supabase db push` to apply)

## Notes on detection

OOS detection runs simple per-platform regex against the page markdown + cleaned HTML returned by anakin. It looks for explicit OOS phrases (`Sold Out`, `Out of Stock`, `Notify Me`, `Currently Unavailable`) before checking for in-stock signals (`Add to Bag`, `Add to Cart`, `Buy Now`). Confidence is "high" when an OOS phrase matches. For tricky listings you can swap to AI extraction by setting `generateJson: true` in the anakin call and parsing the structured result.

## Mocked actions

- **Google/Meta ads bid surge** — toggle in UI, included as a noted action in the Slack alert. No real ad API call.
- **WhatsApp alert** — toggle in UI, marked "coming soon", included as a noted action in the Slack alert.
