export function InsightsPanel({ bullets }: { bullets: string[] }) {
  return (
    <div
      className="rounded-lg p-4 border"
      style={{ background: "var(--surface-1)", borderColor: "var(--border)" }}
    >
      <div className="flex items-center gap-2 mb-2">
        <h3 className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
          Executive summary
        </h3>
        <span
          className="text-[11px] rounded-full px-2 py-0.5"
          style={{ background: "var(--surface-page)", color: "var(--text-muted)" }}
        >
          auto-generated
        </span>
      </div>
      <ul className="space-y-2">
        {bullets.map((b, i) => (
          <li key={i} className="flex gap-2 text-sm" style={{ color: "var(--text-secondary)" }}>
            <span style={{ color: "var(--series-1)" }}>•</span>
            <span>{b}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
