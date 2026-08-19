// ---- Raw API response shapes (simulated, mirroring each platform's real schema) ----

export interface MetaInsightsRow {
  date_start: string;
  date_stop: string;
  campaign_name: string;
  impressions: string;
  clicks: string;
  spend: string;
  actions: { action_type: string; value: string }[];
}

export interface MetaInsightsResponse {
  data: MetaInsightsRow[];
}

export interface GoogleAdsRow {
  segments: { date: string };
  campaign: { name: string };
  metrics: {
    impressions: string;
    clicks: string;
    costMicros: string;
    conversions: string;
  };
}

export interface GoogleAdsResponse {
  results: GoogleAdsRow[];
}

export interface Ga4Report {
  dimensionHeaders: { name: string }[];
  metricHeaders: { name: string }[];
  rows: {
    dimensionValues: { value: string }[];
    metricValues: { value: string }[];
  }[];
}

// ---- Universal normalized schema every channel gets mapped into ----

export type Channel = "Meta" | "Google Ads" | "Organic Search" | "Email";

export interface NormalizedRow {
  date: string;
  channel: Channel;
  campaign_name: string;
  promo: string;
  impressions: number;
  clicks: number;
  marketing_spend: number;
  conversions: number;
}
