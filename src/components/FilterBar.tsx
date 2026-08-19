import type { Channel } from "../data/types";

export type DatePreset = "7d" | "30d" | "90d";

const PRESET_LABELS: Record<DatePreset, string> = {
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "90d": "Last 90 days",
};

const ALL_CHANNELS: Channel[] = ["Meta", "Google Ads", "Organic Search", "Email"];

const CHANNEL_SERIES: Record<Channel, string> = {
  Meta: "var(--series-1)",
  "Google Ads": "var(--series-2)",
  "Organic Search": "var(--series-3)",
  Email: "var(--series-4)",
};

interface FilterBarProps {
  preset: DatePreset;
  onPresetChange: (p: DatePreset) => void;
  channels: Channel[];
  onChannelsChange: (c: Channel[]) => void;
}

export function FilterBar({ preset, onPresetChange, channels, onChannelsChange }: FilterBarProps) {
  function toggleChannel(c: Channel) {
    if (channels.includes(c)) {
      if (channels.length === 1) return; // keep at least one channel selected
      onChannelsChange(channels.filter((x) => x !== c));
    } else {
      onChannelsChange([...channels, c]);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-4 py-1">
      <div
        role="group"
        aria-label="Date range"
        className="inline-flex rounded-md border overflow-hidden"
        style={{ borderColor: "var(--border)" }}
      >
        {(Object.keys(PRESET_LABELS) as DatePreset[]).map((p) => {
          const selected = p === preset;
          return (
            <button
              key={p}
              type="button"
              aria-pressed={selected}
              onClick={() => onPresetChange(p)}
              className="px-3 py-1.5 text-sm transition-colors"
              style={{
                background: selected ? "var(--series-1)" : "var(--surface-1)",
                color: selected ? "#ffffff" : "var(--text-secondary)",
              }}
            >
              {PRESET_LABELS[p]}
            </button>
          );
        })}
      </div>

      <div role="group" aria-label="Channels" className="flex flex-wrap gap-2">
        {ALL_CHANNELS.map((c) => {
          const selected = channels.includes(c);
          return (
            <button
              key={c}
              type="button"
              aria-pressed={selected}
              onClick={() => toggleChannel(c)}
              className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition-opacity"
              style={{
                borderColor: "var(--border)",
                background: "var(--surface-1)",
                color: "var(--text-primary)",
                opacity: selected ? 1 : 0.45,
              }}
            >
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ background: CHANNEL_SERIES[c] }}
              />
              {c}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export { ALL_CHANNELS, CHANNEL_SERIES };
