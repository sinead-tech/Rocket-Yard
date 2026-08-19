import { useMemo, useState } from "react";
import { FilterBar, ALL_CHANNELS, CHANNEL_SERIES, type DatePreset } from "./components/FilterBar";
import { ScoreCard } from "./components/ScoreCard";
import { TrendChart } from "./components/TrendChart";
import { CampaignTable } from "./components/CampaignTable";
import { InsightsPanel } from "./components/InsightsPanel";
import { buildUnifiedDataset } from "./data/pipeline";
import { blendedCpa, campaignTable, filterRows, seriesByChannel, totalsOf } from "./data/aggregate";
import { generateInsights } from "./lib/insights";
import type { Channel } from "./data/types";

const PRESET_DAYS: Record<DatePreset, number> = { "7d": 7, "30d": 30, "90d": 90 };
const TODAY = new Date("2026-08-19T00:00:00");

function isoDaysAgo(from: Date, days: number): string {
  const d = new Date(from);
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return ((current - previous) / previous) * 100;
}

const currency = (n: number) => n.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const number_ = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: 0 });

export default function App() {
  const [preset, setPreset] = useState<DatePreset>("30d");
  const [channels, setChannels] = useState<Channel[]>(ALL_CHANNELS);

  // The full simulated pipeline (ingestion -> normalization -> merge) runs once;
  // filters below only slice the already-unified dataset, mirroring how a real
  // app would filter a warehouse table rather than re-fetch per interaction.
  const dataset = useMemo(() => buildUnifiedDataset(new Date("2026-04-01"), TODAY), []);

  const days = PRESET_DAYS[preset];
  const currentEnd = TODAY.toISOString().slice(0, 10);
  const currentStart = isoDaysAgo(TODAY, days - 1);
  const previousEnd = isoDaysAgo(TODAY, days);
  const previousStart = isoDaysAgo(TODAY, days * 2 - 1);

  const currentRows = useMemo(
    () => filterRows(dataset, { start: currentStart, end: currentEnd, channels }),
    [dataset, currentStart, currentEnd, channels],
  );
  const previousRows = useMemo(
    () => filterRows(dataset, { start: previousStart, end: previousEnd, channels }),
    [dataset, previousStart, previousEnd, channels],
  );

  const currentTotals = useMemo(() => totalsOf(currentRows), [currentRows]);
  const previousTotals = useMemo(() => totalsOf(previousRows), [previousRows]);
  const currentCpa = blendedCpa(currentTotals);
  const previousCpa = blendedCpa(previousTotals);

  const campaigns = useMemo(() => campaignTable(currentRows), [currentRows]);
  const spendSeries = useMemo(() => seriesByChannel(currentRows, channels, "marketing_spend"), [currentRows, channels]);
  const conversionSeries = useMemo(() => seriesByChannel(currentRows, channels, "conversions"), [currentRows, channels]);
  const insights = useMemo(() => generateInsights(currentTotals, previousTotals, campaigns), [currentTotals, previousTotals, campaigns]);

  return (
    <div className="min-h-screen">
      <header className="border-b" style={{ borderColor: "var(--border)" }}>
        <div className="max-w-6xl mx-auto px-4 py-4">
          <h1 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
            Rocket Yard — Marketing Analytics
          </h1>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Blended performance across Meta, Google Ads, organic search, and email
          </p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <FilterBar preset={preset} onPresetChange={setPreset} channels={channels} onChannelsChange={setChannels} />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <ScoreCard label="Marketing spend" value={currency(currentTotals.marketing_spend)} deltaPct={pctChange(currentTotals.marketing_spend, previousTotals.marketing_spend)} goodDirection="down" />
          <ScoreCard label="Conversions" value={number_(currentTotals.conversions)} deltaPct={pctChange(currentTotals.conversions, previousTotals.conversions)} goodDirection="up" />
          <ScoreCard label="Blended CPA" value={currentCpa > 0 ? currency(currentCpa) : "—"} deltaPct={pctChange(currentCpa, previousCpa)} goodDirection="down" />
          <ScoreCard label="Clicks" value={number_(currentTotals.clicks)} deltaPct={pctChange(currentTotals.clicks, previousTotals.clicks)} goodDirection="up" />
        </div>

        <InsightsPanel bullets={insights} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <TrendChart title="Spend by channel" series={spendSeries.map((s) => ({ ...s, color: CHANNEL_SERIES[s.key] }))} valueFormatter={currency} />
          <TrendChart title="Conversions by channel" series={conversionSeries.map((s) => ({ ...s, color: CHANNEL_SERIES[s.key] }))} valueFormatter={number_} />
        </div>

        <div>
          <h2 className="text-sm font-medium mb-2" style={{ color: "var(--text-primary)" }}>
            Campaigns
          </h2>
          <CampaignTable rows={campaigns} />
        </div>
      </main>

      <footer className="max-w-6xl mx-auto px-4 py-6 text-xs" style={{ color: "var(--text-muted)" }}>
        Data shown is simulated (deterministic mock responses shaped like the Meta Graph API, Google Ads API, and GA4 Data API). See README for wiring real credentials.
      </footer>
    </div>
  );
}
