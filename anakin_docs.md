# API Reference (/docs/api-reference)

Explore the full AnakinScraper REST API. All endpoints use the base URL `https://api.anakin.io/v1` and require an `X-API-Key` header for authentication.

### Products

<CardGrid>
  <ProductCard title="Wire" description="Pre-built actions for popular websites — scrape and extract structured data" href="/docs/api-reference/holocron" />
  <ProductCard title="URL Scraper" description="Scrape single or batch URLs with caching and AI extraction" href="/docs/api-reference/url-scraper" />
  <ProductCard title="Map (URL Discovery)" description="Discover all URLs on a website via sitemap and link extraction" href="/docs/api-reference/map" />
  <ProductCard title="Crawl" description="Scrape multiple pages from a website with pattern filtering" href="/docs/api-reference/crawl" />
  <ProductCard title="Search API" description="AI-powered web search with citations (synchronous)" href="/docs/api-reference/search" />
  <ProductCard title="Agentic Search" description="Multi-stage automated research pipeline" href="/docs/api-reference/agentic-search" />
  <ProductCard title="Browser API" description="Control a stealth browser with Playwright or Puppeteer via CDP WebSocket" href="/docs/api-reference/browser-api" />
  <ProductCard title="Browser Sessions" description="Save and reuse login sessions for authenticated scraping" href="/docs/api-reference/browser-sessions" />
</CardGrid>

### Authentication

Every request requires an API key passed via the `X-API-Key` header:

```
X-API-Key: your_api_key
```

Get your API key from the [Dashboard](/dashboard).


---

# Agentic Search (/docs/api-reference/agentic-search)

Advanced 4-stage AI research pipeline that automatically searches the web, scrapes relevant sources, and synthesizes a comprehensive research report. Jobs are processed asynchronously.

### How It Works

1. **Query refinement** — AI refines your research question for optimal search
2. **Web search** — discovers relevant sources and citations
3. **Citation scraping** — automatically scrapes top citation URLs for full content
4. **Analysis & synthesis** — produces a comprehensive research report

### Endpoints

<EndpointCard method="POST" path="/v1/agentic-search" description="Submit Search — start an agentic research job" href="/docs/api-reference/agentic-search/submit-search" />

<EndpointCard method="GET" path="/v1/agentic-search/{id}" description="Get Search Result — poll for status and retrieve research report" href="/docs/api-reference/agentic-search/get-search-result" />


---

# GET Get Results (/docs/api-reference/agentic-search/get-search-result)

<EndpointBanner method="GET" path="https://api.anakin.io/v1/agentic-search/{id}" />

Retrieve the status and results of an agentic search job. Agentic searches run through multiple stages and may take several minutes — poll every 10 seconds.

---

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` **required** | string | The job ID returned from the submit endpoint |

---

### Response — Processing

<StatusBadge code={202} text="Accepted" />

```json
{
  "job_id": "3f8aa45d-6ea3-4107-88ce-7f39ecf48a84",
  "status": "pending",
  "message": "Job is pending",
  "created_at": "2024-01-01T12:00:00.000Z"
}
```

### Response — Completed

<StatusBadge code={200} text="OK" />

```json
{
  "id": "3f8aa45d-6ea3-4107-88ce-7f39ecf48a84",
  "status": "completed",
  "jobType": "agentic_search",
  "generatedJson": {
    "summary": "Summary of the research findings...",
    "structured_data": {
      "developments": [
        {
          "title": "Quantum Computing Advances",
          "description": "Recent developments in quantum computing...",
          "organization": "IBM",
          "date": "2024-01"
        }
      ]
    },
    "data_schema": {
      "description": "Schema for structured data extraction",
      "fields": {
        "developments": {
          "type": "array",
          "description": "List of developments"
        }
      }
    }
  },
  "createdAt": "2024-01-01T12:00:00.000Z",
  "completedAt": "2024-01-01T12:05:00.000Z",
  "durationMs": 33500
}
```

---

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier for the job |
| `status` | string | `pending`, `processing`, `completed`, or `failed` |
| `jobType` | string | Always `agentic_search` for this endpoint |
| `generatedJson` | object | The full agentic search result (see below) |
| `createdAt` | string | ISO 8601 timestamp of job creation |
| `completedAt` | string | ISO 8601 timestamp of completion |
| `durationMs` | number | Total processing time in milliseconds |

### generatedJson Fields

| Field | Type | Description |
|-------|------|-------------|
| `summary` | string | Concise summary of findings |
| `structured_data` | object | Dynamic structured data matching `data_schema.fields` |
| `data_schema` | object | Schema describing the structured data format |

### Job Statuses

| Status | Description |
|--------|-------------|
| `pending` | Job is queued |
| `processing` | Research pipeline is running |
| `completed` | Research report is ready |
| `failed` | Job encountered an error |

---

### Code Examples

<Tabs items={["cURL", "Python", "JavaScript"]}>
<Tab value="cURL">
```bash
curl -X GET https://api.anakin.io/v1/agentic-search/3f8aa45d-6ea3-4107-88ce-7f39ecf48a84 \
  -H "X-API-Key: your_api_key"
```
</Tab>
<Tab value="Python">
```python
import requests

job_id = "3f8aa45d-6ea3-4107-88ce-7f39ecf48a84"

result = requests.get(
    f'https://api.anakin.io/v1/agentic-search/{job_id}',
    headers={'X-API-Key': 'your_api_key'}
)

data = result.json()
if data['status'] == 'completed':
    result_data = data['generatedJson']
    print(f"Summary: {result_data['summary']}")
    print(f"Schema: {result_data['data_schema']}")
    print(f"Data: {result_data['structured_data']}")
```
</Tab>
<Tab value="JavaScript">
```javascript
const jobId = '3f8aa45d-6ea3-4107-88ce-7f39ecf48a84';

const res = await fetch(`https://api.anakin.io/v1/agentic-search/${jobId}`, {
  headers: { 'X-API-Key': 'your_api_key' }
});
const data = await res.json();

if (data.status === 'completed') {
  const resultData = data.generatedJson;
  console.log(resultData.summary);
  console.log(resultData.data_schema);
  console.log(resultData.structured_data);
}
```
</Tab>
</Tabs>

For polling patterns, see the [Polling Jobs](/docs/api-reference/polling-jobs) reference.


---

# POST Research Query (/docs/api-reference/agentic-search/submit-search)

<EndpointBanner method="POST" path="https://api.anakin.io/v1/agentic-search" />

Start an agentic research pipeline. The job runs through 4 stages (query refinement, web search, citation scraping, analysis) and may take several minutes to complete. Poll for results using [GET /v1/agentic-search/\{id\}](/docs/api-reference/agentic-search/get-search-result).

---

### Request Body

```json
{
  "prompt": "Comprehensive analysis of quantum computing trends"
}
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `prompt` **required** | string | Research query or question |

---

### Response

<StatusBadge code={202} text="Accepted" />

```json
{
  "job_id": "3f8aa45d-6ea3-4107-88ce-7f39ecf48a84",
  "status": "pending",
  "message": "Agentic search job queued successfully",
  "created_at": "2024-01-01T12:00:00.000Z"
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `job_id` | string | Unique identifier for the agentic search job |
| `status` | string | Job status (`pending`) |
| `message` | string | Confirmation message |
| `created_at` | string | ISO 8601 timestamp of job creation |

Use the `job_id` with [GET /v1/agentic-search/\{id\}](/docs/api-reference/agentic-search/get-search-result) to poll for results. Agentic searches typically take longer than standard scrapes — poll every 10 seconds.

---

### Code Examples

<Tabs items={["cURL", "Python", "JavaScript"]}>
<Tab value="cURL">
```bash
curl -X POST https://api.anakin.io/v1/agentic-search \
  -H "X-API-Key: your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Comprehensive analysis of quantum computing trends"
  }'
```
</Tab>
<Tab value="Python">
```python
import requests

response = requests.post(
    'https://api.anakin.io/v1/agentic-search',
    headers={'X-API-Key': 'your_api_key'},
    json={
        'prompt': 'Comprehensive analysis of quantum computing trends'
    }
)

data = response.json()
print(f"Agentic search submitted: {data['job_id']}")
```
</Tab>
<Tab value="JavaScript">
```javascript
const response = await fetch('https://api.anakin.io/v1/agentic-search', {
  method: 'POST',
  headers: {
    'X-API-Key': 'your_api_key',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    prompt: 'Comprehensive analysis of quantum computing trends'
  })
});

const data = await response.json();
console.log(data.job_id);
```
</Tab>
</Tabs>


---

# Browser API (/docs/api-reference/browser-api)

## What is Browser API?

Browser API gives you a **stealth browser in the cloud** that you control with your own code. Connect Playwright, Puppeteer, or any CDP-compatible client to Anakin's anti-detection browser via a single WebSocket URL.

Unlike traditional scraping APIs where you submit a URL and get results back, Browser API gives you **full browser control**: navigate pages, click buttons, fill forms, take screenshots, extract data — all through your own automation scripts.

---

## Why use Browser API?

- **Anti-detection built in** — Stealth browser with fingerprint masking, WebRTC leak prevention, and `navigator.webdriver = false`. No configuration needed.
- **Playwright and Puppeteer support** — Connect with `connect_over_cdp` (Playwright) or `browser.connect()` (Puppeteer). No code changes beyond the connection URL.
- **Smart proxy selection** — Per-domain proxy optimization via Thompson Sampling. The best proxy is automatically selected for each target site.
- **No browser infrastructure** — No managing headless browsers, displays, or containers. Just connect and scrape.
- **Same API key** — Uses your existing Anakin API key. No separate auth flow.

---

## Quick Start

<Tabs items={["Playwright (Python)", "Playwright (Node.js)", "Puppeteer (Node.js)"]}>
<Tab value="Playwright (Python)">
```python
import asyncio
from playwright.async_api import async_playwright

API_KEY = "your_api_key"

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.connect_over_cdp(
            "wss://api.anakin.io/v1/browser-connect",
            headers={"X-API-Key": API_KEY},
        )
        page = browser.contexts[0].pages[0]

        # Navigate and extract data
        await page.goto("https://books.toscrape.com", wait_until="domcontentloaded")
        print("Title:", await page.title())

        # Extract structured data
        books = await page.evaluate("""
            Array.from(document.querySelectorAll('article.product_pod')).slice(0, 5).map(el => ({
                title: el.querySelector('h3 a')?.title,
                price: el.querySelector('.price_color')?.textContent,
            }))
        """)
        print("Books:", books)

        # Take a screenshot
        await page.screenshot(path="screenshot.png")

        # Use locators
        count = await page.locator("article.product_pod").count()
        print(f"Found {count} products")

        await browser.close()

asyncio.run(main())
```
</Tab>
<Tab value="Playwright (Node.js)">
```javascript
const { chromium } = require('playwright');

const API_KEY = 'your_api_key';

(async () => {
  const browser = await chromium.connectOverCDP(
    'wss://api.anakin.io/v1/browser-connect',
    { headers: { 'X-API-Key': API_KEY } }
  );
  const page = browser.contexts()[0].pages()[0];

  await page.goto('https://books.toscrape.com', { waitUntil: 'domcontentloaded' });
  console.log('Title:', await page.title());

  const books = await page.evaluate(() =>
    Array.from(document.querySelectorAll('article.product_pod')).slice(0, 5).map(el => ({
      title: el.querySelector('h3 a')?.title,
      price: el.querySelector('.price_color')?.textContent,
    }))
  );
  console.log('Books:', books);

  await page.screenshot({ path: 'screenshot.png' });
  await browser.close();
})();
```
</Tab>
<Tab value="Puppeteer (Node.js)">
```javascript
const puppeteer = require('puppeteer-core');

const API_KEY = 'your_api_key';

(async () => {
  const browser = await puppeteer.connect({
    browserWSEndpoint: 'wss://api.anakin.io/v1/browser-connect',
    headers: { 'X-API-Key': API_KEY },
  });

  const page = (await browser.pages())[0] || await browser.newPage();
  await page.goto('https://books.toscrape.com', {
    waitUntil: 'domcontentloaded',
    timeout: 30000,
  });

  console.log('Title:', await page.title());
  console.log('HTML:', (await page.content()).length, 'chars');

  await page.screenshot({ path: 'screenshot.png' });
  await browser.disconnect();
})();
```
</Tab>
</Tabs>

---

## Supported Features

### Playwright

| Feature | Status |
|---------|--------|
| `page.goto()` | ✅ |
| `page.title()` / `page.content()` | ✅ |
| `page.evaluate()` | ✅ |
| `page.screenshot()` | ✅ |
| `page.locator()` — count, text, attributes | ✅ |
| `page.wait_for_selector()` | ✅ |
| `page.wait_for_function()` | ✅ |
| `page.inner_text()` / `page.text_content()` | ✅ |
| `page.set_extra_http_headers()` | ✅ |
| Mouse and keyboard input | ✅ |
| Scroll / pagination | ✅ |
| Cross-site navigation | ✅ |
| Stealth (`webdriver=false`) | ✅ |
| Session keepalive (60s+) | ✅ |
| `page.route()` — network interception | ❌ |

### Puppeteer

| Feature | Status |
|---------|--------|
| `page.goto()` | ✅ |
| `page.title()` / `page.content()` | ✅ |
| `page.evaluate()` | ✅ |
| `page.screenshot()` | ✅ |
| `page.$$()` — querySelectorAll | ✅ |
| `page.$eval()` — scoped evaluate | ✅ |
| `page.waitForSelector()` | ✅ |
| `page.setExtraHTTPHeaders()` | ✅ |
| Mouse and keyboard input | ✅ |
| Scroll / pagination | ✅ |
| Cross-site navigation | ✅ |
| `browser.pages()` / `browser.newPage()` | ✅ |
| `page.waitForNavigation()` | ❌ |

### Selenium

Selenium with ChromeDriver is **not supported**. Use Playwright or Puppeteer instead.

### Known limitations

These are inherent to how remote CDP connections work, not specific to Browser API:

- **`page.goto()` response object is `null`** — when connecting via `connect_over_cdp()` / `puppeteer.connect()`, the HTTP response object is always `null`. Navigation itself works correctly (page loads, URL updates, content is accessible).
- **`page.route()` does not fire (Playwright)** — request interception requires a locally-owned `BrowserContext`. It is not available when the context is owned by a remote browser.
- **`page.waitForNavigation()` hangs (Puppeteer)** — use `page.waitForSelector()` or `page.waitForFunction()` after clicks instead.

---

## Scraping Example: Extract Product Data

```python
import asyncio
from playwright.async_api import async_playwright

async def scrape_books():
    async with async_playwright() as p:
        browser = await p.chromium.connect_over_cdp(
            "wss://api.anakin.io/v1/browser-connect",
            headers={"X-API-Key": "your_api_key"},
        )
        page = browser.contexts[0].pages[0]
        await page.goto("https://books.toscrape.com", wait_until="domcontentloaded")

        # Wait for products to load
        await page.wait_for_selector("article.product_pod")

        # Extract all books on the page
        books = await page.evaluate("""
            Array.from(document.querySelectorAll('article.product_pod')).map(el => ({
                title: el.querySelector('h3 a')?.title,
                price: el.querySelector('.price_color')?.textContent,
                rating: el.querySelector('.star-rating')?.className.replace('star-rating ', ''),
                inStock: !!el.querySelector('.instock'),
                link: el.querySelector('h3 a')?.href,
            }))
        """)

        print(f"Scraped {len(books)} books")
        for book in books[:3]:
            print(f"  {book['title']} — {book['price']}")

        await browser.close()

asyncio.run(scrape_books())
```

---

## Billing

Browser API sessions are billed at **1 credit per 2 minutes** (rounded up). A session that lasts 3 minutes costs 2 credits.

Sessions auto-disconnect when your credits reach 0.

## Limits

| Parameter | Value |
|-----------|-------|
| Max session duration | 2 hours |
| Idle timeout | 300 seconds (no CDP messages from client) |
| Credit cost | 1 credit / 2 min |
| Geo-targeting (`?country=XX`) | ✅ |
| Max message size | 50 MB |
| Authentication | X-API-Key header |

> **Idle disconnect:** The connection is closed if your script sends no CDP messages for **300 seconds**. Keep your automation actively sending commands, or call `browser.close()` when done rather than leaving the connection open.

## Saved Sessions

Load a [saved browser session](/docs/api-reference/browser-sessions) to connect with pre-authenticated cookies and localStorage. This lets your scripts access pages that require login — without handling authentication in code.

Pass `?session_id=<uuid>` or `?session_name=<name>` as a query parameter:

<Tabs items={["Playwright (Python)", "Playwright (Node.js)", "Puppeteer (Node.js)"]}>
<Tab value="Playwright (Python)">
```python
import asyncio
from playwright.async_api import async_playwright

API_KEY = "your_api_key"
SESSION_ID = "your_session_id"  # from dashboard or GET /v1/sessions

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.connect_over_cdp(
            f"wss://api.anakin.io/v1/browser-connect?session_id={SESSION_ID}",
            headers={"X-API-Key": API_KEY},
        )
        page = browser.contexts[0].pages[0]

        # Navigate to an authenticated page — cookies are pre-loaded
        await page.goto("https://amazon.com/your-orders", wait_until="domcontentloaded")
        print("Title:", await page.title())

        await browser.close()

asyncio.run(main())
```
</Tab>
<Tab value="Playwright (Node.js)">
```javascript
const { chromium } = require('playwright');

const API_KEY = 'your_api_key';
const SESSION_ID = 'your_session_id';

(async () => {
  const browser = await chromium.connectOverCDP(
    `wss://api.anakin.io/v1/browser-connect?session_id=${SESSION_ID}`,
    { headers: { 'X-API-Key': API_KEY } }
  );
  const page = browser.contexts()[0].pages()[0];

  await page.goto('https://amazon.com/your-orders', { waitUntil: 'domcontentloaded' });
  console.log('Title:', await page.title());

  await browser.close();
})();
```
</Tab>
<Tab value="Puppeteer (Node.js)">
```javascript
const puppeteer = require('puppeteer-core');

const API_KEY = 'your_api_key';
const SESSION_ID = 'your_session_id';

(async () => {
  const browser = await puppeteer.connect({
    browserWSEndpoint: `wss://api.anakin.io/v1/browser-connect?session_id=${SESSION_ID}`,
    headers: { 'X-API-Key': API_KEY },
  });

  const page = (await browser.pages())[0] || await browser.newPage();
  await page.goto('https://amazon.com/your-orders', {
    waitUntil: 'domcontentloaded',
    timeout: 30000,
  });

  console.log('Title:', await page.title());
  await browser.disconnect();
})();
```
</Tab>
</Tabs>

You can also use the session name instead of ID:

```
wss://api.anakin.io/v1/browser-connect?session_name=my-login
```

### How it works

1. The API loads your saved session from encrypted storage
2. The browser launches with your cookies and localStorage pre-injected
3. If the session was created with a static IP proxy, the same proxy is reused — preventing IP mismatch issues
4. Billing is the same (1 credit / 2 min) — no extra charge for session loading

### Session query parameters

| Parameter | Description |
|-----------|-------------|
| `session_id` | UUID of the saved session |
| `session_name` | Name of the saved session (must be unique per user) |

If both are provided, `session_id` takes precedence. If neither is provided, a fresh browser is launched (default behavior).

### Error responses

Session validation happens before the WebSocket connection is established, so errors are returned as standard HTTP responses:

| Status | Error | Meaning |
|--------|-------|---------|
| 404 | `session not found` | Session ID/name doesn't exist or doesn't belong to you |
| 422 | `session has no stored data — save it first` | Session was created but never saved — log in and save first |
| 409 | `session is being automated` | Session is currently being used by an automation job |

---

## Saving Sessions

You can also **save** a session directly from Browser API. Pass `?save_session=<name>` when connecting, and the session is automatically saved when you disconnect — no extra API calls needed.

```
wss://api.anakin.io/v1/browser-connect?save_session=my-login&save_url=https://your-target-site.com
```

<Tabs items={["Playwright (Python)", "Playwright (Node.js)"]}>
<Tab value="Playwright (Python)">
```python
import asyncio
from playwright.async_api import async_playwright

API_KEY = "your_api_key"

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.connect_over_cdp(
            "wss://api.anakin.io/v1/browser-connect?save_session=my-login&save_url=https://your-target-site.com",
            headers={"X-API-Key": API_KEY},
        )
        page = browser.contexts[0].pages[0]

        # Navigate to your site's login page and fill in credentials.
        # Replace the URL and selectors with those of your target site.
        await page.goto("https://your-target-site.com/login")
        await page.fill("input[name='username']", "your_username")
        await page.fill("input[name='password']", "your_password")
        await page.click("button[type='submit']")
        await page.wait_for_load_state("networkidle")

        # Disconnect — session is auto-saved
        await browser.close()

asyncio.run(main())
```
</Tab>
<Tab value="Playwright (Node.js)">
```javascript
const { chromium } = require('playwright');

const API_KEY = 'your_api_key';

(async () => {
  const browser = await chromium.connectOverCDP(
    'wss://api.anakin.io/v1/browser-connect?save_session=my-login&save_url=https://your-target-site.com',
    { headers: { 'X-API-Key': API_KEY } }
  );
  const page = browser.contexts()[0].pages()[0];

  // Navigate to your site's login page and fill in credentials.
  // Replace the URL and selectors with those of your target site.
  await page.goto('https://your-target-site.com/login');
  await page.fill("input[name='username']", 'your_username');
  await page.fill("input[name='password']", 'your_password');
  await page.click("button[type='submit']");
  await page.waitForLoadState('networkidle');

  // Disconnect — session is auto-saved
  await browser.close();
})();
```
</Tab>
</Tabs>

Next time, load the saved session with `?session_name=my-login` — see [Saved Sessions](#saved-sessions) above.

### Save query parameters

| Parameter | Required | Description |
|-----------|----------|-------------|
| `save_session` | Yes | Name for the saved session (must be unique per user) |
| `save_url` | No | Website URL associated with the session (e.g. `https://amazon.com`) |

### Save error responses

Session name is validated **before** the WebSocket connection starts:

| Status | Error | Meaning |
|--------|-------|---------|
| 409 | `session name already exists` | Choose a different name |
| 503 | `session saving not configured` | Server-side encryption not set up |

### How saving works

1. You connect with `?save_session=my-name`
2. The session name is validated (must be unique) before the WebSocket upgrades
3. You automate login, navigate pages, etc.
4. When you disconnect, the browser's cookies and localStorage are automatically extracted and encrypted
5. The session appears in your [dashboard](https://anakin.io/dashboard) and `GET /v1/sessions`
6. If the session proxy was a static IP, it's saved too — reuse preserves the same IP

> **Note:** Save is best-effort on disconnect. If you need guaranteed saves with visual confirmation, use the [interactive browser session](/docs/api-reference/browser-sessions) flow instead.

---

## Session Recording

Every Browser API session is **automatically recorded** as a WebM video — no extra parameters needed. The recording starts when you connect and is saved when you disconnect.

You can combine recording with other features like session saving:

```
wss://api.anakin.io/v1/browser-connect?save_session=my-login&save_url=https://amazon.com
```

### Retrieving recordings

After disconnecting, your recording is available via the API:

```bash
# List all recordings
curl https://api.anakin.io/v1/recordings \
  -H "X-API-Key: your_api_key"

# Get a specific recording (includes video URL)
curl https://api.anakin.io/v1/recordings/rec-123 \
  -H "X-API-Key: your_api_key"
```

The response includes a presigned video URL (valid for 1 hour):

```json
{
  "id": "abc-123",
  "connId": "rec-123",
  "duration": 45,
  "fileSize": 304205,
  "status": "completed",
  "videoUrl": "https://s3.amazonaws.com/...",
  "createdAt": "2026-04-01T12:00:00Z"
}
```

Recordings are also available in your [dashboard](/recordings).

### How recording works

1. You connect — recording starts automatically
2. The browser runs on a virtual display (Xvfb) — ffmpeg captures the full display as a WebM video
3. When you disconnect, the video is finalized, uploaded to encrypted storage, and linked to your account
4. No extra credit cost — recording is included in the standard Browser API rate

---

## Geo-Targeting

Pass `?country=XX` (ISO 3166-1 alpha-2) when connecting to route your session through a proxy in that country:

```
wss://api.anakin.io/v1/browser-connect?country=IN
```

Supported codes include `US`, `IN`, `GB`, `DE`, `FR`, `JP`, `SG`, and others depending on proxy availability. The proxy is selected via Thompson Sampling from the pool scored for that country and target domain. Defaults to `US` if not specified or if the requested country has no available proxies.


---

# Browser API (/docs/api-reference/browser-connect)

## What is Browser API?

Browser API gives you a **stealth browser in the cloud** that you control with your own code. Connect Playwright, Puppeteer, or any CDP-compatible client to Anakin's anti-detection browser via a single WebSocket URL.

Unlike traditional scraping APIs where you submit a URL and get results back, Browser API gives you **full browser control**: navigate pages, click buttons, fill forms, take screenshots, extract data — all through your own automation scripts.

---

## Why use Browser API?

- **Anti-detection built in** — Stealth browser with fingerprint masking, WebRTC leak prevention, and `navigator.webdriver = false`. No configuration needed.
- **Playwright and Puppeteer support** — Connect with `connect_over_cdp` (Playwright) or `browser.connect()` (Puppeteer). No code changes beyond the connection URL.
- **Smart proxy selection** — Per-domain proxy optimization via Thompson Sampling. The best proxy is automatically selected for each target site.
- **No browser infrastructure** — No managing headless browsers, displays, or containers. Just connect and scrape.
- **Same API key** — Uses your existing Anakin API key. No separate auth flow.

---

## Quick Start

<Tabs items={["Playwright (Python)", "Playwright (Node.js)", "Puppeteer (Node.js)"]}>
<Tab value="Playwright (Python)">
```python
import asyncio
from playwright.async_api import async_playwright

API_KEY = "your_api_key"

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.connect_over_cdp(
            "wss://api.anakin.io/v1/browser-connect",
            headers={"X-API-Key": API_KEY},
        )
        page = browser.contexts[0].pages[0]

        # Navigate and extract data
        await page.goto("https://books.toscrape.com", wait_until="domcontentloaded")
        print("Title:", await page.title())

        # Extract structured data
        books = await page.evaluate("""
            Array.from(document.querySelectorAll('article.product_pod')).slice(0, 5).map(el => ({
                title: el.querySelector('h3 a')?.title,
                price: el.querySelector('.price_color')?.textContent,
            }))
        """)
        print("Books:", books)

        # Take a screenshot
        await page.screenshot(path="screenshot.png")

        # Use locators
        count = await page.locator("article.product_pod").count()
        print(f"Found {count} products")

        await browser.close()

asyncio.run(main())
```
</Tab>
<Tab value="Playwright (Node.js)">
```javascript
const { chromium } = require('playwright');

const API_KEY = 'your_api_key';

(async () => {
  const browser = await chromium.connectOverCDP(
    'wss://api.anakin.io/v1/browser-connect',
    { headers: { 'X-API-Key': API_KEY } }
  );
  const page = browser.contexts()[0].pages()[0];

  await page.goto('https://books.toscrape.com', { waitUntil: 'domcontentloaded' });
  console.log('Title:', await page.title());

  const books = await page.evaluate(() =>
    Array.from(document.querySelectorAll('article.product_pod')).slice(0, 5).map(el => ({
      title: el.querySelector('h3 a')?.title,
      price: el.querySelector('.price_color')?.textContent,
    }))
  );
  console.log('Books:', books);

  await page.screenshot({ path: 'screenshot.png' });
  await browser.close();
})();
```
</Tab>
<Tab value="Puppeteer (Node.js)">
```javascript
const puppeteer = require('puppeteer-core');

const API_KEY = 'your_api_key';

(async () => {
  const browser = await puppeteer.connect({
    browserWSEndpoint: 'wss://api.anakin.io/v1/browser-connect',
    headers: { 'X-API-Key': API_KEY },
  });

  const page = (await browser.pages())[0] || await browser.newPage();
  await page.goto('https://books.toscrape.com', {
    waitUntil: 'domcontentloaded',
    timeout: 30000,
  });

  console.log('Title:', await page.title());
  console.log('HTML:', (await page.content()).length, 'chars');

  await page.screenshot({ path: 'screenshot.png' });
  await browser.disconnect();
})();
```
</Tab>
</Tabs>

---

## Supported Features

### Playwright

| Feature | Status |
|---------|--------|
| `page.goto()` | ✅ |
| `page.title()` / `page.content()` | ✅ |
| `page.evaluate()` | ✅ |
| `page.screenshot()` | ✅ |
| `page.locator()` — count, text, attributes | ✅ |
| `page.wait_for_selector()` | ✅ |
| `page.wait_for_function()` | ✅ |
| `page.inner_text()` / `page.text_content()` | ✅ |
| `page.set_extra_http_headers()` | ✅ |
| Mouse and keyboard input | ✅ |
| Scroll / pagination | ✅ |
| Cross-site navigation | ✅ |
| Stealth (`webdriver=false`) | ✅ |
| Session keepalive (60s+) | ✅ |
| `page.route()` — network interception | ❌ |

### Puppeteer

| Feature | Status |
|---------|--------|
| `page.goto()` | ✅ |
| `page.title()` / `page.content()` | ✅ |
| `page.evaluate()` | ✅ |
| `page.screenshot()` | ✅ |
| `page.$$()` — querySelectorAll | ✅ |
| `page.$eval()` — scoped evaluate | ✅ |
| `page.waitForSelector()` | ✅ |
| `page.setExtraHTTPHeaders()` | ✅ |
| Mouse and keyboard input | ✅ |
| Scroll / pagination | ✅ |
| Cross-site navigation | ✅ |
| `browser.pages()` / `browser.newPage()` | ✅ |
| `page.waitForNavigation()` | ❌ |

### Selenium

Selenium with ChromeDriver is **not supported**. Use Playwright or Puppeteer instead.

### Known limitations

These are inherent to how remote CDP connections work, not specific to Browser API:

- **`page.goto()` response object is `null`** — when connecting via `connect_over_cdp()` / `puppeteer.connect()`, the HTTP response object is always `null`. Navigation itself works correctly (page loads, URL updates, content is accessible).
- **`page.route()` does not fire (Playwright)** — request interception requires a locally-owned `BrowserContext`. It is not available when the context is owned by a remote browser.
- **`page.waitForNavigation()` hangs (Puppeteer)** — use `page.waitForSelector()` or `page.waitForFunction()` after clicks instead.

---

## Scraping Example: Extract Product Data

```python
import asyncio
from playwright.async_api import async_playwright

async def scrape_books():
    async with async_playwright() as p:
        browser = await p.chromium.connect_over_cdp(
            "wss://api.anakin.io/v1/browser-connect",
            headers={"X-API-Key": "your_api_key"},
        )
        page = browser.contexts[0].pages[0]
        await page.goto("https://books.toscrape.com", wait_until="domcontentloaded")

        # Wait for products to load
        await page.wait_for_selector("article.product_pod")

        # Extract all books on the page
        books = await page.evaluate("""
            Array.from(document.querySelectorAll('article.product_pod')).map(el => ({
                title: el.querySelector('h3 a')?.title,
                price: el.querySelector('.price_color')?.textContent,
                rating: el.querySelector('.star-rating')?.className.replace('star-rating ', ''),
                inStock: !!el.querySelector('.instock'),
                link: el.querySelector('h3 a')?.href,
            }))
        """)

        print(f"Scraped {len(books)} books")
        for book in books[:3]:
            print(f"  {book['title']} — {book['price']}")

        await browser.close()

asyncio.run(scrape_books())
```

---

## Billing

Browser API sessions are billed at **1 credit per 2 minutes** (rounded up). A session that lasts 3 minutes costs 2 credits.

Sessions auto-disconnect when your credits reach 0.

## Limits

| Parameter | Value |
|-----------|-------|
| Max session duration | 2 hours |
| Idle timeout | 60 seconds (no messages) |
| Credit cost | 1 credit / 2 min |
| Geo-targeting (`?country=XX`) | ✅ |
| Max message size | 50 MB |
| Authentication | X-API-Key header |

> **Idle disconnect:** The connection is closed if no CDP messages are exchanged for **60 seconds**. Keep your automation actively sending commands, or call `browser.close()` when done rather than leaving the connection open.

## Saved Sessions

Load a [saved browser session](/docs/api-reference/browser-sessions) to connect with pre-authenticated cookies and localStorage. This lets your scripts access pages that require login — without handling authentication in code.

Pass `?session_id=<uuid>` or `?session_name=<name>` as a query parameter:

<Tabs items={["Playwright (Python)", "Playwright (Node.js)", "Puppeteer (Node.js)"]}>
<Tab value="Playwright (Python)">
```python
import asyncio
from playwright.async_api import async_playwright

API_KEY = "your_api_key"
SESSION_ID = "your_session_id"  # from dashboard or GET /v1/sessions

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.connect_over_cdp(
            f"wss://api.anakin.io/v1/browser-connect?session_id={SESSION_ID}",
            headers={"X-API-Key": API_KEY},
        )
        page = browser.contexts[0].pages[0]

        # Navigate to an authenticated page — cookies are pre-loaded
        await page.goto("https://amazon.com/your-orders", wait_until="domcontentloaded")
        print("Title:", await page.title())

        await browser.close()

asyncio.run(main())
```
</Tab>
<Tab value="Playwright (Node.js)">
```javascript
const { chromium } = require('playwright');

const API_KEY = 'your_api_key';
const SESSION_ID = 'your_session_id';

(async () => {
  const browser = await chromium.connectOverCDP(
    `wss://api.anakin.io/v1/browser-connect?session_id=${SESSION_ID}`,
    { headers: { 'X-API-Key': API_KEY } }
  );
  const page = browser.contexts()[0].pages()[0];

  await page.goto('https://amazon.com/your-orders', { waitUntil: 'domcontentloaded' });
  console.log('Title:', await page.title());

  await browser.close();
})();
```
</Tab>
<Tab value="Puppeteer (Node.js)">
```javascript
const puppeteer = require('puppeteer-core');

const API_KEY = 'your_api_key';
const SESSION_ID = 'your_session_id';

(async () => {
  const browser = await puppeteer.connect({
    browserWSEndpoint: `wss://api.anakin.io/v1/browser-connect?session_id=${SESSION_ID}`,
    headers: { 'X-API-Key': API_KEY },
  });

  const page = (await browser.pages())[0] || await browser.newPage();
  await page.goto('https://amazon.com/your-orders', {
    waitUntil: 'domcontentloaded',
    timeout: 30000,
  });

  console.log('Title:', await page.title());
  await browser.disconnect();
})();
```
</Tab>
</Tabs>

You can also use the session name instead of ID:

```
wss://api.anakin.io/v1/browser-connect?session_name=my-amazon-login
```

### How it works

1. The API loads your saved session from encrypted storage
2. The browser launches with your cookies and localStorage pre-injected
3. If the session was created with a static IP proxy, the same proxy is reused — preventing IP mismatch issues
4. Billing is the same (1 credit / 2 min) — no extra charge for session loading

### Session query parameters

| Parameter | Description |
|-----------|-------------|
| `session_id` | UUID of the saved session |
| `session_name` | Name of the saved session (must be unique per user) |

If both are provided, `session_id` takes precedence. If neither is provided, a fresh browser is launched (default behavior).

### Error responses

Session validation happens before the WebSocket connection is established, so errors are returned as standard HTTP responses:

| Status | Error | Meaning |
|--------|-------|---------|
| 404 | `session not found` | Session ID/name doesn't exist or doesn't belong to you |
| 422 | `session has no stored data — save it first` | Session was created but never saved — log in and save first |
| 409 | `session is being automated` | Session is currently being used by an automation job |

---

## Saving Sessions

You can also **save** a session directly from Browser API. Pass `?save_session=<name>` when connecting, and the session is automatically saved when you disconnect — no extra API calls needed.

```
wss://api.anakin.io/v1/browser-connect?save_session=my-amazon-login&save_url=https://amazon.com
```

<Tabs items={["Playwright (Python)", "Playwright (Node.js)"]}>
<Tab value="Playwright (Python)">
```python
import asyncio
from playwright.async_api import async_playwright

API_KEY = "your_api_key"

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.connect_over_cdp(
            "wss://api.anakin.io/v1/browser-connect?save_session=my-amazon-login&save_url=https://amazon.com",
            headers={"X-API-Key": API_KEY},
        )
        page = browser.contexts[0].pages[0]

        # Log in programmatically
        await page.goto("https://amazon.com/signin")
        await page.fill("#email", "user@example.com")
        await page.fill("#password", "mypassword")
        await page.click("#signIn")
        await page.wait_for_url("**/your-account**")

        # Disconnect — session is auto-saved
        await browser.close()

asyncio.run(main())
```
</Tab>
<Tab value="Playwright (Node.js)">
```javascript
const { chromium } = require('playwright');

const API_KEY = 'your_api_key';

(async () => {
  const browser = await chromium.connectOverCDP(
    'wss://api.anakin.io/v1/browser-connect?save_session=my-amazon-login&save_url=https://amazon.com',
    { headers: { 'X-API-Key': API_KEY } }
  );
  const page = browser.contexts()[0].pages()[0];

  // Log in programmatically
  await page.goto('https://amazon.com/signin');
  await page.fill('#email', 'user@example.com');
  await page.fill('#password', 'mypassword');
  await page.click('#signIn');

  // Disconnect — session is auto-saved
  await browser.close();
})();
```
</Tab>
</Tabs>

Next time, load the saved session with `?session_name=my-amazon-login` — see [Saved Sessions](#saved-sessions) above.

### Save query parameters

| Parameter | Required | Description |
|-----------|----------|-------------|
| `save_session` | Yes | Name for the saved session (must be unique per user) |
| `save_url` | No | Website URL associated with the session (e.g. `https://amazon.com`) |

### Save error responses

Session name is validated **before** the WebSocket connection starts:

| Status | Error | Meaning |
|--------|-------|---------|
| 409 | `session name already exists` | Choose a different name |
| 503 | `session saving not configured` | Server-side encryption not set up |

### How saving works

1. You connect with `?save_session=my-name`
2. The session name is validated (must be unique) before the WebSocket upgrades
3. You automate login, navigate pages, etc.
4. When you disconnect, the browser's cookies and localStorage are automatically extracted and encrypted
5. The session appears in your [dashboard](https://anakin.io/dashboard) and `GET /v1/sessions`
6. If the session proxy was a static IP, it's saved too — reuse preserves the same IP

> **Note:** Save is best-effort on disconnect. If you need guaranteed saves with visual confirmation, use the [interactive browser session](/docs/api-reference/browser-sessions) flow instead.

---

## Session Recording

Every Browser API session is **automatically recorded** as a WebM video — no extra parameters needed. The recording starts when you connect and is saved when you disconnect.

```
wss://api.anakin.io/v1/browser-connect
```

You can combine recording with other features like session saving:

```
wss://api.anakin.io/v1/browser-connect?save_session=my-login&save_url=https://amazon.com
```

### Retrieving recordings

After disconnecting, your recording is available via the API:

```bash
# List all recordings
curl https://api.anakin.io/v1/recordings \
  -H "X-API-Key: your_api_key"

# Get a specific recording (includes video URL)
curl https://api.anakin.io/v1/recordings/rec-123 \
  -H "X-API-Key: your_api_key"
```

The response includes a presigned video URL (valid for 1 hour):

```json
{
  "id": "abc-123",
  "connId": "rec-123",
  "duration": 45,
  "fileSize": 304205,
  "status": "completed",
  "videoUrl": "https://s3.amazonaws.com/...",
  "createdAt": "2026-04-01T12:00:00Z"
}
```

Recordings are also available in your [dashboard](/recordings).

### How recording works

1. You connect — recording starts automatically
2. The browser runs on a virtual display (Xvfb) — ffmpeg captures the full display as a WebM video
3. When you disconnect, the video is finalized, uploaded to encrypted storage, and linked to your account
4. No extra credit cost — recording is included in the standard Browser API rate

---

## Geo-Targeting

Pass `?country=XX` (ISO 3166-1 alpha-2) when connecting to route your session through a proxy in that country:

```
wss://api.anakin.io/v1/browser-connect?country=IN
```

Supported codes include `US`, `IN`, `GB`, `DE`, `FR`, `JP`, `SG`, and others depending on proxy availability. The proxy is selected via Thompson Sampling from the pool scored for that country and target domain. Defaults to `US` if not specified or if the requested country has no available proxies.

---

## Cloudflare Signed Agent

Pass `?signed_agent=true` to identify your session as a legitimate crawler to Cloudflare. Each page navigation is signed with an [RFC 9421](https://www.rfc-editor.org/rfc/rfc9421) HTTP message signature, cryptographically linking the request to Anakin's published agent identity.

```
wss://api.anakin.io/v1/browser-connect?signed_agent=true
```

Cloudflare verifies the signature against Anakin's public key directory at `https://anakin.io/.well-known/http-message-signatures-directory`. Sites that participate in Cloudflare's [Web Bot Auth](https://blog.cloudflare.com/web-bot-auth) programme will recognize the signature and reduce or skip bot challenges for verified navigations.

**When to use it:**
- Your target site is protected by Cloudflare and returns frequent bot challenges
- You are running legitimate, rule-abiding crawls and want to declare your intent
- You want to avoid IP-based blocks on sites that support signed-agent verification

**What it does:**
- Injects `Signature`, `Signature-Input`, and `Signature-Agent` headers on every `page.goto()` call
- Signatures are scoped per-URL (5-minute validity window, unique nonce per request)
- Your own extra headers (e.g. `Authorization`, `Accept-Language`) are preserved — signing is additive

**What it does not do:**
- It does not guarantee bypass on all Cloudflare-protected sites — only those enrolled in the Web Bot Auth programme respond to signed-agent identity
- It does not disable stealth fingerprint masking — both features are active simultaneously

Can be combined with other parameters:

```
wss://api.anakin.io/v1/browser-connect?signed_agent=true&country=US&session_id=your-session-id
```


---

# Browser Sessions (/docs/api-reference/browser-sessions)

> **Tip:**
> - Session data is protected using **AES-256-GCM encryption** with complete user isolation.
> - The system does not collect, store, or retain passwords, authentication secrets, or credentials at any time.
> - Session data is permanently and irreversibly deleted upon user-initiated session removal.

## What are Browser Sessions?

Browser sessions allow you to scrape content that requires authentication. Instead of handling complex login flows programmatically, you log in once through a real browser, and we save your session for future API requests.

This is useful for scraping:
- Account dashboards and order history
- Subscription-based content
- Social media profiles
- Any page that requires a login

---

## How It Works

There are two ways to create a session:

### Option A: Interactive (Dashboard)

1. **Create** — From your [dashboard](https://anakin.io/dashboard), click **Create Session** to launch an interactive browser
2. **Log in** — Navigate to the website and log in with your credentials. Complete 2FA or captchas as needed
3. **Save** — Click **Save Session** to encrypt and store your cookies and localStorage

### Option B: Programmatic (Browser API)

Save sessions directly from [Browser API](/docs/api-reference/browser-connect#saving-sessions) — just add `?save_session=my-name` when connecting. The session auto-saves when you disconnect:

```python
browser = await p.chromium.connect_over_cdp(
    "wss://api.anakin.io/v1/browser-connect?save_session=my-amazon-login&save_url=https://amazon.com",
    headers={"X-API-Key": "your_api_key"},
)
# ... automate login with Playwright ...
await browser.close()  # session auto-saved
```

### Use in API Requests

Include the `sessionId` in your scrape requests. The API will use your saved session to access authenticated pages.

---

## Using Sessions with the API

Add the `sessionId` parameter to your [URL Scraper](/docs/api-reference/url-scraper/submit-scrape-job) request:

```json
{
  "url": "https://amazon.com/your-orders",
  "sessionId": "session_abc123xyz",
  "country": "us"
}
```

When using a session, browser-based scraping is automatically enabled since sessions require a full browser environment.

<Tabs items={["cURL", "Python", "JavaScript"]}>
<Tab value="cURL">
```bash
curl -X POST https://api.anakin.io/v1/url-scraper \
  -H "X-API-Key: your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://amazon.com/your-orders",
    "sessionId": "session_abc123xyz",
    "country": "us"
  }'
```
</Tab>
<Tab value="Python">
```python
import requests

response = requests.post(
    'https://api.anakin.io/v1/url-scraper',
    headers={'X-API-Key': 'your_api_key'},
    json={
        'url': 'https://amazon.com/your-orders',
        'sessionId': 'session_abc123xyz',
        'country': 'us'
    }
)

data = response.json()
print(f"Job submitted: {data['jobId']}")
```
</Tab>
<Tab value="JavaScript">
```javascript
const response = await fetch('https://api.anakin.io/v1/url-scraper', {
  method: 'POST',
  headers: {
    'X-API-Key': 'your_api_key',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    url: 'https://amazon.com/your-orders',
    sessionId: 'session_abc123xyz',
    country: 'us'
  })
});

const data = await response.json();
console.log(data.jobId);
```
</Tab>
</Tabs>

---

## Using Sessions with Browser API

You can also load saved sessions into [Browser API](/docs/api-reference/browser-connect) for full programmatic control of an authenticated browser. Pass `?session_id` or `?session_name` when connecting:

<Tabs items={["Python", "JavaScript"]}>
<Tab value="Python">
```python
import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.connect_over_cdp(
            "wss://api.anakin.io/v1/browser-connect?session_id=session_abc123xyz",
            headers={"X-API-Key": "your_api_key"},
        )
        page = browser.contexts[0].pages[0]

        # Cookies are pre-loaded — navigate directly to authenticated pages
        await page.goto("https://amazon.com/your-orders")
        orders = await page.evaluate("document.title")
        print("Page:", orders)

        await browser.close()

asyncio.run(main())
```
</Tab>
<Tab value="JavaScript">
```javascript
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.connectOverCDP(
    'wss://api.anakin.io/v1/browser-connect?session_name=my-amazon-login',
    { headers: { 'X-API-Key': 'your_api_key' } }
  );
  const page = browser.contexts()[0].pages()[0];

  await page.goto('https://amazon.com/your-orders');
  console.log('Title:', await page.title());

  await browser.close();
})();
```
</Tab>
</Tabs>

This is useful when:
- You need to interact with authenticated pages (click, scroll, fill forms)
- The URL Scraper API doesn't give you enough control
- You want to combine session auth with custom Playwright/Puppeteer automation

See the [Browser API docs](/docs/api-reference/browser-connect#saved-sessions) for full details.

---

## Managing Sessions

You can manage your sessions from the [dashboard](https://anakin.io/dashboard) or via the API.

### API Reference

All session endpoints require an `X-API-Key` header.

#### List sessions

```bash
GET /v1/sessions
```

Returns all sessions belonging to the authenticated user. Optionally filter by domain:

```bash
curl https://api.anakin.io/v1/sessions \
  -H "X-API-Key: your_api_key"

# Filter by domain
curl "https://api.anakin.io/v1/sessions?domain=amazon.com" \
  -H "X-API-Key: your_api_key"
```

#### Rename a session

```bash
PATCH /v1/sessions/:id
```

```bash
curl -X PATCH https://api.anakin.io/v1/sessions/session_abc123 \
  -H "X-API-Key: your_api_key" \
  -H "Content-Type: application/json" \
  -d '{"name": "new-session-name"}'
```

#### Delete a session

```bash
DELETE /v1/sessions/:id
```

Permanently deletes the session and its encrypted storage from S3. This action is irreversible.

```bash
curl -X DELETE https://api.anakin.io/v1/sessions/session_abc123 \
  -H "X-API-Key: your_api_key"
```



---

# Crawl (/docs/api-reference/crawl)

The Crawl API scrapes multiple pages from a website. It first discovers URLs (like [Map](/docs/api-reference/map)), then scrapes each page and returns the content. Use it when you need the actual content from multiple pages, not just the URLs.

### Features

- **Multi-page scraping** — crawl up to 100 pages in a single job
- **Pattern filtering** — include/exclude URLs by glob patterns
- **Browser rendering** — use headless Chrome for JS-heavy sites
- **Per-page results** — get HTML and markdown for each crawled page
- **Proxy routing** — route through [207 countries](/docs/api-reference/supported-countries)

### Endpoints

<EndpointCard method="POST" path="/v1/crawl" description="Submit Crawl Job — crawl multiple pages from a website" href="/docs/api-reference/crawl/submit-crawl-job" />

<EndpointCard method="GET" path="/v1/crawl/{id}" description="Get Crawl Result — retrieve crawled page content" href="/docs/api-reference/crawl/get-crawl-result" />


---

# GET Get Crawl Result (/docs/api-reference/crawl/get-crawl-result)

<EndpointBanner method="GET" path="https://api.anakin.io/v1/crawl/{id}" />

Retrieve the status and results of a crawl job. Use this to poll for completion after submitting a [crawl request](/docs/api-reference/crawl/submit-crawl-job).

---

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` **required** | string | The job ID returned from the submit endpoint |

---

### Response

<StatusBadge code={200} text="OK" />

```json
{
  "id": "job_abc123xyz",
  "status": "completed",
  "url": "https://example.com",
  "totalPages": 3,
  "completedPages": 3,
  "results": [
    {
      "url": "https://example.com",
      "status": "completed",
      "html": "<html>...</html>",
      "markdown": "# Home page content...",
      "durationMs": 2000
    },
    {
      "url": "https://example.com/blog",
      "status": "completed",
      "html": "<html>...</html>",
      "markdown": "# Blog index...",
      "durationMs": 1500
    },
    {
      "url": "https://example.com/blog/post-1",
      "status": "failed",
      "error": "Connection timeout",
      "durationMs": 5000
    }
  ],
  "createdAt": "2024-01-01T12:00:00Z",
  "completedAt": "2024-01-01T12:00:15Z",
  "durationMs": 15000
}
```

---

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `status` | string | `pending`, `processing`, `completed`, or `failed` |
| `url` | string | The starting URL submitted for crawling |
| `totalPages` | number | Total pages discovered and attempted |
| `completedPages` | number | Pages successfully scraped |
| `results` | array | Per-page results. Only present when completed. |
| `error` | string | Error message. Only present when the entire job failed. |
| `durationMs` | number | Total processing time in milliseconds. |

### Per-Page Result Fields

| Field | Type | Description |
|-------|------|-------------|
| `url` | string | The page URL |
| `status` | string | `completed` or `failed` |
| `html` | string | Raw HTML content. Only when page completed. |
| `markdown` | string | Markdown version of the content. Only when page completed. |
| `error` | string | Error message. Only when page failed. |
| `durationMs` | number | Per-page processing time in milliseconds. |

---

### Code Examples

<Tabs items={["cURL", "Python", "JavaScript"]}>
<Tab value="cURL">
```bash
curl -X GET https://api.anakin.io/v1/crawl/job_abc123xyz \
  -H "X-API-Key: your_api_key"
```
</Tab>
<Tab value="Python">
```python
import requests
import time

job_id = "job_abc123xyz"

while True:
    result = requests.get(
        f'https://api.anakin.io/v1/crawl/{job_id}',
        headers={'X-API-Key': 'your_api_key'}
    )
    data = result.json()

    if data['status'] == 'completed':
        print(f"Crawled {data['completedPages']}/{data['totalPages']} pages:")
        for page in data['results']:
            if page['status'] == 'completed':
                print(f"  {page['url']} — {len(page['markdown'])} chars")
            else:
                print(f"  {page['url']} — FAILED: {page['error']}")
        break
    elif data['status'] == 'failed':
        print(f"Error: {data['error']}")
        break

    time.sleep(2)
```
</Tab>
<Tab value="JavaScript">
```javascript
const jobId = 'job_abc123xyz';

const poll = async () => {
  const res = await fetch(`https://api.anakin.io/v1/crawl/${jobId}`, {
    headers: { 'X-API-Key': 'your_api_key' }
  });
  const data = await res.json();

  if (data.status === 'completed') {
    console.log(`Crawled ${data.completedPages}/${data.totalPages} pages:`);
    data.results.forEach(page => {
      if (page.status === 'completed') {
        console.log(`  ${page.url} — ${page.markdown.length} chars`);
      } else {
        console.log(`  ${page.url} — FAILED: ${page.error}`);
      }
    });
  } else if (data.status === 'failed') {
    console.error(data.error);
  } else {
    setTimeout(poll, 2000);
  }
};

poll();
```
</Tab>
</Tabs>

For polling patterns, see the [Polling Jobs](/docs/api-reference/polling-jobs) reference.


---

# POST Submit Crawl Job (/docs/api-reference/crawl/submit-crawl-job)

<EndpointBanner method="POST" path="https://api.anakin.io/v1/crawl" />

Submit a website for multi-page crawling. The job discovers URLs and scrapes each page. Use the returned `jobId` to [poll for results](/docs/api-reference/crawl/get-crawl-result).

---

### Request Body

```json
{
  "url": "https://example.com",
  "maxPages": 10,
  "includePatterns": ["/blog/*"],
  "excludePatterns": ["/admin/*"],
  "country": "us",
  "useBrowser": false
}
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `url` **required** | string | The starting URL to crawl from. Must be valid HTTP/HTTPS. |
| `maxPages` | number | Maximum pages to crawl. Default `10`, max `100`. |
| `includePatterns` | string[] | URL glob patterns to include. Only URLs matching at least one pattern are crawled. |
| `excludePatterns` | string[] | URL glob patterns to exclude. URLs matching any pattern are skipped. |
| `country` | string | Country code for proxy routing. Default `"us"`. See [Supported Countries](/docs/api-reference/supported-countries). |
| `useBrowser` | boolean | Use headless Chrome for rendering. Default `false`. Best for JS-heavy sites. |
| `sessionId` | string | Browser session ID for authenticated crawling. See [Browser Sessions](/docs/api-reference/browser-sessions). |

---

### Response

<StatusBadge code={202} text="Accepted" />

```json
{
  "jobId": "job_abc123xyz",
  "status": "pending"
}
```

The job is processed asynchronously. Use the `jobId` with [GET /v1/crawl/\{id\}](/docs/api-reference/crawl/get-crawl-result) to check status and retrieve results.

---

### Code Examples

<Tabs items={["cURL", "Python", "JavaScript"]}>
<Tab value="cURL">
```bash
curl -X POST https://api.anakin.io/v1/crawl \
  -H "X-API-Key: your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com",
    "maxPages": 20,
    "includePatterns": ["/blog/*"],
    "country": "us"
  }'
```
</Tab>
<Tab value="Python">
```python
import requests

response = requests.post(
    'https://api.anakin.io/v1/crawl',
    headers={'X-API-Key': 'your_api_key'},
    json={
        'url': 'https://example.com',
        'maxPages': 20,
        'includePatterns': ['/blog/*'],
        'excludePatterns': ['/admin/*'],
        'country': 'us'
    }
)

data = response.json()
print(f"Job submitted: {data['jobId']}")
```
</Tab>
<Tab value="JavaScript">
```javascript
const response = await fetch('https://api.anakin.io/v1/crawl', {
  method: 'POST',
  headers: {
    'X-API-Key': 'your_api_key',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    url: 'https://example.com',
    maxPages: 20,
    includePatterns: ['/blog/*'],
    excludePatterns: ['/admin/*'],
    country: 'us'
  })
});

const data = await response.json();
console.log(data.jobId);
```
</Tab>
</Tabs>


---

# Error Responses (/docs/api-reference/error-responses)

Every AnakinScraper endpoint returns errors in a consistent JSON shape. This page is the canonical reference — what we return, what each code means, when to retry, and how to diagnose the most common failures.

For per-endpoint rate limits and the recommended request pacing, see [Rate Limits](/docs/documentation/rate-limits).

---

## Error response format

All errors return a JSON body with two fields:

```json
{
  "error": "rate_limit_exceeded",
  "message": "Too many requests. Please try again later."
}
```

| Field | Type | Description |
|-------|------|-------------|
| `error` | string | A short, machine-readable code. Stable across releases — safe to switch on in code. |
| `message` | string | A human-readable explanation. Subject to copy changes — log it but don't parse it. |

> **Async jobs are different.** When a polled job ends in `status: "failed"`, the failure shape lives inside the job response (`error` field, free-form string). See [Async job failures](#async-job-failures) below.

---

## HTTP status codes

| Status | Meaning | Retry? |
|--------|---------|--------|
| `200` | Success — synchronous endpoint returned a result, or polled job is complete. | — |
| `202` | Accepted — async job was queued, or polled job is still in progress. | — |
| `400` | Bad Request — your request body or parameters are invalid. | No — fix the request. |
| `401` | Unauthorized — API key missing, malformed, or revoked. | No — check the key. |
| `402` | Payment Required — insufficient credits for the operation. | No — top up credits. |
| `403` | Forbidden — the resource exists but you don't own it. | No. |
| `404` | Not Found — the job ID, session, or scraper doesn't exist. | No. |
| `409` | Conflict — resource is locked or already exists (e.g., session in use, duplicate name). | After resolving the conflict. |
| `422` | Unprocessable Entity — request was valid but the resource isn't ready (e.g., session not yet saved). | After the prerequisite is met. |
| `429` | Too Many Requests — rate limit exceeded. | Yes — see [Rate limit handling](#rate-limit-handling). |
| `500` | Internal Server Error — unexpected failure on our side. | Yes — exponential backoff. |
| `502` | Bad Gateway — a downstream service (browser, CDP proxy) is unreachable. | Yes — exponential backoff. |
| `503` | Service Unavailable — a required service is temporarily down or unconfigured. | Yes — wait 30–60s. |

---

## Error code catalog

The `error` field uses a fixed set of codes. The table below covers every code returned by the public API.

### Validation & input

| Code | HTTP | When you'll see it | What to do |
|------|------|--------------------|-----------|
| `invalid_request` | 400 | Body is not valid JSON, a required field is missing, or a value is out of range (e.g., `depth > 5`, batch with 0 or >10 URLs, prompt >8KB, schema >50KB). | Inspect `message` for the specific field, fix the request, and resubmit. |
| `invalid_url` | 400 | A URL in a batch request is malformed. | Fix the URL. The `message` indicates the index. |
| `invalid_job_type` | 400 | The `job_type` field on `POST /v1/request` doesn't match a registered handler. | Use a supported value (`url_scraper`, `crawl`, `map`, `agentic_search`, `search`, `web_scraper`). |

### Auth & authorization

| Code | HTTP | When you'll see it | What to do |
|------|------|--------------------|-----------|
| `unauthorized` | 401 | No API key was sent, or the key is malformed, revoked, or belongs to a deleted user. | Send a valid key in `X-API-Key` (or one of the [accepted header variants](#accepted-api-key-headers)). Generate a new key in the dashboard if needed. |
| `forbidden` | 403 | The resource (job, session, scraper) exists but belongs to a different user. | Use a job ID from your own account. |

### Credits

| Code | HTTP | When you'll see it | What to do |
|------|------|--------------------|-----------|
| `insufficient_credits` | 402 | Account balance is below the cost of the operation. The `message` includes the cost and your current balance. | Top up credits in [Billing](/buy-credits) or upgrade your plan. |

### Rate limiting

| Code | HTTP | When you'll see it | What to do |
|------|------|--------------------|-----------|
| `rate_limit_exceeded` | 429 | You exceeded the per-endpoint rate limit. | See [Rate limit handling](#rate-limit-handling). |

### Resource state

| Code | HTTP | When you'll see it | What to do |
|------|------|--------------------|-----------|
| `not_found` | 404 | Job ID, session ID, or scraper ID doesn't exist. | Verify the ID. Job IDs are valid for 30 days. |
| `session_not_saved` | 422 | You tried to attach a saved browser session before its storage state was uploaded. | Run the manual save flow first (see [Browser Sessions](/docs/api-reference/browser-sessions/manual-sessions)). |
| `session_in_use` | 409 | A saved session is already attached to an active automation. | Wait for the other run to finish, or use a different session. |
| `duplicate_name` | 409 | A session name is already taken for this user. | Use a unique name. |

### Server-side

| Code | HTTP | When you'll see it | What to do |
|------|------|--------------------|-----------|
| `server_error` | 500 | Unhandled error in our handler — usually a database or internal service issue. | Retry with backoff. If it persists, [contact support](#reporting-unexpected-errors) with the request ID. |
| `queue_error` | 500 | Failed to enqueue the job (SQS unavailable or misconfigured). | Retry with backoff. |
| `configuration_error` | 500 | A required service-side config is missing for this endpoint. | Retry; if persistent, contact support. |
| `internal_error` | 500 | Generic catch-all for unexpected failures. | Retry with backoff. |
| `search_error` | 500 | Upstream search provider (Perplexity) returned an error. | Retry with backoff; reword the prompt if persistent. |
| `service_unavailable` | 503 | A dependent service (browser AI, CDP proxy, scraper generator) is offline. | Retry after 30–60 seconds. |

> **Note on format consistency.** A small number of older endpoints — `/v1/browser-connect`, `/v1/ai/evaluate`, and a few scraper-management routes — currently return errors using slight variations of the format above (e.g., omitting `message`, or using a Fiber default shape `{"statusCode": 400, "message": "..."}` for validation errors). Treat them as still conforming to the principle: a string `error` field is always present, and the HTTP status is authoritative.

### Accepted API key headers

The API accepts the key under any of the following headers (and a few query params for WebSocket endpoints), in priority order:

`X-API-Key`, `X-Api-Key`, `Api-Key`, `API-Key`, `X-Access-Key`, `Access-Key`, `apikey`, `api_key`, `Authorization` (with `Bearer `, `API-Key `, `ApiKey ` prefix or raw).

For `/v1/browser-connect` (WebSocket): `?api_key=`, `?apikey=`, or `?token=` query parameters also work.

---

## Async job failures

For async endpoints (`/v1/url-scraper`, `/v1/agentic-search`, `/v1/map`, `/v1/crawl`, Wire's `/v1/holocron/task`), HTTP status `200`/`202` only confirms that polling is working. The actual outcome lives in the `status` field of the job response:

| `status` | Meaning |
|----------|---------|
| `pending` | Queued, not yet picked up by a worker. |
| `processing` | A worker is actively running the job. |
| `completed` | Finished successfully — results are in the response. |
| `failed` | The job ran but could not produce a result. See `error`. |

A failed job response looks like this:

```json
{
  "id": "job-abc123",
  "status": "failed",
  "error": "Blocked by website (HTTP 403)",
  "createdAt": "2025-04-30T18:12:04Z",
  "completedAt": "2025-04-30T18:12:34Z",
  "durationMs": 30000
}
```

The `error` field is a free-form, human-readable string. Common substrings to switch on if you must:

| Substring | Cause | Suggested fix |
|-----------|-------|---------------|
| `Blocked by website`, `HTTP 403`, `HTTP 429`, `bot detection`, `CAPTCHA` | Anti-bot protection. | Set `useBrowser: true` and/or specify a `country`. Try a [browser session](/docs/api-reference/browser-sessions/manual-sessions) for sites that require login. |
| `Connection timeout`, `timeout` | Page didn't finish loading in time. | For SPAs, set `useBrowser: true` and increase wait time. |
| `DNS resolution failed`, `no such host` | The domain can't be resolved. | Verify the URL is reachable. |
| `TLS`, `SSL` | Certificate validation failure. | Confirm the target uses a trusted certificate. |
| `Invalid URL` | Malformed URL passed all the way through. | Pre-validate URLs client-side. |

> **Batch jobs.** A batch URL scraper job is `completed` if any child finishes — partial failures don't fail the parent. Iterate `results[]` and check each child's `status` and `error`.

---

## Retry guidance

### When to retry

| Status | Retry? | Why |
|--------|--------|-----|
| `400`, `401`, `402`, `403`, `404`, `409`, `422` | **No** | The request itself is the problem. Retrying will return the same error. |
| `429` | **Yes** | Transient — the bucket refills. Read `Retry-After` if present, otherwise back off. |
| `500`, `502`, `503` | **Yes** | Transient server-side issue. Cap retries at 3–5 and use exponential backoff with jitter. |
| Network errors (no response) | **Yes** | Treat the same as `5xx`. |

### Recommended pattern: exponential backoff with jitter

Jitter spreads retries from many clients so a thundering herd doesn't synchronize. Cap the total wait so a stuck worker fails fast instead of looping forever.

<Tabs items={["Python", "Node.js"]}>
<Tab value="Python">
```python
import random
import time
import requests

RETRYABLE = {429, 500, 502, 503}
MAX_ATTEMPTS = 5
BASE_DELAY = 1.0  # seconds
MAX_DELAY = 30.0

def request_with_retry(method, url, *, headers=None, json=None):
    """POST/GET with exponential backoff + jitter on retryable failures."""
    for attempt in range(MAX_ATTEMPTS):
        try:
            response = requests.request(method, url, headers=headers, json=json, timeout=30)
        except requests.RequestException:
            if attempt == MAX_ATTEMPTS - 1:
                raise
            time.sleep(_backoff(attempt))
            continue

        if response.status_code not in RETRYABLE:
            return response

        # Honor server-sent Retry-After when present
        retry_after = response.headers.get("Retry-After")
        delay = float(retry_after) if retry_after else _backoff(attempt)

        if attempt == MAX_ATTEMPTS - 1:
            return response  # caller decides what to do

        time.sleep(delay)

    return response


def _backoff(attempt: int) -> float:
    """Full-jitter exponential backoff, capped at MAX_DELAY."""
    cap = min(MAX_DELAY, BASE_DELAY * (2 ** attempt))
    return random.uniform(0, cap)


# Usage
resp = request_with_retry(
    "POST",
    "https://api.anakin.io/v1/url-scraper",
    headers={"X-API-Key": "ak-your-key-here"},
    json={"url": "https://example.com"},
)
resp.raise_for_status()
print(resp.json()["jobId"])
```
</Tab>
<Tab value="Node.js">
```javascript
const RETRYABLE = new Set([429, 500, 502, 503]);
const MAX_ATTEMPTS = 5;
const BASE_DELAY = 1000;   // ms
const MAX_DELAY = 30_000;

async function requestWithRetry(url, init = {}) {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    let response;
    try {
      response = await fetch(url, init);
    } catch (err) {
      if (attempt === MAX_ATTEMPTS - 1) throw err;
      await sleep(backoff(attempt));
      continue;
    }

    if (!RETRYABLE.has(response.status)) return response;

    // Honor server-sent Retry-After when present
    const retryAfter = response.headers.get("Retry-After");
    const delay = retryAfter ? Number(retryAfter) * 1000 : backoff(attempt);

    if (attempt === MAX_ATTEMPTS - 1) return response;
    await sleep(delay);
  }
}

function backoff(attempt) {
  const cap = Math.min(MAX_DELAY, BASE_DELAY * 2 ** attempt);
  return Math.random() * cap;  // full jitter
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Usage
const res = await requestWithRetry("https://api.anakin.io/v1/url-scraper", {
  method: "POST",
  headers: {
    "X-API-Key": "ak-your-key-here",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ url: "https://example.com" }),
});
const { jobId } = await res.json();
console.log(jobId);
```
</Tab>
</Tabs>

---

## Rate limit handling

Per-endpoint limits are documented on the [Rate Limits](/docs/documentation/rate-limits) page. The short version: most submit endpoints allow **60 requests/min per user**; AI evaluation is **10/min**; GET polling endpoints are not rate-limited.

### Response headers

When a request is rate-limited, the API returns `429 Too Many Requests` with the standard error body. Some 429 responses (notably `/v1/browser-connect` over the limit on concurrent CDP sessions) include a `Retry-After` header indicating seconds to wait:

```http
HTTP/1.1 429 Too Many Requests
Retry-After: 5
Content-Type: application/json

{"error": "rate_limit_exceeded", "message": "Too many requests. Please try again later."}
```

> **Heads up.** AnakinScraper does **not** currently emit the optional `X-RateLimit-Limit`, `X-RateLimit-Remaining`, or `X-RateLimit-Reset` headers. Don't rely on them — drive your retry loop off `Retry-After` (when present) or your own backoff. Surfacing these headers is on our roadmap.

### Reading `Retry-After`

The `requestWithRetry` helpers above already honor `Retry-After`. If you only need to handle 429 specifically:

<Tabs items={["Python", "Node.js"]}>
<Tab value="Python">
```python
import time
import requests

resp = requests.post(
    "https://api.anakin.io/v1/url-scraper",
    headers={"X-API-Key": "ak-your-key-here"},
    json={"url": "https://example.com"},
)

if resp.status_code == 429:
    wait = int(resp.headers.get("Retry-After", "5"))
    time.sleep(wait)
    resp = requests.post(...)  # retry
```
</Tab>
<Tab value="Node.js">
```javascript
let res = await fetch("https://api.anakin.io/v1/url-scraper", { method: "POST", ... });

if (res.status === 429) {
  const wait = Number(res.headers.get("Retry-After") ?? 5);
  await new Promise((r) => setTimeout(r, wait * 1000));
  res = await fetch(...);  // retry
}
```
</Tab>
</Tabs>

---

## Troubleshooting

The following scenarios cover the failures we see most often in support tickets.

### "I'm getting 403 from the target site"

The site has bot detection. Two levers, in order of effectiveness:

1. **Switch to the browser handler.** Add `"useBrowser": true` to your request — this routes through Camoufox (Firefox-based, fingerprint-masked) instead of plain HTTP.
2. **Set a country.** Add `"country": "US"` (or another ISO code) — the proxy bandit will pick a residential IP from that region.

If both fail, the site likely requires a logged-in session. Use [Browser Sessions](/docs/api-reference/browser-sessions/manual-sessions) to capture cookies once, then attach the session by ID.

### "Timeouts on a single-page app"

Plain HTTP can't run JavaScript. Set `"useBrowser": true` so the scraper executes the page's JS before extracting content. For very slow SPAs, also increase `"waitForSelector"` or `"waitMs"` if your endpoint supports them.

### "Schema extraction returns the wrong fields"

Agentic Search and JSON extraction are LLM-driven — better prompts and tighter schemas produce better output:

- **Be explicit** in the prompt: name each field and describe its expected shape (e.g., "extract `price` as a number in USD, no currency symbol").
- **Provide examples** in the prompt for ambiguous fields.
- **Tighten the schema.** Required JSON Schema fields force the model to produce them; optional fields tend to get omitted.
- **Cap the schema at 50KB.** Larger schemas are rejected with `invalid_request`.

### "Job stuck in pending"

A few possibilities:

- **You're polling the wrong endpoint.** `POST /v1/url-scraper` returns a `jobId` you poll at `GET /v1/url-scraper/{id}`. The list is in [Polling Jobs](/docs/api-reference/polling-jobs).
- **Worker fleet is saturated.** Pending → processing usually takes &lt;5s. If it's been &gt;60s, retry or [contact support](#reporting-unexpected-errors).
- **The job died silently.** Stale jobs are auto-marked `failed` after 1 hour. If you see this, check the `error` field for the cause.

### "402 insufficient_credits when I just topped up"

Credits are deducted on **completion**, but checked **upfront**. If you submitted a batch of 10 URLs and have 8 credits, the batch is rejected immediately even though some URLs would have come from cache (which costs 0). Top up enough for the worst case.

### "Got a 401 with a brand-new key"

API keys take a few seconds to propagate. If a freshly-created key returns 401, wait 5–10 seconds and retry. If it persists, regenerate the key in the dashboard.

### "Different services return slightly different error shapes"

A small number of older endpoints (notably `/v1/browser-connect`, `/v1/ai/evaluate`, and some scraper-management routes) use minor variations on the canonical format. The HTTP status is always authoritative; the body always contains a string `error` field. Plan your error handling around the status code first, then the `error` code.

### "Wire job returned a `429` even though I've only made a few requests"

`GET /v1/holocron/jobs/{id}` is capped at **60/min per user** — unlike URL Scraper, which is unlimited. If you're polling many Wire jobs in parallel, stagger them or reduce poll frequency. See [Rate Limits](/docs/documentation/rate-limits) for the per-endpoint table.

### "Browser Connect closed unexpectedly"

The CDP proxy returns 429 once a single API instance has 50 concurrent CDP sessions. Pool clients across multiple instances, close sessions when done, and retry on `Retry-After`. If you saved a session, it must finish uploading to S3 before another connection can attach to it (otherwise you'll see `session_not_saved`).

---

## Reporting unexpected errors

If you hit a `500`, an unfamiliar `error` code, or behavior that contradicts this page:

- **Capture the request:** method, URL, headers (redact the API key), body.
- **Capture the response:** status, headers, body.
- **Note the time** (UTC, to the second) — this lets us correlate against server logs.
- **Email** support@anakin.io with the above. For Enterprise customers, see your dedicated channel.


---

# Wire (/docs/api-reference/holocron)

Run pre-built automation actions across hundreds of popular websites. Each action handles browser rendering, authentication, and structured data extraction. Jobs are processed asynchronously — submit a task and poll for results.

### How It Works

1. **Discover an action** — list catalogs or search to find an `action_id` and its parameter schema
2. **Submit a task** — call `POST /v1/holocron/task` with the `action_id` and your parameters
3. **Poll for results** — use the returned `job_id` to check status and retrieve data

Browse available actions from the [Wire dashboard](/holocron) or via the discovery endpoints below.

### Endpoints

<EndpointCard method="GET"  path="/v1/holocron/catalog"        description="List Catalogs — every supported website with its action count"      href="/docs/api-reference/holocron/list-catalogs" />
<EndpointCard method="GET"  path="/v1/holocron/catalog/{slug}" description="Catalog Details — single catalog plus its full action list & schemas" href="/docs/api-reference/holocron/get-catalog" />
<EndpointCard method="GET"  path="/v1/holocron/search"         description="Search Actions — find an action_id by query, catalog, or category"   href="/docs/api-reference/holocron/search-actions" />
<EndpointCard method="POST" path="/v1/holocron/task"           description="Execute Task — run a pre-built action and get a job ID"             href="/docs/api-reference/holocron/execute-task" />
<EndpointCard method="GET"  path="/v1/holocron/jobs/{id}"      description="Get Job Status — poll for status and retrieve results"               href="/docs/api-reference/holocron/get-job" />

### Identities & credentials

An **identity** is a named account on a website (e.g. "Personal Amazon", "Work Amazon"). Each identity holds one or more **credentials** (cookies, API keys, etc.) — the encrypted auth data needed to run tasks as that account.

To use multi-auth: list your identities, copy the `credential_id` you want, pass it as `credential_id` on `POST /v1/holocron/task`. Identities and credentials are created and managed via the [Wire dashboard](/holocron/identities) — the API endpoints below are read-only for discovery.

<EndpointCard method="GET" path="/v1/holocron/identities" description="List all your identities (or one by ID) with their credentials inline" href="/docs/api-reference/holocron/list-identities" />

### Errors

Common error responses on [POST /v1/holocron/task](/docs/api-reference/holocron/execute-task):

| Status | Code | When | Action |
|--------|------|------|--------|
| `401` | `AUTH_REQUIRED` | Action needs auth and you have no credential for this catalog | Visit the `connect_url` in the response to connect your account |
| `401` | `AUTH_EXPIRED` | The `credential_id` exists but its session is no longer valid (cookies expired, token revoked, password changed) | Have the user reconnect — `GET /identities` will show `status: "expired"` on the credential |
| `403` | `FORBIDDEN` | The `credential_id` doesn't belong to you, or belongs to a different catalog than the action | Re-fetch valid credential IDs via [GET /v1/holocron/identities](/docs/api-reference/holocron/list-identities) |
| `402` | `INSUFFICIENT_CREDITS` | Your account balance can't cover the action's `credits_per_call` | Top up credits or use a smaller-cost action |
| `500` | `EXECUTION_FAILED` | Transient submission failure — engine couldn't enqueue the task. Credits are not deducted | Retry the request; if it persists, contact support |


---

# POST Execute Task (/docs/api-reference/holocron/execute-task)

<EndpointBanner method="POST" path="https://api.anakin.io/v1/holocron/task" />

Submit a task to execute a Wire action. Credits are deducted immediately at submission and refunded automatically if the job fails. Poll for results using [GET /v1/holocron/jobs/\{id\}](/docs/api-reference/holocron/get-job).

---

### Request Body

```json
{
  "action_id": "li_profile_scrape",
  "credential_id": "11111111-2222-3333-4444-555555555555",
  "params": {
    "profile_url": "https://www.linkedin.com/in/example"
  }
}
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `action_id` **required** | string | The action to run. Find action IDs in the [Wire dashboard](/holocron) |
| `credential_id` | string (UUID) | Required for actions where `auth_required: true`. Get IDs from [GET /v1/holocron/identities](/docs/api-reference/holocron/list-identities) |
| `params` | object | Action-specific input parameters |

> **Auth-required actions** need a `credential_id`. List your credentials with [GET /v1/holocron/identities](/docs/api-reference/holocron/list-identities), or manage them in the [Identities dashboard](/holocron/identities) (hover any credential to copy its ID).

---

### Response

<StatusBadge code={202} text="Accepted" />

```json
{
  "status": "processing",
  "job_id": "7c3f1a2b-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
  "poll_url": "/v1/holocron/jobs/7c3f1a2b-4d5e-6f7a-8b9c-0d1e2f3a4b5c"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `job_id` | string | Use this to poll for results |
| `poll_url` | string | Convenience path for the polling endpoint |

Use the `job_id` with [GET /v1/holocron/jobs/\{id\}](/docs/api-reference/holocron/get-job) to retrieve your results.

---

### Error Responses

**Insufficient credits** — `402 Payment Required`
```json
{
  "status": "error",
  "error": {
    "code": "INSUFFICIENT_CREDITS",
    "message": "You need 5 credits. Current balance: 2",
    "balance": 2,
    "required": 5
  }
}
```

**Authentication required** — `401 Unauthorized`

Returned when the action requires you to connect your account for the target website and you have no credential for it. Visit the `connect_url` to authenticate.

```json
{
  "status": "error",
  "error": {
    "code": "AUTH_REQUIRED",
    "message": "This action requires a LinkedIn connection.",
    "connect_url": "/products/holocron/linkedin/connect"
  }
}
```

**Credential expired** — `401 Unauthorized`

Returned when the `credential_id` you passed exists but its session is no longer valid (cookies expired, token revoked, password changed, etc.). The user needs to reconnect. List your credentials with [GET /v1/holocron/identities](/docs/api-reference/holocron/list-identities) — `status` will show `expired`.

```json
{
  "status": "error",
  "error": {
    "code": "AUTH_EXPIRED",
    "message": "Credential is no longer active. Please reconnect."
  }
}
```

**Forbidden** — `403 Forbidden`

Returned when the `credential_id` you passed exists but doesn't belong to you, or belongs to a different catalog than the action you're calling. Common cause: copy/pasting a `credential_id` between accounts, or accidentally passing an Amazon credential to a LinkedIn action.

```json
{
  "status": "error",
  "error": {
    "code": "FORBIDDEN",
    "message": "Credential does not belong to this user or catalog"
  }
}
```

**Submission failed** — `500 Internal Server Error`

Transient server-side failure when enqueueing the task. Credits are not deducted. Retry the request; if it persists, contact support with the request timestamp.

```json
{
  "status": "error",
  "error": {
    "code": "EXECUTION_FAILED",
    "message": "Failed to submit task. Please try again."
  }
}
```

> Note: `EXECUTION_FAILED` can also appear as a final status on a successfully submitted job (see [GET /v1/holocron/jobs/\{id\}](/docs/api-reference/holocron/get-job)). Same code, different meaning — at submission it means the engine couldn't enqueue; at job completion it means the scraper raised an unrecoverable error.

---

### Code Examples

<Tabs items={["cURL", "Python", "JavaScript"]}>
<Tab value="cURL">
```bash
curl -X POST https://api.anakin.io/v1/holocron/task \
  -H "X-API-Key: your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "action_id": "li_profile_scrape",
    "credential_id": "11111111-2222-3333-4444-555555555555",
    "params": {
      "profile_url": "https://www.linkedin.com/in/example"
    }
  }'
```
</Tab>
<Tab value="Python">
```python
import requests

response = requests.post(
    'https://api.anakin.io/v1/holocron/task',
    headers={'X-API-Key': 'your_api_key'},
    json={
        'action_id': 'li_profile_scrape',
        'credential_id': '11111111-2222-3333-4444-555555555555',
        'params': {
            'profile_url': 'https://www.linkedin.com/in/example'
        }
    }
)

data = response.json()
print(f"Job submitted: {data['job_id']}")
```
</Tab>
<Tab value="JavaScript">
```javascript
const response = await fetch('https://api.anakin.io/v1/holocron/task', {
  method: 'POST',
  headers: {
    'X-API-Key': 'your_api_key',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    action_id: 'li_profile_scrape',
    credential_id: '11111111-2222-3333-4444-555555555555',
    params: {
      profile_url: 'https://www.linkedin.com/in/example'
    }
  })
});

const { job_id } = await response.json();
console.log('Job submitted:', job_id);
```
</Tab>
</Tabs>

> `credential_id` is required for auth-required actions like `li_profile_scrape`. Get yours from [GET /v1/holocron/identities](/docs/api-reference/holocron/list-identities). For actions where `auth_required: false`, omit it.


---

# GET Catalog Details (/docs/api-reference/holocron/get-catalog)

<EndpointBanner method="GET" path="https://api.anakin.io/v1/holocron/catalog/{slug}" />

Returns the catalog entry for a single website plus every visible action it exposes. This is the canonical way to discover an action's `action_id`, parameter schema, mode (`async` / `sync`), and credit cost before calling [POST /v1/holocron/task](/docs/api-reference/holocron/execute-task).

Requires an `X-API-Key`. Returns public actions plus any private actions you own.

---

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `slug` **required** | string | Catalog slug (e.g. `airbnb`, `linkedin`). Get slugs from [GET /v1/holocron/catalog](/docs/api-reference/holocron/list-catalogs) |

---

### Response

<StatusBadge code={200} text="OK" />

```json
{
  "catalog": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "slug": "airbnb",
    "name": "Airbnb",
    "url": "https://www.airbnb.com",
    "domain": "airbnb.com",
    "category": "travel",
    "description": "Search listings, fetch reviews, and pull host details.",
    "logo_url": "https://cdn.anakin.io/logos/airbnb.png",
    "auth_required": false,
    "auth_types": [],
    "status": "active",
    "created_at": "2026-02-01T00:00:00Z",
    "updated_at": "2026-04-20T12:00:00Z",
    "action_count": 4
  },
  "actions": [
    {
      "id": "f1e2d3c4-b5a6-7890-1234-56789abcdef0",
      "action_id": "ab_search_listings",
      "catalog_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "name": "Search Listings",
      "description": "Search Airbnb listings by query, dates, and guest count.",
      "tags": ["search", "listings"],
      "type": "scrape",
      "mode": "async",
      "auth_required": false,
      "parameters": {
        "type": "object",
        "properties": {
          "query":    { "type": "string",  "description": "Location query, e.g. 'pacific heights'" },
          "checkin":  { "type": "string",  "description": "ISO date" },
          "checkout": { "type": "string",  "description": "ISO date" },
          "adults":   { "type": "integer" },
          "children": { "type": "integer" },
          "infants":  { "type": "integer" },
          "pets":     { "type": "integer" },
          "cursor":   { "type": "string",  "description": "Pagination cursor from previous response" },
          "currency": { "type": "string" },
          "locale":   { "type": "string" }
        },
        "required": ["query"]
      },
      "credits_per_call": 1,
      "wheel_version": "0.4.2",
      "status": "active",
      "created_at": "2026-02-01T00:00:00Z",
      "updated_at": "2026-04-20T12:00:00Z"
    }
  ]
}
```

#### Catalog fields

See [GET /v1/holocron/catalog](/docs/api-reference/holocron/list-catalogs#response) — the `catalog` object on this endpoint matches the same `CatalogEntry` shape.

#### Action fields

| Field | Type | Description |
|-------|------|-------------|
| `actions[].action_id` | string | **Pass this as `action_id` when calling [POST /v1/holocron/task](/docs/api-reference/holocron/execute-task)** |
| `actions[].name` | string | Display name |
| `actions[].description` | string \| null | Short summary |
| `actions[].tags` | string[] | Free-form tags for filtering / discovery |
| `actions[].type` | string | Action category (e.g. `scrape`, `extract`) |
| `actions[].mode` | string | `async` (returns `job_id`, poll for results) or `sync` (returns data inline) |
| `actions[].auth_required` | boolean | If `true`, you must supply a `credential_id` when calling the task endpoint |
| `actions[].parameters` | object | JSON Schema describing the `params` accepted by [POST /v1/holocron/task](/docs/api-reference/holocron/execute-task) |
| `actions[].credits_per_call` | integer | Base credit cost. Some actions use a CEL expression in `action_config.credit_expression` to compute final cost from the response — final cost is reflected on the [job record](/docs/api-reference/holocron/get-job) |
| `actions[].wheel_version` | string \| null | Build version of the underlying scraper |
| `actions[].status` | string | `active` or `pending_review` |
| `actions[].owner_user_id` | string \| null | Set when this is a private action you built via [build-request](/holocron) |

> Only actions visible to the requesting user are returned. Private actions belonging to other users are filtered out server-side.

---

### Error Responses

**Catalog not found** — `404 Not Found`
```json
{
  "status": "error",
  "error": { "code": "NOT_FOUND", "message": "Catalog entry not found" }
}
```

---

### Code Examples

<Tabs items={["cURL", "Python", "JavaScript"]}>
<Tab value="cURL">
```bash
curl https://api.anakin.io/v1/holocron/catalog/airbnb \
  -H "X-API-Key: your_api_key"
```
</Tab>
<Tab value="Python">
```python
import requests

response = requests.get(
    'https://api.anakin.io/v1/holocron/catalog/airbnb',
    headers={'X-API-Key': 'your_api_key'}
)

data = response.json()
print(f"Catalog: {data['catalog']['name']}")
for action in data['actions']:
    print(f"  {action['action_id']:30} {action['credits_per_call']} cr  {action['name']}")
```
</Tab>
<Tab value="JavaScript">
```javascript
const response = await fetch('https://api.anakin.io/v1/holocron/catalog/airbnb', {
  headers: { 'X-API-Key': 'your_api_key' }
});

const { catalog, actions } = await response.json();
console.log(`Catalog: ${catalog.name}`);
for (const action of actions) {
  console.log(`  ${action.action_id.padEnd(30)} ${action.credits_per_call} cr  ${action.name}`);
}
```
</Tab>
</Tabs>

---

### Rate Limit

60 requests per minute per IP.


---

# GET Get Job Status (/docs/api-reference/holocron/get-job)

<EndpointBanner method="GET" path="https://api.anakin.io/v1/holocron/jobs/{id}" />

Retrieve the status and results of a Wire task. Poll this endpoint until the job reaches `completed` or `failed`. See the [Polling Jobs](/docs/api-reference/polling-jobs) guide for recommended patterns.

---

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` **required** | string | The job ID returned from [POST /v1/holocron/task](/docs/api-reference/holocron/execute-task) |

---

### Response — Processing

<StatusBadge code={200} text="OK" />

```json
{
  "status": "processing"
}
```

### Response — Completed

<StatusBadge code={200} text="OK" />

```json
{
  "status": "completed",
  "data": {
    "name": "Jane Doe",
    "headline": "Software Engineer at Acme Corp",
    "location": "San Francisco, CA",
    "connections": 500
  },
  "credits_used": 2,
  "execution_ms": 8420
}
```

### Response — Failed

<StatusBadge code={200} text="OK" />

```json
{
  "status": "failed",
  "error": {
    "code": "EXECUTION_FAILED",
    "message": "The target page could not be loaded."
  },
  "credits_used": 0
}
```

---

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `status` | string | `processing`, `completed`, or `failed` |
| `data` | object | Structured result data (present when `completed`) |
| `credits_used` | number | Credits charged for this job. `0` on failure (credits are refunded) |
| `execution_ms` | number | Total execution time in milliseconds |
| `error` | object | Error details (present when `failed`) |

### Job Statuses

| Status | Description |
|--------|-------------|
| `processing` | Job is queued or actively running |
| `completed` | Job finished successfully — `data` is populated |
| `failed` | Job encountered an error — credits were refunded |

---

### Code Examples

<Tabs items={["cURL", "Python", "JavaScript"]}>
<Tab value="cURL">
```bash
curl https://api.anakin.io/v1/holocron/jobs/7c3f1a2b-4d5e-6f7a-8b9c-0d1e2f3a4b5c \
  -H "X-API-Key: your_api_key"
```
</Tab>
<Tab value="Python">
```python
import requests
import time

job_id = '7c3f1a2b-4d5e-6f7a-8b9c-0d1e2f3a4b5c'

while True:
    response = requests.get(
        f'https://api.anakin.io/v1/holocron/jobs/{job_id}',
        headers={'X-API-Key': 'your_api_key'}
    )
    data = response.json()

    if data['status'] == 'completed':
        print(data['data'])
        break
    elif data['status'] == 'failed':
        print(f"Job failed: {data['error']['message']}")
        break

    time.sleep(3)
```
</Tab>
<Tab value="JavaScript">
```javascript
const jobId = '7c3f1a2b-4d5e-6f7a-8b9c-0d1e2f3a4b5c';

const poll = async () => {
  while (true) {
    const res = await fetch(`https://api.anakin.io/v1/holocron/jobs/${jobId}`, {
      headers: { 'X-API-Key': 'your_api_key' }
    });
    const data = await res.json();

    if (data.status === 'completed') {
      console.log(data.data);
      break;
    } else if (data.status === 'failed') {
      console.error(data.error.message);
      break;
    }

    await new Promise(r => setTimeout(r, 3000));
  }
};

poll();
```
</Tab>
</Tabs>

For polling patterns, see the [Polling Jobs](/docs/api-reference/polling-jobs) reference.


---

# GET List Catalogs (/docs/api-reference/holocron/list-catalogs)

<EndpointBanner method="GET" path="https://api.anakin.io/v1/holocron/catalog" />

Returns every website in the catalog that has at least one visible action. Use this to discover what's available before drilling into a specific catalog with [GET /v1/holocron/catalog/\{slug\}](/docs/api-reference/holocron/get-catalog).

Requires an `X-API-Key`. Returns all visible catalogs — public catalogs plus any private actions you own.

---

### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `scope` | string | Set to `my` to return only catalogs that contain actions you own. Default: all visible catalogs |

---

### Response

<StatusBadge code={200} text="OK" />

```json
{
  "catalog": [
    {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "slug": "airbnb",
      "name": "Airbnb",
      "url": "https://www.airbnb.com",
      "domain": "airbnb.com",
      "category": "travel",
      "description": "Search listings, fetch reviews, and pull host details.",
      "logo_url": "https://cdn.anakin.io/logos/airbnb.png",
      "auth_required": false,
      "auth_type": null,
      "auth_types": [],
      "auth_login_url": null,
      "status": "active",
      "created_at": "2026-02-01T00:00:00Z",
      "updated_at": "2026-04-20T12:00:00Z",
      "action_count": 4
    }
  ]
}
```

| Field | Type | Description |
|-------|------|-------------|
| `catalog[].id` | string (UUID) | Internal catalog ID — pass this when creating identities |
| `catalog[].slug` | string | URL-safe identifier (e.g. `airbnb`, `linkedin`) — use this in path-based endpoints |
| `catalog[].name` | string | Display name |
| `catalog[].domain` | string | Primary domain the catalog targets |
| `catalog[].category` | string | High-level grouping (e.g. `travel`, `commerce`, `social`) |
| `catalog[].auth_required` | boolean | `true` if any action in this catalog requires a connected account |
| `catalog[].auth_types` | string[] | Allowed credential types when `auth_required` is true. Subset of `browser_state`, `credentials`, `api_key`, `token` |
| `catalog[].auth_login_url` | string \| null | Where users should log in to seed a `browser_state` credential |
| `catalog[].status` | string | `active` or `pending_review` |
| `catalog[].action_count` | integer | Number of visible actions in this catalog (for the requesting user) |

---

### Code Examples

<Tabs items={["cURL", "Python", "JavaScript"]}>
<Tab value="cURL">
```bash
curl https://api.anakin.io/v1/holocron/catalog \
  -H "X-API-Key: your_api_key"
```
</Tab>
<Tab value="Python">
```python
import requests

response = requests.get(
    'https://api.anakin.io/v1/holocron/catalog',
    headers={'X-API-Key': 'your_api_key'}
)

for entry in response.json()['catalog']:
    print(f"{entry['slug']:20} {entry['action_count']:3} actions  {entry['name']}")
```
</Tab>
<Tab value="JavaScript">
```javascript
const response = await fetch('https://api.anakin.io/v1/holocron/catalog', {
  headers: { 'X-API-Key': 'your_api_key' }
});

const { catalog } = await response.json();
for (const entry of catalog) {
  console.log(`${entry.slug.padEnd(20)} ${entry.action_count} actions  ${entry.name}`);
}
```
</Tab>
</Tabs>

---

### Rate Limit

60 requests per minute per IP.


---

# GET List Identities (/docs/api-reference/holocron/list-identities)

<EndpointBanner method="GET" path="https://api.anakin.io/v1/holocron/identities" />
<EndpointBanner method="GET" path="https://api.anakin.io/v1/holocron/identities/{id}" />

Returns the authenticated user's identities and their attached credentials. Use the returned `credentials[].id` as the `credential_id` when submitting authenticated tasks via [POST /v1/holocron/task](/docs/api-reference/holocron/execute-task).

An **identity** is a named container tied to one website (e.g. "Personal Amazon"). Each identity can have multiple **credentials** of different types: `browser_state`, `credentials`, `api_key`, or `token`.

This page covers two endpoints:
- **`GET /v1/holocron/identities`** — list all your identities (paginated by `catalog_id`)
- **`GET /v1/holocron/identities/\{id\}`** — fetch a single identity by ID (returns the same identity object, just one of them)

---

### Query Parameters (list endpoint only)

| Parameter | Type | Description |
|-----------|------|-------------|
| `catalog_id` | string | Filter identities to a single website catalog (optional) |

### Path Parameters (single endpoint only)

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` **required** | string (UUID) | Identity ID |

---

### Response (list)

<StatusBadge code={200} text="OK" />

```json
{
  "status": "ok",
  "identities": [
    {
      "id": "7c3f1a2b-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
      "catalog_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "name": "Personal Amazon",
      "is_default": true,
      "created_at": "2026-04-15T10:00:00Z",
      "credentials": [
        {
          "id": "11111111-2222-3333-4444-555555555555",
          "identity_id": "7c3f1a2b-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
          "credential_type": "browser_state",
          "status": "active",
          "last_used_at": "2026-04-20T12:34:56Z",
          "created_at": "2026-04-15T10:00:00Z"
        }
      ]
    }
  ]
}
```

| Field | Type | Description |
|-------|------|-------------|
| `identities[].id` | string (UUID) | Identity ID |
| `identities[].catalog_id` | string (UUID) | The catalog (website) this identity belongs to |
| `identities[].name` | string | User-given name (unique per user + catalog) |
| `identities[].is_default` | boolean | Marked as the user's default for this catalog |
| `credentials[].id` | string (UUID) | **Use this as `credential_id` in task requests** |
| `credentials[].credential_type` | string | One of: `browser_state`, `credentials`, `api_key`, `token` |
| `credentials[].status` | string | `active` or `expired` — only `active` credentials can be used |

The encrypted credential data is never returned in the response.

### Response (single — `GET /identities/\{id\}`)

Same shape as a single element of the `identities[]` array above, returned at the top level:

```json
{
  "status": "ok",
  "identity": {
    "id": "7c3f1a2b-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
    "catalog_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "name": "Personal Amazon",
    "is_default": true,
    "created_at": "2026-04-15T10:00:00Z",
    "credentials": [ /* same shape */ ]
  }
}
```

Returns `404 Not Found` if the identity doesn't exist or doesn't belong to you.

---

### Code Examples

<Tabs items={["cURL", "Python", "JavaScript"]}>
<Tab value="cURL">
```bash
curl https://api.anakin.io/v1/holocron/identities \
  -H "X-API-Key: your_api_key"
```
</Tab>
<Tab value="Python">
```python
import requests

response = requests.get(
    'https://api.anakin.io/v1/holocron/identities',
    headers={'X-API-Key': 'your_api_key'}
)

for identity in response.json()['identities']:
    print(f"{identity['name']}:")
    for cred in identity.get('credentials', []):
        print(f"  {cred['credential_type']} → {cred['id']}")
```
</Tab>
<Tab value="JavaScript">
```javascript
const response = await fetch('https://api.anakin.io/v1/holocron/identities', {
  headers: { 'X-API-Key': 'your_api_key' }
});

const { identities } = await response.json();
for (const identity of identities) {
  console.log(`${identity.name}:`);
  for (const cred of identity.credentials || []) {
    console.log(`  ${cred.credential_type} → ${cred.id}`);
  }
}
```
</Tab>
</Tabs>

---

### Managing identities via UI

You can also view and copy credential IDs from the [Identities dashboard](/holocron/identities) — hover over a credential pill to reveal a copy button.


---

# GET Search Actions (/docs/api-reference/holocron/search-actions)

<EndpointBanner method="GET" path="https://api.anakin.io/v1/holocron/search" />

Find Wire actions across every catalog in a single request. Useful when you know what you want to do (e.g. "search listings", "fetch profile") but don't yet know which catalog or `action_id` to call.

Requires an `X-API-Key`. Each result includes a `connected` flag indicating whether you already have an active credential for that catalog.

---

### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `q` | string | Free-text query — matches against action name, description, and tags |
| `catalog` | string | Restrict results to a single catalog slug (e.g. `airbnb`) |
| `category` | string | Restrict results to a catalog category (e.g. `travel`, `commerce`) |
| `auth` | string | Set to `false` to exclude actions that require authentication |

All filters are optional and combine with AND semantics. Omitting every filter returns all visible actions.

---

### Response

<StatusBadge code={200} text="OK" />

```json
{
  "results": [
    {
      "action_id": "ab_search_listings",
      "catalog_name": "Airbnb",
      "catalog_slug": "airbnb",
      "name": "Search Listings",
      "description": "Search Airbnb listings by query, dates, and guest count.",
      "mode": "async",
      "auth_required": false,
      "connected": false,
      "params": {
        "type": "object",
        "properties": {
          "query":    { "type": "string" },
          "checkin":  { "type": "string" },
          "checkout": { "type": "string" },
          "adults":   { "type": "integer" }
        },
        "required": ["query"]
      },
      "credits": 1
    }
  ]
}
```

| Field | Type | Description |
|-------|------|-------------|
| `results[].action_id` | string | Pass this as `action_id` to [POST /v1/holocron/task](/docs/api-reference/holocron/execute-task) |
| `results[].catalog_name` | string | Display name of the parent catalog |
| `results[].catalog_slug` | string | Slug of the parent catalog — use with [GET /v1/holocron/catalog/\{slug\}](/docs/api-reference/holocron/get-catalog) for full details |
| `results[].mode` | string | `async` or `sync` |
| `results[].auth_required` | boolean | Whether a `credential_id` is needed when calling this action |
| `results[].connected` | boolean | `true` if you already have an active credential for this catalog |
| `results[].params` | object | JSON Schema for the action's `params` payload |
| `results[].credits` | integer | Base credit cost per call |

---

### Code Examples

<Tabs items={["cURL", "Python", "JavaScript"]}>
<Tab value="cURL">
```bash
# Search across all catalogs
curl "https://api.anakin.io/v1/holocron/search?q=listings" \
  -H "X-API-Key: your_api_key"

# Restrict to one catalog and exclude auth-required actions
curl "https://api.anakin.io/v1/holocron/search?catalog=airbnb&auth=false" \
  -H "X-API-Key: your_api_key"
```
</Tab>
<Tab value="Python">
```python
import requests

response = requests.get(
    'https://api.anakin.io/v1/holocron/search',
    params={'q': 'listings', 'auth': 'false'},
    headers={'X-API-Key': 'your_api_key'},
)

for r in response.json()['results']:
    print(f"{r['catalog_slug']:15} {r['action_id']:30} {r['credits']} cr  {r['name']}")
```
</Tab>
<Tab value="JavaScript">
```javascript
const url = new URL('https://api.anakin.io/v1/holocron/search');
url.searchParams.set('q', 'listings');
url.searchParams.set('auth', 'false');

const response = await fetch(url, {
  headers: { 'X-API-Key': 'your_api_key' }
});

const { results } = await response.json();
for (const r of results) {
  console.log(`${r.catalog_slug.padEnd(15)} ${r.action_id.padEnd(30)} ${r.credits} cr  ${r.name}`);
}
```
</Tab>
</Tabs>

---

### Rate Limit

30 requests per minute per IP.


---

# Map (URL Discovery) (/docs/api-reference/map)

The Map API discovers all URLs on a website. It fetches the page, parses sitemaps, and extracts links to build a complete URL inventory. Use it for site audits, content indexing, or as a precursor to [Crawl](/docs/api-reference/crawl).

### Features

- **Sitemap + link extraction** — combines sitemap.xml parsing with in-page link discovery
- **Subdomain support** — optionally include links to subdomains
- **Search filter** — filter discovered URLs by keyword
- **Browser rendering** — use headless Chrome for JS-rendered pages
- **Up to 5,000 URLs** per request

### Endpoints

<EndpointCard method="POST" path="/v1/map" description="Submit Map Job — discover URLs on a website" href="/docs/api-reference/map/submit-map-job" />

<EndpointCard method="GET" path="/v1/map/{id}" description="Get Map Result — retrieve discovered URLs" href="/docs/api-reference/map/get-map-result" />


---

# GET Get Map Result (/docs/api-reference/map/get-map-result)

<EndpointBanner method="GET" path="https://api.anakin.io/v1/map/{id}" />

Retrieve the status and results of a map job. Use this to poll for completion after submitting a [map request](/docs/api-reference/map/submit-map-job).

---

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` **required** | string | The job ID returned from the submit endpoint |

---

### Response

<StatusBadge code={200} text="OK" />

```json
{
  "id": "job_abc123xyz",
  "status": "completed",
  "url": "https://example.com",
  "links": [
    "https://example.com/about",
    "https://example.com/blog",
    "https://example.com/blog/post-1",
    "https://example.com/contact",
    "https://example.com/pricing"
  ],
  "totalLinks": 5,
  "createdAt": "2024-01-01T12:00:00Z",
  "completedAt": "2024-01-01T12:00:03Z",
  "durationMs": 3000
}
```

---

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `status` | string | `pending`, `processing`, `completed`, or `failed` |
| `url` | string | The original URL submitted for discovery |
| `links` | string[] | Array of discovered URLs. Only present when completed. |
| `totalLinks` | number | Total count of discovered URLs. |
| `error` | string | Error message. Only present when failed. |
| `durationMs` | number | Processing time in milliseconds. |

---

### Code Examples

<Tabs items={["cURL", "Python", "JavaScript"]}>
<Tab value="cURL">
```bash
curl -X GET https://api.anakin.io/v1/map/job_abc123xyz \
  -H "X-API-Key: your_api_key"
```
</Tab>
<Tab value="Python">
```python
import requests
import time

job_id = "job_abc123xyz"

while True:
    result = requests.get(
        f'https://api.anakin.io/v1/map/{job_id}',
        headers={'X-API-Key': 'your_api_key'}
    )
    data = result.json()

    if data['status'] == 'completed':
        print(f"Found {data['totalLinks']} URLs:")
        for link in data['links']:
            print(f"  {link}")
        break
    elif data['status'] == 'failed':
        print(f"Error: {data['error']}")
        break

    time.sleep(1)
```
</Tab>
<Tab value="JavaScript">
```javascript
const jobId = 'job_abc123xyz';

const poll = async () => {
  const res = await fetch(`https://api.anakin.io/v1/map/${jobId}`, {
    headers: { 'X-API-Key': 'your_api_key' }
  });
  const data = await res.json();

  if (data.status === 'completed') {
    console.log(`Found ${data.totalLinks} URLs:`);
    data.links.forEach(link => console.log(`  ${link}`));
  } else if (data.status === 'failed') {
    console.error(data.error);
  } else {
    setTimeout(poll, 1000);
  }
};

poll();
```
</Tab>
</Tabs>

For polling patterns, see the [Polling Jobs](/docs/api-reference/polling-jobs) reference.


---

# POST Submit Map Job (/docs/api-reference/map/submit-map-job)

<EndpointBanner method="POST" path="https://api.anakin.io/v1/map" />

Submit a URL for discovery. The job is processed asynchronously — use the returned `jobId` to [poll for results](/docs/api-reference/map/get-map-result).

---

### Request Body

```json
{
  "url": "https://example.com",
  "includeSubdomains": false,
  "limit": 100,
  "search": "",
  "useBrowser": false
}
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `url` **required** | string | The URL to discover links from. Must be valid HTTP/HTTPS. |
| `includeSubdomains` | boolean | Include links to subdomains (e.g. `blog.example.com`). Default `false`. |
| `limit` | number | Maximum URLs to return. Default `100`, max `5000`. |
| `search` | string | Filter discovered URLs — only return URLs containing this string. |
| `useBrowser` | boolean | Use headless Chrome to render the page before extracting links. Default `false`. Best for JS-heavy sites. |
| `sessionId` | string | Browser session ID for authenticated discovery. See [Browser Sessions](/docs/api-reference/browser-sessions). |

---

### Response

<StatusBadge code={202} text="Accepted" />

```json
{
  "jobId": "job_abc123xyz",
  "status": "pending"
}
```

The job is processed asynchronously. Use the `jobId` with [GET /v1/map/\{id\}](/docs/api-reference/map/get-map-result) to check status and retrieve results.

---

### Code Examples

<Tabs items={["cURL", "Python", "JavaScript"]}>
<Tab value="cURL">
```bash
curl -X POST https://api.anakin.io/v1/map \
  -H "X-API-Key: your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com",
    "includeSubdomains": false,
    "limit": 100
  }'
```
</Tab>
<Tab value="Python">
```python
import requests

response = requests.post(
    'https://api.anakin.io/v1/map',
    headers={'X-API-Key': 'your_api_key'},
    json={
        'url': 'https://example.com',
        'includeSubdomains': False,
        'limit': 100,
        'search': '/blog/'
    }
)

data = response.json()
print(f"Job submitted: {data['jobId']}")
```
</Tab>
<Tab value="JavaScript">
```javascript
const response = await fetch('https://api.anakin.io/v1/map', {
  method: 'POST',
  headers: {
    'X-API-Key': 'your_api_key',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    url: 'https://example.com',
    includeSubdomains: false,
    limit: 100,
    search: '/blog/'
  })
});

const data = await response.json();
console.log(data.jobId);
```
</Tab>
</Tabs>


---

# Polling Jobs (/docs/api-reference/polling-jobs)

Most AnakinScraper endpoints process jobs asynchronously. After submitting a request, you receive a `jobId` and poll a GET endpoint until the job completes.

---

### How it works

1. **Submit** a POST request — you receive a `jobId` with status `pending`
2. **Poll** the corresponding GET endpoint with the `jobId`
3. **Check** the `status` field — repeat until `completed` or `failed`

| Product | Submit | Poll |
|---------|--------|------|
| Wire | `POST /v1/holocron/task` | `GET /v1/holocron/jobs/{id}` |
| URL Scraper | `POST /v1/url-scraper` | `GET /v1/url-scraper/{id}` |
| URL Scraper (batch) | `POST /v1/url-scraper/batch` | `GET /v1/url-scraper/{id}` |
| Agentic Search | `POST /v1/agentic-search` | `GET /v1/agentic-search/{id}` |

> **Search API** (`POST /v1/search`) is synchronous — results are returned immediately, no polling needed.

---

### Recommended polling interval

| Product | Interval | Typical completion |
|---------|----------|--------------------|
| Wire | 2–5 seconds | 3–30 seconds |
| URL Scraper | 2–5 seconds | 3–15 seconds |
| Agentic Search | 10 seconds | 1–5 minutes |

---

### Polling examples

<Tabs items={["Python", "JavaScript"]}>
<Tab value="Python">
```python
import requests
import time

def poll_job(endpoint, job_id, api_key, interval=5, timeout=300):
    """Poll a job until completed or failed."""
    elapsed = 0
    while elapsed < timeout:
        result = requests.get(
            f'https://api.anakin.io/v1/{endpoint}/{job_id}',
            headers={'X-API-Key': api_key}
        )
        data = result.json()

        if data['status'] == 'completed':
            return data
        if data['status'] == 'failed':
            raise Exception(data.get('error', 'Job failed'))

        time.sleep(interval)
        elapsed += interval

    raise TimeoutError('Job polling timed out')

# URL Scraper
result = poll_job('url-scraper', 'job_abc123xyz', 'your_api_key', interval=3)
print(result['markdown'])

# Agentic Search (longer interval)
result = poll_job('agentic-search', 'agentic_abc123xyz', 'your_api_key', interval=10, timeout=600)
print(result['markdown'])
```
</Tab>
<Tab value="JavaScript">
```javascript
async function pollJob(endpoint, jobId, apiKey, interval = 5000, timeout = 300000) {
  const start = Date.now();

  while (Date.now() - start < timeout) {
    const res = await fetch(`https://api.anakin.io/v1/${endpoint}/${jobId}`, {
      headers: { 'X-API-Key': apiKey }
    });
    const data = await res.json();

    if (data.status === 'completed') return data;
    if (data.status === 'failed') throw new Error(data.error || 'Job failed');

    await new Promise(r => setTimeout(r, interval));
  }

  throw new Error('Job polling timed out');
}

// URL Scraper
const result = await pollJob('url-scraper', 'job_abc123xyz', 'your_api_key', 3000);
console.log(result.markdown);

// Agentic Search (longer interval)
const report = await pollJob('agentic-search', 'agentic_abc123xyz', 'your_api_key', 10000, 600000);
console.log(report.markdown);
```
</Tab>
</Tabs>

---

### Status values

| Status | Description |
|--------|-------------|
| `pending` | Job is queued, not yet started |
| `queued` | Job is waiting for a worker (agentic search only) |
| `processing` | Job is actively being processed |
| `completed` | Results are ready — stop polling |
| `failed` | Job encountered an error — stop polling |


---

# Search API (/docs/api-reference/search)

AI-powered web search that returns structured results with citations, snippets, and relevance scores. Results are returned immediately (synchronous).

### Features

- **Synchronous** — results returned instantly, no polling needed
- **AI-generated summaries** — get an answer alongside raw results
- **Citations with scores** — relevance-ranked results with snippets

### Endpoints

<EndpointCard method="POST" path="/v1/search" description="Search — perform an AI-powered web search" href="/docs/api-reference/search/search" />


---

# POST Search (/docs/api-reference/search/search)

<EndpointBanner method="POST" path="https://api.anakin.io/v1/search" />

Perform an AI-powered web search. Returns an AI-generated summary alongside structured search results with citations, snippets, and relevance scores. Results are returned synchronously.

---

### Request Body

```json
{
  "prompt": "latest AI developments 2024",
  "limit": 5
}
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `prompt` **required** | string | Search query or question |
| `limit` | number | Maximum number of results to return. Default `5`. |

---

### Response

<StatusBadge code={200} text="OK" />

```json
{
  "id": "63385e99-3ef5-4667-84a7-e7b398ec8e06",
  "results": [
    {
      "url": "https://example.com/article",
      "title": "AI Developments 2024",
      "snippet": "Recent advancements in AI...",
      "date": "2024-01-15",
      "last_updated": "2024-01-20"
    }
  ]
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier for the search request |
| `results` | array | Array of search result objects |
| `results[].url` | string | Source URL |
| `results[].title` | string | Page title |
| `results[].snippet` | string | Relevant text excerpt |
| `results[].date` | string | Publication date (when available) |
| `results[].last_updated` | string | Last updated date (when available) |

---

### Code Examples

<Tabs items={["cURL", "Python", "JavaScript"]}>
<Tab value="cURL">
```bash
curl -X POST https://api.anakin.io/v1/search \
  -H "X-API-Key: your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "latest AI developments 2024",
    "limit": 5
  }'
```
</Tab>
<Tab value="Python">
```python
import requests

response = requests.post(
    'https://api.anakin.io/v1/search',
    headers={'X-API-Key': 'your_api_key'},
    json={
        'prompt': 'latest AI developments 2024',
        'limit': 5
    }
)

data = response.json()
print(f"Search ID: {data['id']}")

for result in data['results']:
    print(f"\nTitle: {result['title']}")
    print(f"URL: {result['url']}")
    print(f"Snippet: {result['snippet']}")
```
</Tab>
<Tab value="JavaScript">
```javascript
const response = await fetch('https://api.anakin.io/v1/search', {
  method: 'POST',
  headers: {
    'X-API-Key': 'your_api_key',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    prompt: 'latest AI developments 2024',
    limit: 5
  })
});

const data = await response.json();
console.log(`Search ID: ${data.id}`);
data.results.forEach(r => console.log(r.title, r.url));
```
</Tab>
</Tabs>


---

# Supported Countries & Territories (/docs/api-reference/supported-countries)

Use the `country` parameter in your API requests to route through a specific location. Codes follow ISO 3166-1 alpha-2 (lowercase).

| Country | Code |
|---------|------|
| Afghanistan | `af` |
| Aland | `ax` |
| Albania | `al` |
| Algeria | `dz` |
| Andorra | `ad` |
| Angola | `ao` |
| Antarctica | `aq` |
| Antigua and Barbuda | `ag` |
| Argentina | `ar` |
| Armenia | `am` |
| Aruba | `aw` |
| Australia | `au` |
| Austria | `at` |
| Azerbaijan | `az` |
| Bahamas | `bs` |
| Bahrain | `bh` |
| Bangladesh | `bd` |
| Barbados | `bb` |
| Belarus | `by` |
| Belgium | `be` |
| Belize | `bz` |
| Benin | `bj` |
| Bermuda | `bm` |
| Bhutan | `bt` |
| Bolivia | `bo` |
| Bonaire | `bq` |
| Bosnia and Herzegovina | `ba` |
| Botswana | `bw` |
| Brazil | `br` |
| British Indian Ocean Territory | `io` |
| British Virgin Islands | `vg` |
| Brunei | `bn` |
| Bulgaria | `bg` |
| Burkina Faso | `bf` |
| Cambodia | `kh` |
| Cameroon | `cm` |
| Canada | `ca` |
| Cape Verde | `cv` |
| Cayman Islands | `ky` |
| Chile | `cl` |
| China | `cn` |
| Colombia | `co` |
| Cook Islands | `ck` |
| Costa Rica | `cr` |
| Croatia | `hr` |
| Cuba | `cu` |
| Curacao | `cw` |
| Cyprus | `cy` |
| Czech Republic | `cz` |
| Democratic Republic of the Congo | `cd` |
| Denmark | `dk` |
| Djibouti | `dj` |
| Dominican Republic | `do` |
| East Timor | `tl` |
| Ecuador | `ec` |
| Egypt | `eg` |
| El Salvador | `sv` |
| Estonia | `ee` |
| Eswatini | `sz` |
| Ethiopia | `et` |
| Faroe Islands | `fo` |
| Fiji | `fj` |
| Finland | `fi` |
| France | `fr` |
| French Guiana | `gf` |
| French Polynesia | `pf` |
| Gabon | `ga` |
| Georgia | `ge` |
| Germany | `de` |
| Ghana | `gh` |
| Gibraltar | `gi` |
| Greece | `gr` |
| Greenland | `gl` |
| Grenada | `gd` |
| Guadeloupe | `gp` |
| Guam | `gu` |
| Guatemala | `gt` |
| Guernsey | `gg` |
| Guinea | `gn` |
| Guyana | `gy` |
| Haiti | `ht` |
| Honduras | `hn` |
| Hong Kong | `hk` |
| Hungary | `hu` |
| Iceland | `is` |
| India | `in` |
| Indonesia | `id` |
| Iran | `ir` |
| Iraq | `iq` |
| Ireland | `ie` |
| Isle of Man | `im` |
| Israel | `il` |
| Italy | `it` |
| Ivory Coast | `ci` |
| Jamaica | `jm` |
| Japan | `jp` |
| Jersey | `je` |
| Jordan | `jo` |
| Kazakhstan | `kz` |
| Kenya | `ke` |
| Kosovo | `xk` |
| Kuwait | `kw` |
| Kyrgyzstan | `kg` |
| Laos | `la` |
| Latvia | `lv` |
| Lebanon | `lb` |
| Lesotho | `ls` |
| Liberia | `lr` |
| Libya | `ly` |
| Liechtenstein | `li` |
| Lithuania | `lt` |
| Luxembourg | `lu` |
| Macao | `mo` |
| Madagascar | `mg` |
| Malawi | `mw` |
| Malaysia | `my` |
| Maldives | `mv` |
| Mali | `ml` |
| Malta | `mt` |
| Martinique | `mq` |
| Mauritania | `mr` |
| Mauritius | `mu` |
| Mexico | `mx` |
| Micronesia | `fm` |
| Moldova | `md` |
| Monaco | `mc` |
| Mongolia | `mn` |
| Montenegro | `me` |
| Montserrat | `ms` |
| Morocco | `ma` |
| Mozambique | `mz` |
| Myanmar (Burma) | `mm` |
| Namibia | `na` |
| Nepal | `np` |
| Netherlands | `nl` |
| New Caledonia | `nc` |
| New Zealand | `nz` |
| Nicaragua | `ni` |
| Niger | `ne` |
| Nigeria | `ng` |
| North Macedonia | `mk` |
| Northern Mariana Islands | `mp` |
| Norway | `no` |
| Oman | `om` |
| Pakistan | `pk` |
| Palestine | `ps` |
| Panama | `pa` |
| Papua New Guinea | `pg` |
| Paraguay | `py` |
| Peru | `pe` |
| Philippines | `ph` |
| Poland | `pl` |
| Portugal | `pt` |
| Puerto Rico | `pr` |
| Qatar | `qa` |
| Republic of the Congo | `cg` |
| Reunion | `re` |
| Romania | `ro` |
| Russia | `ru` |
| Rwanda | `rw` |
| Saint Kitts and Nevis | `kn` |
| Saint Lucia | `lc` |
| Saint Martin | `mf` |
| Saint Vincent and the Grenadines | `vc` |
| Sao Tome and Principe | `st` |
| Saudi Arabia | `sa` |
| Senegal | `sn` |
| Serbia | `rs` |
| Sierra Leone | `sl` |
| Singapore | `sg` |
| Sint Maarten | `sx` |
| Slovakia | `sk` |
| Slovenia | `si` |
| Solomon Islands | `sb` |
| Somalia | `so` |
| South Africa | `za` |
| South Korea | `kr` |
| Spain | `es` |
| Sri Lanka | `lk` |
| Suriname | `sr` |
| Sweden | `se` |
| Switzerland | `ch` |
| Syria | `sy` |
| Taiwan | `tw` |
| Tajikistan | `tj` |
| Tanzania | `tz` |
| Thailand | `th` |
| Togo | `tg` |
| Tonga | `to` |
| Trinidad and Tobago | `tt` |
| Tunisia | `tn` |
| Turkey | `tr` |
| Turks and Caicos Islands | `tc` |
| U.S. Virgin Islands | `vi` |
| Uganda | `ug` |
| Ukraine | `ua` |
| United Arab Emirates | `ae` |
| United Kingdom | `gb` |
| United States | `us` |
| Uruguay | `uy` |
| Uzbekistan | `uz` |
| Vanuatu | `vu` |
| Venezuela | `ve` |
| Vietnam | `vn` |
| Yemen | `ye` |
| Zambia | `zm` |
| Zimbabwe | `zw` |

---

### Usage Example

```json
{
  "url": "https://example.com",
  "country": "jp"
}
```

This routes the request through a residential proxy in Japan.

---

### Programmatic Access

You can also fetch this list programmatically:

```bash
curl https://api.anakin.io/v1/countries
```

Returns a JSON array of all supported countries with their codes.


---

# URL Scraper (/docs/api-reference/url-scraper)

The URL Scraper is the core scraping API. Submit any URL and receive the scraped HTML, markdown, and optionally AI-extracted JSON data. Supports single URL and batch (up to 10 URLs) modes.

### Features

- **Single & batch** scraping in one API
- **30x faster** with intelligent caching
- **Zero blocks** with anti-detection and proxy routing across [207 countries and territories](/docs/api-reference/supported-countries)
- **AI JSON extraction** — structured data from any page
- **Browser mode** — headless Chrome for JS-heavy sites and SPAs

### Endpoints

<EndpointCard method="POST" path="/v1/url-scraper" description="Submit Scrape Job — scrape a single URL" href="/docs/api-reference/url-scraper/submit-scrape-job" />

<EndpointCard method="POST" path="/v1/url-scraper/batch" description="Batch URL Scraping — scrape up to 10 URLs" href="/docs/api-reference/url-scraper/batch-url-scraping" />

<EndpointCard method="GET" path="/v1/url-scraper/{id}" description="Get Job Status & Results — poll for results" href="/docs/api-reference/url-scraper/get-job-status" />


---

# POST Scrape URLs (/docs/api-reference/url-scraper/batch-url-scraping)

<EndpointBanner method="POST" path="https://api.anakin.io/v1/url-scraper/batch" />

Submit up to 10 URLs for scraping in a single request. All URLs are processed in parallel. Use the returned `jobId` to [poll for results](/docs/api-reference/url-scraper/get-job-status).

---

### Request Body

```json
{
  "urls": [
    "https://example.com/page1",
    "https://example.com/page2",
    "https://example.com/page3"
  ],
  "country": "us",
  "useBrowser": false,
  "generateJson": false
}
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `urls` **required** | string[] | Array of URLs to scrape (1–10). |
| `country` | string | Country code for proxy routing. Default `"us"`. See [Supported Countries](/docs/api-reference/supported-countries) (207 locations). |
| `useBrowser` | boolean | Use headless Chrome with Playwright. Default `false`. |
| `generateJson` | boolean | AI-extract structured JSON from the content. Default `false`. |

---

### Response

<StatusBadge code={202} text="Accepted" />

```json
{
  "jobId": "batch_abc123",
  "status": "pending"
}
```

You receive a parent job ID that tracks overall batch progress. Use [GET /v1/url-scraper/\{id\}](/docs/api-reference/url-scraper/get-job-status) to poll for results — the response will include a `results` array with individual URL outcomes.

---

### Code Examples

<Tabs items={["cURL", "Python", "JavaScript"]}>
<Tab value="cURL">
```bash
curl -X POST https://api.anakin.io/v1/url-scraper/batch \
  -H "X-API-Key: your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "urls": [
      "https://example.com/page1",
      "https://example.com/page2",
      "https://example.com/page3"
    ],
    "country": "us",
    "useBrowser": false,
    "generateJson": true
  }'
```
</Tab>
<Tab value="Python">
```python
import requests

response = requests.post(
    'https://api.anakin.io/v1/url-scraper/batch',
    headers={'X-API-Key': 'your_api_key'},
    json={
        'urls': [
            'https://example.com/page1',
            'https://example.com/page2',
            'https://example.com/page3'
        ],
        'country': 'us',
        'useBrowser': False,
        'generateJson': True
    }
)

data = response.json()
print(f"Batch job submitted: {data['jobId']}")
```
</Tab>
<Tab value="JavaScript">
```javascript
const response = await fetch('https://api.anakin.io/v1/url-scraper/batch', {
  method: 'POST',
  headers: {
    'X-API-Key': 'your_api_key',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    urls: [
      'https://example.com/page1',
      'https://example.com/page2',
      'https://example.com/page3'
    ],
    country: 'us',
    useBrowser: false,
    generateJson: true
  })
});

const data = await response.json();
console.log(data.jobId);
```
</Tab>
</Tabs>


---

# GET Get Results (/docs/api-reference/url-scraper/get-job-status)

<EndpointBanner method="GET" path="https://api.anakin.io/v1/url-scraper/{id}" />

Retrieve the status and results of a scrape job. Use this to poll for completion after submitting a [single URL](/docs/api-reference/url-scraper/submit-scrape-job) or [batch](/docs/api-reference/url-scraper/batch-url-scraping) scrape request.

---

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` **required** | string | The job ID returned from the submit endpoint |

---

### Response — Single URL Job

<StatusBadge code={200} text="OK" />

```json
{
  "id": "job_abc123xyz",
  "status": "completed",
  "url": "https://example.com",
  "jobType": "url_scraper",
  "country": "us",
  "html": "<html>...</html>",
  "cleanedHtml": "<div>...</div>",
  "markdown": "# Page content...",
  "generatedJson": { "data": {} },
  "cached": false,
  "error": null,
  "createdAt": "2024-01-01T12:00:00Z",
  "completedAt": "2024-01-01T12:00:05Z",
  "durationMs": 5000
}
```

### Response — Batch Job

<StatusBadge code={200} text="OK" />

```json
{
  "id": "batch_abc123",
  "status": "completed",
  "jobType": "batch_url_scraper",
  "country": "us",
  "urls": ["https://example.com/page1", "https://example.com/page2"],
  "results": [
    {
      "index": 0,
      "url": "https://example.com/page1",
      "status": "completed",
      "html": "<html>...</html>",
      "cleanedHtml": "<div>...</div>",
      "markdown": "# Content...",
      "generatedJson": { "data": {} },
      "cached": false,
      "durationMs": 3000
    },
    {
      "index": 1,
      "url": "https://example.com/page2",
      "status": "failed",
      "error": "Connection timeout",
      "durationMs": 5000
    }
  ],
  "createdAt": "2024-01-01T12:00:00Z",
  "completedAt": "2024-01-01T12:00:10Z",
  "durationMs": 10000
}
```

---

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `status` | string | `pending`, `processing`, `completed`, or `failed` |
| `html` | string | Raw HTML content. Only present when completed. |
| `cleanedHtml` | string | Cleaned HTML with non-essential elements removed. |
| `markdown` | string | Markdown version of the content. |
| `generatedJson` | object | AI-extracted structured JSON. Only when `generateJson: true` was set. |
| `cached` | boolean | `true` if served from cache. |
| `error` | string | Error message. Only present when failed. |
| `durationMs` | number | Processing time in milliseconds. |
| `results` | array | Batch jobs only — array of per-URL results. |

### Job Statuses

| Status | Description |
|--------|-------------|
| `pending` | Job is queued |
| `processing` | Job is being executed |
| `completed` | Results are ready |
| `failed` | Job encountered an error |

---

### Code Examples

<Tabs items={["cURL", "Python", "JavaScript"]}>
<Tab value="cURL">
```bash
curl -X GET https://api.anakin.io/v1/url-scraper/job_abc123xyz \
  -H "X-API-Key: your_api_key"
```
</Tab>
<Tab value="Python">
```python
import requests

job_id = "job_abc123xyz"

result = requests.get(
    f'https://api.anakin.io/v1/url-scraper/{job_id}',
    headers={'X-API-Key': 'your_api_key'}
)

data = result.json()
if data['status'] == 'completed':
    print(data['markdown'])
```
</Tab>
<Tab value="JavaScript">
```javascript
const jobId = 'job_abc123xyz';

const res = await fetch(`https://api.anakin.io/v1/url-scraper/${jobId}`, {
  headers: { 'X-API-Key': 'your_api_key' }
});
const data = await res.json();

if (data.status === 'completed') {
  console.log(data.markdown);
}
```
</Tab>
</Tabs>

For polling patterns, see the [Polling Jobs](/docs/api-reference/polling-jobs) reference.



---

# POST Scrape URL (/docs/api-reference/url-scraper/submit-scrape-job)

<EndpointBanner method="POST" path="https://api.anakin.io/v1/url-scraper" />

Submit a single URL for scraping. The job is processed asynchronously — use the returned `jobId` to [poll for results](/docs/api-reference/url-scraper/get-job-status).

---

### Request Body

```json
{
  "url": "https://example.com",
  "country": "us",
  "useBrowser": false,
  "generateJson": false
}
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `url` **required** | string | The URL to scrape. Must be valid HTTP/HTTPS. |
| `country` | string | Country code for proxy routing. Default `"us"`. See [Supported Countries](/docs/api-reference/supported-countries) (207 locations). |
| `useBrowser` | boolean | Use headless Chrome with Playwright. Default `false`. Best for JS-heavy sites. |
| `generateJson` | boolean | AI-extract structured JSON from the content. Default `false`. |
| `sessionId` | string | Browser session ID for scraping authenticated pages. See [Browser Sessions](/docs/api-reference/browser-sessions). |

---

### Response

<StatusBadge code={202} text="Accepted" />

```json
{
  "jobId": "job_abc123xyz",
  "status": "pending"
}
```

The job is processed asynchronously. Use the `jobId` with [GET /v1/url-scraper/\{id\}](/docs/api-reference/url-scraper/get-job-status) to check status and retrieve results.

---

### Code Examples

<Tabs items={["cURL", "Python", "JavaScript"]}>
<Tab value="cURL">
```bash
curl -X POST https://api.anakin.io/v1/url-scraper \
  -H "X-API-Key: your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com",
    "country": "us",
    "useBrowser": false,
    "generateJson": false
  }'
```
</Tab>
<Tab value="Python">
```python
import requests

response = requests.post(
    'https://api.anakin.io/v1/url-scraper',
    headers={'X-API-Key': 'your_api_key'},
    json={
        'url': 'https://example.com',
        'country': 'us',
        'useBrowser': False,
        'generateJson': True
    }
)

data = response.json()
print(f"Job submitted: {data['jobId']}")
```
</Tab>
<Tab value="JavaScript">
```javascript
const response = await fetch('https://api.anakin.io/v1/url-scraper', {
  method: 'POST',
  headers: {
    'X-API-Key': 'your_api_key',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    url: 'https://example.com',
    country: 'us',
    useBrowser: false,
    generateJson: true
  })
});

const data = await response.json();
console.log(data.jobId);
```
</Tab>
</Tabs>


---

# Overview (/docs/documentation)

Scrape any website, extract structured data with AI, and search the web — all through a simple REST API.

### Products

<CardGrid>
  <ProductCard title="Wire" description="Pre-built actions for popular websites" href="/docs/api-reference/holocron" />
  <ProductCard title="URL Scraper" description="Scrape single or batch URLs with caching and AI extraction" href="/docs/api-reference/url-scraper" />
  <ProductCard title="Search API" description="AI-powered web search with citations (synchronous)" href="/docs/api-reference/search" />
  <ProductCard title="Agentic Search" description="Multi-stage automated research pipeline" href="/docs/api-reference/agentic-search" />
</CardGrid>

### Key features

- **Zero blocks** — anti-detection and proxy routing across [207 countries and territories](/docs/api-reference/supported-countries)
- **Async job pattern** — submit a job, poll for results when ready
- **AI extraction** — structured JSON from any page with `generateJson: true`
- **Headless browser** — JS-heavy sites and SPAs with `useBrowser: true`
- **Intelligent caching** — 30x faster on repeat requests

### Use cases

<CardGrid>
  <ProductCard title="AI & RAG Pipelines" description="Feed web data into LLMs and AI assistants" href="/docs/documentation/use-cases/ai-rag" />
  <ProductCard title="Deep Research" description="Multi-source automated research pipelines" href="/docs/documentation/use-cases/deep-research" />
  <ProductCard title="Price Monitoring" description="Track pricing and product changes" href="/docs/documentation/use-cases/price-monitoring" />
  <ProductCard title="Lead Generation" description="Extract leads from company websites" href="/docs/documentation/use-cases/lead-generation" />
</CardGrid>

See all [use cases](/docs/documentation/use-cases) for more examples.

Get started with the [Quick Start](/docs/documentation/getting-started) guide.


---

# Overview (/docs/documentation/getting-started)

Get your API key and scrape your first page — choose the path that fits your workflow.

---

## 1. Get your API key

Sign up at the [Dashboard](/dashboard) — it's free, no credit card required. You start with **500 credits**.

Copy your API key from the dashboard. It starts with `ak-`.

---

## 2. Choose your path

<CardGrid>
  <ProductCard title="Quick Start: CLI" description="Install the CLI and scrape from your terminal in 2 minutes. Best for trying things out fast." href="/docs/documentation/getting-started/cli" />
</CardGrid>

### Pick your language

Native HTTP client examples — minimal or zero dependencies, copy-pasteable.

<CardGrid>
  <ProductCard title="cURL" description="Talk to the API directly from a shell script or CI pipeline. No language runtime needed." href="/docs/documentation/getting-started/curl" />
  <ProductCard title="Python" description="The requests library. Drop-in for Django, FastAPI, Celery, and notebook workflows." href="/docs/documentation/getting-started/python" />
  <ProductCard title="Node.js" description="Built-in fetch, no npm install. Works with Next.js, Express, NestJS, and TypeScript." href="/docs/documentation/getting-started/node" />
  <ProductCard title="Go" description="Standard library net/http. Ideal for backends and CLI tools." href="/docs/documentation/getting-started/go" />
  <ProductCard title="Ruby" description="Stdlib net/http + json. Drop-in for Rails service objects and Sidekiq jobs." href="/docs/documentation/getting-started/ruby" />
  <ProductCard title="PHP" description="Built-in cURL extension. Works in Laravel, Symfony, and plain PHP 8+." href="/docs/documentation/getting-started/php" />
  <ProductCard title="Java" description="Java 11+ HttpClient with Jackson. Plugs into Spring Boot, Quarkus, Micronaut." href="/docs/documentation/getting-started/java" />
  <ProductCard title="Rust" description="Lightweight ureq crate, no async runtime needed." href="/docs/documentation/getting-started/rust" />
  <ProductCard title="Elixir" description="Req — modern Elixir HTTP client, bundled with Phoenix 1.7+." href="/docs/documentation/getting-started/elixir" />
  <ProductCard title=".NET" description="Built-in HttpClient and System.Text.Json. Works with .NET 6+ and ASP.NET Core." href="/docs/documentation/getting-started/dotnet" />
</CardGrid>

---

## Products

| I want to... | Product |
|---|---|
| Run pre-built website actions | [Wire](/docs/api-reference/holocron) |
| Extract content from a URL | [URL Scraper](/docs/api-reference/url-scraper) |
| Scrape multiple URLs at once | [URL Scraper (batch)](/docs/api-reference/url-scraper/batch-url-scraping) |
| Search the web with AI | [Search API](/docs/api-reference/search) |
| Deep multi-source research | [Agentic Search](/docs/api-reference/agentic-search) |
| Scrape login-protected pages | [Browser Sessions](/docs/api-reference/browser-sessions) |

See [Pricing & Credits](/docs/documentation/pricing) for costs per operation.

---

## Quick reference

| | |
|---|---|
| **Base URL** | `https://api.anakin.io/v1` |
| **Auth header** | `X-API-Key: ak-your-key-here` |
| **Free credits** | 500 on signup |
| **Rate limits** | 60/min per scraping/search endpoint, 20/min Wire tasks, 10/min AI eval — [details](/docs/documentation/rate-limits) |
| **Failed jobs** | Not charged — credits deducted only on success |

{/* sync-flow validation 2026-04-27 — safe to remove */}


---

# CLI (/docs/documentation/getting-started/cli)

The CLI is the fastest way to use AnakinScraper. It handles job submission, polling, and output formatting for you.

---

## Install the CLI

Requires Python 3.10+.

<Tabs items={["pip", "pipx"]}>
<Tab value="pip">
```bash
pip install anakin-cli
```
</Tab>
<Tab value="pipx">
```bash
pipx install anakin-cli
```
</Tab>
</Tabs>

---

## Authenticate

Save your API key (you only need to do this once):

```bash
anakin login --api-key "ak-your-key-here"
```

Verify it worked:

```bash
anakin status
```

---

## Scrape your first page

```bash
anakin scrape "https://example.com"
```

The CLI submits the job, polls until it's done, and prints the markdown output to your terminal. That's it.

**Save to a file:**

```bash
anakin scrape "https://example.com" -o page.md
```

---

## Go further

### Extract structured JSON with AI

```bash
anakin scrape "https://news.ycombinator.com" --format json
```

AI automatically extracts structured data from the page — no schema needed.

### Scrape JavaScript-heavy sites

```bash
anakin scrape "https://example.com/spa" --browser
```

Enables full browser rendering for SPAs and dynamic content. Only use when needed — standard scraping is faster.

### Batch scrape multiple URLs

```bash
anakin scrape-batch "https://a.com" "https://b.com" "https://c.com"
```

Scrape up to 10 URLs in parallel with a single command.

### Search the web with AI

```bash
anakin search "best web scraping libraries 2025"
```

Returns AI-powered search results instantly.

### Deep research

```bash
anakin research "comparison of web frameworks 2025" -o report.json
```

Runs a multi-stage AI research pipeline across 20+ sources. Takes 1–5 minutes.

---

## Next steps

<CardGrid>
  <ProductCard title="CLI Commands" description="Full reference for all CLI commands, flags, and options" href="/docs/sdks/cli/commands" />
  <ProductCard title="CLI Examples" description="Real-world recipes: piping, scripting, and batch workflows" href="/docs/sdks/cli/examples" />
  <ProductCard title="API Reference" description="Full endpoint docs if you want to use the API directly" href="/docs/api-reference" />
  <ProductCard title="Use Cases" description="RAG pipelines, lead gen, price monitoring, and more" href="/docs/documentation/use-cases" />
</CardGrid>


---

# cURL (/docs/documentation/getting-started/curl)

Hit the AnakinScraper REST API directly with `curl`. Useful for quick tests, shell scripts, CI pipelines, or any environment without a language runtime.

---

## Authentication

Set your API key as an environment variable. Get a key from the [Dashboard](/dashboard).

```bash
export ANAKIN_API_KEY=ak-your-key-here
```

The base URL is `https://api.anakin.io/v1`. Every request authenticates via the `X-API-Key` header.

---

## Install

`curl` is preinstalled on macOS, Linux, and most CI runners. The polling script below also uses `jq` for JSON parsing — install it once if you don't have it:

```bash
# macOS
brew install jq

# Debian / Ubuntu
sudo apt-get install jq
```

---

## Submit a single request

Fire-and-forget submit, useful when you'll poll separately or check results later in the dashboard:

```bash
curl -X POST https://api.anakin.io/v1/url-scraper \
  -H "X-API-Key: $ANAKIN_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'
```

Response:

```json
{
  "jobId": "job_abc123xyz",
  "status": "pending"
}
```

Poll the job:

```bash
curl https://api.anakin.io/v1/url-scraper/job_abc123xyz \
  -H "X-API-Key: $ANAKIN_API_KEY"
```

---

## Submit + poll in one script

Save as `scrape.sh` (`chmod +x scrape.sh`):

```bash
#!/bin/bash
set -e
: "${ANAKIN_API_KEY:?ANAKIN_API_KEY is not set}"

BASE="https://api.anakin.io/v1"
URL="${1:-https://example.com}"

submitted=$(curl -sS -X POST "$BASE/url-scraper" \
  -H "X-API-Key: $ANAKIN_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"url\": \"$URL\"}")
job_id=$(echo "$submitted" | jq -r '.jobId')

for _ in $(seq 1 60); do
  job=$(curl -sS "$BASE/url-scraper/$job_id" -H "X-API-Key: $ANAKIN_API_KEY") \
    || { sleep 3; continue; }     # retry transient errors
  status=$(echo "$job" | jq -r '.status')
  case "$status" in
    completed) echo "$job" | jq -r '.markdown'; exit 0 ;;
    failed)    echo "scrape failed: $(echo "$job" | jq -r '.error')" >&2; exit 1 ;;
  esac
  sleep 3
done
echo "timed out after 3 minutes" >&2
exit 1
```

Run it:

```bash
./scrape.sh https://example.com
```

---

## What this does

1. Submits the URL to `/url-scraper` and gets back a `jobId`.
2. Polls `/url-scraper/{jobId}` every 3 seconds (up to 60 attempts = 3 minutes).
3. Retries transient `curl` errors silently — only surfaces real failures.
4. Prints the final `markdown` when the job completes.

Most jobs finish in 3–15 seconds.

---

## Go further

### Extract structured JSON with AI

Replace the submit body with `generateJson: true` to have AI return structured data:

```bash
curl -sS -X POST "$BASE/url-scraper" \
  -H "X-API-Key: $ANAKIN_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://news.ycombinator.com", "generateJson": true}'
```

The completed response includes a `generatedJson` field with structured data inferred from the page.

### Scrape JavaScript-heavy sites

For SPAs and dynamically-loaded pages, add `useBrowser: true`:

```bash
curl -sS -X POST "$BASE/url-scraper" \
  -H "X-API-Key: $ANAKIN_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com/spa", "useBrowser": true}'
```

> Only use browser mode when needed — standard scraping is faster and cheaper.

### Search the web with AI

The Search API is **synchronous** — no polling needed:

```bash
curl -sS -X POST https://api.anakin.io/v1/search \
  -H "X-API-Key: $ANAKIN_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "best web scraping libraries 2025"}'
```

---

## Use it from CI

Drop the polling script into a GitHub Actions step or a cron job. The `ANAKIN_API_KEY` should come from a secret store (GitHub Secrets, Vault, Doppler, etc.) — never hard-code it:

```yaml
# .github/workflows/scrape.yml
- name: Scrape pricing page
  env:
    ANAKIN_API_KEY: ${{ secrets.ANAKIN_API_KEY }}
  run: ./scrape.sh https://example.com/pricing > pricing.md
```

---

## Next steps

<CardGrid>
  <ProductCard title="API Reference" description="Full endpoint docs with parameters and response schemas" href="/docs/api-reference" />
  <ProductCard title="Polling Jobs" description="Async job patterns, intervals, and production polling code" href="/docs/api-reference/polling-jobs" />
  <ProductCard title="Pricing & Credits" description="Credit costs per operation and plan details" href="/docs/documentation/pricing" />
  <ProductCard title="Use Cases" description="RAG pipelines, lead gen, price monitoring, and more" href="/docs/documentation/use-cases" />
</CardGrid>


---

# .NET (/docs/documentation/getting-started/dotnet)

Submit a scrape, poll for the result, and handle transient errors — using the standard library's `HttpClient` and `System.Text.Json`.

---

## Authentication

Set your API key as an environment variable. Get a key from the [Dashboard](/dashboard).

```bash
export ANAKIN_API_KEY=ak-your-key-here
```

The base URL is `https://api.anakin.io/v1`. Every request authenticates via the `X-API-Key` header.

---

## Install

No NuGet packages needed — `HttpClient`, `System.Net.Http.Json`, and `System.Text.Json` are all in the .NET 6+ standard library. Create a console project:

```bash
dotnet new console -o quickstart
cd quickstart
```

---

## Scrape a page

Replace `Program.cs` with:

```csharp
using System.Net.Http.Json;
using System.Text.Json.Nodes;

const string Base = "https://api.anakin.io/v1";
var apiKey = Environment.GetEnvironmentVariable("ANAKIN_API_KEY")
    ?? throw new InvalidOperationException("ANAKIN_API_KEY is not set");

using var http = new HttpClient { Timeout = TimeSpan.FromSeconds(30) };
http.DefaultRequestHeaders.Add("X-API-Key", apiKey);

async Task<JsonNode?> Request(HttpMethod method, string path, object? body = null)
{
    var req = new HttpRequestMessage(method, Base + path);
    if (body != null) req.Content = JsonContent.Create(body);
    try
    {
        var resp = await http.SendAsync(req);
        return await resp.Content.ReadFromJsonAsync<JsonNode>();
    }
    catch (HttpRequestException) { return null; } // caller retries on null
}

var submitted = await Request(HttpMethod.Post, "/url-scraper",
    new { url = "https://example.com" });
var jobId = submitted!["jobId"]!.ToString();

for (int i = 0; i < 60; i++)
{
    var job = await Request(HttpMethod.Get, $"/url-scraper/{jobId}");
    if (job == null)
    {
        await Task.Delay(3000); // retry transient errors
        continue;
    }
    var status = job["status"]!.ToString();
    if (status == "completed")
    {
        Console.WriteLine(job["markdown"]);
        return;
    }
    if (status == "failed")
    {
        throw new Exception($"scrape failed: {job["error"]}");
    }
    await Task.Delay(3000);
}
throw new TimeoutException("timed out after 3 minutes");
```

Run it:

```bash
dotnet run
```

---

## What this does

1. Submits `https://example.com` to `/url-scraper` and gets back a `jobId`.
2. Polls `/url-scraper/{jobId}` every 3 seconds (up to 60 attempts = 3 minutes).
3. Retries transient `HttpRequestException` errors silently — only surfaces real failures.
4. Prints the final `markdown` when the job completes.

Most jobs finish in 3–15 seconds.

---

## Go further

### Extract structured JSON with AI

Replace the submit body with `generateJson: true` to have AI return structured data:

```csharp
var submitted = await Request(HttpMethod.Post, "/url-scraper", new {
    url          = "https://news.ycombinator.com",
    generateJson = true
});
```

The completed response includes a `generatedJson` field with structured data inferred from the page.

### Scrape JavaScript-heavy sites

For SPAs and dynamically-loaded pages, add `useBrowser: true`:

```csharp
var submitted = await Request(HttpMethod.Post, "/url-scraper", new {
    url        = "https://example.com/spa",
    useBrowser = true
});
```

> Only use browser mode when needed — standard scraping is faster and cheaper.

---

## Use it from ASP.NET Core

Register a typed `HttpClient` via `IHttpClientFactory` to get connection pooling and DI for free, then call from a hosted background service (`IHostedService`) or a Hangfire/Quartz job — the polling loop awaits up to 3 minutes per URL, so background execution is the natural fit.

```csharp
// Program.cs
builder.Services.AddHttpClient("anakin", c => {
    c.BaseAddress = new Uri("https://api.anakin.io/v1");
    c.DefaultRequestHeaders.Add("X-API-Key",
        builder.Configuration["ANAKIN_API_KEY"]);
    c.Timeout = TimeSpan.FromSeconds(30);
});
```

---

## Next steps

<CardGrid>
  <ProductCard title="API Reference" description="Full endpoint docs with parameters and response schemas" href="/docs/api-reference" />
  <ProductCard title="Polling Jobs" description="Async job patterns, intervals, and production polling code" href="/docs/api-reference/polling-jobs" />
  <ProductCard title="Pricing & Credits" description="Credit costs per operation and plan details" href="/docs/documentation/pricing" />
  <ProductCard title="Use Cases" description="RAG pipelines, lead gen, price monitoring, and more" href="/docs/documentation/use-cases" />
</CardGrid>


---

# Elixir (/docs/documentation/getting-started/elixir)

Submit a scrape, poll for the result, and handle transient errors — using `Req`, the modern Elixir HTTP client (already bundled with Phoenix 1.7+).

---

## Authentication

Set your API key as an environment variable. Get a key from the [Dashboard](/dashboard).

```bash
export ANAKIN_API_KEY=ak-your-key-here
```

The base URL is `https://api.anakin.io/v1`. Every request authenticates via the `x-api-key` header.

---

## Install

`Req` is the de facto modern HTTP client in Elixir — JSON encode/decode, retry, and connection pooling all built in. Phoenix 1.7+ already bundles it; standalone projects need one dep:

Add to `mix.exs`:

```elixir
defp deps do
  [
    {:req, "~> 0.5"}
  ]
end
```

Then:

```bash
mix deps.get
```

---

## Scrape a page

Save as `lib/quickstart.ex`:

```elixir
defmodule Quickstart do
  @base "https://api.anakin.io/v1"

  defp api_key do
    System.get_env("ANAKIN_API_KEY") || raise "ANAKIN_API_KEY is not set"
  end

  defp request(method, path, body \\ nil) do
    Req.request(
      method: method,
      url: @base <> path,
      headers: [{"x-api-key", api_key()}, {"content-type", "application/json"}],
      json: body,
      receive_timeout: 30_000
    )
  end

  def scrape(url) do
    {:ok, %{body: submitted}} = request(:post, "/url-scraper", %{url: url})
    job_id = submitted["jobId"]

    Enum.reduce_while(1..60, nil, fn _, _ ->
      case request(:get, "/url-scraper/#{job_id}") do
        {:ok, %{body: %{"status" => "completed"} = job}} ->
          {:halt, job}
        {:ok, %{body: %{"status" => "failed", "error" => err}}} ->
          raise "scrape failed: #{err}"
        _ ->
          Process.sleep(3_000) # retry transient errors
          {:cont, nil}
      end
    end)
    |> case do
      nil -> raise "timed out after 3 minutes"
      job -> job
    end
  end
end

job = Quickstart.scrape("https://example.com")
IO.puts(job["markdown"])
```

Run it:

```bash
mix run lib/quickstart.ex
```

---

## What this does

1. Submits `https://example.com` to `/url-scraper` and gets back a `jobId`.
2. Polls `/url-scraper/{jobId}` every 3 seconds (up to 60 attempts = 3 minutes).
3. Retries transient network errors silently — only surfaces real failures.
4. Prints the final `markdown` when the job completes.

Most jobs finish in 3–15 seconds.

---

## Go further

### Extract structured JSON with AI

Replace the submit body with `generateJson: true` to have AI return structured data:

```elixir
{:ok, %{body: submitted}} = request(:post, "/url-scraper", %{
  url: "https://news.ycombinator.com",
  generateJson: true
})
```

The completed response includes a `generatedJson` field with structured data inferred from the page.

### Scrape JavaScript-heavy sites

For SPAs and dynamically-loaded pages, add `useBrowser: true`:

```elixir
{:ok, %{body: submitted}} = request(:post, "/url-scraper", %{
  url: "https://example.com/spa",
  useBrowser: true
})
```

> Only use browser mode when needed — standard scraping is faster and cheaper.

---

## Use it from Phoenix

Wrap `scrape/1` in a `GenServer` or schedule via `Oban` — the polling loop blocks for up to 3 minutes per URL. For Phoenix LiveView, kick off scraping in a `Task.async/1` and update the LiveView when the result arrives.

---

## Next steps

<CardGrid>
  <ProductCard title="API Reference" description="Full endpoint docs with parameters and response schemas" href="/docs/api-reference" />
  <ProductCard title="Polling Jobs" description="Async job patterns, intervals, and production polling code" href="/docs/api-reference/polling-jobs" />
  <ProductCard title="Pricing & Credits" description="Credit costs per operation and plan details" href="/docs/documentation/pricing" />
  <ProductCard title="Use Cases" description="RAG pipelines, lead gen, price monitoring, and more" href="/docs/documentation/use-cases" />
</CardGrid>


---

# Go (/docs/documentation/getting-started/go)

Submit a scrape, poll for the result, and handle transient errors — all with `net/http` from Go's standard library.

---

## Authentication

Set your API key as an environment variable. Get a key from the [Dashboard](/dashboard).

```bash
export ANAKIN_API_KEY=ak-your-key-here
```

The base URL is `https://api.anakin.io/v1`. Every request authenticates via the `X-API-Key` header.

---

## Install

No third-party packages needed — everything is in the standard library. Just initialize a module:

```bash
go mod init quickstart
```

---

## Scrape a page

Save as `main.go`:

```go
package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"time"
)

func main() {
	apiKey := os.Getenv("ANAKIN_API_KEY")
	if apiKey == "" {
		panic("ANAKIN_API_KEY is not set")
	}
	base := "https://api.anakin.io/v1"
	client := &http.Client{Timeout: 30 * time.Second}

	do := func(method, path string, body any) map[string]any {
		var buf bytes.Buffer
		if body != nil {
			json.NewEncoder(&buf).Encode(body)
		}
		req, _ := http.NewRequest(method, base+path, &buf)
		req.Header.Set("X-API-Key", apiKey)
		req.Header.Set("Content-Type", "application/json")
		resp, err := client.Do(req)
		if err != nil {
			return nil // caller retries on nil
		}
		defer resp.Body.Close()
		var out map[string]any
		json.NewDecoder(resp.Body).Decode(&out)
		return out
	}

	submitted := do("POST", "/url-scraper", map[string]string{"url": "https://example.com"})
	jobID := submitted["jobId"].(string)

	for i := 0; i < 60; i++ {
		job := do("GET", "/url-scraper/"+jobID, nil)
		if job == nil {
			time.Sleep(3 * time.Second) // retry transient errors
			continue
		}
		switch job["status"] {
		case "completed":
			fmt.Println(job["markdown"])
			return
		case "failed":
			panic(fmt.Sprintf("scrape failed: %v", job["error"]))
		}
		time.Sleep(3 * time.Second)
	}
	panic("timed out after 3 minutes")
}
```

Run it:

```bash
go run main.go
```

---

## What this does

1. Submits `https://example.com` to `/url-scraper` and gets back a `jobId`.
2. Polls `/url-scraper/{jobId}` every 3 seconds (up to 60 attempts = 3 minutes).
3. Retries transient network errors silently — only surfaces real failures.
4. Prints the final `markdown` when the job completes.

Most jobs finish in 3–15 seconds.

---

## Go further

### Extract structured JSON with AI

Replace the submit body with `generateJson: true` to have AI return structured data:

```go
submitted := do("POST", "/url-scraper", map[string]any{
    "url":          "https://news.ycombinator.com",
    "generateJson": true,
})
```

The completed response includes a `generatedJson` field with structured data inferred from the page.

### Scrape JavaScript-heavy sites

For SPAs and dynamically-loaded pages, add `useBrowser: true`:

```go
submitted := do("POST", "/url-scraper", map[string]any{
    "url":        "https://example.com/spa",
    "useBrowser": true,
})
```

> Only use browser mode when needed — standard scraping is faster and cheaper.

---

## Next steps

<CardGrid>
  <ProductCard title="API Reference" description="Full endpoint docs with parameters and response schemas" href="/docs/api-reference" />
  <ProductCard title="Polling Jobs" description="Async job patterns, intervals, and production polling code" href="/docs/api-reference/polling-jobs" />
  <ProductCard title="Pricing & Credits" description="Credit costs per operation and plan details" href="/docs/documentation/pricing" />
  <ProductCard title="Use Cases" description="RAG pipelines, lead gen, price monitoring, and more" href="/docs/documentation/use-cases" />
</CardGrid>


---

# Java (/docs/documentation/getting-started/java)

Submit a scrape, poll for the result, and handle transient errors — using `java.net.http.HttpClient` from the Java 11+ standard library plus Jackson for JSON parsing.

---

## Authentication

Set your API key as an environment variable. Get a key from the [Dashboard](/dashboard).

```bash
export ANAKIN_API_KEY=ak-your-key-here
```

The base URL is `https://api.anakin.io/v1`. Every request authenticates via the `X-API-Key` header.

---

## Install

`HttpClient` is in the Java 11+ standard library. Jackson is the de facto JSON library and is already on the classpath in nearly every Spring Boot, Quarkus, or Micronaut project.

**Maven**:

```xml
<dependency>
  <groupId>com.fasterxml.jackson.core</groupId>
  <artifactId>jackson-databind</artifactId>
  <version>2.17.0</version>
</dependency>
```

**Gradle**:

```groovy
implementation 'com.fasterxml.jackson.core:jackson-databind:2.17.0'
```

---

## Scrape a page

Save as `Quickstart.java`:

```java
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Map;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

public class Quickstart {
    static final String BASE = "https://api.anakin.io/v1";
    static final String API_KEY = System.getenv("ANAKIN_API_KEY");
    static final HttpClient HTTP = HttpClient.newBuilder()
        .connectTimeout(Duration.ofSeconds(30)).build();
    static final ObjectMapper JSON = new ObjectMapper();

    static JsonNode request(String method, String path, Object body) throws Exception {
        var publisher = body == null
            ? HttpRequest.BodyPublishers.noBody()
            : HttpRequest.BodyPublishers.ofString(JSON.writeValueAsString(body));
        var req = HttpRequest.newBuilder(URI.create(BASE + path))
            .header("X-API-Key", API_KEY)
            .header("Content-Type", "application/json")
            .method(method, publisher).build();
        var resp = HTTP.send(req, HttpResponse.BodyHandlers.ofString());
        return JSON.readTree(resp.body());
    }

    static JsonNode scrape(String url) throws Exception {
        var submitted = request("POST", "/url-scraper", Map.of("url", url));
        var jobId = submitted.get("jobId").asText();
        for (int i = 0; i < 60; i++) {
            JsonNode job;
            try { job = request("GET", "/url-scraper/" + jobId, null); }
            catch (Exception e) { Thread.sleep(3000); continue; } // retry transient errors
            switch (job.get("status").asText()) {
                case "completed": return job;
                case "failed":
                    throw new RuntimeException("scrape failed: " + job.path("error").asText(""));
            }
            Thread.sleep(3000);
        }
        throw new RuntimeException("timed out after 3 minutes");
    }

    public static void main(String[] args) throws Exception {
        if (API_KEY == null) throw new RuntimeException("ANAKIN_API_KEY is not set");
        var job = scrape("https://example.com");
        System.out.println(job.get("markdown").asText());
    }
}
```

Run it (with Maven/Gradle handling Jackson on the classpath):

```bash
mvn compile exec:java -Dexec.mainClass=Quickstart
# or with Gradle: ./gradlew run
```

---

## What this does

1. Submits `https://example.com` to `/url-scraper` and gets back a `jobId`.
2. Polls `/url-scraper/{jobId}` every 3 seconds (up to 60 attempts = 3 minutes).
3. Retries transient I/O errors silently — only surfaces real failures.
4. Prints the final `markdown` when the job completes.

Most jobs finish in 3–15 seconds.

---

## Go further

### Extract structured JSON with AI

Replace the submit body with `generateJson: true` to have AI return structured data:

```java
var submitted = request("POST", "/url-scraper", Map.of(
    "url",          "https://news.ycombinator.com",
    "generateJson", true
));
```

The completed response includes a `generatedJson` field with structured data inferred from the page.

### Scrape JavaScript-heavy sites

For SPAs and dynamically-loaded pages, add `useBrowser: true`:

```java
var submitted = request("POST", "/url-scraper", Map.of(
    "url",        "https://example.com/spa",
    "useBrowser", true
));
```

> Only use browser mode when needed — standard scraping is faster and cheaper.

---

## Use it from Spring Boot

Wrap the `request` and `scrape` methods in a `@Service` and call from a `@Async` method or a Spring Batch job — the polling loop blocks for up to 3 minutes per URL, so background execution is the natural fit. For non-blocking use, switch to `HTTP.sendAsync()` and chain the polling with `CompletableFuture`.

---

## Next steps

<CardGrid>
  <ProductCard title="API Reference" description="Full endpoint docs with parameters and response schemas" href="/docs/api-reference" />
  <ProductCard title="Polling Jobs" description="Async job patterns, intervals, and production polling code" href="/docs/api-reference/polling-jobs" />
  <ProductCard title="Pricing & Credits" description="Credit costs per operation and plan details" href="/docs/documentation/pricing" />
  <ProductCard title="Use Cases" description="RAG pipelines, lead gen, price monitoring, and more" href="/docs/documentation/use-cases" />
</CardGrid>


---

# Node.js (/docs/documentation/getting-started/node)

Submit a scrape, poll for the result, and handle transient errors — using `fetch`, which is built into Node.js 18+ and every modern browser. No `axios`, no `node-fetch`, no dependencies.

---

## Authentication

Set your API key as an environment variable. Get a key from the [Dashboard](/dashboard).

```bash
export ANAKIN_API_KEY=ak-your-key-here
```

The base URL is `https://api.anakin.io/v1`. Every request authenticates via the `X-API-Key` header.

---

## Install

`fetch` is built into Node.js 18+ and Bun and Deno. Confirm:

```bash
node --version  # v18.0.0 or later
```

No npm packages needed for the basic flow. Just an `.mjs` (or `"type": "module"` in `package.json`) for top-level `await`.

---

## Scrape a page

Save as `quickstart.mjs`:

```javascript
const BASE = "https://api.anakin.io/v1"
const API_KEY = process.env.ANAKIN_API_KEY
if (!API_KEY) throw new Error("ANAKIN_API_KEY is not set")

async function request(method, path, body) {
  try {
    const resp = await fetch(BASE + path, {
      method,
      headers: { "X-API-Key": API_KEY, "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(30_000),
    })
    return await resp.json()
  } catch {
    return null // caller retries on null
  }
}

async function scrape(url) {
  const submitted = await request("POST", "/url-scraper", { url })
  const jobId = submitted.jobId

  for (let i = 0; i < 60; i++) {
    const job = await request("GET", `/url-scraper/${jobId}`)
    if (!job) {
      await new Promise(r => setTimeout(r, 3000)) // retry transient errors
      continue
    }
    if (job.status === "completed") return job
    if (job.status === "failed") {
      throw new Error(`scrape failed: ${job.error}`)
    }
    await new Promise(r => setTimeout(r, 3000))
  }
  throw new Error("timed out after 3 minutes")
}

const job = await scrape("https://example.com")
console.log(job.markdown)
```

Run it:

```bash
node quickstart.mjs
```

---

## What this does

1. Submits `https://example.com` to `/url-scraper` and gets back a `jobId`.
2. Polls `/url-scraper/{jobId}` every 3 seconds (up to 60 attempts = 3 minutes).
3. Retries transient fetch errors silently — only surfaces real failures.
4. Prints the final `markdown` when the job completes.

Most jobs finish in 3–15 seconds.

---

## Go further

### Extract structured JSON with AI

Replace the submit body with `generateJson: true` to have AI return structured data:

```javascript
const submitted = await request("POST", "/url-scraper", {
  url: "https://news.ycombinator.com",
  generateJson: true,
})
```

The completed response includes a `generatedJson` field with structured data inferred from the page.

### Scrape JavaScript-heavy sites

For SPAs and dynamically-loaded pages, add `useBrowser: true`:

```javascript
const submitted = await request("POST", "/url-scraper", {
  url: "https://example.com/spa",
  useBrowser: true,
})
```

> Only use browser mode when needed — standard scraping is faster and cheaper.

---

## Use it from Next.js / Express / NestJS

Drop the `request` and `scrape` functions into a service module and call from a queued background job (BullMQ, Inngest, Trigger.dev) — the polling loop awaits up to 3 minutes per URL, so background execution is the natural fit. For Next.js specifically, run from a route handler with `export const maxDuration = 300` if your platform supports it, or push to a queue:

```javascript
// app/api/scrape/route.js
import { Queue } from "bullmq"
const scrapeQueue = new Queue("scrape")

export async function POST(req) {
  const { url } = await req.json()
  await scrapeQueue.add("scrape", { url })
  return Response.json({ queued: true })
}
```

---

## TypeScript

For typed responses, define a minimal interface and cast — no SDK needed:

```typescript
type Job = {
  id: string
  status: "pending" | "completed" | "failed"
  markdown?: string
  generatedJson?: unknown
  error?: string
}

const job = await scrape("https://example.com") as Job
```

---

## Next steps

<CardGrid>
  <ProductCard title="API Reference" description="Full endpoint docs with parameters and response schemas" href="/docs/api-reference" />
  <ProductCard title="Polling Jobs" description="Async job patterns, intervals, and production polling code" href="/docs/api-reference/polling-jobs" />
  <ProductCard title="Pricing & Credits" description="Credit costs per operation and plan details" href="/docs/documentation/pricing" />
  <ProductCard title="Use Cases" description="RAG pipelines, lead gen, price monitoring, and more" href="/docs/documentation/use-cases" />
</CardGrid>


---

# PHP (/docs/documentation/getting-started/php)

Submit a scrape, poll for the result, and handle transient errors — all with PHP's bundled `curl` extension.

---

## Authentication

Set your API key as an environment variable. Get a key from the [Dashboard](/dashboard).

```bash
export ANAKIN_API_KEY=ak-your-key-here
```

The base URL is `https://api.anakin.io/v1`. Every request authenticates via the `X-API-Key` header.

---

## Install

No Composer packages needed — `curl` and `json` are PHP extensions enabled by default. Requires **PHP 8.0+** for the `throw` expression in the example below.

```bash
php --version  # confirm 8.0+
php -m | grep -E "curl|json"  # confirm extensions present
```

---

## Scrape a page

Save as `quickstart.php`:

```php
<?php
$apiKey = getenv("ANAKIN_API_KEY") ?: throw new Exception("ANAKIN_API_KEY is not set");
$base   = "https://api.anakin.io/v1";

function request(string $method, string $path, ?array $body = null): ?array {
    global $apiKey, $base;
    $ch = curl_init($base . $path);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CUSTOMREQUEST  => $method,
        CURLOPT_HTTPHEADER     => ["X-API-Key: $apiKey", "Content-Type: application/json"],
        CURLOPT_TIMEOUT        => 30,
    ]);
    if ($body !== null) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body));
    }
    $response = curl_exec($ch);
    $err = curl_error($ch);
    curl_close($ch);
    return $err ? null : json_decode($response, true);
}

function scrape(string $url): array {
    $submitted = request("POST", "/url-scraper", ["url" => $url]);
    $jobId = $submitted["jobId"];

    for ($i = 0; $i < 60; $i++) {
        $job = request("GET", "/url-scraper/" . $jobId);
        if ($job === null) {
            sleep(3); // retry transient errors
            continue;
        }
        if ($job["status"] === "completed") return $job;
        if ($job["status"] === "failed") {
            throw new Exception("scrape failed: " . ($job["error"] ?? ""));
        }
        sleep(3);
    }
    throw new Exception("timed out after 3 minutes");
}

$job = scrape("https://example.com");
echo $job["markdown"];
```

Run it:

```bash
php quickstart.php
```

---

## What this does

1. Submits `https://example.com` to `/url-scraper` and gets back a `jobId`.
2. Polls `/url-scraper/{jobId}` every 3 seconds (up to 60 attempts = 3 minutes).
3. Retries transient cURL errors silently — only surfaces real failures.
4. Echoes the final `markdown` when the job completes.

Most jobs finish in 3–15 seconds.

---

## Go further

### Extract structured JSON with AI

Replace the submit body with `generateJson: true` to have AI return structured data:

```php
$submitted = request("POST", "/url-scraper", [
    "url"          => "https://news.ycombinator.com",
    "generateJson" => true,
]);
```

The completed response includes a `generatedJson` field with structured data inferred from the page.

### Scrape JavaScript-heavy sites

For SPAs and dynamically-loaded pages, add `useBrowser: true`:

```php
$submitted = request("POST", "/url-scraper", [
    "url"        => "https://example.com/spa",
    "useBrowser" => true,
]);
```

> Only use browser mode when needed — standard scraping is faster and cheaper.

---

## Use it from Laravel

Drop the `request` and `scrape` functions into a service class and call from a queued job — the polling loop blocks for up to 3 minutes per URL, so background jobs are the natural fit:

```php
// app/Jobs/ScrapeUrlJob.php
class ScrapeUrlJob implements ShouldQueue {
    public function __construct(public string $url) {}

    public function handle(AnakinScraper $scraper): void {
        $job = $scraper->scrape($this->url);
        Page::create(["url" => $this->url, "markdown" => $job["markdown"]]);
    }
}
```

---

## Next steps

<CardGrid>
  <ProductCard title="API Reference" description="Full endpoint docs with parameters and response schemas" href="/docs/api-reference" />
  <ProductCard title="Polling Jobs" description="Async job patterns, intervals, and production polling code" href="/docs/api-reference/polling-jobs" />
  <ProductCard title="Pricing & Credits" description="Credit costs per operation and plan details" href="/docs/documentation/pricing" />
  <ProductCard title="Use Cases" description="RAG pipelines, lead gen, price monitoring, and more" href="/docs/documentation/use-cases" />
</CardGrid>


---

# Python (/docs/documentation/getting-started/python)

Submit a scrape, poll for the result, and handle transient errors — using `requests`, the standard Python HTTP library.

---

## Authentication

Set your API key as an environment variable. Get a key from the [Dashboard](/dashboard).

```bash
export ANAKIN_API_KEY=ak-your-key-here
```

The base URL is `https://api.anakin.io/v1`. Every request authenticates via the `X-API-Key` header.

---

## Install

`requests` is the de facto Python HTTP library. Install once:

```bash
pip install requests
```

If you'd rather avoid any dependency, the same logic works with `urllib.request` from the standard library — but `requests` is cleaner and present in nearly every Python project.

---

## Scrape a page

Save as `quickstart.py`:

```python
import os
import time
import requests

BASE = "https://api.anakin.io/v1"
API_KEY = os.environ.get("ANAKIN_API_KEY")
if not API_KEY:
    raise SystemExit("ANAKIN_API_KEY is not set")

session = requests.Session()
session.headers.update({"X-API-Key": API_KEY, "Content-Type": "application/json"})


def request(method: str, path: str, json=None):
    try:
        resp = session.request(method, BASE + path, json=json, timeout=30)
        return resp.json()
    except requests.RequestException:
        return None  # caller retries on None


def scrape(url: str) -> dict:
    submitted = request("POST", "/url-scraper", {"url": url})
    job_id = submitted["jobId"]

    for _ in range(60):
        job = request("GET", f"/url-scraper/{job_id}")
        if job is None:
            time.sleep(3)  # retry transient errors
            continue
        if job["status"] == "completed":
            return job
        if job["status"] == "failed":
            raise RuntimeError(f"scrape failed: {job.get('error')}")
        time.sleep(3)
    raise TimeoutError("timed out after 3 minutes")


if __name__ == "__main__":
    job = scrape("https://example.com")
    print(job["markdown"])
```

Run it:

```bash
python quickstart.py
```

---

## What this does

1. Submits `https://example.com` to `/url-scraper` and gets back a `jobId`.
2. Polls `/url-scraper/{jobId}` every 3 seconds (up to 60 attempts = 3 minutes).
3. Retries transient `RequestException` errors silently — only surfaces real failures.
4. Prints the final `markdown` when the job completes.

Most jobs finish in 3–15 seconds.

---

## Go further

### Extract structured JSON with AI

Replace the submit body with `generateJson: True` to have AI return structured data:

```python
submitted = request("POST", "/url-scraper", {
    "url": "https://news.ycombinator.com",
    "generateJson": True,
})
```

The completed response includes a `generatedJson` field with structured data inferred from the page.

### Scrape JavaScript-heavy sites

For SPAs and dynamically-loaded pages, add `useBrowser: True`:

```python
submitted = request("POST", "/url-scraper", {
    "url": "https://example.com/spa",
    "useBrowser": True,
})
```

> Only use browser mode when needed — standard scraping is faster and cheaper.

---

## Use it from Django / FastAPI

Wrap `scrape()` in a Celery / RQ / Dramatiq task — the polling loop blocks for up to 3 minutes per URL, so background execution is the natural fit. For FastAPI specifically, swap `requests` for `httpx.AsyncClient` and `await asyncio.sleep(3)` to keep the event loop free:

```python
# app/tasks/scrape.py
from celery import shared_task

@shared_task
def scrape_url(url: str):
    job = scrape(url)
    Page.objects.create(url=url, markdown=job["markdown"])
```

---

## Next steps

<CardGrid>
  <ProductCard title="API Reference" description="Full endpoint docs with parameters and response schemas" href="/docs/api-reference" />
  <ProductCard title="Polling Jobs" description="Async job patterns, intervals, and production polling code" href="/docs/api-reference/polling-jobs" />
  <ProductCard title="Pricing & Credits" description="Credit costs per operation and plan details" href="/docs/documentation/pricing" />
  <ProductCard title="Use Cases" description="RAG pipelines, lead gen, price monitoring, and more" href="/docs/documentation/use-cases" />
</CardGrid>


---

# Ruby (/docs/documentation/getting-started/ruby)

Submit a scrape, poll for the result, and handle transient errors — all with `net/http` and `json` from Ruby's standard library.

---

## Authentication

Set your API key as an environment variable. Get a key from the [Dashboard](/dashboard).

```bash
export ANAKIN_API_KEY=ak-your-key-here
```

The base URL is `https://api.anakin.io/v1`. Every request authenticates via the `X-API-Key` header.

---

## Install

No gems needed — `net/http` and `json` ship with Ruby. This works in any Ruby 2.7+ project, including Rails.

---

## Scrape a page

Save as `quickstart.rb`:

```ruby
require "net/http"
require "json"
require "uri"

BASE_URL = "https://api.anakin.io/v1"
API_KEY  = ENV.fetch("ANAKIN_API_KEY") { raise "ANAKIN_API_KEY is not set" }

def request(method, path, body = nil)
  uri  = URI(BASE_URL + path)
  http = Net::HTTP.new(uri.host, uri.port)
  http.use_ssl = true
  http.read_timeout = 30

  req = Net::HTTPGenericRequest.new(method, !body.nil?, true, uri.request_uri)
  req["X-API-Key"]    = API_KEY
  req["Content-Type"] = "application/json"
  req.body = body.to_json if body

  JSON.parse(http.request(req).body)
end

def scrape(url)
  submitted = request("POST", "/url-scraper", { url: url })
  job_id    = submitted["jobId"]

  60.times do
    begin
      job = request("GET", "/url-scraper/#{job_id}")
    rescue StandardError
      sleep 3 # retry transient errors
      next
    end

    case job["status"]
    when "completed" then return job
    when "failed"    then raise "scrape failed: #{job['error']}"
    end
    sleep 3
  end
  raise "timed out after 3 minutes"
end

job = scrape("https://example.com")
puts job["markdown"]
```

Run it:

```bash
ruby quickstart.rb
```

---

## What this does

1. Submits `https://example.com` to `/url-scraper` and gets back a `jobId`.
2. Polls `/url-scraper/{jobId}` every 3 seconds (up to 60 attempts = 3 minutes).
3. Retries transient network errors silently — only surfaces real failures.
4. Prints the final `markdown` when the job completes.

Most jobs finish in 3–15 seconds.

---

## Go further

### Extract structured JSON with AI

Pass `generateJson: true` to have AI return structured data:

```ruby
submitted = request("POST", "/url-scraper", {
  url: "https://news.ycombinator.com",
  generateJson: true
})
```

The completed response includes a `generatedJson` field with structured data inferred from the page.

### Scrape JavaScript-heavy sites

For SPAs and dynamically-loaded pages, add `useBrowser: true`:

```ruby
submitted = request("POST", "/url-scraper", {
  url: "https://example.com/spa",
  useBrowser: true
})
```

> Only use browser mode when needed — standard scraping is faster and cheaper.

---

## Use it from Rails

Drop the `request` and `scrape` methods into a service object (e.g. `app/services/anakin_scraper.rb`) and call from a job:

```ruby
# app/jobs/scrape_url_job.rb
class ScrapeUrlJob < ApplicationJob
  queue_as :default

  def perform(url)
    job = AnakinScraper.scrape(url)
    Page.create!(url: url, markdown: job["markdown"])
  end
end
```

Background jobs are the natural fit — the polling loop blocks for up to 3 minutes per URL.

---

## Next steps

<CardGrid>
  <ProductCard title="API Reference" description="Full endpoint docs with parameters and response schemas" href="/docs/api-reference" />
  <ProductCard title="Polling Jobs" description="Async job patterns, intervals, and production polling code" href="/docs/api-reference/polling-jobs" />
  <ProductCard title="Pricing & Credits" description="Credit costs per operation and plan details" href="/docs/documentation/pricing" />
  <ProductCard title="Use Cases" description="RAG pipelines, lead gen, price monitoring, and more" href="/docs/documentation/use-cases" />
</CardGrid>


---

# Rust (/docs/documentation/getting-started/rust)

Submit a scrape, poll for the result, and handle transient errors — using `ureq` (a minimal sync HTTP client) and `serde_json`.

---

## Authentication

Set your API key as an environment variable. Get a key from the [Dashboard](/dashboard).

```bash
export ANAKIN_API_KEY=ak-your-key-here
```

The base URL is `https://api.anakin.io/v1`. Every request authenticates via the `X-API-Key` header.

---

## Install

Rust's stdlib doesn't ship an HTTP client. `ureq` is the lightest sensible choice — synchronous, no async runtime, single small crate. For async or `reqwest` users, the same logic translates trivially.

Add to `Cargo.toml`:

```toml
[dependencies]
ureq = { version = "2", features = ["json"] }
serde_json = "1"
```

---

## Scrape a page

Save as `src/main.rs`:

```rust
use std::env;
use std::thread::sleep;
use std::time::Duration;
use serde_json::{json, Value};

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let api_key = env::var("ANAKIN_API_KEY")
        .map_err(|_| "ANAKIN_API_KEY is not set")?;
    let base = "https://api.anakin.io/v1";
    let agent = ureq::AgentBuilder::new()
        .timeout(Duration::from_secs(30))
        .build();

    let submitted: Value = agent.post(&format!("{base}/url-scraper"))
        .set("X-API-Key", &api_key)
        .send_json(json!({ "url": "https://example.com" }))?
        .into_json()?;
    let job_id = submitted["jobId"].as_str().ok_or("missing jobId")?;

    for _ in 0..60 {
        let resp = agent.get(&format!("{base}/url-scraper/{job_id}"))
            .set("X-API-Key", &api_key)
            .call();
        let job: Value = match resp {
            Ok(r) => r.into_json()?,
            Err(_) => { sleep(Duration::from_secs(3)); continue; } // retry transient errors
        };
        match job["status"].as_str() {
            Some("completed") => {
                println!("{}", job["markdown"].as_str().unwrap_or(""));
                return Ok(());
            }
            Some("failed") => {
                return Err(format!("scrape failed: {}", job["error"]).into());
            }
            _ => {}
        }
        sleep(Duration::from_secs(3));
    }
    Err("timed out after 3 minutes".into())
}
```

Run it:

```bash
cargo run
```

---

## What this does

1. Submits `https://example.com` to `/url-scraper` and gets back a `jobId`.
2. Polls `/url-scraper/{jobId}` every 3 seconds (up to 60 attempts = 3 minutes).
3. Retries transient network errors silently — only surfaces real failures.
4. Prints the final `markdown` when the job completes.

Most jobs finish in 3–15 seconds.

---

## Go further

### Extract structured JSON with AI

Replace the submit body with `generateJson: true` to have AI return structured data:

```rust
let submitted: Value = agent.post(&format!("{base}/url-scraper"))
    .set("X-API-Key", &api_key)
    .send_json(json!({
        "url": "https://news.ycombinator.com",
        "generateJson": true
    }))?
    .into_json()?;
```

The completed response includes a `generatedJson` field with structured data inferred from the page.

### Scrape JavaScript-heavy sites

For SPAs and dynamically-loaded pages, add `useBrowser: true`:

```rust
.send_json(json!({
    "url": "https://example.com/spa",
    "useBrowser": true
}))?
```

> Only use browser mode when needed — standard scraping is faster and cheaper.

---

## Async with reqwest

If you're already on Tokio, swap `ureq` for `reqwest` and `.await` the requests — the loop structure is identical. The polling sleep becomes `tokio::time::sleep(Duration::from_secs(3)).await`.

---

## Next steps

<CardGrid>
  <ProductCard title="API Reference" description="Full endpoint docs with parameters and response schemas" href="/docs/api-reference" />
  <ProductCard title="Polling Jobs" description="Async job patterns, intervals, and production polling code" href="/docs/api-reference/polling-jobs" />
  <ProductCard title="Pricing & Credits" description="Credit costs per operation and plan details" href="/docs/documentation/pricing" />
  <ProductCard title="Use Cases" description="RAG pipelines, lead gen, price monitoring, and more" href="/docs/documentation/use-cases" />
</CardGrid>


---

# Pricing & Credits (/docs/documentation/pricing)

## Per-Request Pricing

AnakinScraper uses a simple credit-based system. Each API request consumes credits based on the type of operation performed.

| Request Type | Credits | Description |
|--------------|---------|-------------|
| Wire action | Varies | Credit cost shown per action in the catalog — deducted upfront, refunded on failure |
| URL scrape | 1 credit | HTML extraction with optional JS rendering |
| + AI Summary | +1 credit | AI-generated summary of the page content |
| + AI JSON extraction | +2 credits | AI-structured data extraction |
| Batch scraping | 1 credit × URLs | 1 credit per URL in the batch (add-ons apply per URL) |
| Crawl | 1 credit × pages | Multi-page crawl, charged upfront based on max pages |
| Map (URL discovery) | 1 credit | Discover all URLs on a domain |
| Search API | 3 credits | Web search with full content extraction |
| Agentic Search | 10 + 1/URL | 10 base + 1 credit per URL scraped during research |
| Browser API | 1 credit / 2 min | Live CDP browser session, billed per 2-minute interval (rounded up) |

## Plans

### Starter (Free)
- 500 credits
- Basic scraping
- API access

### Pro ($9/month)
- 3,000 credits/month
- Priority support
- Advanced features
- 99.9% uptime SLA

### Scale ($29/month)
- 12,000 credits/month
- Priority support
- All API endpoints
- 99.9% uptime SLA

### Enterprise (Custom)
- Unlimited credits
- Dedicated support
- Custom integrations
- SLA guarantees

[Contact sales](https://calendly.com/d/ctqw-64s-rgt/let-s-talk-about-your-use-case-anakin-io) for Enterprise pricing.

## Credit Usage Examples

### Basic HTML Scrape
```bash
curl -X POST https://api.anakin.io/v1/scrape \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'
```
**Cost: 1 credit**

### URL Scrape with JS Rendering
```bash
curl -X POST https://api.anakin.io/v1/scrape \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com", "useBrowser": true}'
```
**Cost: 1 credit** (same as basic — JS rendering has no additional cost)

### Batch Scraping (10 URLs)
```bash
curl -X POST https://api.anakin.io/v1/scrape/batch \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"urls": ["url1", "url2", ...], "useBrowser": true}'
```
**Cost: 10 credits** (1 credit × 10 URLs)

### URL Scrape with AI Summary
```bash
curl -X POST https://api.anakin.io/v1/scrape \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com", "formats": ["markdown", "summary"]}'
```
**Cost: 2 credits** (1 base + 1 for AI summary)

### URL Scrape with AI JSON Extraction
```bash
curl -X POST https://api.anakin.io/v1/scrape \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com", "formats": ["markdown", "json"]}'
```
**Cost: 3 credits** (1 base + 2 for AI JSON extraction)

### Crawl (10 pages)
```bash
curl -X POST https://api.anakin.io/v1/crawl \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com", "maxPages": 10}'
```
**Cost: 10 credits** (1 credit × 10 pages)

### Map (URL Discovery)
```bash
curl -X POST https://api.anakin.io/v1/map \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'
```
**Cost: 1 credit**


---

# Rate Limits (/docs/documentation/rate-limits)

AnakinScraper applies rate limits per API key to ensure reliable performance for all users. Limits are enforced using a sliding window algorithm — the window counts requests within the last N seconds and rejects once the limit is reached.

---

## Limits by endpoint

Each row below represents an **independent bucket** — hitting the limit on one endpoint does not affect your quota on another. Limits are scoped either per API key (per-user) or per IP, as noted in the **Bucket** column.

#### Wire — discovery (no auth required)

| Endpoint | Rate limit | Bucket |
|----------|-----------|--------|
| `GET /v1/holocron/catalog` | 60 requests/min | per-IP |
| `GET /v1/holocron/catalog/{slug}` | 60 requests/min | per-IP |
| `GET /v1/holocron/search` | 30 requests/min | per-IP |

#### Wire — authenticated

| Endpoint | Rate limit | Bucket |
|----------|-----------|--------|
| `POST /v1/holocron/task` | 20 requests/min | per-user |
| `GET /v1/holocron/jobs` | 60 requests/min | per-user |
| `GET /v1/holocron/jobs/{id}` | 60 requests/min | per-user |
| `GET /v1/holocron/jobs/{id}/download` | 30 requests/min | per-user |

> **Wire polling is rate-limited.** Unlike URL Scraper / Search polling — which have no rate limit — `GET /v1/holocron/jobs/{id}` is capped at **60 requests/min per user**. Treat it as roughly one poll per second per job and use exponential backoff if you're polling many jobs in parallel.

#### Scraping

| Endpoint | Rate limit | Bucket |
|----------|-----------|--------|
| `POST /v1/url-scraper` | 60 requests/min | per-user |
| `POST /v1/url-scraper/batch` | 60 requests/min | per-user |
| `POST /v1/map` | 60 requests/min | per-user |
| `POST /v1/crawl` | 60 requests/min | per-user |

#### Search

| Endpoint | Rate limit | Bucket |
|----------|-----------|--------|
| `POST /v1/search` | 60 requests/min | per-user |
| `POST /v1/agentic-search` | 60 requests/min | per-user |

#### Browser Sessions

| Endpoint | Rate limit | Bucket |
|----------|-----------|--------|
| `POST /v1/sessions/manual-start` | 60 requests/min | per-user |
| `POST /v1/sessions/manual-save` | 60 requests/min | per-user |
| `PATCH /v1/sessions/{id}` | 60 requests/min | per-user |
| `DELETE /v1/sessions/{id}` | 60 requests/min | per-user |

#### AI Evaluation

| Endpoint | Rate limit | Bucket |
|----------|-----------|--------|
| `POST /v1/ai/evaluate` | 10 requests/min | per-user |
| `POST /v1/ai/evaluate/stream` | 10 requests/min | per-user |

#### Endpoints with no rate limit

The following GET endpoints are not rate-limited — you can poll them as often as needed:

- `GET /v1/url-scraper/{id}`
- `GET /v1/agentic-search/{id}`
- `GET /v1/map/{id}`
- `GET /v1/crawl/{id}`

---

## Rate limit response

When you exceed a rate limit, the API returns a `429 Too Many Requests` response:

```json
{
  "error": "rate_limit_exceeded",
  "message": "Too many requests. Please try again later."
}
```

See [Error Responses](/docs/api-reference/error-responses) for the full error format and the canonical retry pattern with exponential backoff and jitter.

---

## Handling rate limits

### Retry with exponential backoff

The recommended approach is to wait and retry with exponential backoff. Start with a short delay and double it on each retry.

<Tabs items={["Python", "JavaScript"]}>
<Tab value="Python">
```python
import requests
import time

def scrape_with_retry(url, api_key, max_retries=3):
    """Submit a scrape job with automatic retry on rate limit."""
    delay = 2

    for attempt in range(max_retries + 1):
        response = requests.post(
            "https://api.anakin.io/v1/url-scraper",
            headers={"X-API-Key": api_key},
            json={"url": url}
        )

        if response.status_code == 429:
            if attempt == max_retries:
                raise Exception("Rate limit exceeded after retries")
            print(f"Rate limited, retrying in {delay}s...")
            time.sleep(delay)
            delay *= 2
            continue

        response.raise_for_status()
        return response.json()

result = scrape_with_retry("https://example.com", "ak-your-key-here")
print(result["jobId"])
```
</Tab>
<Tab value="JavaScript">
```javascript
async function scrapeWithRetry(url, apiKey, maxRetries = 3) {
  let delay = 2000;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await fetch("https://api.anakin.io/v1/url-scraper", {
      method: "POST",
      headers: {
        "X-API-Key": apiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ url })
    });

    if (response.status === 429) {
      if (attempt === maxRetries) {
        throw new Error("Rate limit exceeded after retries");
      }
      console.log(`Rate limited, retrying in ${delay / 1000}s...`);
      await new Promise(r => setTimeout(r, delay));
      delay *= 2;
      continue;
    }

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  }
}

const result = await scrapeWithRetry("https://example.com", "ak-your-key-here");
console.log(result.jobId);
```
</Tab>
</Tabs>

### Use batch endpoints

If you're scraping multiple URLs, use the [batch endpoint](/docs/api-reference/url-scraper/batch-url-scraping) instead of submitting individual requests. A single batch request can include up to 10 URLs and only counts as one request against the rate limit.

```bash
# Bad: 10 requests, 10 against rate limit
for url in url1 url2 ... url10; do
  curl -X POST .../v1/url-scraper -d "{\"url\": \"$url\"}"
done

# Good: 1 request, 1 against rate limit
curl -X POST https://api.anakin.io/v1/url-scraper/batch \
  -H "X-API-Key: ak-your-key-here" \
  -H "Content-Type: application/json" \
  -d '{"urls": ["url1", "url2", "...", "url10"]}'
```

### Spread requests over time

If you have a large list of URLs, pace your submissions rather than sending them all at once. A simple approach is to add a short delay between requests:

```python
import time

urls = ["https://example.com/1", "https://example.com/2", ...]

for url in urls:
    result = scrape_with_retry(url, api_key)
    job_ids.append(result["jobId"])
    time.sleep(1)  # ~60 requests/min stays within the limit
```

---

## Tips

- **Rate limits apply to submit endpoints only.** Poll as often as you like — GET endpoints for checking job status are not rate-limited.
- **Batch when possible.** A single batch request with 10 URLs uses 1 rate-limit slot, not 10.
- **Cache results.** AnakinScraper caches responses for 24 hours. Repeat requests for the same URL return instantly and cost zero credits, but they still count against rate limits.
- **Use the CLI for simple workloads.** The [Anakin CLI](/docs/sdks/cli) handles rate limiting and retries automatically.

---

## Increasing your limits

If you need higher rate limits for your use case, contact us:

- **Email** — support@anakin.io
- **Enterprise plan** — includes custom rate limits. [Talk to sales](https://calendly.com/d/ctqw-64s-rgt/let-s-talk-about-your-use-case-anakin-io).


---

# Use Cases (/docs/documentation/use-cases)

Explore how different teams leverage AnakinScraper to power their AI applications, data pipelines, and business workflows.

<CardGrid>
  <ProductCard title="AI & Agent Data Ingestion" description="Feed web data into LLMs, AI agents, and retrieval pipelines." href="/docs/documentation/use-cases/ai-agent-data-ingestion" />
  <ProductCard title="Competitive Intelligence & Pricing" description="Monitor competitor websites, pricing strategies, and detect changes in real-time." href="/docs/documentation/use-cases/competitive-intel" />
  <ProductCard title="Structured Market & Web Research" description="Run structured multi-source research and extract insights from the web." href="/docs/documentation/use-cases/market-research" />
  <ProductCard title="Financial & Corporate Filings" description="Extract structured data from financial reports, SEC filings, and corporate documents." href="/docs/documentation/use-cases/financial-filings" />
  <ProductCard title="Lead Generation" description="Extract and enrich leads from company websites and directories." href="/docs/documentation/use-cases/lead-generation" />
  <ProductCard title="SEO & Search Intelligence" description="Monitor search rankings, audit content, and track online presence." href="/docs/documentation/use-cases/seo-marketing" />
  <ProductCard title="Review & Sentiment Data Extraction" description="Collect reviews, ratings, and sentiment signals from across the web." href="/docs/documentation/use-cases/review-sentiment" />
  <ProductCard title="ML & Training Data Collection" description="Build large-scale datasets from the web for model training and fine-tuning." href="/docs/documentation/use-cases/ml-training-data" />
  <ProductCard title="Browser Automation & Web Workflows" description="Automate complex browser interactions and multi-step web workflows." href="/docs/documentation/use-cases/browser-automation" />
  <ProductCard title="Content Aggregation" description="Collect articles, news, and content from multiple sources." href="/docs/documentation/use-cases/content-aggregation" />
</CardGrid>


---

# AI & Agent Data Ingestion (/docs/documentation/use-cases/ai-agent-data-ingestion)

Use Anakin's scraping API to turn web pages into **structured JSON** (or clean text/markdown) for **RAG pipelines**, **AI agents**, and **support copilots**. Typical workflows include crawling docs, help centers, product pages, and forum threads, then chunking and indexing for retrieval.

---

### Common sources

* Documentation sites (MDX/Docs frameworks, API references)
* Help centers / knowledge bases (Zendesk-style, custom)
* Product pages + changelogs
* Forums / community threads

---

### What to extract

* Title, headings hierarchy (H1/H2/H3)
* Main content blocks (exclude nav/footer)
* Code blocks (language + code)
* Tables, lists, callouts
* Canonical URL, publish/updated timestamps
* Outbound links for crawl expansion

---

### Implementation notes

* Prefer **browser rendering** for JS docs sites and SPAs.
* Use **structured extraction** to keep stable fields: `title`, `sections[]`, `code_blocks[]`, `tables[]`.
* Use **dedupe keys** (canonical URL + content hash) to avoid re-indexing.
* For RAG: chunk by heading boundaries; store metadata (source URL, section path).

---

### FAQs

<Accordion type="single" collapsible className="w-full">
  <AccordionItem value="q1">
    <AccordionTrigger>Do you generate embeddings or manage vector databases?</AccordionTrigger>
    <AccordionContent>No. The API extracts structured content from webpages. Embeddings, chunking, and indexing are handled in your own AI pipeline.</AccordionContent>
  </AccordionItem>
  <AccordionItem value="q2">
    <AccordionTrigger>Can I extract clean content from JS-heavy documentation sites?</AccordionTrigger>
    <AccordionContent>Yes. Use browser rendering to extract the fully rendered DOM and then structure headings, paragraphs, code blocks, and tables.</AccordionContent>
  </AccordionItem>
  <AccordionItem value="q3">
    <AccordionTrigger>How do I avoid reprocessing unchanged content?</AccordionTrigger>
    <AccordionContent>Store a content hash of the structured output and compare it across runs. Only re-embed if the hash changes.</AccordionContent>
  </AccordionItem>
  <AccordionItem value="q4">
    <AccordionTrigger>Can I scrape private or logged-in knowledge bases?</AccordionTrigger>
    <AccordionContent>Yes, if you provide valid session credentials or cookies using authenticated sessions.</AccordionContent>
  </AccordionItem>
  <AccordionItem value="q5">
    <AccordionTrigger>Does the API clean or rewrite content?</AccordionTrigger>
    <AccordionContent>No. It extracts what is present on the page. Any cleaning or transformation happens in your pipeline.</AccordionContent>
  </AccordionItem>
</Accordion>


---

# Browser Automation & Web Workflows (/docs/documentation/use-cases/browser-automation)

Automate JS-heavy flows to reach data that isn't available via static HTML alone. This includes **authenticated dashboards**, multi-step navigation, and extracting data after interactions.

---

### Common sources

* Authenticated portals (member-only pages, dashboards)
* Multi-step flows (filters, tabs, pagination controls)
* JS-rendered apps with client-side routing

---

### What to extract

* Post-login content (tables, lists, metrics)
* UI state-specific data (selected filters, tabs, date ranges)
* Export links / report links (when available)

---

### Implementation notes

* Use authenticated sessions (cookies/tokens) and browser rendering.
* Extract stateful metadata: `filters_applied`, `date_range`, `view_name`.
* Build idempotent workflows: re-runable steps, clear failure modes, retries.

---

### FAQs

<Accordion type="single" collapsible className="w-full">
  <AccordionItem value="q1">
    <AccordionTrigger>Is this full RPA?</AccordionTrigger>
    <AccordionContent>No. It enables browser-rendered extraction and authenticated flows. Workflow orchestration is built on your side.</AccordionContent>
  </AccordionItem>
  <AccordionItem value="q2">
    <AccordionTrigger>Can I scrape dashboards behind login?</AccordionTrigger>
    <AccordionContent>Yes, using authenticated sessions with valid credentials or cookies.</AccordionContent>
  </AccordionItem>
  <AccordionItem value="q3">
    <AccordionTrigger>Can I interact with filters or tabs?</AccordionTrigger>
    <AccordionContent>Yes, if your workflow triggers those states before extraction.</AccordionContent>
  </AccordionItem>
  <AccordionItem value="q4">
    <AccordionTrigger>What if the page uses client-side routing?</AccordionTrigger>
    <AccordionContent>Browser rendering resolves the final DOM state for extraction.</AccordionContent>
  </AccordionItem>
  <AccordionItem value="q5">
    <AccordionTrigger>Does the API maintain persistent sessions automatically?</AccordionTrigger>
    <AccordionContent>Session management logic should be handled in your integration.</AccordionContent>
  </AccordionItem>
</Accordion>


---

# Competitive Intelligence & Pricing (/docs/documentation/use-cases/competitive-intel)

Extract competitor site data (pricing pages, feature pages, release notes, product catalogs) into structured fields for **competitive analysis**, **pricing intelligence**, and **feature comparison**.

---

### Common sources

* Pricing pages (plan tiers, add-ons, limits, feature matrices)
* Feature pages, integrations pages
* Changelogs / release notes
* Public product catalogs and category pages

---

### What to extract

* Plans and tiers: name, price, billing cadence, currency
* Feature matrices (rows/columns normalized)
* Usage limits: seats, API calls, storage, rate limits
* Add-ons and overage pricing
* Promotions, coupons, seasonal offers (where present)
* Change metadata: last updated date, page version id, content hash

---

### Implementation notes

* Rendering often required for pricing widgets and tabs.
* Normalize plan data into a consistent schema across vendors.
* Use `content_hash` for change detection and diffing (your system can compute diffs).
* Handle geo-based pricing by varying locale headers / region routing (if needed).

---

### FAQs

<Accordion type="single" collapsible className="w-full">
  <AccordionItem value="q1">
    <AccordionTrigger>Does this track competitor changes automatically?</AccordionTrigger>
    <AccordionContent>No. You must schedule recurring scrapes and compare structured outputs to detect changes.</AccordionContent>
  </AccordionItem>
  <AccordionItem value="q2">
    <AccordionTrigger>Can pricing tables that require interaction be extracted?</AccordionTrigger>
    <AccordionContent>Yes, if they are rendered in the DOM after interaction. Browser rendering is required for most dynamic pricing widgets.</AccordionContent>
  </AccordionItem>
  <AccordionItem value="q3">
    <AccordionTrigger>Can I extract feature comparison tables?</AccordionTrigger>
    <AccordionContent>Yes. Tables and structured lists can be normalized into JSON fields.</AccordionContent>
  </AccordionItem>
  <AccordionItem value="q4">
    <AccordionTrigger>Does the API interpret pricing logic (discounts, bundles)?</AccordionTrigger>
    <AccordionContent>No. It extracts visible pricing data. Interpretation is handled downstream.</AccordionContent>
  </AccordionItem>
  <AccordionItem value="q5">
    <AccordionTrigger>How do I detect real pricing changes?</AccordionTrigger>
    <AccordionContent>Compare structured pricing JSON across runs instead of raw HTML to avoid layout noise.</AccordionContent>
  </AccordionItem>
</Accordion>


---

# Content Aggregation (/docs/documentation/use-cases/content-aggregation)

Aggregate content from multiple webpages into normalized outputs for **news aggregation**, **research feeds**, **internal dashboards**, and **content pipelines**.

---

### Common sources

* Blogs and news archives
* Company update pages
* Release notes/changelog pages
* Documentation announcement pages

---

### What to extract

* Article list entries: title, URL, excerpt, publish date, author
* Full article content (main body + headings)
* Tags/categories
* Media: featured image URL, embeds (if needed)
* Canonical URL + source attribution

---

### Implementation notes

* Two-stage approach: scrape index pages → collect article URLs → scrape article pages.
* Normalize into a single schema across sources.
* Use content hashing to detect updates without storing huge diffs.

---

### FAQs

<Accordion type="single" collapsible className="w-full">
  <AccordionItem value="q1">
    <AccordionTrigger>Can I scrape blog archives?</AccordionTrigger>
    <AccordionContent>Yes. Extract article listings and then scrape individual article pages.</AccordionContent>
  </AccordionItem>
  <AccordionItem value="q2">
    <AccordionTrigger>Does the API provide RSS feeds?</AccordionTrigger>
    <AccordionContent>No. You can generate RSS downstream using extracted content.</AccordionContent>
  </AccordionItem>
  <AccordionItem value="q3">
    <AccordionTrigger>How do I detect new articles?</AccordionTrigger>
    <AccordionContent>Re-scrape index pages and compare extracted URLs or content hashes.</AccordionContent>
  </AccordionItem>
  <AccordionItem value="q4">
    <AccordionTrigger>Can I extract publication dates and authors?</AccordionTrigger>
    <AccordionContent>Yes, if they are visible in the page content.</AccordionContent>
  </AccordionItem>
  <AccordionItem value="q5">
    <AccordionTrigger>Does the API summarize content?</AccordionTrigger>
    <AccordionContent>No. It extracts content; summarization must be done using your own AI pipeline.</AccordionContent>
  </AccordionItem>
</Accordion>


---

# Financial & Corporate Filings (/docs/documentation/use-cases/financial-filings)

Extract structured data from corporate websites for **investor relations**, **press releases**, **earnings pages**, and **public disclosures**. Useful for analysis pipelines and research workflows.

---

### Common sources

* Investor Relations (IR) pages (quarterly results, presentations)
* Press release archives
* Leadership pages and governance pages
* Public filings portals (where web accessible)

---

### What to extract

* Press release entries: title, date, category, URL
* Earnings artifacts: PDF links, webcast links, transcripts (if present)
* Company metadata: legal name, HQ location, leadership roster
* Document metadata: file type, published date, version identifiers

---

### Implementation notes

* Many IR sites load content via JS; enable rendering.
* Extract document links and store them (download/processing happens downstream).
* Preserve timestamps and original source URLs for traceability.

---

### FAQs

<Accordion type="single" collapsible className="w-full">
  <AccordionItem value="q1">
    <AccordionTrigger>Can I extract press release archives?</AccordionTrigger>
    <AccordionContent>Yes. You can scrape index pages and extract titles, dates, and URLs for each entry.</AccordionContent>
  </AccordionItem>
  <AccordionItem value="q2">
    <AccordionTrigger>Can the API parse PDFs?</AccordionTrigger>
    <AccordionContent>No. It extracts webpage content. PDF parsing must be handled separately.</AccordionContent>
  </AccordionItem>
  <AccordionItem value="q3">
    <AccordionTrigger>How do I identify the latest earnings release?</AccordionTrigger>
    <AccordionContent>Scrape the archive page and sort entries by extracted publish date.</AccordionContent>
  </AccordionItem>
  <AccordionItem value="q4">
    <AccordionTrigger>Can I extract document download links?</AccordionTrigger>
    <AccordionContent>Yes. If links are visible in the rendered page, they can be captured.</AccordionContent>
  </AccordionItem>
  <AccordionItem value="q5">
    <AccordionTrigger>Does the API validate financial data?</AccordionTrigger>
    <AccordionContent>No. It only extracts what is publicly displayed on the webpage.</AccordionContent>
  </AccordionItem>
</Accordion>


---

# Lead Generation (/docs/documentation/use-cases/lead-generation)

Extract structured business data from the public web (directories, company pages, partner lists) for **prospecting**, **account research**, and **CRM enrichment**.

---

### Common sources

* B2B directories, association listings
* Partner / reseller / agency directories
* Conference sponsor/exhibitor lists
* Company "Contact" and "About" pages

---

### What to extract

* Company name, domain, category/industry
* Location, service areas
* Contact channels: emails (if public), phone, contact forms
* Social links, team pages (if public)
* Signals: certifications, partner badges, technologies listed

---

### Implementation notes

* Be strict about "public web only" fields; store provenance.
* Use extraction schema that separates `contact_methods[]` from `people[]`.
* Avoid brittle scraping of obfuscated emails—prefer consistent selectors.

---

### FAQs

<Accordion type="single" collapsible className="w-full">
  <AccordionItem value="q1">
    <AccordionTrigger>Does the API provide private contact data?</AccordionTrigger>
    <AccordionContent>No. It extracts only what is publicly available on the scraped pages.</AccordionContent>
  </AccordionItem>
  <AccordionItem value="q2">
    <AccordionTrigger>Can I scrape company directories?</AccordionTrigger>
    <AccordionContent>Yes, including listing pages and company profile pages.</AccordionContent>
  </AccordionItem>
  <AccordionItem value="q3">
    <AccordionTrigger>Does the API enrich company data?</AccordionTrigger>
    <AccordionContent>No. It extracts visible fields. Enrichment requires external systems.</AccordionContent>
  </AccordionItem>
  <AccordionItem value="q4">
    <AccordionTrigger>How do I prevent duplicate companies?</AccordionTrigger>
    <AccordionContent>Use domain normalization and entity deduplication in your own database.</AccordionContent>
  </AccordionItem>
  <AccordionItem value="q5">
    <AccordionTrigger>Can I scrape contact forms?</AccordionTrigger>
    <AccordionContent>You can extract form structure, but submission workflows require browser automation logic on your side.</AccordionContent>
  </AccordionItem>
</Accordion>


---

# Structured Market & Web Research (/docs/documentation/use-cases/market-research)

Collect structured facts from many web sources for **market research**, **category research**, and **competitive landscape mapping**. This includes aggregating lists, extracting entities, and building a dataset you can query.

---

### Common sources

* Directories (companies, tools, marketplaces)
* Public listings pages (partners, agencies, vendor ecosystems)
* Industry reports pages and statistics pages
* Public datasets pages and data portals

---

### What to extract

* Entities: name, description, category, website, location
* Pricing/positioning summaries (when publicly listed)
* Metadata: tags, industries, integrations, target audience
* Tables and structured lists
* Links to "detail pages" for deeper extraction

---

### Implementation notes

* Start with list pages → collect detail URLs → scrape detail pages for full schema.
* Use dedupe by domain + entity name normalization.
* Keep provenance: every extracted entity should retain its source URL and scrape timestamp.

---

### FAQs

<Accordion type="single" collapsible className="w-full">
  <AccordionItem value="q1">
    <AccordionTrigger>Can I scrape entire directories?</AccordionTrigger>
    <AccordionContent>Yes. Start from listing pages, collect detail page URLs, then scrape each detail page.</AccordionContent>
  </AccordionItem>
  <AccordionItem value="q2">
    <AccordionTrigger>Does the API deduplicate entities across sources?</AccordionTrigger>
    <AccordionContent>No. Deduplication must be implemented in your data pipeline.</AccordionContent>
  </AccordionItem>
  <AccordionItem value="q3">
    <AccordionTrigger>Can I extract structured attributes consistently across different sites?</AccordionTrigger>
    <AccordionContent>Yes, but you define the schema. Each source may require slightly different extraction logic.</AccordionContent>
  </AccordionItem>
  <AccordionItem value="q4">
    <AccordionTrigger>Is rendering required for directory sites?</AccordionTrigger>
    <AccordionContent>Often yes. Many modern directories load content via client-side JavaScript.</AccordionContent>
  </AccordionItem>
  <AccordionItem value="q5">
    <AccordionTrigger>Can I crawl multiple levels deep?</AccordionTrigger>
    <AccordionContent>Yes, as long as you manage crawl scope and URL constraints in your workflow.</AccordionContent>
  </AccordionItem>
</Accordion>


---

# ML & Training Data Collection (/docs/documentation/use-cases/ml-training-data)

Create datasets from the web for **machine learning**, including **NLP**, **information extraction**, **classification**, and **entity recognition** pipelines.

---

### Common sources

* Public articles, blogs, documentation, forums
* Public product catalogs and listings
* Tables and structured lists useful as labeled sources

---

### What to extract

* Clean text with provenance (URL, timestamp)
* Structured fields suitable for supervised labels (title/category/price/attributes)
* Tables as normalized rows
* Image URLs / media metadata (if needed for CV pipelines)

---

### Implementation notes

* Keep dataset rows deterministic: same URL → same schema fields.
* Store raw + cleaned versions (raw HTML optional).
* Use stable identifiers: `source_url`, `content_hash`, `extraction_version`.

---

### FAQs

<Accordion type="single" collapsible className="w-full">
  <AccordionItem value="q1">
    <AccordionTrigger>Does the API label training data?</AccordionTrigger>
    <AccordionContent>No. It extracts raw structured data; labeling is your responsibility.</AccordionContent>
  </AccordionItem>
  <AccordionItem value="q2">
    <AccordionTrigger>Can I collect large volumes of data?</AccordionTrigger>
    <AccordionContent>Yes, subject to your usage limits and rate management.</AccordionContent>
  </AccordionItem>
  <AccordionItem value="q3">
    <AccordionTrigger>Is the extracted output deterministic?</AccordionTrigger>
    <AccordionContent>Yes, if the source page content is unchanged.</AccordionContent>
  </AccordionItem>
  <AccordionItem value="q4">
    <AccordionTrigger>Can I extract multilingual content?</AccordionTrigger>
    <AccordionContent>Yes. The API returns content as rendered on the page.</AccordionContent>
  </AccordionItem>
  <AccordionItem value="q5">
    <AccordionTrigger>Should I store raw HTML for training datasets?</AccordionTrigger>
    <AccordionContent>That depends on your model objective. Structured JSON is typically easier to manage.</AccordionContent>
  </AccordionItem>
</Accordion>


---

# Review & Sentiment Data Extraction (/docs/documentation/use-cases/review-sentiment)

Collect structured text from reviews, forums, and community posts for **sentiment analysis**, **topic modeling**, and **voice-of-customer** pipelines.

---

### Common sources

* Review pages (product/service reviews)
* Community threads and Q&A forums
* Public social-like pages (web accessible)

---

### What to extract

* Review/post text, rating (if present), date
* Author handle (if public), verified flags (if present)
* Helpful votes / reactions (if present)
* Thread structure: parent/child relationships
* Product/entity identifiers (SKU, product name, URL)

---

### Implementation notes

* Prefer structured fields: `rating`, `body`, `timestamp`, `thread_id`, `reply_to`.
* Handle pagination carefully; store page cursors.
* Keep raw text clean (strip UI noise like "Read more", "Translate").

---

### FAQs

<Accordion type="single" collapsible className="w-full">
  <AccordionItem value="q1">
    <AccordionTrigger>Does the API calculate sentiment?</AccordionTrigger>
    <AccordionContent>No. It extracts review text and metadata. Sentiment scoring must be done separately.</AccordionContent>
  </AccordionItem>
  <AccordionItem value="q2">
    <AccordionTrigger>Can I scrape paginated reviews?</AccordionTrigger>
    <AccordionContent>Yes. You must manage pagination logic in your workflow.</AccordionContent>
  </AccordionItem>
  <AccordionItem value="q3">
    <AccordionTrigger>Can I extract ratings and timestamps?</AccordionTrigger>
    <AccordionContent>Yes, if those elements are visible in the rendered DOM.</AccordionContent>
  </AccordionItem>
  <AccordionItem value="q4">
    <AccordionTrigger>How do I avoid duplicate reviews?</AccordionTrigger>
    <AccordionContent>Use review IDs or compute a hash of stable fields like author, date, and content.</AccordionContent>
  </AccordionItem>
  <AccordionItem value="q5">
    <AccordionTrigger>Can I extract nested replies?</AccordionTrigger>
    <AccordionContent>Yes, as long as reply hierarchy is present in the DOM.</AccordionContent>
  </AccordionItem>
</Accordion>


---

# SEO & Search Intelligence (/docs/documentation/use-cases/seo-marketing)

Extract data from search and content surfaces for **SERP research**, **keyword intelligence**, **content auditing**, and **AEO/answer engine optimization** workflows.

---

### Common sources

* Search results pages (where accessible)
* Competitor content hubs and blog archives
* Programmatic landing pages
* FAQ-rich pages / schema-heavy pages

---

### What to extract

* Page title, meta description, canonical URL
* Headings, FAQs, structured data markers
* Internal links and topic clusters
* Publish date and author (if present)
* Content layout: lists, tables, definitions

---

### Implementation notes

* Rendering helps when SERP pages are JS-heavy.
* Extract "main content" + metadata; ignore navigation elements.
* Store structured blocks for downstream scoring (readability, topical coverage, schema presence).

---

### FAQs

<Accordion type="single" collapsible className="w-full">
  <AccordionItem value="q1">
    <AccordionTrigger>Is this a rank tracking tool?</AccordionTrigger>
    <AccordionContent>No. You can extract SERP or page content, but tracking and comparison must be built separately.</AccordionContent>
  </AccordionItem>
  <AccordionItem value="q2">
    <AccordionTrigger>Can I extract meta tags and structured data?</AccordionTrigger>
    <AccordionContent>Yes. Titles, meta descriptions, canonical tags, and schema markup can be captured.</AccordionContent>
  </AccordionItem>
  <AccordionItem value="q3">
    <AccordionTrigger>Does the API analyze keyword performance?</AccordionTrigger>
    <AccordionContent>No. It extracts page content and metadata. Analysis happens downstream.</AccordionContent>
  </AccordionItem>
  <AccordionItem value="q4">
    <AccordionTrigger>Can I extract FAQ sections from pages?</AccordionTrigger>
    <AccordionContent>Yes, if they are present in the DOM or marked up with structured data.</AccordionContent>
  </AccordionItem>
  <AccordionItem value="q5">
    <AccordionTrigger>Is rendering required for search result pages?</AccordionTrigger>
    <AccordionContent>Often yes, as many are dynamically generated.</AccordionContent>
  </AccordionItem>
</Accordion>


---

# Integrations (/docs/integrations)

Use AnakinScraper inside your IDE, AI frameworks, and workflow automation platforms.

---

### Plugins & Skills

Use AnakinScraper inside your AI agent or code editor. Scrape, search, and research without leaving your environment.

| Integration | Status | Description |
|-------------|--------|-------------|
| [Claude Code](/docs/integrations/ide-plugins/claude-code) | Available | Plugin for Claude Code with skills, agents, and hooks |
| [Cursor](/docs/integrations/ide-plugins/cursor) | Available | Plugin for Cursor with rules, skills, and agents |
| [OpenClaw](/docs/integrations/ide-plugins/openclaw) | Available | Skill for OpenClaw AI agents on ClawHub |

---

### AI Frameworks

Integrate AnakinScraper into AI application frameworks.

| Integration | Status | Description |
|-------------|--------|-------------|
| [Google ADK](/docs/integrations/ai-frameworks/google-adk) | Available | ADK tools for scraping, search, and research in Gemini agents |
| [LangChain](/docs/integrations/ai-frameworks/langchain) | Coming Soon | Document Loader, Tools, and Retriever for scraping and search |
| [LlamaIndex](/docs/integrations/ai-frameworks/llamaindex) | Coming Soon | Reader and Tools for RAG pipelines and agents |
| [CrewAI](/docs/integrations/ai-frameworks/crewai) | Coming Soon | Tools for multi-agent scraping, search, and research |
| [Langflow](/docs/integrations/ai-frameworks/langflow) | Coming Soon | Visual drag-and-drop components for scraping and search |
| [Flowise](/docs/integrations/ai-frameworks/flowise) | Coming Soon | Visual chatflow nodes for scraping and search |

---

### Workflow Automation

Trigger scrapes, searches, and research from your automation workflows.

| Integration | Status | Description |
|-------------|--------|-------------|
| [Dify](/docs/integrations/workflow/dify) | Available | Plugin with 5 tools for Dify AI workflows |
| [n8n](/docs/integrations/workflow/n8n) | Coming Soon | Community node with scrape, search, and agentic search |
| [Zapier](/docs/integrations/workflow/zapier) | Available | 4 actions: scrape, AI search, agentic search, get results |
| [Make](/docs/integrations/workflow/make) | Available | 4 native modules: scrape, poll, agentic search, AI search |


---

# MCP Server (/docs/integrations/ai-agents/mcp-server)

The [`@anakin-io/mcp`](https://www.npmjs.com/package/@anakin-io/mcp) package is an [MCP](https://modelcontextprotocol.io) server that exposes six Anakin tools — `scrape`, `search`, `map`, `crawl`, `agentic_search`, `wire_action` — to any MCP-compatible agent client. With it installed, Claude Desktop, Cursor, etc. can fetch web pages, run AI search, crawl sites, and execute Wire actions directly from a chat or coding session.

> **Status: alpha (v0.1.x).** Tool surface and arguments may change between minor versions until v1.0.
> Package: [`@anakin-io/mcp` on npm](https://www.npmjs.com/package/@anakin-io/mcp) · Source: [github.com/Anakin-Inc/anakin-mcp](https://github.com/Anakin-Inc/anakin-mcp).

---

## Quick install (recommended)

One command auto-configures every detected agent client on your machine:

```bash
npx -y @anakin-io/mcp init --all
```

You'll be prompted for your API key (or set `ANAKIN_API_KEY` first to skip the prompt). Get one free at the [Dashboard](/dashboard) — 500 credits, no card required.

After it finishes, **restart your agent client(s)**. The `anakin` MCP server appears in the tool list, exposing six tools.

If you'd rather configure one specific client:

```bash
npx -y @anakin-io/mcp init --client=cursor
```

Available client names: `claude-desktop`, `claude-code`, `cursor`, `cline`, `continue`, `zed`, `windsurf`, `vscode`.

---

## What gets exposed

Each tool is a thin wrapper around the matching Anakin REST endpoint. Agents see typed input schemas (so they know what arguments each tool takes) and get back a string payload they can quote in their replies.

| Tool | Purpose | Async? |
|---|---|---|
| `scrape` | Fetch one URL → markdown by default. Set `generateJson: true` for AI-extracted structured data. Set `useBrowser: true` for SPAs. | async (3–15s typical) |
| `search` | AI web search with citations. Returns URL + title + snippet for each hit. | sync |
| `map` | Discover all reachable URLs on a domain. | async |
| `crawl` | Bulk-fetch markdown across a site (with include / exclude patterns). | async |
| `agentic_search` | Multi-source deep research. Searches the web, scrapes citations, structures the combined data with an LLM. | async (1–5 min) |
| `wire_action` | Execute a pre-built website action via [Wire](/docs/api-reference/holocron) (login flows, form fills, etc.). | async |

---

## Manual setup per client

If you'd rather edit config files yourself, copy the right snippet for your client. **Set your real API key** in `env.ANAKIN_API_KEY` — the agent never sees it; it lives only in this local config file.

### Claude Desktop

| Platform | Path |
|---|---|
| macOS | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| Windows | `%APPDATA%/Claude/claude_desktop_config.json` |

```json
{
  "mcpServers": {
    "anakin": {
      "command": "npx",
      "args": ["-y", "@anakin-io/mcp"],
      "env": {
        "ANAKIN_API_KEY": "ak-..."
      }
    }
  }
}
```

Restart Claude Desktop.

### Claude Code (Anthropic CLI)

Edit `~/.claude/settings.json`:

```json
{
  "mcpServers": {
    "anakin": {
      "command": "npx",
      "args": ["-y", "@anakin-io/mcp"],
      "env": {
        "ANAKIN_API_KEY": "ak-..."
      }
    }
  }
}
```

Or use Claude Code's built-in command:

```bash
claude mcp add anakin npx -y @anakin-io/mcp -e ANAKIN_API_KEY=ak-...
```

### Cursor

Edit `~/.cursor/mcp.json` (user-scoped) or `./.cursor/mcp.json` (project-scoped):

```json
{
  "mcpServers": {
    "anakin": {
      "command": "npx",
      "args": ["-y", "@anakin-io/mcp"],
      "env": {
        "ANAKIN_API_KEY": "ak-..."
      }
    }
  }
}
```

Restart Cursor.

### Cline (VS Code extension)

| Platform | Path |
|---|---|
| macOS | `~/Library/Application Support/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json` |
| Linux | `~/.config/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json` |
| Windows | `%APPDATA%/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json` |

```json
{
  "mcpServers": {
    "anakin": {
      "command": "npx",
      "args": ["-y", "@anakin-io/mcp"],
      "env": {
        "ANAKIN_API_KEY": "ak-..."
      }
    }
  }
}
```

Reload the Cline extension (or restart VS Code).

### Continue (IDE extension)

Edit `~/.continue/config.json`:

```json
{
  "experimental": {
    "modelContextProtocolServers": [
      {
        "name": "anakin",
        "command": "npx",
        "args": ["-y", "@anakin-io/mcp"],
        "env": {
          "ANAKIN_API_KEY": "ak-..."
        }
      }
    ]
  }
}
```

If you have other entries under `experimental.modelContextProtocolServers`, append the `anakin` object — don't overwrite. Reload the Continue extension.

### Zed

| Platform | Path |
|---|---|
| macOS | `~/.config/zed/settings.json` |
| Linux | `~/.config/zed/settings.json` |
| Windows | `%APPDATA%/Zed/settings.json` |

```json
{
  "context_servers": {
    "anakin": {
      "command": "npx",
      "args": ["-y", "@anakin-io/mcp"],
      "env": {
        "ANAKIN_API_KEY": "ak-..."
      }
    }
  }
}
```

Reload Zed.

### Windsurf

Edit `~/.codeium/windsurf/mcp_config.json`:

```json
{
  "mcpServers": {
    "anakin": {
      "command": "npx",
      "args": ["-y", "@anakin-io/mcp"],
      "env": {
        "ANAKIN_API_KEY": "ak-..."
      }
    }
  }
}
```

Restart Windsurf.

### VS Code (with the MCP extension)

Edit `.vscode/mcp.json` in your workspace:

```json
{
  "servers": {
    "anakin": {
      "command": "npx",
      "args": ["-y", "@anakin-io/mcp"],
      "env": {
        "ANAKIN_API_KEY": "ak-..."
      }
    }
  }
}
```

Reload VS Code.

---

## Verify it works

In Claude Desktop / Cursor / etc., start a new chat and try:

> Use anakin to scrape https://example.com and return the markdown.

The agent should:

1. Find the `scrape` tool in `anakin`'s tool list
2. Call `scrape({ url: "https://example.com" })`
3. Quote back the rendered markdown

You can also try other tools:

> Use anakin's search to find recent articles about MCP servers.

> Use anakin to map the URLs on https://docs.anakin.io and pick three to scrape.

> Use anakin's agentic_search for a comparative analysis of TypeScript HTTP libraries.

---

## How the API key flows

Your key never enters the conversation context. It lives **only** in the agent client's local config file (e.g., `claude_desktop_config.json`), gets passed to the MCP server subprocess as an environment variable when the client starts, and from there is sent in the `X-API-Key` header on every Anakin REST request.

If `ANAKIN_API_KEY` is unset or empty when the server starts, it exits with a message pointing at the [Dashboard](/dashboard). The agent client typically surfaces that error in its MCP servers panel; the agent itself just sees `anakin` missing from its tool list.

If the key is invalid or you're out of credits, the first tool call returns an error (`Invalid API key` or `Insufficient credits`) which the agent reports back to you. Update the config and restart the client.

---

## Troubleshooting

**The MCP servers panel shows `anakin` as "Failed"**
→ Click the entry to see the stderr output. Most common: `ANAKIN_API_KEY is not set` (fix: fill in `env.ANAKIN_API_KEY` and restart) or a JSON syntax error in your config (fix: validate with `cat <config> | jq .`).

**`anakin` doesn't appear in the tool list at all**
→ The client hasn't reloaded the config. Quit fully (⌘Q on macOS) and reopen.

**Tool call returns "Invalid API key"**
→ Key is wrong or revoked. Get a fresh one from the [Dashboard](/dashboard).

**Tool call returns "Insufficient credits"**
→ Top up at the [Dashboard](/dashboard). Failed jobs aren't charged, so credits only deduct on successful operations.

**`init --all` says "No supported MCP clients detected"**
→ The init command checks for the existence of each client's config directory. If a client is installed but you've never opened it (or you installed via an unusual method that doesn't create the standard dir), pass the client name explicitly:

```bash
npx -y @anakin-io/mcp init --client=cursor
```

That always writes the config, creating any missing parent directories.

---

## Two paths agents can use Anakin

This MCP server is one of two complementary integration paths:

1. **MCP** (this page) — for clients that support it. Tools are typed and called natively. Best when available.
2. **[SKILL.md](https://anakin.io/agent-onboarding/SKILL.md)** — for any agent that can fetch a URL. The markdown describes the API end-to-end so an agent can use it via plain HTTP calls. Works in environments without subprocess support.

Most users on Claude Desktop / Cursor / Windsurf / VS Code will want path 1. Custom agents and CI agents can use path 2.

---

## Related

- [`anakin-mcp` on GitHub](https://github.com/Anakin-Inc/anakin-mcp) — source, releases, issue tracker
- [`@anakin-io/sdk`](https://github.com/Anakin-Inc/anakin-node) — Node.js / TypeScript SDK
- [`anakin`](https://github.com/Anakin-Inc/anakin-py) — Python SDK
- [`anakin-cli`](https://github.com/Anakin-Inc/anakin-cli) — Python CLI for terminal-driven use
- [SKILL.md](https://anakin.io/agent-onboarding/SKILL.md) — agent-onboarding doc for non-MCP agents
- [API reference](/docs/api-reference) — endpoint-by-endpoint REST docs


---

# Agent Onboarding (SKILL.md) (/docs/integrations/ai-agents/skill-md)

Anakin publishes a `SKILL.md` file at a permanent public URL. Any AI agent that supports tool discovery via a URL can load this file to understand Anakin's full capability surface — no manual configuration required.

**Direct URL:**

```
https://anakin.io/agent-onboarding/SKILL.md
```

---

### What it contains

The file is a structured Markdown document covering:

- What Anakin does (web scraping, crawling, AI search, Wire actions, browser sessions)
- All available API endpoints with parameters and response shapes
- Authentication instructions (`ANAKIN_API_KEY` environment variable or `X-API-Key` header)
- Usage examples in plain language the agent can follow
- Links to the full API reference and SDK docs

### Who it's for

`SKILL.md` follows the emerging convention (popularised by Firecrawl, Exa, and others) of publishing a single machine-readable onboarding document that AI agents can fetch to self-configure. It works in any context where an agent can retrieve a URL:

- **MCP clients** — reference it as a resource in your MCP config
- **Custom agents** — fetch it at startup and inject it as system context
- **AI coding assistants** — paste the URL into the system prompt or initial message
- **LLM pipelines** — use it as a tool-definition source for function-calling setups

### Using it in a prompt

```
Before using any Anakin tools, read the onboarding document at:
https://anakin.io/agent-onboarding/SKILL.md
```

The agent will fetch the file, understand what Anakin can do, and start using the correct endpoints and parameters without further instruction.

### Format

The file is served as `Content-Type: text/markdown` with no authentication. It is always current — updated in sync with the API.


---

# CrewAI (/docs/integrations/ai-frameworks/crewai)

<ComingSoonBanner description="This is currently under active development. Stay tuned for updates." />

| | |
|---|---|
| **Framework** | [CrewAI](https://www.crewai.com) |
| **Type** | Tool |

---

### What to expect

The CrewAI integration will provide tools that agents can use autonomously:

- **Scrape Tool** — Agents scrape any URL and get back clean markdown or structured JSON
- **Search Tool** — Agents perform AI-powered web searches with instant results
- **Research Tool** — Agents run deep multi-stage research on any topic

---

### In the meantime

You can integrate AnakinScraper into your CrewAI agents today using the [REST API](/docs/api-reference) with CrewAI's custom tool support, or use the [Anakin CLI](/docs/sdks/cli) as a subprocess tool.

---

### Stay updated

- **Discord** — [discord.gg/T57dHrdT8u](https://discord.gg/T57dHrdT8u)
- **Email** — support@anakin.io


---

# Flowise (/docs/integrations/ai-frameworks/flowise)

<ComingSoonBanner description="This is currently under active development. Stay tuned for updates." />

| | |
|---|---|
| **Framework** | [Flowise](https://flowiseai.com) |
| **Type** | Component |

---

### What to expect

The Flowise integration will provide visual nodes for:

- **Scrape Node** — Scrape any URL and pass clean data to downstream nodes
- **Search Node** — AI-powered web search as a chatflow node
- **Research Node** — Deep agentic research as a chatflow node

---

### In the meantime

You can use AnakinScraper in Flowise today via the **Custom Tool** or **HTTP Request** node with the [REST API](/docs/api-reference).

---

### Stay updated

- **Discord** — [discord.gg/T57dHrdT8u](https://discord.gg/T57dHrdT8u)
- **Email** — support@anakin.io


---

# Google ADK (/docs/integrations/ai-frameworks/google-adk)

Google ADK tools for web scraping, search, and research — powered by Anakin. Build AI agents with Gemini that can extract data from any website, perform intelligent web searches, and conduct deep autonomous research.

| | |
|---|---|
| **PyPI** | [pypi.org/project/anakin-adk](https://pypi.org/project/anakin-adk/) |
| **Source** | [GitHub](https://github.com/Anakin-Inc/anakin-adk) |
| **Type** | Tool |
| **Version** | 0.1.2 |
| **Tools** | 4 |
| **License** | MIT |
| **Requires** | Python >=3.10 |

---

### How it works

You register Anakin tools with your Google ADK agent. When a user asks something that requires web data, Gemini automatically selects the right tool, fills in the parameters, and returns the results — no manual configuration needed.

```
User → "What's on this page?" → Gemini agent → scrape_website → Anakin API → results → Gemini → response
```

The tools expose their parameter schemas to Gemini via ADK's tool protocol, so the model knows when to use the browser, which country to route through, and whether to extract structured JSON — all based on the conversation context and your agent's instructions.

---

### Key features

- **Anti-detection** — Proxy routing across 207 countries prevents blocking
- **Intelligent Caching** — Up to 30x faster on repeated requests
- **AI Extraction** — Convert any webpage into structured JSON
- **Browser Automation** — Full headless Chrome support for SPAs and JS-heavy sites
- **Batch Processing** — Scrape up to 10 URLs in a single request
- **Deep Research** — Autonomous multi-stage research combining search, scraping, and AI synthesis

---

### Setup

#### 1. Get your API key

1. Sign up at [anakin.io/signup](/signup)
2. Go to your [Dashboard](/dashboard)
3. Copy your API key (starts with `ask_`)

#### 2. Install the package

```bash
pip install anakin-adk
```

You also need the Anakin CLI installed and authenticated:

```bash
pip install anakin-cli
anakin login --api-key "ask_your-key-here"
```

---

### Tools

Each tool is exposed to Gemini with a full parameter schema. The model decides which parameters to use based on the user's request and your agent instructions. You can guide tool behavior by including hints in your agent's `instruction` field (e.g., "always use the browser for JavaScript-heavy sites" or "route through UK proxies").

#### 1. scrape_website

Scrape a single URL and return clean markdown or structured JSON.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `url` | string | Yes | — | Target URL to scrape (HTTP/HTTPS) |
| `country` | string | No | `us` | Proxy location from [207 countries](/docs/api-reference/supported-countries) |
| `use_browser` | boolean | No | `false` | Enable headless Chrome for JavaScript-heavy sites |
| `generate_json` | boolean | No | `false` | Use AI to extract structured data |
| `session_id` | string | No | — | Browser session ID for [authenticated pages](/docs/api-reference/browser-sessions) |

**Response includes:** Raw HTML, cleaned HTML, markdown conversion, structured JSON (if `generate_json` enabled), cache status, timing metrics.

---

#### 2. batch_scrape

Scrape up to 10 URLs at once and return combined results.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `urls` | string | Yes | — | Comma-separated list of URLs (1–10) |
| `country` | string | No | `us` | Proxy location from [207 countries](/docs/api-reference/supported-countries) |
| `use_browser` | boolean | No | `false` | Enable headless Chrome for JavaScript-heavy sites |
| `generate_json` | boolean | No | `false` | Use AI to extract structured data from each page |

**Response includes:** Per-URL results with HTML, markdown, and optional structured JSON.

---

#### 3. search_web

AI-powered web search returning results with citations. Results are returned immediately without polling.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `prompt` | string | Yes | — | Search query or question |
| `limit` | number | No | `5` | Maximum results to return |

**Response includes:** Array of results with URLs, titles, snippets, publication dates, last updated timestamps.

---

#### 4. deep_research

Autonomous multi-stage research pipeline combining search, scraping, and AI synthesis. Takes 1–5 minutes.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `prompt` | string | Yes | Research question or topic |

**Response includes:** Comprehensive AI-generated report, structured findings, citations with source URLs, scraped source data, processing metrics.

---

### Processing times

| Tool | Type | Typical Duration |
|------|------|------------------|
| scrape_website | Async | 3–15 seconds |
| batch_scrape | Async | 5–30 seconds |
| search_web | **Sync** | Immediate |
| deep_research | Async | 1–5 minutes |

---

### Usage

#### Full toolkit

Pass all 4 tools to your agent at once:

```python
from anakin_adk import AnakinToolkit
from google.adk.agents import Agent

agent = Agent(
    model="gemini-2.5-pro",
    name="web_researcher",
    instruction="Help users extract data from the web",
    tools=AnakinToolkit().get_tools(),
)
```

Run with the ADK dev UI:

```bash
adk web
```

#### Individual tools

Use specific tools instead of the full toolkit:

```python
from anakin_adk import ScrapeWebsiteTool, SearchWebTool
from google.adk.agents import Agent

agent = Agent(
    model="gemini-2.5-pro",
    name="search_and_scrape",
    instruction="Search the web and scrape relevant pages",
    tools=[SearchWebTool(), ScrapeWebsiteTool()],
)
```

#### Product research agent

An agent that compares products by scraping multiple pages:

```python
from anakin_adk import AnakinToolkit
from google.adk.agents import Agent

agent = Agent(
    model="gemini-2.5-pro",
    name="product_researcher",
    instruction="""You are a product research assistant.
When asked to compare products:
1. Use search_web to find relevant product pages
2. Use batch_scrape with generate_json=true to extract structured data
3. Summarize findings in a comparison table""",
    tools=AnakinToolkit().get_tools(),
)
```

#### Deep research agent

An agent for comprehensive research reports:

```python
from anakin_adk import DeepResearchTool
from google.adk.agents import Agent

agent = Agent(
    model="gemini-2.5-pro",
    name="deep_researcher",
    instruction="""You are a research analyst.
Use deep_research for broad questions that need multiple sources.
Use search_web + scrape_website for targeted fact-checking.""",
    tools=AnakinToolkit().get_tools(),
)
```

#### Geo-targeted scraping agent

An agent that routes through specific country proxies:

```python
from anakin_adk import AnakinToolkit
from google.adk.agents import Agent

agent = Agent(
    model="gemini-2.5-pro",
    name="geo_scraper",
    instruction="""You scrape websites for users.
Always ask which country to route through.
Use use_browser=true for JavaScript-heavy sites.
Use generate_json=true when the user wants structured data.""",
    tools=AnakinToolkit().get_tools(),
)
```

#### More examples

The [examples directory](https://github.com/Anakin-Inc/anakin-adk/tree/main/examples) includes:

- **`basic_scraping.py`** — Simple scrape agent
- **`research_agent.py`** — Deep research agent
- **`search_and_scrape.py`** — Multi-step: search then scrape

---

### Troubleshooting

| Code | Meaning | Action |
|------|---------|--------|
| 400 | Invalid parameters | Check your agent's instructions — Gemini may be passing unexpected values |
| 401 | Invalid API key | Run `anakin login` to re-authenticate |
| 402 | Plan upgrade required | Upgrade at [Pricing](/docs/documentation/pricing) |
| 404 | Job not found | Job may have expired |
| 429 | Rate limit exceeded | Reduce request frequency or upgrade your plan |
| 5xx | Server error | Retry with backoff |

**Common issues:**

| Issue | Fix |
|-------|-----|
| Agent never uses tools | Check that `tools=` is set correctly and the instruction mentions web tasks |
| Empty scrape results | Add `use_browser=true` hint to your agent instruction for JS-heavy sites |
| Wrong country data | Add a country hint to your instruction (e.g., "always route through `gb`") |
| CLI not authenticated | Run `anakin status` to check, then `anakin login` if needed |

---

### Stay updated

- **Discord** — [discord.gg/T57dHrdT8u](https://discord.gg/T57dHrdT8u)
- **Email** — support@anakin.io


---

# LangChain (/docs/integrations/ai-frameworks/langchain)

<ComingSoonBanner description="This is currently under active development. Stay tuned for updates." />

---

### What to expect

The LangChain integration will provide:

- **Document Loader** — Load web pages as LangChain documents using AnakinScraper's scraping engine
- **Search Tool** — AI-powered web search as a LangChain tool for agents
- **Research Tool** — Deep agentic research as a LangChain tool

---

### In the meantime

You can integrate AnakinScraper into your LangChain applications today using the [REST API](/docs/api-reference) with LangChain's custom tool support, or use the [Anakin CLI](/docs/sdks/cli) as a subprocess tool.

---

### Stay updated

- **Discord** — [discord.gg/T57dHrdT8u](https://discord.gg/T57dHrdT8u)
- **Email** — support@anakin.io


---

# Langflow (/docs/integrations/ai-frameworks/langflow)

<ComingSoonBanner description="This is currently under active development. Stay tuned for updates." />

| | |
|---|---|
| **Framework** | [Langflow](https://www.langflow.org) |
| **Type** | Component |

---

### What to expect

The Langflow integration will provide visual drag-and-drop components for:

- **Scrape Component** — Scrape any URL and feed clean data into your flow
- **Search Component** — AI-powered web search as a flow node
- **Research Component** — Deep agentic research as a flow node

---

### In the meantime

You can use AnakinScraper in Langflow today via the **HTTP Request** component with the [REST API](/docs/api-reference).

---

### Stay updated

- **Discord** — [discord.gg/T57dHrdT8u](https://discord.gg/T57dHrdT8u)
- **Email** — support@anakin.io


---

# LlamaIndex (/docs/integrations/ai-frameworks/llamaindex)

<ComingSoonBanner description="This is currently under active development. Stay tuned for updates." />

| | |
|---|---|
| **Framework** | [LlamaIndex](https://www.llamaindex.ai) |
| **Type** | Reader |

---

### What to expect

The LlamaIndex integration will provide:

- **AnakinReader** — Load web pages as LlamaIndex `Document` objects for RAG pipelines, indexing, and querying
- **Search Tool** — AI-powered web search as a LlamaIndex tool for agents
- **Research Tool** — Deep agentic research as a LlamaIndex tool

---

### In the meantime

You can integrate AnakinScraper into your LlamaIndex applications today using the [REST API](/docs/api-reference) with LlamaIndex's custom reader support, or use the [Anakin CLI](/docs/sdks/cli) as a subprocess tool.

---

### Stay updated

- **Discord** — [discord.gg/T57dHrdT8u](https://discord.gg/T57dHrdT8u)
- **Email** — support@anakin.io


---

# Claude Code (/docs/integrations/ide-plugins/claude-code)

Scrape websites, search the web, and run deep research directly inside Claude Code.

| | |
|---|---|
| **Source** | [GitHub](https://github.com/Anakin-Inc/anakin-claude-plugin) |
| **License** | MIT |
| **Requires** | [anakin-cli](/docs/sdks/cli) (Python 3.10+) |

---

### Prerequisites

- **Claude Code** installed and working
- **Python 3.10+** — required for [anakin-cli](/docs/sdks/cli) (installed automatically by the plugin)
- **API key** — get one from the [Dashboard](/dashboard) (the plugin will prompt you if needed)

---

### Setup

Clone the plugin from GitHub and point Claude Code to it:

```bash
git clone https://github.com/Anakin-Inc/anakin-claude-plugin.git
claude --plugin-dir ./anakin-claude-plugin
```

The plugin handles the rest automatically — its `check-auth` hook verifies that `anakin-cli` is installed and authenticated before running commands, and the `/anakin:setup` skill can install the CLI and configure your API key if needed.

---

### Skills

The plugin adds these skills to Claude Code:

| Skill | Command | Description |
|-------|---------|-------------|
| Scrape Website | `/anakin:scrape-website [url]` | Scrape a single URL to markdown, JSON, or raw |
| Scrape Batch | `/anakin:scrape-batch [url1] [url2]` | Scrape up to 10 URLs at once |
| Search Web | `/anakin:search-web [query]` | AI-powered web search with instant results |
| Deep Research | `/anakin:deep-research [topic]` | Deep agentic multi-step research (1–5 min) |
| Setup | `/anakin:setup` | Install CLI, configure API key, set up output directory |
| CLI Knowledge | *(auto)* | Background knowledge: escalation workflow, CLI rules, output organization |

---

### Agents

| Agent | Description |
|-------|-------------|
| `data-extraction-architect` | Plans which anakin-cli commands to use for complex extraction tasks |

---

### Hooks

| Hook | Event | Description |
|------|-------|-------------|
| `check-auth` | `PreToolUse` (Bash) | Verifies anakin-cli is installed and authenticated before running commands |

---

### Usage

Once the plugin is active, Claude will use Anakin automatically for scraping and search tasks. You can also invoke skills directly:

```
/anakin:search-web latest React documentation

/anakin:scrape-website https://example.com

/anakin:deep-research pros and cons of microservices vs monolith

/anakin:scrape-batch https://a.com https://b.com https://c.com
```

All output is saved to the `.anakin/` directory to keep your context window clean:

```
.anakin/
├── search-react-docs.json
├── example.com.md
├── batch-results.json
└── research-microservices.json
```

---

### Configuration

| Variable | Description |
|----------|-------------|
| `ANAKIN_API_KEY` | API key (env var, takes precedence over config file) |
| `~/.anakin/config.json` | Stored API key (set via `anakin login`) |


---

# Cursor (/docs/integrations/ide-plugins/cursor)

Scrape websites, search the web, and run deep research directly inside Cursor.

| | |
|---|---|
| **Source** | [GitHub](https://github.com/Anakin-Inc/anakin-cursor-plugin) |
| **License** | MIT |
| **Requires** | [anakin-cli](/docs/sdks/cli) (Python 3.10+) |

---

### Prerequisites

- **Cursor** installed and working
- **Python 3.10+** — required for [anakin-cli](/docs/sdks/cli) (installed automatically by the plugin)
- **API key** — get one from the [Dashboard](/dashboard) (the plugin will prompt you if needed)

---

### Setup

Clone the plugin from GitHub and add it to Cursor:

```bash
git clone https://github.com/Anakin-Inc/anakin-cursor-plugin.git
/add-plugin anakin
```

The plugin handles the rest automatically — its `anakin-setup` rule ensures `anakin-cli` is installed and authenticated before running commands.

---

### Skills

| Skill | Description |
|-------|-------------|
| `scrape-website` | Scrape a single URL to markdown, JSON, or raw using `anakin scrape` |
| `scrape-batch` | Scrape up to 10 URLs at once using `anakin scrape-batch` |
| `search-web` | AI-powered web search using `anakin search` |
| `deep-research` | Deep agentic research across multiple sources using `anakin research` |

---

### Rules

| Rule | Description |
|------|-------------|
| `anakin-setup` | Ensures anakin-cli is installed and authenticated before running commands |
| `anakin-cli-usage` | URL quoting, output handling, format defaults, and error recovery |

---

### Agents

| Agent | Description |
|-------|-------------|
| `data-extraction-architect` | Plans which anakin-cli commands to use for complex extraction tasks |

---

### Usage

Once the plugin is installed, Cursor's AI agent will automatically use Anakin for web scraping and search tasks. You can also reference the skills directly in your prompts.

---

### Configuration

| Variable | Description |
|----------|-------------|
| `ANAKIN_API_KEY` | API key (env var, takes precedence over config file) |
| `~/.anakin/config.json` | Stored API key (set via `anakin login`) |


---

# MCP Server (/docs/integrations/ide-plugins/mcp-server)

The [`@anakin-io/mcp`](https://www.npmjs.com/package/@anakin-io/mcp) package is an [MCP](https://modelcontextprotocol.io) server that exposes six Anakin tools — `scrape`, `search`, `map`, `crawl`, `agentic_search`, `wire_action` — to any MCP-compatible agent client. With it installed, Claude Desktop, Cursor, etc. can fetch web pages, run AI search, crawl sites, and execute Wire actions directly from a chat or coding session.

> **Status: alpha (v0.1.x).** Tool surface and arguments may change between minor versions until v1.0.
> Package: [`@anakin-io/mcp` on npm](https://www.npmjs.com/package/@anakin-io/mcp) · Source: [github.com/Anakin-Inc/anakin-mcp](https://github.com/Anakin-Inc/anakin-mcp).

---

## Quick install (recommended)

One command auto-configures every detected agent client on your machine:

```bash
npx -y @anakin-io/mcp init --all
```

You'll be prompted for your API key (or set `ANAKIN_API_KEY` first to skip the prompt). Get one free at the [Dashboard](/dashboard) — 500 credits, no card required.

After it finishes, **restart your agent client(s)**. The `anakin` MCP server appears in the tool list, exposing six tools.

If you'd rather configure one specific client:

```bash
npx -y @anakin-io/mcp init --client=cursor
```

Available client names: `claude-desktop`, `claude-code`, `cursor`, `cline`, `continue`, `zed`, `windsurf`, `vscode`.

---

## What gets exposed

Each tool is a thin wrapper around the matching Anakin REST endpoint. Agents see typed input schemas (so they know what arguments each tool takes) and get back a string payload they can quote in their replies.

| Tool | Purpose | Async? |
|---|---|---|
| `scrape` | Fetch one URL → markdown by default. Set `generateJson: true` for AI-extracted structured data. Set `useBrowser: true` for SPAs. | async (3–15s typical) |
| `search` | AI web search with citations. Returns URL + title + snippet for each hit. | sync |
| `map` | Discover all reachable URLs on a domain. | async |
| `crawl` | Bulk-fetch markdown across a site (with include / exclude patterns). | async |
| `agentic_search` | Multi-source deep research. Searches the web, scrapes citations, structures the combined data with an LLM. | async (1–5 min) |
| `wire_action` | Execute a pre-built website action via [Wire](/docs/api-reference/holocron) (login flows, form fills, etc.). | async |

---

## Manual setup per client

If you'd rather edit config files yourself, copy the right snippet for your client. **Set your real API key** in `env.ANAKIN_API_KEY` — the agent never sees it; it lives only in this local config file.

### Claude Desktop

| Platform | Path |
|---|---|
| macOS | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| Windows | `%APPDATA%/Claude/claude_desktop_config.json` |

```json
{
  "mcpServers": {
    "anakin": {
      "command": "npx",
      "args": ["-y", "@anakin-io/mcp"],
      "env": {
        "ANAKIN_API_KEY": "ak-..."
      }
    }
  }
}
```

Restart Claude Desktop.

### Claude Code (Anthropic CLI)

Edit `~/.claude/settings.json`:

```json
{
  "mcpServers": {
    "anakin": {
      "command": "npx",
      "args": ["-y", "@anakin-io/mcp"],
      "env": {
        "ANAKIN_API_KEY": "ak-..."
      }
    }
  }
}
```

Or use Claude Code's built-in command:

```bash
claude mcp add anakin npx -y @anakin-io/mcp -e ANAKIN_API_KEY=ak-...
```

### Cursor

Edit `~/.cursor/mcp.json` (user-scoped) or `./.cursor/mcp.json` (project-scoped):

```json
{
  "mcpServers": {
    "anakin": {
      "command": "npx",
      "args": ["-y", "@anakin-io/mcp"],
      "env": {
        "ANAKIN_API_KEY": "ak-..."
      }
    }
  }
}
```

Restart Cursor.

### Cline (VS Code extension)

| Platform | Path |
|---|---|
| macOS | `~/Library/Application Support/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json` |
| Linux | `~/.config/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json` |
| Windows | `%APPDATA%/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json` |

```json
{
  "mcpServers": {
    "anakin": {
      "command": "npx",
      "args": ["-y", "@anakin-io/mcp"],
      "env": {
        "ANAKIN_API_KEY": "ak-..."
      }
    }
  }
}
```

Reload the Cline extension (or restart VS Code).

### Continue (IDE extension)

Edit `~/.continue/config.json`:

```json
{
  "experimental": {
    "modelContextProtocolServers": [
      {
        "name": "anakin",
        "command": "npx",
        "args": ["-y", "@anakin-io/mcp"],
        "env": {
          "ANAKIN_API_KEY": "ak-..."
        }
      }
    ]
  }
}
```

If you have other entries under `experimental.modelContextProtocolServers`, append the `anakin` object — don't overwrite. Reload the Continue extension.

### Zed

| Platform | Path |
|---|---|
| macOS | `~/.config/zed/settings.json` |
| Linux | `~/.config/zed/settings.json` |
| Windows | `%APPDATA%/Zed/settings.json` |

```json
{
  "context_servers": {
    "anakin": {
      "command": "npx",
      "args": ["-y", "@anakin-io/mcp"],
      "env": {
        "ANAKIN_API_KEY": "ak-..."
      }
    }
  }
}
```

Reload Zed.

### Windsurf

Edit `~/.codeium/windsurf/mcp_config.json`:

```json
{
  "mcpServers": {
    "anakin": {
      "command": "npx",
      "args": ["-y", "@anakin-io/mcp"],
      "env": {
        "ANAKIN_API_KEY": "ak-..."
      }
    }
  }
}
```

Restart Windsurf.

### VS Code (with the MCP extension)

Edit `.vscode/mcp.json` in your workspace:

```json
{
  "servers": {
    "anakin": {
      "command": "npx",
      "args": ["-y", "@anakin-io/mcp"],
      "env": {
        "ANAKIN_API_KEY": "ak-..."
      }
    }
  }
}
```

Reload VS Code.

---

## Verify it works

In Claude Desktop / Cursor / etc., start a new chat and try:

> Use anakin to scrape https://example.com and return the markdown.

The agent should:

1. Find the `scrape` tool in `anakin`'s tool list
2. Call `scrape({ url: "https://example.com" })`
3. Quote back the rendered markdown

You can also try other tools:

> Use anakin's search to find recent articles about MCP servers.

> Use anakin to map the URLs on https://docs.anakin.io and pick three to scrape.

> Use anakin's agentic_search for a comparative analysis of TypeScript HTTP libraries.

---

## How the API key flows

Your key never enters the conversation context. It lives **only** in the agent client's local config file (e.g., `claude_desktop_config.json`), gets passed to the MCP server subprocess as an environment variable when the client starts, and from there is sent in the `X-API-Key` header on every Anakin REST request.

If `ANAKIN_API_KEY` is unset or empty when the server starts, it exits with a message pointing at the [Dashboard](/dashboard). The agent client typically surfaces that error in its MCP servers panel; the agent itself just sees `anakin` missing from its tool list.

If the key is invalid or you're out of credits, the first tool call returns an error (`Invalid API key` or `Insufficient credits`) which the agent reports back to you. Update the config and restart the client.

---

## Troubleshooting

**The MCP servers panel shows `anakin` as "Failed"**
→ Click the entry to see the stderr output. Most common: `ANAKIN_API_KEY is not set` (fix: fill in `env.ANAKIN_API_KEY` and restart) or a JSON syntax error in your config (fix: validate with `cat <config> | jq .`).

**`anakin` doesn't appear in the tool list at all**
→ The client hasn't reloaded the config. Quit fully (⌘Q on macOS) and reopen.

**Tool call returns "Invalid API key"**
→ Key is wrong or revoked. Get a fresh one from the [Dashboard](/dashboard).

**Tool call returns "Insufficient credits"**
→ Top up at the [Dashboard](/dashboard). Failed jobs aren't charged, so credits only deduct on successful operations.

**`init --all` says "No supported MCP clients detected"**
→ The init command checks for the existence of each client's config directory. If a client is installed but you've never opened it (or you installed via an unusual method that doesn't create the standard dir), pass the client name explicitly:

```bash
npx -y @anakin-io/mcp init --client=cursor
```

That always writes the config, creating any missing parent directories.

---

## Two paths agents can use Anakin

This MCP server is one of two complementary integration paths:

1. **MCP** (this page) — for clients that support it. Tools are typed and called natively. Best when available.
2. **[SKILL.md](https://anakin.io/agent-onboarding/SKILL.md)** — for any agent that can fetch a URL. The markdown describes the API end-to-end so an agent can use it via plain HTTP calls. Works in environments without subprocess support.

Most users on Claude Desktop / Cursor / Windsurf / VS Code will want path 1. Custom agents and CI agents can use path 2.

---

## Related

- [`anakin-mcp` on GitHub](https://github.com/Anakin-Inc/anakin-mcp) — source, releases, issue tracker
- [`@anakin-io/sdk`](https://github.com/Anakin-Inc/anakin-node) — Node.js / TypeScript SDK
- [`anakin`](https://github.com/Anakin-Inc/anakin-py) — Python SDK
- [`anakin-cli`](https://github.com/Anakin-Inc/anakin-cli) — Python CLI for terminal-driven use
- [SKILL.md](https://anakin.io/agent-onboarding/SKILL.md) — agent-onboarding doc for non-MCP agents
- [API reference](/docs/api-reference) — endpoint-by-endpoint REST docs


---

# OpenClaw (/docs/integrations/ide-plugins/openclaw)

Skill for [OpenClaw](https://openclaw.ai) that gives your AI agent web scraping, batch scraping, AI search, and autonomous research capabilities. Available on [ClawHub](https://clawhub.ai/Viraal-Bambori/anakin).

| | |
|---|---|
| **Marketplace** | [ClawHub](https://clawhub.ai/Viraal-Bambori/anakin) |
| **Platform** | [OpenClaw](https://openclaw.ai) |
| **Version** | 1.0.0 |
| **Security** | VirusTotal Benign, OpenClaw Benign (high confidence) |
| **Requirements** | `anakin` binary, `ANAKIN_API_KEY` env var |

---

### Setup

#### 1. Install the skill

```bash
clawhub install anakin
```

This downloads the skill and its dependencies (including `anakin-cli`) into your `./skills` directory automatically.

Or browse and download directly from [ClawHub](https://clawhub.ai/Viraal-Bambori/anakin).

#### 2. Configure your API key

1. Sign up at [anakin.io/signup](/signup) and get your API key from the [Dashboard](/dashboard)
2. Set the `ANAKIN_API_KEY` environment variable in your OpenClaw config

#### 3. Restart OpenClaw

Start a new OpenClaw session so it picks up the installed skill.

---

### What the agent gets

Once installed, your OpenClaw agent can autonomously:

- **Scrape URLs** — Extract content from any web page as clean markdown, structured JSON, or raw HTML
- **Batch scrape** — Scrape up to 10 URLs in parallel with a single call
- **AI search** — Run intelligent web searches with citations and relevance scoring
- **Deep research** — Autonomous multi-source research that synthesizes comprehensive reports (1–5 minutes)

The agent decides which capability to use based on the user's request. The skill's `SKILL.md` includes a decision guide so the agent picks the right tool automatically.

---

### How it works

The skill is a `SKILL.md` file that instructs the OpenClaw agent how to use the `anakin` CLI. When a user asks the agent to scrape a website, search the web, or research a topic, the agent:

1. Creates a `.anakin/` output folder in the working directory
2. Runs the appropriate `anakin` CLI command
3. Reads the output file and summarizes the results

All output is saved to files (never floods the agent's context), and the agent handles errors like rate limits and timeouts automatically.

---

### Security

The skill has been scanned and verified:

| Scanner | Status | Detail |
|---------|--------|--------|
| VirusTotal | Benign | [View report](https://www.virustotal.com/gui/file/d23ce9f141cfc820b1031d3e7664da171b75709bb58517ab6a122562a4cc5b39) |
| OpenClaw | Benign | High confidence — only requires `anakin` binary and `ANAKIN_API_KEY` |

The skill does not request unrelated credentials, system files, or hidden endpoints. It only uses the `anakin` CLI and a single API key.

---

### Stay updated

- **Discord** — [discord.gg/T57dHrdT8u](https://discord.gg/T57dHrdT8u)
- **Email** — support@anakin.io


---

# Dify (/docs/integrations/workflow/dify)

Web scraping and AI-powered search plugin for Dify. Extract data from any website, perform intelligent web searches, and conduct deep research — all inside your Dify workflows and agents.

| | |
|---|---|
| **Marketplace** | [Dify Plugin Store](https://marketplace.dify.ai/plugin/anakin/anakin) |
| **Source** | [GitHub](https://github.com/Anakin-Inc/anakin-dify-plugins/tree/main/anakin) |
| **Type** | Tool Plugin |
| **Version** | 0.0.1 |
| **Tools** | 5 |

---

### Key features

- **Anti-detection** — Proxy routing across 207 countries prevents blocking
- **Intelligent Caching** — Up to 30x faster on repeated requests
- **AI Extraction** — Convert any webpage into structured JSON
- **Browser Automation** — Full headless Chrome support for SPAs and JS-heavy sites
- **Session Management** — Authenticated scraping with encrypted session storage (AES-256-GCM)
- **Batch Processing** — Submit multiple URLs in a single request

---

### Setup

#### 1. Get your API key

1. Sign up at [anakin.io/signup](/signup)
2. Go to your [Dashboard](/dashboard)
3. Copy your API key (starts with `ask_`)

#### 2. Install in Dify

1. Install the Anakin plugin in your Dify workspace from the [Plugin Store](https://marketplace.dify.ai/plugin/anakin/anakin)
2. Go to **Plugins** > **Anakin** > **Configure**
3. Enter a name for the authorization (e.g., "Production")
4. Paste your API key
5. Click **Save**

---

### Tools

#### 1. URL Scraper

Scrapes a single URL, returning HTML, markdown, and optionally structured JSON.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `url` | string | Yes | — | Target URL to scrape (HTTP/HTTPS) |
| `country` | string | No | `us` | Proxy location from 207 countries |
| `use_browser` | boolean | No | `false` | Enable headless Chrome for JavaScript-heavy sites |
| `generate_json` | boolean | No | `false` | Use AI to extract structured data |
| `session_id` | string | No | — | Browser session ID for authenticated pages |

**Response includes:** Raw HTML, cleaned HTML, markdown conversion, structured JSON (if `generate_json` enabled), cache status, timing metrics.

---

#### 2. Batch URL Scraper

Scrape up to 10 URLs simultaneously in parallel.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `urls` | string | Yes | — | Comma-separated list of URLs (1–10) |
| `country` | string | No | `us` | Proxy location from 207 countries |
| `use_browser` | boolean | No | `false` | Enable headless Chrome for JavaScript-heavy sites |
| `generate_json` | boolean | No | `false` | Use AI to extract structured data from each page |

---

#### 3. AI Search

Synchronous AI-powered web search returning results with citations and relevance scoring. Results are returned immediately without polling.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `prompt` | string | Yes | — | Search query or question |
| `limit` | number | No | `5` | Maximum results to return |

**Response includes:** Array of results with URLs, titles, snippets, publication dates, last updated timestamps.

---

#### 4. Deep Research (Agentic Search)

Multi-stage automated research pipeline combining search, scraping, and AI synthesis. Takes 1–5 minutes.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `prompt` | string | Yes | Research question or topic |

**Response includes:** AI-generated comprehensive answers, summaries, structured findings, citations with source URLs, scraped source data, processing metrics.

---

### Examples

#### In a Workflow

1. Add a **Tool** node to your workflow
2. Select **Anakin** and choose your tool
3. Configure parameters (e.g., enter URL, enable `generate_json`)
4. Connect to the next node for processing

#### In an Agent

1. Create an Agent app
2. Add Anakin tools to the agent's toolset
3. The agent will automatically use scraping/search based on user queries

#### Scraping with AI extraction

```
Tool: URL Scraper
URL: https://example.com/products
Generate JSON: true
```

Returns structured product data automatically extracted by AI.

#### Authenticated scraping

```
Tool: URL Scraper
URL: https://example.com/dashboard
Session ID: your-session-id-from-dashboard
Use Browser: true
```

Scrapes pages that require login using your saved browser session. Learn more about [Browser Sessions](/docs/api-reference/browser-sessions).

---

### Processing times

| Tool | Type | Typical Duration |
|------|------|------------------|
| URL Scraper | Async | 3–15 seconds |
| Batch Scraper | Async | 5–30 seconds |
| AI Search | **Sync** | Immediate |
| Deep Research | Async | 1–5 minutes |
| Custom Scraper | Async | 3–15 seconds |

---

### Troubleshooting

| Code | Meaning | Action |
|------|---------|--------|
| 400 | Invalid parameters | Check your input |
| 401 | Invalid API key | Verify your API key in plugin settings |
| 402 | Plan upgrade required | Upgrade at [Pricing](/docs/documentation/pricing) |
| 404 | Job not found | Job may have expired |
| 429 | Rate limit exceeded | Wait and retry |
| 5xx | Server error | Retry with backoff |

---

### Country codes

Proxy routing supports [207 countries](/docs/api-reference/supported-countries). Common codes:

| Code | Country |
|------|---------|
| `us` | United States (default) |
| `gb` | United Kingdom |
| `de` | Germany |
| `fr` | France |
| `jp` | Japan |
| `au` | Australia |


---

# Make (/docs/integrations/workflow/make)

Official verified integration for Make (formerly Integromat) with native modules for web scraping, AI search, and deep research.

| | |
|---|---|
| **Marketplace** | [make.com/integrations/anakin](https://www.make.com/en/integrations/anakin) |
| **Status** | Verified, Official Vendor |
| **Modules** | 4 (3 Actions, 1 Search) |

---

### Setup

#### 1. Get your API key

Sign up at [anakin.io/signup](/signup) and get your API key from the [Dashboard](/dashboard).

#### 2. Add the Anakin module

1. In your Make scenario, click **+** to add a module
2. Search for **Anakin**
3. Select the module you need (UniversalDataExtractor, Search, etc.)

#### 3. Connect your account

1. Click **Create a connection**
2. Enter your API key
3. Click **Save**

---

### Modules

#### UniversalDataExtractor (Action)

Extract data from any website. Submits a scrape job and returns the results including HTML, markdown, and structured data.

Maps to the [URL Scraper API](/docs/api-reference/url-scraper).

---

#### DataPoller (Action)

Fetch the results for a previously submitted job using its job ID. Use this after **UniversalDataExtractor** or **AgenticSearch** if you need to poll for results separately.

Maps to the scrape job status endpoint (`GET /v1/request/{id}`) or agentic search status endpoint (`GET /v1/agentic-search/{id}`).

---

#### AgenticSearch (Action)

Start an advanced AI search job that searches web sources and extracts structured data. Returns a job ID to check results later. Takes 1–5 minutes.

Maps to the [Agentic Search API](/docs/api-reference/agentic-search).

---

#### Search (Search)

Perform an AI-powered web search. Returns instant results with answers, citations, and sources. This is synchronous — no polling needed.

Maps to the [Search API](/docs/api-reference/search).

---

### Examples

#### Scrape a URL and save to Google Sheets

```
Schedule → Anakin (UniversalDataExtractor) → Google Sheets (Add Row)
```

1. **Schedule** — trigger on a daily/hourly schedule
2. **Anakin UniversalDataExtractor** — enter the URL to scrape
3. **Google Sheets** — map the markdown or structured data to columns

#### Research and email a report

```
Webhook → Anakin (AgenticSearch) → Delay → Anakin (DataPoller) → Gmail (Send Email)
```

1. **Webhook** — receive a research topic
2. **Anakin AgenticSearch** — start deep research, get a job ID
3. **Delay** — wait 3–5 minutes for research to complete
4. **Anakin DataPoller** — fetch the completed results using the job ID
5. **Gmail** — send the research report

#### AI search to Notion

```
Webhook → Anakin (Search) → Notion (Create Page)
```

1. **Webhook** — receive a search query
2. **Anakin Search** — get instant AI-powered results
3. **Notion** — create a page with the search results

#### Popular connections

Google Sheets, OpenAI, Gmail, Google Drive, Telegram Bot, Airtable, Notion, Google Docs, Slack, Shopify, HubSpot CRM, WordPress, and [more](https://www.make.com/en/integrations/anakin).

---

### Troubleshooting

| Issue | Fix |
|-------|-----|
| Connection failed | Verify your API key is correct and has credits |
| Scrape returns empty | Try enabling browser mode if the option is available, or check if the URL is accessible |
| Agentic search still processing | Add a **Delay** module (3–5 min) before polling with DataPoller |
| Rate limit error (429) | Add a delay between requests or reduce scenario frequency |


---

# n8n (/docs/integrations/workflow/n8n)

<ComingSoonBanner description="This is currently under active development. Stay tuned for updates." />

| | |
|---|---|
| **Platform** | [n8n](https://n8n.io) |
| **Type** | Community Node |

---

### What to expect

The n8n community node will provide:

- **Scrape URL** — Extract content and structured data from any website with automatic polling
- **AI Search** — Synchronous AI-powered web search with instant results
- **Agentic Search** — Multi-stage deep research pipeline with structured data extraction

---

### In the meantime

You can integrate AnakinScraper into your n8n workflows today using n8n's **HTTP Request** node with the [REST API](/docs/api-reference), or use the [Anakin CLI](/docs/sdks/cli) via the **Execute Command** node.

---

### Stay updated

- **Discord** — [discord.gg/T57dHrdT8u](https://discord.gg/T57dHrdT8u)
- **Email** — support@anakin.io


---

# Zapier (/docs/integrations/workflow/zapier)

Extract structured data from websites and perform AI-powered searches — connected to 8,000+ apps on Zapier.

| | |
|---|---|
| **Marketplace** | [zapier.com/apps/anakin](https://zapier.com/apps/anakin/integrations) |
| **Category** | AI Agents |
| **Status** | Beta |

---

### Setup

#### 1. Create a new Zap

Go to [zapier.com/app/zaps](https://zapier.com/app/zaps) and click **Create Zap**.

#### 2. Add a trigger

Choose any trigger that produces data you want to scrape or research — Webhooks by Zapier, Schedule, Gmail, Slack, or any of 8,000+ apps.

#### 3. Add an Anakin action

1. Click **+** to add an action
2. Search for **Anakin**
3. Choose your action (Extract Website Data, Perform AI Search, etc.)
4. Click **Sign in** and enter your API key (get one from the [Dashboard](/dashboard))
5. Map fields from your trigger
6. Click **Test action**, then **Publish**

---

### Actions

#### Extract Website Data

Extracts structured data from any website including HTML, markdown, and generated JSON. Submits a scrape job and polls until complete.

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `url` | string | Yes | — | The full URL of the website to extract data from |
| `country` | string | No | `us` | Country code for proxy routing (e.g., `us`, `gb`, `de`). See [supported countries](/docs/api-reference/supported-countries) |
| `forceFresh` | boolean | No | `false` | Bypass cache and force fresh data extraction |
| `maxWaitTime` | integer | No | `300` | Maximum seconds to wait for the job to complete |
| `pollInterval` | integer | No | `3` | Seconds between status checks |

**Output fields:**

| Field | Type | Description |
|-------|------|-------------|
| `url` | string | The URL that was scraped |
| `status` | string | Job status (`completed` or `failed`) |
| `result` | text | Raw HTML content |
| `markdown` | text | Clean markdown version of the page |
| `generatedJson` | string | AI-extracted structured data |
| `cached` | boolean | Whether the result came from cache |
| `success` | boolean | Success flag |
| `durationMs` | number | Processing time in milliseconds |

---

#### Perform AI Search

AI-powered search using Perplexity. Returns instant answers with citations and sources. This is synchronous — results are returned immediately.

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `searchQuery` | text | Yes | — | The search query or question (e.g., "What are the latest trends in AI?") |
| `maxResults` | integer | No | `5` | Maximum number of search results to return |

---

#### Start Agentic Search

Starts an advanced AI search job that searches web sources and extracts structured data. Returns a job ID to check results later. Takes 1–5 minutes.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `searchPrompt` | text | Yes | The research question or topic |
| `useBrowser` | boolean | No | Use headless browser for more reliable scraping |

**Output:** Returns a `job_id` to use with **Get Agentic Search Results**.

---

#### Get Agentic Search Results

Fetches current status and results for an agentic search job. Returns immediately with the current state (`processing`, `completed`, or `failed`).

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `jobId` | string | Yes | The job ID from the Start Agentic Search action |

---

### Examples

#### Scrape a URL from a webhook

1. **Trigger:** Webhooks by Zapier — Catch Hook
2. **Action:** Anakin — Extract Website Data (map webhook URL to `url`)
3. **Action:** Google Sheets — Create Row (save markdown and structured data)

Send data to your webhook:

```bash
curl -X POST YOUR_WEBHOOK_URL \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'
```

#### Daily product monitoring

1. **Trigger:** Schedule by Zapier — Every Day
2. **Action:** Anakin — Extract Website Data (hardcode the product URL)
3. **Action:** Google Sheets — Create Row (append price data)
4. **Action:** Filter — Only continue if price changed
5. **Action:** Slack — Send Channel Message

#### Research pipeline

1. **Trigger:** Webhook (receives a research topic)
2. **Action:** Anakin — Start Agentic Search
3. **Action:** Delay — Wait 3 minutes
4. **Action:** Anakin — Get Agentic Search Results
5. **Action:** Gmail — Send Email with the report

#### AI search to Airtable

1. **Trigger:** Airtable — New Record (with a search query field)
2. **Action:** Anakin — Perform AI Search (map the query field)
3. **Action:** Airtable — Update Record (write results back)

#### More ideas

- **Price monitoring** — Scrape product pages on a schedule, save to Google Sheets, alert on changes
- **Lead enrichment** — Scrape company websites from a CRM trigger, extract structured data
- **News aggregation** — Scrape articles from RSS URLs, save cleaned markdown to Notion
- **Competitor analysis** — Monitor competitor pricing pages, compare with previous data
- **Market research** — Run agentic search on topics, email structured reports

---

### Troubleshooting

| Issue | Fix |
|-------|-----|
| Scrape returns empty | Try setting `forceFresh` to true to bypass cache |
| Timeout | Increase `maxWaitTime` (default is 300 seconds) |
| Auth error | Re-enter your API key in the Zapier connection settings |
| Agentic search still processing | Use a **Delay** action (3–5 min) between Start and Get Results |
| Geo-restricted content | Set `country` to match the target site's region |


---

# Releases (/docs/releases)

A stable record of every released version across our four published packages. Each entry links to the npm or PyPI registry, the GitHub release, and the source commit it was built from.

| Package | Latest | Source |
|---|---|---|
| [`@anakin-io/sdk`](https://www.npmjs.com/package/@anakin-io/sdk) | `0.1.0` | [github.com/Anakin-Inc/anakin-node](https://github.com/Anakin-Inc/anakin-node) |
| [`@anakin-io/mcp`](https://www.npmjs.com/package/@anakin-io/mcp) | `0.1.0` | [github.com/Anakin-Inc/anakin-mcp](https://github.com/Anakin-Inc/anakin-mcp) |
| [`anakin-sdk`](https://pypi.org/project/anakin-sdk/) (PyPI) | `0.1.0` | [github.com/Anakin-Inc/anakin-py](https://github.com/Anakin-Inc/anakin-py) |
| [`anakin-cli`](https://pypi.org/project/anakin-cli/) (PyPI) | `0.2.0` | [github.com/Anakin-Inc/anakin-cli](https://github.com/Anakin-Inc/anakin-cli) |

---

## 2026-04-28 — Initial public release of three new packages

Three packages went live to npm + PyPI on the same day. The fourth (`anakin-cli`) was already published earlier (last bumped to `0.2.0` on 2026-03-18) and is unchanged in this release window.

### `@anakin-io/sdk` v0.1.0 — Node.js / TypeScript SDK

First public release. Wraps every Anakin endpoint in a single async call with built-in polling, real TypeScript types, and zero runtime dependencies.

```bash
npm install @anakin-io/sdk
```

```typescript
import { Anakin } from "@anakin-io/sdk"
const client = new Anakin({ apiKey: "ak-..." })
const doc = await client.scrape("https://example.com")
console.log(doc.markdown)
```

**What's included:** `scrape`, `map`, `crawl`, `search`, `agenticSearch`, `wire`, plus a full `SessionsClient` for browser-session CRUD (`list`, `create`, `save`, `update`, `delete`).

**Quality gates:** 25 unit tests, strict TypeScript (`exactOptionalPropertyTypes`), ESM + CJS dual build via tsup (~28 KB), zero runtime dependencies. Works on Node 18+.

**Links:** [npm](https://www.npmjs.com/package/@anakin-io/sdk) · [GitHub release](https://github.com/Anakin-Inc/anakin-node/releases/tag/v0.1.0) · [docs](/docs/sdks/node)

---

### `@anakin-io/mcp` v0.1.0 — Model Context Protocol server

First public release. Lets AI agents in **Claude Desktop, Claude Code, Cursor, Cline, Continue, Zed, Windsurf, and VS Code** call Anakin natively — no glue code required.

```bash
npx -y @anakin-io/mcp init --all
```

That single command auto-configures every detected agent client on your machine. After it finishes, restart your client and Anakin's tools appear in the agent's tool list.

**Tools exposed (6):** `scrape`, `search`, `map`, `crawl`, `agentic_search`, `wire_action` — each a thin wrapper over the corresponding Anakin REST endpoint with a typed JSON Schema for arguments.

**Supported clients (8):** `claude-desktop`, `claude-code`, `cursor`, `cline`, `continue`, `zed`, `windsurf`, `vscode`. Each has its own config schema; all are auto-detected and configured by `init`.

**Quality gates:** 27 unit tests across the tool registry shape and per-client config writers, strict TypeScript, ESM + CJS dual build. Only `@modelcontextprotocol/sdk` at runtime.

**Links:** [npm](https://www.npmjs.com/package/@anakin-io/mcp) · [GitHub release](https://github.com/Anakin-Inc/anakin-mcp/releases/tag/v0.1.0) · [setup docs](/docs/integrations/ai-agents/mcp-server)

---

### `anakin-sdk` v0.1.0 — Python SDK

First public release. Wraps every Anakin endpoint with a single sync call, typed Pydantic v2 response models, and built-in polling.

```bash
pip install anakin-sdk
```

```python
from anakin import Anakin

client = Anakin(api_key="ak-...")  # or set ANAKIN_API_KEY
doc = client.scrape("https://example.com")
print(doc.markdown)
```

> **Distribution name** is `anakin-sdk` (PyPI). **Import name** is `anakin`. They differ because the unscoped `anakin` PyPI name is held by an unrelated package.

**What's included:** `scrape`, `map`, `crawl`, `search`, `agentic_search`, `wire`, `countries`, plus a `SessionsClient` for browser-session CRUD. Built-in retries with exponential backoff and `Retry-After` honour on 429s. Hidden polling — calls return the final result.

**Validated on:** Python **3.10, 3.11, 3.12, 3.13** — install + import + 25/25 tests pass on every version. Multi-version validation is automated via [`scripts/test-multiver.sh`](https://github.com/Anakin-Inc/anakin-py/blob/main/scripts/test-multiver.sh) in the repo.

**Links:** [PyPI](https://pypi.org/project/anakin-sdk/) · [GitHub release](https://github.com/Anakin-Inc/anakin-py/releases/tag/v0.1.0) · [docs](/docs/sdks/python)

---

## Earlier releases

### `anakin-cli` v0.2.0 — 2026-03-18

The Python CLI for terminal-driven scraping. Installs `anakin` as a binary on `$PATH`. Already published before this release window.

```bash
pip install anakin-cli
anakin login --api-key "ak-..."
anakin scrape "https://example.com" -o page.md
```

**Commands:** `search`, `scrape`, `scrape-batch`, `research`, `login`, `status`.

**Links:** [PyPI](https://pypi.org/project/anakin-cli/) · [docs](/docs/sdks/cli)

---

## Versioning

All four packages follow [Semantic Versioning](https://semver.org/):

- **0.x.y** — alpha. Public API may change between minor versions until 1.0.
- **x.0.0** (1.0+) — stable. Breaking changes require a major bump.
- **Patch (z) bumps** — bug fixes, no API changes.

Until 1.0, treat the SDKs as alpha and pin to a specific minor version (`@anakin-io/sdk@^0.1.0`, `anakin-sdk==0.1.*`) if you need stability across upgrades.

## Status badges

If you'd like to embed real-time version badges on your own README:

```markdown
[![npm](https://img.shields.io/npm/v/@anakin-io/sdk.svg)](https://www.npmjs.com/package/@anakin-io/sdk)
[![npm](https://img.shields.io/npm/v/@anakin-io/mcp.svg)](https://www.npmjs.com/package/@anakin-io/mcp)
[![PyPI](https://img.shields.io/pypi/v/anakin-sdk.svg)](https://pypi.org/project/anakin-sdk/)
[![PyPI](https://img.shields.io/pypi/v/anakin-cli.svg)](https://pypi.org/project/anakin-cli/)
```

## Reporting issues

Each repo has its own issue tracker — file there for fastest response:

- [`@anakin-io/sdk` issues](https://github.com/Anakin-Inc/anakin-node/issues)
- [`@anakin-io/mcp` issues](https://github.com/Anakin-Inc/anakin-mcp/issues)
- [`anakin-sdk` issues](https://github.com/Anakin-Inc/anakin-py/issues)
- [`anakin-cli` issues](https://github.com/Anakin-Inc/anakin-cli/issues)

For bugs that span multiple packages or are about the API itself, the [main repo's issue tracker](https://github.com/Anakin-Inc/blueprint-scribe-35/issues) is the catch-all.


---

# SDKs & CLI (/docs/sdks)

Official client libraries, command-line tools, and an MCP server for the Anakin API. All open source under Apache 2.0.

---

### SDKs

| SDK | Status | Install | Description |
|-----|--------|---------|-------------|
| [Python SDK](/docs/sdks/python) | Alpha (v0.1.x) | `pip install anakin-sdk` | Native Python client with `pydantic` v2 typed models |
| [Node.js SDK](/docs/sdks/node) | Alpha (v0.1.x) | `npm install @anakin-io/sdk` | Native TypeScript client, ESM + CJS, built on `fetch` |
| [Go SDK](/docs/sdks/go) | Alpha (v0.1.x) | `go get github.com/Anakin-Inc/anakin-go` | Pure stdlib Go module, functional options, zero dependencies |
| [Rust SDK](/docs/sdks/rust) | Alpha (v0.1.x) | `anakin-sdk = "0.1"` in `Cargo.toml` | Async Rust crate built on reqwest + tokio |
| [PHP SDK](/docs/sdks/php) | Alpha (v0.1.x) | `composer require anakin/sdk` | PHP 8.1+ client built on Guzzle 7 |
| [Ruby SDK](/docs/sdks/ruby) | Alpha (v0.1.x) | `gem install anakin-sdk` | Pure-stdlib Ruby gem, no runtime dependencies |
| [Elixir SDK](/docs/sdks/elixir) | Alpha (v0.1.x) | `{:anakin, "~> 0.1"}` in `mix.exs` | Elixir Hex package built on Req + Jason |
| [Java SDK](/docs/sdks/java) | Alpha (v0.1.x) | `io.github.anakin-inc:anakin-sdk:0.1.0` (Maven / Gradle) | Java 17+ client, zero external HTTP dependencies |
| [.NET SDK](/docs/sdks/dotnet) | Coming soon | NuGet: `Anakin` (pending) | C# async client for .NET 6+ — publishing in progress |

### CLI

| Tool | Status | Description |
|------|--------|-------------|
| [Anakin CLI](/docs/sdks/cli) | Available | Scrape, search, and research from your terminal |

### MCP server (for AI agents)

| Server | Status | Install | Description |
|--------|--------|---------|-------------|
| [`@anakin-io/mcp`](/docs/integrations/ai-agents/mcp-server) | Alpha (v0.1.x) | `npx -y @anakin-io/mcp init --all` | Plug Anakin into Claude Desktop, Claude Code, Cursor, Cline, Continue, Zed, Windsurf, and VS Code via MCP — no glue code required |

---

### Why use the SDKs?

- **Three-line scrape**, no boilerplate. Submit-then-poll is hidden behind a single sync call.
- **Identical surface across every language** so switching is mechanical: `scrape`, `map`, `crawl`, `search`, `agentic_search`, `wire`, plus browser-session CRUD.
- **Built-in retries** with exponential backoff and `Retry-After` honour on 429s.
- **Typed errors** — every SDK exposes the same hierarchy (`AuthenticationError`, `InsufficientCreditsError` with balance/required, `RateLimitError`, `JobFailedError`, etc.) named idiomatically per language.
- **Hidden polling** — `client.crawl(...)` returns the final result. No job IDs to manage.


---

# Anakin CLI (/docs/sdks/cli)

Scrape websites, search the web, and run deep research — all from your terminal.

| | |
|---|---|
| **Latest version** | 0.1.0 |
| **License** | MIT |
| **Python** | 3.10+ |
| **PyPI** | [anakin-cli](https://pypi.org/project/anakin-cli/) |
| **Source** | [GitHub](https://github.com/Anakin-Inc/anakin-cli) |

```bash
pip install anakin-cli
```

---

### Prerequisites

Before installing, make sure you have:

1. **Python 3.10 or higher** — check with `python --version`
2. **pip** — Python's package manager (included with Python 3.10+)
3. **An API key** — get one from the [Dashboard](/dashboard). If you don't have an account, [sign up here](/signup)

---

### Installation

<Tabs items={["pip", "pipx"]}>
<Tab value="pip">
```bash
pip install anakin-cli
```
</Tab>
<Tab value="pipx">
```bash
# Install in an isolated environment (recommended for CLI tools)
pipx install anakin-cli
```
</Tab>
</Tabs>

Verify the installation:

```bash
anakin status
```

To upgrade to the latest version:

```bash
pip install --upgrade anakin-cli
```

---

### Authentication

Set up your API key so the CLI can make requests on your behalf.

**Login command (recommended)**

```bash
anakin login --api-key "ak-your-key-here"
```

This saves your key locally. You only need to do this once.

**Environment variable**

```bash
export ANAKIN_API_KEY="ak-your-key-here"
```

**Interactive prompt**

If no key is configured, the CLI will prompt you to enter one.

---

### Quick start

```bash
# Scrape a page to markdown
anakin scrape "https://example.com"

# Extract structured JSON with AI
anakin scrape "https://example.com/product" --format json

# Scrape a JS-heavy site with headless browser
anakin scrape "https://example.com/spa" --browser

# Batch scrape multiple URLs
anakin scrape-batch "https://a.com" "https://b.com" "https://c.com"

# AI-powered web search
anakin search "python async best practices"

# Deep research (takes 1–5 min)
anakin research "comparison of web frameworks 2025" -o report.json
```

---

### Commands overview

| Command | Description |
|---------|-------------|
| [`anakin login`](/docs/sdks/cli/commands#login) | Save your API key locally |
| [`anakin status`](/docs/sdks/cli/commands#status) | Check version and authentication status |
| [`anakin scrape`](/docs/sdks/cli/commands#scrape) | Scrape a single URL to markdown, JSON, or raw |
| [`anakin scrape-batch`](/docs/sdks/cli/commands#scrape-batch) | Scrape up to 10 URLs in parallel |
| [`anakin search`](/docs/sdks/cli/commands#search) | AI-powered web search (instant results) |
| [`anakin research`](/docs/sdks/cli/commands#research) | Deep multi-stage agentic research |

See the full [Commands Reference](/docs/sdks/cli/commands) for all flags and options, or check out [Examples & Recipes](/docs/sdks/cli/examples) for real-world usage patterns.

---

### Output modes

Every command that returns data supports the `-o` flag to write to a file. Without it, output goes to stdout.

```bash
# Print to terminal
anakin scrape "https://example.com"

# Save to file
anakin scrape "https://example.com" -o page.md
```

The `scrape` command also supports three output formats:

| Format | Flag | What you get |
|--------|------|-------------|
| Markdown | `--format markdown` | Clean readable text (default) |
| JSON | `--format json` | AI-extracted structured data |
| Raw | `--format raw` | Full API response with HTML and metadata |

---

### Tips

**Always quote URLs** containing `?`, `&`, or `#` — shells interpret these as special characters:

```bash
# Wrong — zsh will fail
anakin scrape https://example.com/page?id=123

# Correct
anakin scrape "https://example.com/page?id=123"
```

**Piping works cleanly** because all progress messages go to stderr:

```bash
anakin scrape "https://example.com" --format json | jq '.title'
```

**Use `--browser`** for JavaScript-heavy sites, SPAs, and dynamically loaded content.

**Use `--country`** to route requests through a specific country's proxy. See all [207 supported countries](/docs/api-reference/supported-countries).

---

### Support

- **Discord** — [discord.gg/T57dHrdT8u](https://discord.gg/T57dHrdT8u)
- **Email** — support@anakin.io
- **PyPI** — [pypi.org/project/anakin-cli](https://pypi.org/project/anakin-cli/)


---

# CLI Commands (/docs/sdks/cli/commands)

All available commands for the Anakin CLI.

---

### login

Save your API key for future sessions.

```bash
anakin login --api-key "ak-your-key-here"
```

| Flag | Description |
|------|-------------|
| `--api-key` | Your AnakinScraper API key |

---

### status

Check the CLI version and whether you're authenticated.

```bash
anakin status
```

---

### scrape

Scrape a single URL. Returns clean markdown by default.

```bash
anakin scrape "https://example.com"
```

| Flag | Type | Description | Default |
|------|------|-------------|---------|
| `--format` | string | Output format: `markdown`, `json`, or `raw` | `markdown` |
| `--browser` | flag | Use headless browser for JS-heavy sites | off |
| `--country` | string | Two-letter country code for geo-located scraping | `us` |
| `--session-id` | string | Browser session ID for authenticated scraping | — |
| `--timeout` | number | Polling timeout in seconds | `120` |
| `-o, --output` | string | Save output to a file instead of stdout | stdout |

#### Output formats

| Format | What you get | Best for |
|--------|-------------|----------|
| `markdown` | Clean readable page text | Reading, LLM context |
| `json` | AI-extracted structured data | Data pipelines |
| `raw` | Full API response (HTML, metadata, everything) | Debugging |

#### Examples

```bash
# Default markdown output
anakin scrape "https://example.com"

# Save to file
anakin scrape "https://example.com" -o page.md

# Extract structured JSON
anakin scrape "https://example.com/product" --format json -o product.json

# Full raw API response
anakin scrape "https://example.com" --format raw -o debug.json

# JavaScript-heavy site
anakin scrape "https://example.com/spa" --browser

# Scrape from the UK
anakin scrape "https://example.com" --country gb

# Longer timeout for slow sites
anakin scrape "https://example.com" --timeout 300

# Authenticated scraping with a saved browser session
anakin scrape "https://example.com/dashboard" --session-id "session_abc123"
```

---

### scrape-batch

Scrape up to 10 URLs simultaneously. All URLs are processed in parallel.

```bash
anakin scrape-batch "https://a.com" "https://b.com" "https://c.com"
```

| Flag | Type | Description | Default |
|------|------|-------------|---------|
| `-o, --output` | string | Save output to a file | stdout |

#### Examples

```bash
# Scrape 3 URLs
anakin scrape-batch "https://a.com" "https://b.com" "https://c.com"

# Save batch results to file
anakin scrape-batch "https://a.com" "https://b.com" -o results.json
```

---

### search

AI-powered web search. Returns results instantly (synchronous).

```bash
anakin search "your search query"
```

| Flag | Type | Description | Default |
|------|------|-------------|---------|
| `-o, --output` | string | Save output to a file | stdout |

#### Examples

```bash
# Search the web
anakin search "python async best practices"

# Save search results
anakin search "best web scraping tools 2025" -o results.json

# Pipe to jq
anakin search "latest AI news" | jq '.results[0]'
```

---

### research

Deep agentic research. Runs a multi-stage pipeline: query refinement, web search, citation scraping, and AI synthesis. Takes 1–5 minutes.

```bash
anakin research "your research topic"
```

| Flag | Type | Description | Default |
|------|------|-------------|---------|
| `-o, --output` | string | Save output to a file | stdout |

#### Examples

```bash
# Run deep research
anakin research "comparison of web frameworks 2025"

# Save research report
anakin research "quantum computing industry trends" -o report.json
```

---

## Error handling

The CLI provides clear error messages:

| Error | Code | Fix |
|-------|------|-----|
| Authentication failed | 401 | Run `anakin login --api-key "ak-xxx"` |
| Plan upgrade required | 402 | Visit [Pricing](/docs/documentation/pricing) |
| Rate limit exceeded | 429 | Wait a few seconds and retry |
| Job timed out | — | Increase with `--timeout 300` |
| Job failed | — | Check if the URL is accessible |

**Exit codes:** `0` for success, `1` for any error.


---

# CLI Examples (/docs/sdks/cli/examples)

Real-world usage patterns for the Anakin CLI.

---

### Scrape a page to markdown

The most common use case — get clean, readable content from any URL:

```bash
anakin scrape "https://docs.python.org/3/tutorial/index.html" -o tutorial.md
```

---

### Extract structured data with AI

Use `--format json` to get AI-extracted structured data instead of raw text:

```bash
anakin scrape "https://amazon.com/dp/B0EXAMPLE" --format json -o product.json
```

The AI analyzes the page and returns structured fields like title, price, description, etc.

---

### Scrape a JavaScript-heavy site

For SPAs, React/Next.js sites, or pages with dynamically loaded content:

```bash
anakin scrape "https://app.example.com/dashboard" --browser
```

The `--browser` flag launches a headless browser to render JavaScript before extracting content.

---

### Batch scrape multiple pages

Scrape up to 10 URLs in a single command. All are processed in parallel:

```bash
anakin scrape-batch \
  "https://example.com/page-1" \
  "https://example.com/page-2" \
  "https://example.com/page-3" \
  "https://example.com/page-4" \
  "https://example.com/page-5" \
  -o pages.json
```

---

### Scrape from a specific country

Route your request through a proxy in a specific country. Useful for geo-restricted content:

```bash
# Scrape from the UK
anakin scrape "https://example.co.uk/deals" --country gb

# Scrape from Japan
anakin scrape "https://example.jp/products" --country jp
```

See the full list of [207 supported countries](/docs/api-reference/supported-countries).

---

### Scrape authenticated pages

Use a saved browser session to scrape pages that require login:

```bash
# First, create a session from the dashboard at anakin.io/dashboard
# Then use the session ID:
anakin scrape "https://example.com/my-account" --session-id "session_abc123"
```

Learn more about [Browser Sessions](/docs/api-reference/browser-sessions).

---

### Pipe output to other tools

Progress messages go to stderr, so piping works cleanly:

```bash
# Extract a specific field with jq
anakin scrape "https://example.com" --format json | jq '.title'

# Count words in scraped markdown
anakin scrape "https://example.com" | wc -w

# Feed into another script
anakin search "latest AI papers" | python process_results.py
```

---

### Research a topic

Run deep multi-stage research that scrapes and synthesizes multiple sources:

```bash
anakin research "best practices for web scraping in 2025" -o research.json
```

This takes 1–5 minutes and produces a comprehensive report with citations.

---

### Use in shell scripts

```bash
#!/bin/bash
# scrape-urls.sh — Scrape a list of URLs from a file

while IFS= read -r url; do
  filename=$(echo "$url" | sed 's|https\?://||;s|/|_|g').md
  echo "Scraping: $url -> $filename" >&2
  anakin scrape "$url" -o "$filename"
done < urls.txt
```

---

### Debug a failing scrape

Use `--format raw` to see the full API response including headers, status codes, and error details:

```bash
anakin scrape "https://example.com" --format raw -o debug.json
```

If the default HTTP handler fails, try with `--browser` to use the headless browser:

```bash
anakin scrape "https://example.com" --browser --format raw -o debug.json
```


---

# .NET SDK (/docs/sdks/dotnet)

The official .NET / C# SDK for the Anakin API is currently in development and will be published to NuGet shortly.

| | |
|---|---|
| **Status** | Coming soon |
| **Target** | `net6.0`, `net8.0` |
| **Package** | `Anakin` on NuGet (pending) |
| **Source** | [github.com/Anakin-Inc/anakin-dotnet](https://github.com/Anakin-Inc/anakin-dotnet) |
| **License** | Apache 2.0 |

---

The source code is complete and tested. We are currently working through the NuGet account setup required for publishing.

### Preview

Once published, installation will be:

```bash
dotnet add package Anakin
```

And usage:

```csharp
using Anakin;

using var client = AnakinClient.Create(opts =>
{
    opts.ApiKey = "ak-...";  // or set ANAKIN_API_KEY
});

var doc = await client.ScrapeAsync("https://example.com");
Console.WriteLine(doc.Markdown);
```

All the same methods as the other SDKs — `ScrapeAsync`, `MapAsync`, `CrawlAsync`, `SearchAsync`, `AgenticSearchAsync`, `WireAsync`, plus browser-session management. Built on `HttpClient` + `System.Text.Json` with no third-party dependencies.

### Get notified

Watch the [GitHub repo](https://github.com/Anakin-Inc/anakin-dotnet) for the release, or check [anakin.io/docs/releases](/docs/releases) for the announcement.

In the meantime, you can use the REST API directly — see the [API reference](/docs/api-reference) and the [.NET Quick Start](/docs/documentation/getting-started/dotnet).


---

# Elixir SDK (/docs/sdks/elixir)

Official Elixir Hex package for the Anakin API. Wraps every documented endpoint, runs internal polling, and returns idiomatic `{:ok, result}` / `{:error, exception}` tuples. Built on [Req](https://github.com/wojtekmach/req) and Jason.

| | |
|---|---|
| **Status** | Alpha (v0.1.x) |
| **Language** | Elixir 1.14+ |
| **Hex name** | [`anakin`](https://hex.pm/packages/anakin) on Hex |
| **Docs** | [hexdocs.pm/anakin](https://hexdocs.pm/anakin/0.1.0) (auto-generated) |
| **Source** | [github.com/Anakin-Inc/anakin-elixir](https://github.com/Anakin-Inc/anakin-elixir) |
| **License** | Apache 2.0 |

---

### Install

Add to your `mix.exs`:

```elixir
def deps do
  [{:anakin, "~> 0.1"}]
end
```

Then:

```bash
mix deps.get
```

### Quickstart

```elixir
{:ok, client} = Anakin.Client.new(api_key: "ak-...")  # or set ANAKIN_API_KEY env var

# Scrape a single URL — returns {:ok, result} or {:error, exception}
case Anakin.scrape(client, "https://example.com") do
  {:ok, doc} -> IO.puts(doc["markdown"])
  {:error, e} -> IO.warn(Exception.message(e))
end

# Discover URLs on a site
{:ok, sitemap} = Anakin.map(client, "https://example.com", limit: 200)
IO.inspect(sitemap["links"])

# Crawl pages and get content for each
{:ok, crawl} = Anakin.crawl(client, "https://example.com", max_pages: 20)
Enum.each(crawl["pages"], fn page ->
  IO.puts("#{page["url"]}: #{String.length(page["markdown"] || "")}")
end)
```

### What's in v0.1

| Function | Returns |
|---|---|
| `Anakin.scrape(client, url, opts \\ [])` | `{:ok, map}` — the document |
| `Anakin.map(client, url, opts \\ [])` | `{:ok, map}` — discovered links |
| `Anakin.crawl(client, url, opts \\ [])` | `{:ok, map}` — crawled pages |
| `Anakin.search(client, query, opts \\ [])` | `{:ok, map}` — search results (synchronous API) |
| `Anakin.agentic_search(client, prompt, opts \\ [])` | `{:ok, map}` — AI-synthesised answer |
| `Anakin.wire(client, action_id, params)` | `{:ok, map}` — Wire action result (run a [Wire](/docs/api-reference/holocron) action) |
| `Anakin.list_sessions/1`, `create_session/3`, `save_session/3`, `update_session/3`, `delete_session/2` | Browser session CRUD |

All response functions return `{:ok, parsed_json_map}` on success or `{:error, %Anakin.Error{...}}` on failure. The body of `{:ok, ...}` is the parsed JSON map — strict struct types are on the v0.2 roadmap.

### Configuration

```elixir
{:ok, client} = Anakin.Client.new(
  api_key:              "ak-...",                       # or ANAKIN_API_KEY env var
  base_url:             "https://api.anakin.io/v1",
  request_timeout_ms:   60_000,                         # per-request HTTP timeout
  max_retries:          4,                              # retries on 429 / 5xx
  poll_interval_ms:     1_000,                          # initial polling delay
  poll_max_interval_ms: 10_000,                         # cap on exponential backoff
  poll_timeout_ms:      300_000,                        # total wait before %JobTimeout{}
  req_options:          []                              # extra options forwarded to Req.request/2
)
```

You can also use `Anakin.Client.new!/1` to raise on missing API key (useful in app config / supervision trees).

### Errors

Pattern-match on the struct module to react to specific failure modes:

```elixir
case Anakin.scrape(client, "https://example.com") do
  {:ok, doc} ->
    IO.puts(doc["markdown"])

  {:error, %Anakin.Error.InsufficientCredits{balance: b, required: r}} ->
    IO.puts("out of credits: balance=#{b}, needed=#{r}")

  {:error, %Anakin.Error.Authentication{}} ->
    IO.puts("invalid API key — get a fresh one at anakin.io/dashboard")

  {:error, %Anakin.Error.RateLimit{retry_after: ra}} ->
    IO.puts("rate limited; retry after #{ra}s")

  {:error, %Anakin.Error.JobFailed{reason: reason}} ->
    IO.puts("job failed: #{reason}")

  {:error, e} ->
    IO.puts("anakin error: #{Exception.message(e)}")
end
```

The hierarchy:

| Module | When |
|---|---|
| `Anakin.Error.Authentication` | 401 — invalid or missing API key |
| `Anakin.Error.InsufficientCredits` | 402 — out of credits (`:balance`, `:required`) |
| `Anakin.Error.InvalidRequest` | 400 — validation failure |
| `Anakin.Error.RateLimit` | 429 — after retry budget exhausted (`:retry_after` seconds) |
| `Anakin.Error.JobFailed` | Polled job came back with `status="failed"` (`:reason`) |
| `Anakin.Error.JobTimeout` | Polling budget exhausted before terminal status |
| `Anakin.Error.Server` | 5xx — after retries exhausted |
| `Anakin.Error.Network` | DNS / connect / read-timeout |
| `Anakin.Error` | Base struct; unmatched failures fall back here |

### Stability

`v0.1.x` is alpha. The public API may change between minor versions until v1.0. Pin a specific version in production:

```elixir
{:anakin, "0.1.0"}
```

Raise issues on [GitHub](https://github.com/Anakin-Inc/anakin-elixir/issues).


---

# Go SDK (/docs/sdks/go)

Official Go module for the Anakin API. Wraps every documented endpoint with a single blocking call, internal polling, and a typed error hierarchy. Zero runtime dependencies — pure stdlib HTTP.

| | |
|---|---|
| **Status** | Alpha (v0.1.x) |
| **Language** | Go 1.21+ |
| **Module** | [`github.com/Anakin-Inc/anakin-go`](https://pkg.go.dev/github.com/Anakin-Inc/anakin-go) on pkg.go.dev |
| **Source** | [github.com/Anakin-Inc/anakin-go](https://github.com/Anakin-Inc/anakin-go) |
| **License** | Apache 2.0 |

---

### Install

```bash
go get github.com/Anakin-Inc/anakin-go
```

Requires Go 1.21+.

### Quickstart

```go
package main

import (
    "context"
    "fmt"

    "github.com/Anakin-Inc/anakin-go"
)

func main() {
    client, err := anakin.New(anakin.WithAPIKey("ak-..."))  // or set ANAKIN_API_KEY
    if err != nil {
        panic(err)
    }

    // Scrape a single URL — returns the final result, no polling required
    doc, err := client.Scrape(context.Background(), "https://example.com")
    if err != nil {
        panic(err)
    }
    fmt.Println(doc.Markdown)

    // Discover URLs on a site
    sitemap, err := client.Map(context.Background(), "https://example.com")
    if err != nil {
        panic(err)
    }
    fmt.Println(sitemap.Links)
}
```

### What's in v0.1

| Method | Returns |
|---|---|
| `client.Scrape(ctx, url, opts...)` | `*Document` |
| `client.Map(ctx, url, opts...)` | `*MapResult` |
| `client.Crawl(ctx, url, opts...)` | `*CrawlResult` |
| `client.Search(ctx, prompt, opts...)` | `*SearchResult` (synchronous API) |
| `client.AgenticSearch(ctx, prompt, opts...)` | `*AgenticSearchResult` |
| `client.Wire(ctx, actionID, params)` | `*WireResult` (run a [Wire](/docs/api-reference/holocron) action) |
| `client.Sessions().List / Create / Save / Update / Delete` | Browser session CRUD |
| `anakin.SupportedCountries()` | `[]Country` (static, bundled, no network call) |

### Configuration

```go
client, err := anakin.New(
    anakin.WithAPIKey("ak-..."),                    // or ANAKIN_API_KEY env var
    anakin.WithBaseURL("https://api.anakin.io/v1"),
    anakin.WithTimeout(60 * time.Second),           // per-request HTTP timeout
    anakin.WithMaxRetries(4),                       // retries on 429 / 5xx
    anakin.WithPollInterval(1 * time.Second),       // initial polling delay
    anakin.WithPollMaxInterval(10 * time.Second),   // cap on exponential backoff
    anakin.WithPollTimeout(5 * time.Minute),        // total wait before JobTimeoutError
)
```

### Errors

Every error returned by the SDK is a typed concrete value. Match with `errors.As`:

```go
import "errors"

doc, err := client.Scrape(ctx, "https://example.com")

var creditsErr *anakin.InsufficientCreditsError
var authErr   *anakin.AuthenticationError
var rlErr     *anakin.RateLimitError
var jobErr    *anakin.JobFailedError

switch {
case errors.As(err, &creditsErr):
    fmt.Printf("out of credits: balance=%d, needed=%d\n", creditsErr.Balance, creditsErr.Required)
case errors.As(err, &authErr):
    fmt.Println("invalid API key — get a fresh one at anakin.io/dashboard")
case errors.As(err, &rlErr):
    fmt.Printf("rate limited; retry after %s\n", rlErr.RetryAfter)
case errors.As(err, &jobErr):
    fmt.Printf("job failed: %s\n", jobErr.Reason)
case err != nil:
    fmt.Printf("unknown error: %v\n", err)
}
```

The error hierarchy:

| Type | When |
|---|---|
| `*AuthenticationError` | 401 — invalid or missing API key |
| `*InsufficientCreditsError` | 402 — out of credits (`.Balance`, `.Required`) |
| `*InvalidRequestError` | 400 — validation failure |
| `*RateLimitError` | 429 — after retry budget exhausted (`.RetryAfter`) |
| `*JobFailedError` | Polled job came back with `status="failed"` (`.Reason`) |
| `*JobTimeoutError` | Polling budget exhausted before terminal status |
| `*ServerError` | 5xx — after retries exhausted |
| `*NetworkError` | DNS / connect / read-timeout (`.Cause`) |
| `*APIError` | Base type; everything above embeds it |

### Stability

`v0.1.x` is alpha. The public API may change between minor versions until v1.0. Pin a specific version in production:

```bash
go get github.com/Anakin-Inc/anakin-go@v0.1.0
```

Full reference docs and examples are on [pkg.go.dev](https://pkg.go.dev/github.com/Anakin-Inc/anakin-go).

Raise issues on [GitHub](https://github.com/Anakin-Inc/anakin-go/issues).


---

# Java SDK (/docs/sdks/java)

Official Java SDK for the Anakin API. Wraps every documented endpoint with a single synchronous call, internal polling, and a typed exception hierarchy. Zero HTTP dependencies — uses `java.net.http.HttpClient` from the JDK.

| | |
|---|---|
| **Status** | Alpha (v0.1.x) |
| **Language** | Java 17+ |
| **Artifact** | `io.github.anakin-inc:anakin-sdk:0.1.0` on Maven Central |
| **Source** | [github.com/Anakin-Inc/anakin-java](https://github.com/Anakin-Inc/anakin-java) |
| **License** | Apache 2.0 |

---

### Install

**Gradle:**

```groovy
dependencies {
    implementation 'io.github.anakin-inc:anakin-sdk:0.1.0'
}
```

**Maven:**

```xml
<dependency>
    <groupId>io.github.anakin-inc</groupId>
    <artifactId>anakin-sdk</artifactId>
    <version>0.1.0</version>
</dependency>
```

Requires Java 17+.

### Quickstart

```java
import io.anakin.sdk.Anakin;
import io.anakin.sdk.types.Document;

public class Demo {
    public static void main(String[] args) {
        Anakin client = Anakin.builder()
                .apiKey("ak-...")  // or set ANAKIN_API_KEY
                .build();

        // Scrape a single URL — returns the final result, no polling required
        Document doc = client.scrape("https://example.com");
        System.out.println(doc.markdown);

        // Discover URLs on a site
        var sitemap = client.map("https://example.com");
        System.out.println(sitemap.links);
    }
}
```

### What's in v0.1

| Method | Returns |
|---|---|
| `client.scrape(url)` / `client.scrape(url, opts)` | `Document` |
| `client.map(url)` / `client.map(url, opts)` | `MapResult` |
| `client.crawl(url)` / `client.crawl(url, opts)` | `CrawlResult` |
| `client.search(query)` / `client.search(query, opts)` | `SearchResult` (synchronous API) |
| `client.agenticSearch(prompt)` / `client.agenticSearch(prompt, opts)` | `AgenticSearchResult` |
| `client.wire(actionId, params)` | `WireResult` (run a [Wire](/docs/api-reference/holocron) action) |
| `client.sessions().list / create / save / update / delete` | Browser session CRUD |
| `Countries.supported()` | `Map<String, String>` (bundled, no network call) |

### Configuration

```java
Anakin client = Anakin.builder()
        .apiKey("ak-...")                              // or ANAKIN_API_KEY env var
        .baseURL("https://api.anakin.io/v1")
        .timeout(Duration.ofSeconds(60))               // per-request HTTP timeout
        .maxRetries(4)                                 // retries on 429 / 5xx
        .pollInterval(Duration.ofSeconds(1))           // initial polling delay
        .pollMaxInterval(Duration.ofSeconds(10))       // cap on exponential backoff
        .pollTimeout(Duration.ofMinutes(5))            // total wait before JobTimeoutException
        .build();
```

### Errors

Every error thrown by the SDK is a typed subclass of `AnakinException`:

```java
try {
    Document doc = client.scrape("https://example.com");
} catch (InsufficientCreditsException e) {
    System.out.printf("out of credits: balance=%d, needed=%d%n", e.getBalance(), e.getRequired());
} catch (AuthenticationException e) {
    System.out.println("invalid API key — get a fresh one at anakin.io/dashboard");
} catch (RateLimitException e) {
    System.out.printf("rate limited; retry after %s%n", e.getRetryAfter());
} catch (JobFailedException e) {
    System.out.printf("job failed: %s%n", e.getReason());
} catch (AnakinException e) {
    System.out.printf("unknown error: %s%n", e.getMessage());
}
```

The exception hierarchy:

| Type | When |
|---|---|
| `AuthenticationException` | 401 — invalid or missing API key |
| `InsufficientCreditsException` | 402 — out of credits (`getBalance()`, `getRequired()`) |
| `InvalidRequestException` | 400 — validation failure |
| `RateLimitException` | 429 — after retry budget exhausted (`getRetryAfter()`) |
| `JobFailedException` | Polled job came back with `status="failed"` (`getReason()`) |
| `JobTimeoutException` | Polling budget exhausted before terminal status |
| `ServerException` | 5xx — after retries exhausted |
| `NetworkException` | DNS / connect / read-timeout |
| `AnakinException` | Base type; everything above extends it |

### Stability

`v0.1.x` is alpha. The public API may change between minor versions until v1.0. Pin a specific version in production:

```groovy
implementation 'io.github.anakin-inc:anakin-sdk:0.1.0'
```

Raise issues on [GitHub](https://github.com/Anakin-Inc/anakin-java/issues).


---

# Node.js SDK (/docs/sdks/node)

Official Node.js / TypeScript SDK for the Anakin API. Wraps every documented endpoint with a single async call, full TypeScript types, and built-in polling.

| | |
|---|---|
| **Status** | Alpha (v0.1.x) |
| **Runtime** | Node.js 18+ |
| **Package** | [`@anakin-io/sdk`](https://www.npmjs.com/package/@anakin-io/sdk) on npm |
| **Source** | [github.com/Anakin-Inc/anakin-node](https://github.com/Anakin-Inc/anakin-node) |
| **Bundle** | ESM + CJS, ~28 KB |
| **License** | Apache 2.0 |

---

### Install

```bash
npm install @anakin-io/sdk
# or
pnpm add @anakin-io/sdk
# or
yarn add @anakin-io/sdk
```

### Quickstart

```typescript
import { Anakin } from '@anakin-io/sdk'

const client = new Anakin({ apiKey: 'ak-...' })  // or set ANAKIN_API_KEY env var

// Scrape a single URL — returns the final result, no polling required
const doc = await client.scrape('https://example.com', { formats: ['markdown'] })
console.log(doc.markdown)

// Discover URLs on a site
const sitemap = await client.map('https://example.com', { limit: 200 })
console.log(sitemap.links)

// Crawl pages and get content for each
const crawl = await client.crawl('https://example.com', { maxPages: 20 })
for (const page of crawl.pages) {
  console.log(page.url, page.markdown?.length ?? 0)
}
```

### What's in v0.1

| Method | Returns |
|---|---|
| `client.scrape(url, opts)` | `Promise<Document>` |
| `client.map(url, opts)` | `Promise<MapResult>` |
| `client.crawl(url, opts)` | `Promise<CrawlResult>` |
| `client.search(prompt, opts)` | `Promise<SearchResult>` (synchronous API) |
| `client.agenticSearch(prompt, opts)` | `Promise<AgenticSearchResult>` |
| `client.wire(actionId, params, opts)` | `Promise<WireResult>` (run a [Wire](/docs/api-reference/holocron) action) |
| `client.sessions.list / .create / .save / .update / .delete` | Browser session CRUD |
| `client.countries()` | `Country[]` (static, bundled with the SDK) |

### Configuration

```typescript
const client = new Anakin({
  apiKey: 'ak-...',          // or ANAKIN_API_KEY env var
  timeoutMs: 60_000,         // per-request HTTP timeout
  maxRetries: 4,             // retries on 429 / 5xx
  pollIntervalMs: 1_000,     // initial polling delay
  pollMaxIntervalMs: 10_000, // cap on exponential backoff
  pollTimeoutMs: 300_000,    // total wait before JobTimeoutError
})
```

### Errors

```typescript
import {
  AnakinError,                // base for everything below
  AuthenticationError,        // bad/missing API key
  InsufficientCreditsError,   // 402 — exposes .balance, .required
  InvalidRequestError,        // 400
  JobFailedError,             // job came back with status="failed"
  JobTimeoutError,            // pollTimeoutMs exceeded
  RateLimitError,             // 429 — exposes .retryAfter
  ServerError,                // 5xx after retries
  NetworkError,               // DNS / connection / timeout
  WireAuthRequiredError,      // Wire action needs account connection (.connectUrl)
} from '@anakin-io/sdk'
```

### Examples

The [`examples/`](https://github.com/Anakin-Inc/anakin-node/tree/main/examples) folder has copy-paste-able scripts:

- `quickstart.mjs` — scrape, map, crawl, search, wire — five recipes
- `agentic-extraction.mjs` — multi-stage AI search with a custom JSON schema

### Stability

`v0.1.x` is alpha. The public API may change between minor versions until v1.0. Pin a specific version in production:

```json
{
  "dependencies": {
    "@anakin-io/sdk": "0.1.0"
  }
}
```

Raise issues on [GitHub](https://github.com/Anakin-Inc/anakin-node/issues).


---

# PHP SDK (/docs/sdks/php)

Official PHP SDK for the Anakin API. Wraps every documented endpoint with a single sync call, internal polling, and a typed exception hierarchy. Built on Guzzle 7.

| | |
|---|---|
| **Status** | Alpha (v0.1.x) |
| **Language** | PHP 8.1+ (with `ext-curl` and `ext-json`) |
| **Package** | [`anakin/sdk`](https://packagist.org/packages/anakin/sdk) on Packagist |
| **Source** | [github.com/Anakin-Inc/anakin-php](https://github.com/Anakin-Inc/anakin-php) |
| **License** | Apache 2.0 |

---

### Install

```bash
composer require anakin/sdk
```

### Quickstart

```php
<?php
require 'vendor/autoload.php';

use Anakin\Client;

$client = new Client(['api_key' => 'ak-...']);  // or set ANAKIN_API_KEY env var

// Scrape a single URL — returns the final result, no polling required
$doc = $client->scrape('https://example.com');
echo $doc['markdown'];

// Discover URLs on a site
$sitemap = $client->map('https://example.com', ['limit' => 200]);
print_r($sitemap['links']);

// Crawl pages and get content for each
$crawl = $client->crawl('https://example.com', ['max_pages' => 20]);
foreach ($crawl['pages'] as $page) {
    echo $page['url'] . ': ' . strlen($page['markdown'] ?? '') . "\n";
}
```

### What's in v0.1

| Method | Returns |
|---|---|
| `$client->scrape($url, $opts)` | `array` — the document |
| `$client->map($url, $opts)` | `array` — discovered links |
| `$client->crawl($url, $opts)` | `array` — crawled pages |
| `$client->search($query, $opts)` | `array` — search results (synchronous API) |
| `$client->agenticSearch($prompt, $opts)` | `array` — AI-synthesised answer |
| `$client->wire($actionId, $params)` | `array` — Wire action result (run a [Wire](/docs/api-reference/holocron) action) |
| `$client->sessions()->list / create / save / update / delete` | Browser session CRUD |

All response methods return associative arrays (the parsed JSON response). Strong typing via [Psalm](https://psalm.dev) and [PHPStan](https://phpstan.org) generics is on the v0.2 roadmap.

### Configuration

```php
$client = new Anakin\Client([
    'api_key'           => 'ak-...',                    // or ANAKIN_API_KEY env var
    'base_url'          => 'https://api.anakin.io/v1',
    'timeout'           => 60,                          // per-request HTTP timeout (seconds)
    'max_retries'       => 4,                           // retries on 429 / 5xx
    'poll_interval'     => 1.0,                         // initial polling delay
    'poll_max_interval' => 10.0,                        // cap on exponential backoff
    'poll_timeout'      => 300,                         // total wait before JobTimeoutException
    'http_client'       => $myGuzzleClient,             // optional — inject your own PSR-18 client
]);
```

### Errors

```php
use Anakin\Exception\{
    AnakinException,                // base for everything below
    AuthenticationException,        // bad/missing API key
    InsufficientCreditsException,   // 402 — exposes ->balance, ->required
    InvalidRequestException,        // 400
    JobFailedException,             // job came back with status="failed"
    JobTimeoutException,            // poll_timeout exceeded
    RateLimitException,             // 429 — exposes ->retryAfter
    ServerException,                // 5xx after retries
    NetworkException,               // DNS / connection / timeout
};

try {
    $doc = $client->scrape('https://example.com');
} catch (InsufficientCreditsException $e) {
    echo "out of credits: balance={$e->balance}, needed={$e->required}";
} catch (RateLimitException $e) {
    echo "rate limited; retry after {$e->retryAfter}s";
} catch (AnakinException $e) {
    echo "anakin error: {$e->getMessage()}";
}
```

### Stability

`v0.1.x` is alpha. The public API may change between minor versions until v1.0. Pin a specific version in production:

```json
{
    "require": {
        "anakin/sdk": "0.1.0"
    }
}
```

Raise issues on [GitHub](https://github.com/Anakin-Inc/anakin-php/issues).


---

# Python SDK (/docs/sdks/python)

Official Python SDK for the Anakin API. Wraps every documented endpoint with a single sync call, typed Pydantic v2 response models, and built-in polling.

| | |
|---|---|
| **Status** | Alpha (v0.1.x) |
| **Language** | Python 3.10+ |
| **Package** | [`anakin-sdk`](https://pypi.org/project/anakin-sdk/) on PyPI |
| **Import name** | `anakin` (so you `pip install anakin-sdk` but `from anakin import Anakin`) |
| **Source** | [github.com/Anakin-Inc/anakin-py](https://github.com/Anakin-Inc/anakin-py) |
| **License** | Apache 2.0 |

---

### Install

```bash
pip install anakin-sdk
```

### Quickstart

```python
from anakin import Anakin

client = Anakin(api_key="ak-...")  # or set ANAKIN_API_KEY env var

# Scrape a single URL — returns the final result, no polling required
doc = client.scrape("https://example.com", formats=["markdown"])
print(doc.markdown)

# Discover URLs on a site
sitemap = client.map("https://example.com", limit=200)
print(sitemap.links)

# Crawl pages and get content for each
crawl = client.crawl("https://example.com", max_pages=20)
for page in crawl.pages:
    print(page.url, len(page.markdown or ""))
```

### What's in v0.1

| Method | Returns |
|---|---|
| `client.scrape(url, ...)` | `Document` |
| `client.map(url, ...)` | `MapResult` |
| `client.crawl(url, ...)` | `CrawlResult` |
| `client.search(prompt, ...)` | `SearchResult` (synchronous API) |
| `client.agentic_search(prompt, ...)` | `AgenticSearchResult` |
| `client.wire(action_id, params, ...)` | `WireResult` (run a [Wire](/docs/api-reference/holocron) action) |
| `client.sessions.list / .create / .save / .update / .delete` | Browser session CRUD |
| `client.countries()` | `list[Country]` (static, bundled with the SDK) |

### Configuration

```python
client = Anakin(
    api_key="ak-...",          # or ANAKIN_API_KEY env var
    timeout=60.0,              # per-request HTTP timeout (seconds)
    max_retries=4,             # retries on 429 / 5xx
    poll_interval=1.0,         # initial polling delay
    poll_max_interval=10.0,    # cap on exponential backoff
    poll_timeout=300.0,        # total wait before JobTimeoutError
)
```

### Errors

```python
from anakin import (
    AnakinError,                # base for everything below
    AuthenticationError,        # bad/missing API key
    InsufficientCreditsError,   # 402 — exposes .balance, .required
    InvalidRequestError,        # 400
    JobFailedError,             # job came back with status="failed"
    JobTimeoutError,            # poll_timeout exceeded
    RateLimitError,             # 429 — exposes .retry_after
    ServerError,                # 5xx after retries
    NetworkError,               # DNS / connection / timeout
    WireAuthRequiredError,      # Wire action needs account connection (.connect_url)
)
```

### Examples

The [`examples/`](https://github.com/Anakin-Inc/anakin-py/tree/main/examples) folder in the repo has copy-paste-able scripts for the common workflows:

- `quickstart.py` — scrape, map, crawl, search, wire — five recipes in one file
- `agentic_extraction.py` — multi-stage AI search with a custom JSON schema

### Stability

`v0.1.x` is alpha. The public API may change between minor versions until v1.0. Pin a specific version in production:

```
anakin==0.1.0
```

Raise issues on [GitHub](https://github.com/Anakin-Inc/anakin-py/issues).


---

# Releases (/docs/sdks/releases)

Current versions of all published Anakin packages. For full release notes see [/docs/releases](/docs/releases).

| Package | Registry | Latest | Install |
|---|---|---|---|
| `@anakin-io/sdk` | npm | `0.1.0` | `npm install @anakin-io/sdk` |
| `@anakin-io/mcp` | npm | `0.1.0` | `npx -y @anakin-io/mcp init --all` |
| `anakin-sdk` | PyPI | `0.1.0` | `pip install anakin-sdk` |
| `anakin-cli` | PyPI | `0.2.0` | `pip install anakin-cli` |
| `anakin-sdk` | crates.io | `0.1.0` | `cargo add anakin-sdk` |
| `anakin-sdk` | RubyGems | `0.1.0` | `gem install anakin-sdk` |
| `anakin/sdk` | Packagist | `0.1.0` | `composer require anakin/sdk` |
| `anakin` | Hex | `0.1.0` | `{:anakin, "~> 0.1"}` |
| `github.com/Anakin-Inc/anakin-go` | pkg.go.dev | `v0.1.0` | `go get github.com/Anakin-Inc/anakin-go` |
| `io.github.anakin-inc:anakin-sdk` | Maven Central | `0.1.0` | see [Java SDK](/docs/sdks/java) |
| `Anakin` | NuGet | coming soon | see [.NET SDK](/docs/sdks/dotnet) |

Full changelog with release notes → [Releases](/docs/releases)


---

# Ruby SDK (/docs/sdks/ruby)

Official Ruby gem for the Anakin API. Wraps every documented endpoint with a single sync call, internal polling, and a typed error hierarchy. Pure stdlib — no runtime dependencies.

| | |
|---|---|
| **Status** | Alpha (v0.1.x) |
| **Language** | Ruby 2.7+ |
| **Gem name** | [`anakin-sdk`](https://rubygems.org/gems/anakin-sdk) on RubyGems |
| **Source** | [github.com/Anakin-Inc/anakin-ruby](https://github.com/Anakin-Inc/anakin-ruby) |
| **License** | Apache 2.0 |

---

### Install

```bash
gem install anakin-sdk
```

Or in your `Gemfile`:

```ruby
gem 'anakin-sdk', '~> 0.1'
```

### Quickstart

```ruby
require 'anakin'

client = Anakin.new(api_key: 'ak-...')  # or set ANAKIN_API_KEY env var

# Scrape a single URL — returns the final result, no polling required
doc = client.scrape('https://example.com')
puts doc['markdown']

# Discover URLs on a site
sitemap = client.map('https://example.com', limit: 200)
puts sitemap['links']

# Crawl pages and get content for each
crawl = client.crawl('https://example.com', max_pages: 20)
crawl['pages'].each do |page|
  puts "#{page['url']}: #{(page['markdown'] || '').length}"
end
```

### What's in v0.1

| Method | Returns |
|---|---|
| `client.scrape(url, **opts)` | `Hash` — the document |
| `client.map(url, **opts)` | `Hash` — discovered links |
| `client.crawl(url, **opts)` | `Hash` — crawled pages |
| `client.search(query, **opts)` | `Hash` — search results (synchronous API) |
| `client.agentic_search(prompt, **opts)` | `Hash` — AI-synthesised answer |
| `client.wire(action_id, params)` | `Hash` — Wire action result (run a [Wire](/docs/api-reference/holocron) action) |
| `client.sessions.list / create / save / update / delete` | Browser session CRUD |

All response methods return parsed JSON as Ruby `Hash`/`Array`. Strict struct types via `Anakin::Document`, `Anakin::CrawlResult` etc. are on the v0.2 roadmap.

### Configuration

```ruby
client = Anakin.new(
  api_key:           'ak-...',                    # or ANAKIN_API_KEY env var
  base_url:          'https://api.anakin.io/v1',
  timeout:           60,                          # per-request HTTP timeout (seconds)
  max_retries:       4,                           # retries on 429 / 5xx
  poll_interval:     1.0,                         # initial polling delay
  poll_max_interval: 10.0,                        # cap on exponential backoff
  poll_timeout:      300,                         # total wait before JobTimeoutError
)
```

### Errors

```ruby
require 'anakin'

begin
  doc = client.scrape('https://example.com')
rescue Anakin::InsufficientCreditsError => e
  puts "out of credits: balance=#{e.balance}, needed=#{e.required}"
rescue Anakin::AuthenticationError
  puts "invalid API key — get a fresh one at anakin.io/dashboard"
rescue Anakin::RateLimitError => e
  puts "rate limited; retry after #{e.retry_after}s"
rescue Anakin::JobFailedError => e
  puts "job failed: #{e.reason}"
rescue Anakin::Error => e
  puts "anakin error: #{e.message}"
end
```

The hierarchy:

| Class | When |
|---|---|
| `Anakin::AuthenticationError` | 401 — invalid or missing API key |
| `Anakin::InsufficientCreditsError` | 402 — out of credits (`#balance`, `#required`) |
| `Anakin::InvalidRequestError` | 400 — validation failure |
| `Anakin::RateLimitError` | 429 — after retry budget exhausted (`#retry_after`) |
| `Anakin::JobFailedError` | Polled job came back with `status="failed"` (`#reason`) |
| `Anakin::JobTimeoutError` | Polling budget exhausted before terminal status |
| `Anakin::ServerError` | 5xx — after retries exhausted |
| `Anakin::NetworkError` | DNS / connect / read-timeout |
| `Anakin::Error` | Base class; everything above inherits from it |

### Stability

`v0.1.x` is alpha. The public API may change between minor versions until v1.0. Pin a specific version in production:

```ruby
gem 'anakin-sdk', '0.1.0'
```

Raise issues on [GitHub](https://github.com/Anakin-Inc/anakin-ruby/issues).


---

# Rust SDK (/docs/sdks/rust)

Official Rust crate for the Anakin API. Wraps every documented endpoint with a single async call, internal polling, and a strongly typed `Error` enum. Built on `reqwest` (rustls-tls) and `tokio`.

| | |
|---|---|
| **Status** | Alpha (v0.1.x) |
| **Language** | Rust 1.70+ |
| **Crate** | [`anakin-sdk`](https://crates.io/crates/anakin-sdk) on crates.io |
| **Docs** | [docs.rs/anakin-sdk](https://docs.rs/anakin-sdk) (auto-generated) |
| **Source** | [github.com/Anakin-Inc/anakin-rust](https://github.com/Anakin-Inc/anakin-rust) |
| **License** | Apache 2.0 |

---

### Install

Add to your `Cargo.toml`:

```toml
[dependencies]
anakin-sdk = "0.1"
tokio = { version = "1", features = ["full"] }
```

The import name is `anakin` (crate name on crates.io is `anakin-sdk`).

### Quickstart

```rust
use anakin::Client;

#[tokio::main]
async fn main() -> anakin::Result<()> {
    let client = Client::builder()
        .api_key("ak-...")  // or set ANAKIN_API_KEY
        .build()?;

    // Scrape a single URL — returns the final result, no polling required
    let doc = client.scrape("https://example.com").await?;
    println!("{}", doc.markdown.unwrap_or_default());

    // Discover URLs on a site
    let sitemap = client.map("https://example.com").await?;
    println!("{:?}", sitemap.links);

    // Crawl pages and get content for each
    let crawl = client.crawl("https://example.com").await?;
    for page in &crawl.pages {
        println!("{}: {} chars", page.url.as_deref().unwrap_or(""), page.markdown.as_deref().unwrap_or("").len());
    }

    Ok(())
}
```

### What's in v0.1

| Method | Returns |
|---|---|
| `client.scrape(url)` / `scrape_with(url, opts)` | `Result<Document>` |
| `client.map(url)` / `map_with(url, opts)` | `Result<MapResult>` |
| `client.crawl(url)` / `crawl_with(url, opts)` | `Result<CrawlResult>` |
| `client.search(query)` / `search_with(query, opts)` | `Result<SearchResult>` (synchronous API) |
| `client.agentic_search(prompt)` / `agentic_search_with(...)` | `Result<AgenticSearchResult>` |
| `client.wire(action_id, params)` | `Result<WireResult>` (run a [Wire](/docs/api-reference/holocron) action) |
| `client.sessions().list / create / save / update / delete` | Browser session CRUD |
| `anakin::supported_countries()` | `&'static [(&'static str, &'static str)]` (bundled, no network call) |

Extra opts can be passed as `Some(serde_json::json!({ "key": "value" }))`.

### Configuration

```rust
use std::time::Duration;

let client = anakin::Client::builder()
    .api_key("ak-...")                              // or ANAKIN_API_KEY env var
    .base_url("https://api.anakin.io/v1")
    .timeout(Duration::from_secs(60))              // per-request HTTP timeout
    .max_retries(4)                                // retries on 429 / 5xx
    .poll_interval(Duration::from_secs(1))         // initial polling delay
    .poll_max_interval(Duration::from_secs(10))    // cap on exponential backoff
    .poll_timeout(Duration::from_secs(300))        // total wait before JobTimeout
    .build()?;
```

You can also inject a pre-built `reqwest::Client` via `.http_client(c)` for custom proxy or TLS configuration.

### Errors

All errors come back as variants of `anakin::Error`:

```rust
use anakin::Error;

match client.scrape("https://example.com").await {
    Ok(doc) => println!("{}", doc.markdown.unwrap_or_default()),
    Err(Error::InsufficientCredits { balance, required, .. }) => {
        eprintln!("out of credits: balance={balance}, needed={required}");
    }
    Err(Error::Authentication { .. }) => {
        eprintln!("invalid API key — get a fresh one at anakin.io/dashboard");
    }
    Err(Error::RateLimit { retry_after, .. }) => {
        eprintln!("rate limited; retry after {retry_after:?}");
    }
    Err(Error::JobFailed { reason, .. }) => {
        eprintln!("job failed: {reason}");
    }
    Err(e) => eprintln!("unknown error: {e}"),
}
```

The error enum:

| Variant | When |
|---|---|
| `Error::Authentication` | 401 — invalid or missing API key |
| `Error::InsufficientCredits` | 402 — out of credits (`balance`, `required`) |
| `Error::InvalidRequest` | 400 — validation failure |
| `Error::RateLimit` | 429 — after retry budget exhausted (`retry_after`) |
| `Error::JobFailed` | Polled job came back with `status="failed"` (`reason`) |
| `Error::JobTimeout` | Polling budget exhausted before terminal status |
| `Error::Server` | 5xx — after retries exhausted |
| `Error::Network` | DNS / connect / read-timeout |
| `Error::Other` | Decoding failures, missing fields |

### Stability

`v0.1.x` is alpha. The public API may change between minor versions until v1.0. Pin a specific version in production:

```toml
anakin-sdk = "=0.1.0"
```

Full reference docs and examples are on [docs.rs](https://docs.rs/anakin-sdk).

Raise issues on [GitHub](https://github.com/Anakin-Inc/anakin-rust/issues).