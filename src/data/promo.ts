// Campaign naming convention across every channel: Promo_Product_Channel_Audience
// (Google Ads exports use hyphens instead of underscores) so campaigns that
// belong to the same promotion can be matched across platforms with one regex.
const PROMO_PATTERN = /^([A-Za-z0-9]+)[_-]/;

export function extractPromo(campaignName: string): string {
  const match = campaignName.match(PROMO_PATTERN);
  return match ? match[1] : campaignName;
}
