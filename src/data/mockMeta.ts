import { mulberry32, seededRange } from "./rng";
import type { MetaInsightsResponse, MetaInsightsRow } from "./types";

const CAMPAIGNS = [
  { name: "Summer_Apparel_Meta_Retargeting", baseSpend: 180, ctr: 0.021, cvr: 0.09 },
  { name: "Summer_Footwear_Meta_LookalikeUS", baseSpend: 260, ctr: 0.016, cvr: 0.05 },
  { name: "BackToSchool_Apparel_Meta_Broad", baseSpend: 140, ctr: 0.012, cvr: 0.04 },
  { name: "BackToSchool_Accessories_Meta_Retargeting", baseSpend: 95, ctr: 0.024, cvr: 0.1 },
];

// Simulates a GET /act_<id>/insights call against the Meta Graph API.
export function fetchMetaInsights(days: string[]): MetaInsightsResponse {
  const rand = mulberry32(0x4e_45_54_41); // "META"
  const data: MetaInsightsRow[] = [];

  for (const date of days) {
    const dow = new Date(date).getDay();
    const weekendLift = dow === 0 || dow === 6 ? 1.15 : 1;

    for (const c of CAMPAIGNS) {
      const spend = c.baseSpend * weekendLift * seededRange(rand, 0.7, 1.3);
      const impressions = Math.round((spend / seededRange(rand, 8, 14)) * 1000);
      const clicks = Math.round(impressions * c.ctr * seededRange(rand, 0.8, 1.2));
      const purchases = Math.round(clicks * c.cvr * seededRange(rand, 0.7, 1.3));

      data.push({
        date_start: date,
        date_stop: date,
        campaign_name: c.name,
        impressions: String(impressions),
        clicks: String(clicks),
        spend: spend.toFixed(2),
        actions: [
          { action_type: "offsite_conversion.fb_pixel_purchase", value: String(purchases) },
          { action_type: "link_click", value: String(clicks) },
        ],
      });
    }
  }

  return { data };
}
