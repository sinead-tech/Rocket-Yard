import type { Channel, NormalizedRow } from "./types";

export interface Totals {
  impressions: number;
  clicks: number;
  marketing_spend: number;
  conversions: number;
}

export function filterRows(
  rows: NormalizedRow[],
  opts: { start: string; end: string; channels: Channel[] },
): NormalizedRow[] {
  const channelSet = new Set(opts.channels);
  return rows.filter(
    (r) => r.date >= opts.start && r.date <= opts.end && channelSet.has(r.channel),
  );
}

export function totalsOf(rows: NormalizedRow[]): Totals {
  return rows.reduce(
    (acc, r) => ({
      impressions: acc.impressions + r.impressions,
      clicks: acc.clicks + r.clicks,
      marketing_spend: acc.marketing_spend + r.marketing_spend,
      conversions: acc.conversions + r.conversions,
    }),
    { impressions: 0, clicks: 0, marketing_spend: 0, conversions: 0 },
  );
}

export function blendedCpa(totals: Totals): number {
  return totals.conversions > 0 ? totals.marketing_spend / totals.conversions : 0;
}

export interface DailyPoint extends Totals {
  date: string;
}

export function trendByDate(rows: NormalizedRow[]): DailyPoint[] {
  const byDate = new Map<string, Totals>();
  for (const r of rows) {
    const cur = byDate.get(r.date) ?? { impressions: 0, clicks: 0, marketing_spend: 0, conversions: 0 };
    cur.impressions += r.impressions;
    cur.clicks += r.clicks;
    cur.marketing_spend += r.marketing_spend;
    cur.conversions += r.conversions;
    byDate.set(r.date, cur);
  }
  return [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, totals]) => ({ date, ...totals }));
}

export interface CampaignSummary extends Totals {
  campaign_name: string;
  channel: Channel;
  promo: string;
  cpa: number;
}

export function campaignTable(rows: NormalizedRow[]): CampaignSummary[] {
  const byCampaign = new Map<string, CampaignSummary>();
  for (const r of rows) {
    const key = `${r.channel}::${r.campaign_name}`;
    const cur = byCampaign.get(key) ?? {
      campaign_name: r.campaign_name,
      channel: r.channel,
      promo: r.promo,
      impressions: 0,
      clicks: 0,
      marketing_spend: 0,
      conversions: 0,
      cpa: 0,
    };
    cur.impressions += r.impressions;
    cur.clicks += r.clicks;
    cur.marketing_spend += r.marketing_spend;
    cur.conversions += r.conversions;
    byCampaign.set(key, cur);
  }
  return [...byCampaign.values()]
    .map((c) => ({ ...c, cpa: c.conversions > 0 ? c.marketing_spend / c.conversions : 0 }))
    .sort((a, b) => b.marketing_spend - a.marketing_spend);
}

export function seriesByChannel(
  rows: NormalizedRow[],
  channels: Channel[],
  metric: keyof Totals,
): { key: Channel; points: { date: string; value: number }[] }[] {
  const dates = [...new Set(rows.map((r) => r.date))].sort();
  return channels.map((channel) => {
    const byDate = new Map<string, number>();
    for (const r of rows) {
      if (r.channel !== channel) continue;
      byDate.set(r.date, (byDate.get(r.date) ?? 0) + r[metric]);
    }
    return { key: channel, points: dates.map((date) => ({ date, value: byDate.get(date) ?? 0 })) };
  });
}

export interface PromoSummary extends Totals {
  promo: string;
  channels: Channel[];
  cpa: number;
}

// Blended CPA per promotion, matched across platforms via the shared "promo"
// token extracted from each channel's own campaign-naming convention.
export function blendedByPromo(rows: NormalizedRow[]): PromoSummary[] {
  const byPromo = new Map<string, PromoSummary>();
  for (const r of rows) {
    const cur = byPromo.get(r.promo) ?? {
      promo: r.promo,
      channels: [],
      impressions: 0,
      clicks: 0,
      marketing_spend: 0,
      conversions: 0,
      cpa: 0,
    };
    cur.impressions += r.impressions;
    cur.clicks += r.clicks;
    cur.marketing_spend += r.marketing_spend;
    cur.conversions += r.conversions;
    if (!cur.channels.includes(r.channel)) cur.channels.push(r.channel);
    byPromo.set(r.promo, cur);
  }
  return [...byPromo.values()]
    .map((p) => ({ ...p, cpa: p.conversions > 0 ? p.marketing_spend / p.conversions : 0 }))
    .sort((a, b) => b.marketing_spend - a.marketing_spend);
}
