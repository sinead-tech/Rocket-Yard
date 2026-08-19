import { mulberry32, seededRange } from "./rng";
import type { Ga4Report } from "./types";

const SEGMENTS = [
  { channelGroup: "Organic Search", campaignName: "(organic)", baseSessions: 420, cvr: 0.02, adCost: 0 },
  { channelGroup: "Email", campaignName: "Summer_VIP_Email_Newsletter", baseSessions: 130, cvr: 0.06, adCost: 0 },
  { channelGroup: "Email", campaignName: "BackToSchool_Email_Blast", baseSessions: 95, cvr: 0.045, adCost: 0 },
];

// Simulates a POST .../properties/{id}:runReport call against the GA4 Data API.
export function fetchGa4Report(days: string[]): Ga4Report {
  const rand = mulberry32(0x67613400); // "ga4"
  const rows: Ga4Report["rows"] = [];

  for (const date of days) {
    for (const s of SEGMENTS) {
      const sessions = Math.round(s.baseSessions * seededRange(rand, 0.75, 1.25));
      const engagedSessions = Math.round(sessions * seededRange(rand, 0.55, 0.75));
      const conversions = Math.round(sessions * s.cvr * seededRange(rand, 0.7, 1.3));

      rows.push({
        dimensionValues: [
          { value: date.replace(/-/g, "") },
          { value: s.channelGroup },
          { value: s.campaignName },
        ],
        metricValues: [
          { value: String(sessions) },
          { value: String(engagedSessions) },
          { value: String(s.adCost) },
          { value: String(conversions) },
        ],
      });
    }
  }

  return {
    dimensionHeaders: [{ name: "date" }, { name: "sessionDefaultChannelGroup" }, { name: "campaignName" }],
    metricHeaders: [
      { name: "sessions" },
      { name: "engagedSessions" },
      { name: "advertiserAdCost" },
      { name: "conversions" },
    ],
    rows,
  };
}
