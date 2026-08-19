import { fetchGa4Report } from "./mockGa4";
import { fetchGoogleAdsResults } from "./mockGoogleAds";
import { fetchMetaInsights } from "./mockMeta";
import { mergeChannels, normalizeGa4, normalizeGoogleAds, normalizeMeta } from "./normalize";
import { dateRangeDays } from "./rng";
import type { NormalizedRow } from "./types";

// The three-part pipeline: ingest each platform's raw response, normalize it
// into the universal schema, then merge into one unified dataset. In
// production, fetchMetaInsights/fetchGoogleAdsResults/fetchGa4Report would be
// real HTTP calls (see README) — everything downstream is unaffected either way.
export function buildUnifiedDataset(start: Date, end: Date): NormalizedRow[] {
  const days = dateRangeDays(start, end);

  const meta = normalizeMeta(fetchMetaInsights(days));
  const googleAds = normalizeGoogleAds(fetchGoogleAdsResults(days));
  const ga4 = normalizeGa4(fetchGa4Report(days));

  return mergeChannels(meta, googleAds, ga4);
}
