import { useMemo, useRef, useState } from "react";

export interface TrendSeries {
  key: string;
  color: string;
  points: { date: string; value: number }[];
}

interface TrendChartProps {
  title: string;
  series: TrendSeries[];
  valueFormatter: (n: number) => string;
}

const WIDTH = 720;
const HEIGHT = 260;
const PAD = { top: 16, right: 16, bottom: 28, left: 56 };

function niceTicks(max: number, count = 4): number[] {
  if (max <= 0) return [0];
  const step = Math.pow(10, Math.floor(Math.log10(max / count)));
  const normalized = max / count / step;
  const niceStep = (normalized >= 5 ? 5 : normalized >= 2 ? 2 : 1) * step;
  const ticks: number[] = [];
  for (let t = 0; t <= max + niceStep * 0.001; t += niceStep) ticks.push(Math.round(t * 100) / 100);
  return ticks;
}

function formatDateShort(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function TrendChart({ title, series, valueFormatter }: TrendChartProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const dates = series[0]?.points.map((p) => p.date) ?? [];
  const maxValue = Math.max(1, ...series.flatMap((s) => s.points.map((p) => p.value)));
  const ticks = useMemo(() => niceTicks(maxValue), [maxValue]);
  const yMax = ticks[ticks.length - 1] || 1;

  const innerW = WIDTH - PAD.left - PAD.right;
  const innerH = HEIGHT - PAD.top - PAD.bottom;

  const xAt = (i: number) => (dates.length <= 1 ? 0 : (i / (dates.length - 1)) * innerW);
  const yAt = (v: number) => innerH - (v / yMax) * innerH;

  const pathFor = (points: { date: string; value: number }[]) =>
    points.map((p, i) => `${i === 0 ? "M" : "L"} ${xAt(i).toFixed(2)} ${yAt(p.value).toFixed(2)}`).join(" ");

  function handleMove(e: React.PointerEvent<SVGSVGElement>) {
    const svg = svgRef.current;
    if (!svg || dates.length === 0) return;
    const rect = svg.getBoundingClientRect();
    const scaleX = WIDTH / rect.width;
    const localX = (e.clientX - rect.left) * scaleX - PAD.left;
    const idx = Math.round((localX / innerW) * (dates.length - 1));
    setHoverIndex(Math.min(dates.length - 1, Math.max(0, idx)));
  }

  const xTickEvery = Math.max(1, Math.ceil(dates.length / 6));

  return (
    <div className="rounded-lg p-4 border" style={{ background: "var(--surface-1)", borderColor: "var(--border)" }}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
          {title}
        </h3>
        {series.length > 1 && (
          <div className="flex flex-wrap gap-3">
            {series.map((s) => (
              <div key={s.key} className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-secondary)" }}>
                <span className="inline-block w-3 h-0.5 rounded" style={{ background: s.color }} />
                {s.key}
              </div>
            ))}
          </div>
        )}
      </div>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full h-auto touch-none"
        onPointerMove={handleMove}
        onPointerLeave={() => setHoverIndex(null)}
        role="img"
        aria-label={title}
      >
        <g transform={`translate(${PAD.left},${PAD.top})`}>
          {ticks.map((t) => (
            <g key={t}>
              <line
                x1={0}
                x2={innerW}
                y1={yAt(t)}
                y2={yAt(t)}
                stroke="var(--gridline)"
                strokeWidth={1}
              />
              <text x={-8} y={yAt(t)} textAnchor="end" dominantBaseline="middle" fontSize={11} fill="var(--text-muted)">
                {valueFormatter(t)}
              </text>
            </g>
          ))}

          {dates.map((d, i) =>
            i % xTickEvery === 0 ? (
              <text key={d} x={xAt(i)} y={innerH + 18} textAnchor="middle" fontSize={11} fill="var(--text-muted)">
                {formatDateShort(d)}
              </text>
            ) : null,
          )}

          {series.map((s) => (
            <path key={s.key} d={pathFor(s.points)} fill="none" stroke={s.color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          ))}

          {hoverIndex !== null && (
            <>
              <line
                x1={xAt(hoverIndex)}
                x2={xAt(hoverIndex)}
                y1={0}
                y2={innerH}
                stroke="var(--baseline)"
                strokeWidth={1}
              />
              {series.map((s) => {
                const p = s.points[hoverIndex];
                if (!p) return null;
                return (
                  <circle
                    key={s.key}
                    cx={xAt(hoverIndex)}
                    cy={yAt(p.value)}
                    r={4}
                    fill={s.color}
                    stroke="var(--surface-1)"
                    strokeWidth={2}
                  />
                );
              })}
            </>
          )}
        </g>
      </svg>

      {hoverIndex !== null && dates[hoverIndex] && (
        <div
          className="mt-2 rounded-md border p-2 text-xs"
          style={{ borderColor: "var(--border)", background: "var(--surface-1)" }}
        >
          <div className="font-medium mb-1" style={{ color: "var(--text-primary)" }}>
            {formatDateShort(dates[hoverIndex])}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {series.map((s) => {
              const p = s.points[hoverIndex!];
              return (
                <div key={s.key} className="flex items-center gap-1.5">
                  <span className="inline-block w-3 h-0.5 rounded" style={{ background: s.color }} />
                  <span className="font-medium tabular-nums" style={{ color: "var(--text-primary)" }}>
                    {valueFormatter(p?.value ?? 0)}
                  </span>
                  <span style={{ color: "var(--text-secondary)" }}>{s.key}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
