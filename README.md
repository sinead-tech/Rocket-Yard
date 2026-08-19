# Rocket Yard — Marketing Analytics Dashboard

An interactive, multi-channel marketing analytics dashboard: blended spend,
conversions, and CPA across Meta, Google Ads, GA4 organic search, and email —
with filters, trend charts, a sortable campaign table, and an auto-generated
executive summary.

The data pipeline is **simulated but structurally real**: it ingests
responses shaped exactly like the Meta Graph API, Google Ads API, and GA4
Data API (including their conflicting field names), normalizes them into one
schema, and merges them into a single unified dataset — the same shape a
production ingestion job would produce. Swap the three fetch functions for
real HTTP calls and everything downstream (aggregation, charts, insights)
keeps working unchanged.

## Stack

React + TypeScript + Vite, Tailwind CSS v4, hand-built SVG charts (no chart
library dependency).

## Running locally

```bash
npm install
npm run dev
```

## Architecture

```
src/data/
  types.ts        Raw per-platform response shapes + the universal NormalizedRow schema
  mockMeta.ts      Simulated Meta Graph API `/insights` response
  mockGoogleAds.ts Simulated Google Ads API (GAQL) response
  mockGa4.ts       Simulated GA4 Data API `runReport` response
  promo.ts         Regex that extracts a shared "promo" token from any campaign name
  normalize.ts     Maps each platform's raw shape into NormalizedRow
  pipeline.ts      Ingest -> normalize -> merge, in one call
  aggregate.ts      Filtering, totals, trend series, campaign & promo rollups
src/lib/insights.ts Rule-based 3-bullet executive summary generator
src/components/     ScoreCard, FilterBar, TrendChart, CampaignTable, InsightsPanel
src/App.tsx         Wires filters -> pipeline -> aggregation -> UI
```

### The normalization layer

This is the part that actually matters once you have real data. Meta calls
cost `spend` (a decimal string). Google Ads calls it `cost` and reports it in
**micros** on a nested `metrics.costMicros` field. GA4 calls it
`advertiserAdCost` and reports it as one column in a column-oriented report
(`dimensionHeaders`/`metricHeaders`/`rows`, not one object per row). None of
that leaks past `src/data/normalize.ts` — every mapper in that file produces
the same `NormalizedRow`:

```ts
interface NormalizedRow {
  date: string;
  channel: "Meta" | "Google Ads" | "Organic Search" | "Email";
  campaign_name: string;
  promo: string;
  impressions: number;
  clicks: number;
  marketing_spend: number; // universal field, regardless of source name
  conversions: number;
}
```

### Cross-channel campaign matching

Campaigns follow `Promo_Product_Channel_Audience` (Google Ads exports use
hyphens instead of underscores — e.g. `Summer_Apparel_Meta_Retargeting` vs.
`Summer-Apparel-Google-Search`). `src/data/promo.ts` extracts the leading
`Promo` token with one regex so `aggregate.ts#blendedByPromo` can compute a
blended CPA per promotion across platforms, regardless of each platform's own
naming quirks.

### Automated insights

`src/lib/insights.ts#generateInsights` takes this period's totals, the prior
period's totals, and the per-campaign breakdown, and returns three bullet
strings. It's rule-based today (spend/conversion/CPA deltas + best vs. worst
CPA campaign) — deliberately, since a **browser app can never hold a private
LLM API key**. The function's signature is the same shape you'd hand to a
real model, so swapping it for a live call means adding a backend endpoint
(see below) and replacing the one call site in `src/App.tsx`.

## From simulated to live data

The three `fetch*` functions in `src/data/mock*.ts` are the only things that
need to change. Everything else — normalization, aggregation, charts, the
table, insights — already operates on the universal schema.

You cannot call the Meta, Google Ads, or GA4 APIs directly from browser code:
they require server-held secrets (long-lived tokens, OAuth refresh tokens, a
Google service account). The path to production is a small backend
(serverless functions work fine — Vercel/Netlify functions, a Cloudflare
Worker, or a tiny Node/Express service) that:

1. Holds the real credentials as server-only environment variables (see
   `.env.example` — never prefix these with `VITE_`, since that prefix tells
   Vite to bundle the value into client-side JS).
2. Calls each platform's API on a schedule or on-demand, using the same
   request shapes already modeled in `mockMeta.ts` / `mockGoogleAds.ts` /
   `mockGa4.ts`.
3. Runs the existing `normalize*` functions (or a server-side port of them)
   and returns `NormalizedRow[]` — or writes them to a small database/warehouse
   table that the frontend queries.
4. Optionally calls an LLM (e.g. the Claude API) with the same
   totals/campaign data `generateInsights` already receives, and returns real
   generated bullets instead of the rule-based ones.

Then `buildUnifiedDataset` in `src/data/pipeline.ts` becomes a `fetch()` to
that backend instead of a call to the three mock generators.

## Deployment

This is a static Vite build (`npm run build` → `dist/`), so it deploys
anywhere that serves static files:

- **Vercel or Netlify** — connect the GitHub repo, framework preset "Vite",
  build command `npm run build`, output directory `dist`. If you add the
  backend functions described above, both platforms host serverless
  functions alongside the static build in the same project.
- Any static host (GitHub Pages, Cloudflare Pages, S3 + CloudFront) works
  the same way once a backend endpoint exists for live data.
