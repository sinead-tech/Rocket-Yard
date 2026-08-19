import type { Totals } from "../data/aggregate";
import type { CampaignSummary } from "../data/aggregate";

function pctChange(current: number, previous: number): number {
  if (previous === 0) return current === 0 ? 0 : 100;
  return ((current - previous) / previous) * 100;
}

function fmtPct(n: number): string {
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(0)}%`;
}

function fmtMoney(n: number): string {
  return n.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

/**
 * Rule-based executive summary generator. Takes this period's totals against
 * the prior period plus a per-campaign breakdown and returns three bullets —
 * the same input shape a real LLM call would take (see README "Automated
 * insights" for wiring this to an actual model behind a backend endpoint,
 * since browser code can never hold a private LLM API key).
 */
export function generateInsights(
  current: Totals,
  previous: Totals,
  campaigns: CampaignSummary[],
): string[] {
  const bullets: string[] = [];

  const spendChange = pctChange(current.marketing_spend, previous.marketing_spend);
  const convChange = pctChange(current.conversions, previous.conversions);
  const currentCpa = current.conversions > 0 ? current.marketing_spend / current.conversions : 0;
  const previousCpa = previous.conversions > 0 ? previous.marketing_spend / previous.conversions : 0;
  const cpaChange = pctChange(currentCpa, previousCpa);

  bullets.push(
    `Blended spend ${spendChange >= 0 ? "rose" : "fell"} ${fmtPct(Math.abs(spendChange)).replace("+", "")} to ${fmtMoney(current.marketing_spend)} while conversions ${convChange >= 0 ? "grew" : "dropped"} ${fmtPct(Math.abs(convChange)).replace("+", "")} versus the prior period.`,
  );

  if (currentCpa > 0) {
    bullets.push(
      `Blended CPA is ${fmtMoney(currentCpa)}, ${cpaChange >= 0 ? "up" : "down"} ${fmtPct(Math.abs(cpaChange)).replace("+", "")} period over period — ${cpaChange <= 0 ? "efficiency is improving" : "efficiency is worsening"}.`,
    );
  }

  // Only compare campaigns that actually spent something — a $0-spend organic
  // or email "campaign" has a trivial $0 CPA that isn't a real efficiency signal.
  const sorted = [...campaigns]
    .filter((c) => c.conversions > 0 && c.marketing_spend > 0)
    .sort((a, b) => a.cpa - b.cpa);
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];
  if (best && worst && best.campaign_name !== worst.campaign_name) {
    bullets.push(
      `${best.campaign_name} (${best.channel}) is the most efficient campaign at ${fmtMoney(best.cpa)} CPA; ${worst.campaign_name} (${worst.channel}) lags at ${fmtMoney(worst.cpa)} — consider reallocating budget between them.`,
    );
  } else if (best) {
    bullets.push(`${best.campaign_name} (${best.channel}) is currently the top-performing campaign at ${fmtMoney(best.cpa)} CPA.`);
  }

  return bullets;
}
