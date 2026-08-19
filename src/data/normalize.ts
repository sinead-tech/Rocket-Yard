import { extractPromo } from "./promo";
import type {
  Ga4Report,
  GoogleAdsResponse,
  MetaInsightsResponse,
  NormalizedRow,
} from "./types";

// ---- The normalization layer ----
// Each platform names and shapes things differently (Meta calls cost "spend",
// Google Ads calls it "cost" in micros, GA4 calls it "advertiserAdCost" on a
// column-oriented report). Every mapper below transforms its source into the
// same universal row shape — { date, channel, marketing_spend, ... } — so the
// rest of the app never has to know which platform a number came from.

function sumActions(actions: { action_type: string; value: string }[], type: string): number {
  return actions.filter((a) => a.action_type === type).reduce((sum, a) => sum + Number(a.value), 0);
}

export function normalizeMeta(response: MetaInsightsResponse): NormalizedRow[] {
  return response.data.map((row) => ({
    date: row.date_start,
    channel: "Meta",
    campaign_name: row.campaign_name,
    promo: extractPromo(row.campaign_name),
    impressions: Number(row.impressions),
    clicks: Number(row.clicks),
    marketing_spend: Number(row.spend),
    conversions: sumActions(row.actions, "offsite_conversion.fb_pixel_purchase"),
  }));
}

export function normalizeGoogleAds(response: GoogleAdsResponse): NormalizedRow[] {
  return response.results.map((row) => ({
    date: row.segments.date,
    channel: "Google Ads",
    campaign_name: row.campaign.name,
    promo: extractPromo(row.campaign.name),
    impressions: Number(row.metrics.impressions),
    clicks: Number(row.metrics.clicks),
    marketing_spend: Number(row.metrics.costMicros) / 1_000_000,
    conversions: Number(row.metrics.conversions),
  }));
}

function ga4DateToIso(yyyymmdd: string): string {
  return `${yyyymmdd.slice(0, 4)}-${yyyymmdd.slice(4, 6)}-${yyyymmdd.slice(6, 8)}`;
}

export function normalizeGa4(report: Ga4Report): NormalizedRow[] {
  return report.rows.map((row) => {
    const [date, channelGroup, campaignName] = row.dimensionValues.map((d) => d.value);
    const [sessions, , adCost, conversions] = row.metricValues.map((m) => Number(m.value));
    const channel = channelGroup === "Email" ? "Email" : "Organic Search";

    return {
      date: ga4DateToIso(date),
      channel,
      campaign_name: campaignName,
      promo: campaignName === "(organic)" ? "Organic" : extractPromo(campaignName),
      impressions: sessions,
      clicks: Number(row.metricValues[1].value),
      marketing_spend: adCost,
      conversions,
    };
  });
}

export function mergeChannels(...sources: NormalizedRow[][]): NormalizedRow[] {
  return sources.flat().sort((a, b) => a.date.localeCompare(b.date));
}
