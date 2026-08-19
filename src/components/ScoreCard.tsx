interface ScoreCardProps {
  label: string;
  value: string;
  deltaPct: number | null;
  goodDirection?: "up" | "down";
}

export function ScoreCard({ label, value, deltaPct, goodDirection = "up" }: ScoreCardProps) {
  const hasDelta = deltaPct !== null && Number.isFinite(deltaPct);
  const isGood = hasDelta && (goodDirection === "up" ? deltaPct! >= 0 : deltaPct! <= 0);

  return (
    <div
      className="rounded-lg p-4 border"
      style={{ background: "var(--surface-1)", borderColor: "var(--border)" }}
    >
      <div className="text-sm" style={{ color: "var(--text-secondary)" }}>
        {label}
      </div>
      <div className="mt-1 text-3xl font-medium tabular-nums" style={{ color: "var(--text-primary)" }}>
        {value}
      </div>
      {hasDelta && (
        <div
          className="mt-1 text-sm tabular-nums"
          style={{ color: isGood ? "var(--success-text)" : "var(--status-critical)" }}
        >
          {deltaPct! >= 0 ? "▲" : "▼"} {Math.abs(deltaPct!).toFixed(1)}% vs. prior period
        </div>
      )}
    </div>
  );
}
