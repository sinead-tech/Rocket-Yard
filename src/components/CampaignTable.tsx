import { useState } from "react";
import type { CampaignSummary } from "../data/aggregate";
import { CHANNEL_SERIES } from "./FilterBar";

type SortKey = keyof Pick<
  CampaignSummary,
  "marketing_spend" | "impressions" | "clicks" | "conversions" | "cpa"
>;

const COLUMNS: { key: SortKey; label: string; format: (n: number) => string }[] = [
  { key: "impressions", label: "Impressions", format: (n) => n.toLocaleString() },
  { key: "clicks", label: "Clicks", format: (n) => n.toLocaleString() },
  { key: "marketing_spend", label: "Spend", format: (n) => n.toLocaleString(undefined, { style: "currency", currency: "USD" }) },
  { key: "conversions", label: "Conversions", format: (n) => n.toLocaleString(undefined, { maximumFractionDigits: 0 }) },
  { key: "cpa", label: "CPA", format: (n) => (n > 0 ? n.toLocaleString(undefined, { style: "currency", currency: "USD" }) : "—") },
];

export function CampaignTable({ rows }: { rows: CampaignSummary[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("marketing_spend");
  const [sortDesc, setSortDesc] = useState(true);

  const sorted = [...rows].sort((a, b) => (sortDesc ? b[sortKey] - a[sortKey] : a[sortKey] - b[sortKey]));

  function onSort(key: SortKey) {
    if (key === sortKey) {
      setSortDesc((d) => !d);
    } else {
      setSortKey(key);
      setSortDesc(true);
    }
  }

  return (
    <div className="rounded-lg border overflow-hidden" style={{ background: "var(--surface-1)", borderColor: "var(--border)" }}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--gridline)" }}>
              <th className="text-left font-medium px-3 py-2" style={{ color: "var(--text-secondary)" }}>
                Campaign
              </th>
              <th className="text-left font-medium px-3 py-2" style={{ color: "var(--text-secondary)" }}>
                Channel
              </th>
              {COLUMNS.map((col) => (
                <th key={col.key} className="text-right font-medium px-3 py-2">
                  <button
                    type="button"
                    onClick={() => onSort(col.key)}
                    className="tabular-nums"
                    style={{ color: sortKey === col.key ? "var(--text-primary)" : "var(--text-secondary)" }}
                  >
                    {col.label} {sortKey === col.key ? (sortDesc ? "▼" : "▲") : ""}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((r) => (
              <tr key={`${r.channel}::${r.campaign_name}`} style={{ borderBottom: "1px solid var(--gridline)" }}>
                <td className="px-3 py-2" style={{ color: "var(--text-primary)" }}>
                  {r.campaign_name}
                </td>
                <td className="px-3 py-2">
                  <span className="inline-flex items-center gap-1.5" style={{ color: "var(--text-secondary)" }}>
                    <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: CHANNEL_SERIES[r.channel] }} />
                    {r.channel}
                  </span>
                </td>
                {COLUMNS.map((col) => (
                  <td key={col.key} className="px-3 py-2 text-right tabular-nums" style={{ color: "var(--text-primary)" }}>
                    {col.format(r[col.key])}
                  </td>
                ))}
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={2 + COLUMNS.length} className="px-3 py-6 text-center" style={{ color: "var(--text-muted)" }}>
                  No campaigns match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
