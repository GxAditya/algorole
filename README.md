# AlgoScore

A TinyFish-powered job and internship finder. Type a role and a location, get
back **exact job postings** — every Apply button lands on the individual
listing page, not a portal search screen. Results are match-scored against
your preferences (role, location, seniority, skills, visa).

## Features

- **Exact listings, not portal pages** — Search → Fetch-expand pipeline
  (`lib/tinyfish/exact-jobs.ts`) resolves portal indexes into direct posting
  URLs via ATS domain targeting + link extraction.
- **Worldwide search** — free-text location box (any city/country, or Remote)
  plus a region dropdown (24 countries + Worldwide). An empty location box
  falls back to the selected region, so the dropdown always takes effect.
- **Smart matching** — 100-point match score on role, location, seniority,
  skills, visa sponsorship, and job type (`lib/matching/engine.ts`).
  Your saved Preferences drive the scoring automatically.
- **Saved jobs + application tracker** — bookmark jobs from any card
  (`/saved`), track pipeline stages (saved → applied → interviewing →
  offer / rejected) with notes (`/applications`). All local.
- **Deep scan (opt-in)** — Agent-powered scraping of JS-heavy boards the
  free pipeline can't expand. Paid (TinyFish wallet) and slow, so it's a
  toggle, capped at 2 boards per search.
- **BYOK (Bring Your Own Key)** — users paste their own TinyFish API key in
  Settings; keys live in `localStorage` only.
- **Visible errors** — API failures (bad key, rate limit, network) surface
  inline instead of failing silently.
- **Titles in Sora** — headings use the Sora typeface; body uses Geist.

## How search works

```
User query ──► POST /api/jobs/search ──► TinyFish Search (×2: ATS-restricted + broad)
                                                    │
                                                    ▼
                                        Classify URLs (exact posting vs portal index)
                                                    │
                                                    ▼
                                        TinyFish Fetch (links:true, one batched call)
                                        portal pages ──► exact posting links
                                                    │
                                                    ▼
                                        Match scoring + ranking ──► Job[]
```

1. **Search (free)** — two parallel `GET https://api.search.tinyfish.ai`
   calls: one restricted with `include_domains` to ATS hosts (Greenhouse,
   Lever, Ashby, Workable, …), one broad. Both carry the location in the
   query string plus the ISO country code for geo-targeting.
2. **Classify** — `isExactJobUrl()` keeps deep links
   (`boards.greenhouse.io/…/jobs/123`, `linkedin.com/jobs/view/…`) and queues
   portal/search pages for expansion.
3. **Fetch-expand (free)** — one batched `POST
   https://api.fetch.tinyfish.ai` with `links: true` pulls all `<a href>`
   links from index pages; only exact-posting links survive.
