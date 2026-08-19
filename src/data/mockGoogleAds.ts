import { mulberry32, seededRange } from "./rng";
import type { GoogleAdsResponse, GoogleAdsRow } from "./types";

const CAMPAIGNS = [
  { name: "Summer-Apparel-Google-Search", baseSpend: 210, ctr: 0.035, cvr: 0.11 },
  { name: "Summer-Footwear-Google-PMax", baseSpend: 300, ctr: 0.014, cvr: 0.06 },
  { name: "BackToSchool-Apparel-Google-Search", baseSpend: 175, ctr: 0.03, cvr: 0.08 },
  { name: "BackToSchool-Accessories-Google-PMax", baseSpend: 110, ctr: 0.013, cvr: 0.05 },
];

// Simulates a GoogleAdsService.SearchStream call (GAQL) against the Google Ads API.
export function fetchGoogleAdsResults(days: string[]): GoogleAdsResponse {
  const rand = mulberry32(0x676f6f67); // "goog"
  const results: GoogleAdsRow[] = [];

  for (const date of days) {
    const dow = new Date(date).getDay();
    const weekendLift = dow === 0 || dow === 6 ? 0.9 : 1.05;

    for (const c of CAMPAIGNS) {
      const spend = c.baseSpend * weekendLift * seededRange(rand, 0.7, 1.3);
      const impressions = Math.round((spend / seededRange(rand, 6, 11)) * 1000);
      const clicks = Math.round(impressions * c.ctr * seededRange(rand, 0.8, 1.2));
      const conversions = clicks * c.cvr * seededRange(rand, 0.7, 1.3);

      results.push({
        segments: { date },
        campaign: { name: c.name },
        metrics: {
          impressions: String(impressions),
          clicks: String(clicks),
          costMicros: String(Math.round(spend * 1_000_000)),
          conversions: conversions.toFixed(1),
        },
      });
    }
  }

  return { results };
}