4. **Agent (opt-in, paid)** — `extractJobsViaAgent()` / `scrapeCompanyCareerPage()`
   drive `POST https://agent.tinyfish.ai/v1/automation/run` with a strict
   `output_schema` for JS-heavy boards. Draws from the TinyFish wallet and is
   much slower, so the default search path doesn't use it.

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A TinyFish API key — [create one here](https://agent.tinyfish.ai/api-keys).
  Search and Fetch are free at any balance; only Agent runs draw from the
  wallet.

### Installation

```bash
cd algorole
npm install
cp .env.example .env.local   # endpoints only; no key needed server-side (BYOK)
npm run dev
```

### Configuration

1. Open `http://localhost:3000`
2. Click **Settings** → paste your TinyFish API key → Save
3. (Optional) Add an LLM key for future enhanced matching

## Usage

1. **Search** — enter a role (e.g. `Software Engineer`), optionally a
   location (`Bangalore, India`, `Berlin`, `Remote`) and/or a region, then
   Search. The line under the filters always shows the effective geography.
   Toggle **Deep scan** to also scrape JS-heavy boards via the paid Agent.
2. **Preferences** — `/preferences` stores target roles, locations, skills,
   and visa needs in `localStorage`. They are sent with every search and
   drive the match scores.
3. **Results** — ranked by match score; **Save** bookmarks, **Track** adds
   to the pipeline, **Apply** opens the exact listing.
4. **Saved** — `/saved` lists bookmarked jobs (unsave from the card).
5. **Applications** — `/applications` tracks status per job plus notes
   (e.g. referral, follow-up), with per-stage counts.

## API Reference

### `POST /api/jobs/search`

Request body:

```json
{
  "query": "Software Engineer",
  "location": "Bangalore, India",
  "country": "IN",
  "language": "en",
  "seniority": "mid",
  "visa_sponsorship": false,
  "preferences": { "roles": ["Backend Engineer"], "keywords": ["Go"] },
  "deep": false,
  "api_key": "your_tinyfish_key"
}
```

| Field | Required | Notes |
| ----- | -------- | ----- |
| `query` | yes | Role / keywords |
| `location` | no | Free text; falls back to the `country` name when empty |
| `country` | no | ISO code (`IN`, `DE`, …); omit or `WORLDWIDE` for global |
| `language` | no | e.g. `en`, `fr` |
| `seniority` | no | `entry` \| `mid` \| `senior` \| `lead` |
| `visa_sponsorship` | no | boolean |
| `preferences` | no | Saved `UserPreferences` — drives scoring (roles, locations, keywords, seniority, visa, job types, exclusions) |
| `deep` | no | `true` = Agent deep scan of ≤2 unresolved boards (paid, slow) |
| `api_key` | yes | TinyFish key, sent upstream as `X-API-Key` |

Success response: `{ jobs: Job[], total: number, query: string,
location?: string, deep?: boolean, deepScanned: number, timestamp: string }`.

Error responses:

| Status | Meaning |
| ------ | ------- |
| 400 | Missing/blank `query` |
| 401 | Missing key, or TinyFish rejected it (invalid/revoked) |
| 429 | TinyFish rate limit — wait and retry |
| 502 | Other TinyFish API error |

## TinyFish integration notes

- Auth for all REST calls is the **`X-API-Key` header**, not
  `Authorization: Bearer`.
- Search is `GET` with query params (`query`, `purpose`, `location`,
  `language`, `include_domains`, `recency_minutes`, …). There is no
  `max_results` parameter.
- Fetch takes `{ urls: [...] }` (max 10 per request), not a single `url`.
- Agent `output_schema` must be a top-level **object** containing a
  `results` array — a bare top-level array is rejected with 400.
- Full reference: [docs.tinyfish.ai](https://docs.tinyfish.ai/)

## Project structure

```
/app
  /page.tsx                - Search UI (worldwide location + region + filters + deep scan)
  /preferences/page.tsx    - User preferences (localStorage, drives scoring)
  /settings/page.tsx       - BYOK key management (localStorage)
  /saved/page.tsx          - Bookmarked jobs
  /applications/page.tsx  - Application tracker (status + notes)
  /api/jobs/search/route.ts - Search endpoint: pipeline + scoring (+ opt-in Agent)
  /globals.css             - Theme, Sora display font
  /layout.tsx              - Font loading (Geist + Sora)
/components
  /jobs/job-card.tsx       - Job display card with match score + Save/Track
  /jobs/job-list.tsx       - Results list / empty state
  /layout/header.tsx       - Shared navigation header
  /ui/                     - ShadCN primitives
/lib
  /tinyfish/client.ts      - TinyFish wrapper (Search/Fetch/Agent, X-API-Key)
  /tinyfish/exact-jobs.ts  - Exact-listing pipeline + URL classifiers + Agent scan
  /tinyfish/scraper.ts     - Career-page scraping helpers
  /matching/engine.ts      - 100-point match scoring + ranking
  /countries.ts            - ISO code → name map (single source of truth)
  /storage.ts              - localStorage helpers (saved, applications, prefs)
/types
  /job.ts                  - Job, UserPreferences, SearchFilters
  /tinyfish.ts             - TinyFish request/response shapes
```

## Environment variables

See `.env.example`. Only endpoint overrides; no secrets required server-side:

```bash
TINYFISH_SEARCH_API_BASE=https://api.search.tinyfish.ai
TINYFISH_FETCH_API_BASE=https://api.fetch.tinyfish.ai
TINYFISH_AGENT_API_BASE=https://agent.tinyfish.ai
```

## Privacy & Security

- API keys live in browser `localStorage` and are forwarded to TinyFish only.
- No database, no accounts, no server-side storage of user data.

## Troubleshooting

- **"Invalid or missing API key"** — create a key at
  `agent.tinyfish.ai/api-keys` and save it in Settings (watch for pasted
  whitespace).
- **Rate limit (429)** — default is 30 searches/min per key; wait a minute.
- **Few/no exact results** — niche role+region combos may have little ATS
  coverage; try Worldwide or a broader role.
- **LinkedIn/Indeed links missing** — those pages often return `bot_blocked`
  or `login_required` from Fetch; the pipeline skips them. Agent+stealth is
  the fallback for such boards.

## Deployment notes

- Standard Next.js app — `npm run build` then deploy to Vercel (or any
  Node host). No database or extra services needed.
- No server-side secrets required: the app is BYOK, keys stay in the
  browser. Endpoint overrides via env vars are optional.
- Deep scan runs can take minutes (Agent); on serverless hosts with short
  function timeouts those requests may time out — the default (free)
  Search+Fetch path is unaffected.

## Development

```bash
npm run dev     # local server
npm run build   # production build
npm start       # serve production build
npm run lint    # eslint
npx tsc --noEmit  # typecheck
```

## Tech Stack

- **Frontend**: Next.js 16 (App Router) + React 19 + TypeScript
- **UI**: ShadCN UI + Tailwind CSS v4 (+ `tw-animate-css`)
- **Fonts**: Sora (titles) + Geist / Geist Mono (body / data)
- **State**: `localStorage` (keys, preferences); no DB
- **API**: Next.js Route Handlers + TinyFish Search / Fetch / Agent

## License

MIT

## Resources

- [TinyFish Documentation](https://docs.tinyfish.ai/)
- [TinyFish API keys](https://agent.tinyfish.ai/api-keys)
- [Next.js Documentation](https://nextjs.org/docs)
- [ShadCN UI](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/)
