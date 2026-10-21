/**
 * Mjukt böljande linjediagram i Paceable-färger. Rent presentationslager:
 * värden 0–100 eller null. Null bryter kurvan (saknat ≠ noll).
 */
export interface WaveSeries {
  id: string;
  values: (number | null)[];
  tone: "primary" | "accent";
  dashed?: boolean;
}

const H = 100;

function segments(values: (number | null)[]) {
  const out: { x: number; y: number }[][] = [];
  let current: { x: number; y: number }[] = [];
  const n = values.length;
  values.forEach((v, i) => {
    if (v == null) {
      if (current.length) out.push(current);
      current = [];
      return;
    }
    current.push({ x: ((i + 0.5) / n) * 1000, y: H - 8 - (Math.max(0, Math.min(100, v)) / 100) * (H - 16) });
  });
  if (current.length) out.push(current);
  return out;
}

function smoothPath(points: { x: number; y: number }[]) {
  if (points.length === 1) return "";
  let d = `M${points[0]!.x},${points[0]!.y}`;
  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[i - 1] ?? points[i]!;
    const p1 = points[i]!;
    const p2 = points[i + 1]!;
    const p3 = points[i + 2] ?? p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C${c1x},${c1y} ${c2x},${c2y} ${p2.x},${p2.y}`;
  }
  return d;
}

export default function SoftWaveChart({ series }: { series: WaveSeries[] }) {
  return (
    <svg
      aria-hidden="true"
      viewBox={`0 0 1000 ${H}`}
      preserveAspectRatio="none"
      className="block h-24 w-full overflow-visible"
      data-chart="wave"
    >
      <line x1="0" x2="1000" y1={H / 2} y2={H / 2} className="stroke-border" strokeDasharray="4 6" vectorEffect="non-scaling-stroke" />
      {series.map((s) => {
        const stroke = s.tone === "primary" ? "stroke-primary" : "stroke-accent-foreground";
        const fill = s.tone === "primary" ? "fill-primary/10" : "fill-accent/30";
        return segments(s.values).map((seg, idx) => {
          const line = smoothPath(seg);
          const area = line ? `${line} L${seg[seg.length - 1]!.x},${H} L${seg[0]!.x},${H} Z` : "";
          return (
            <g key={`${s.id}-${idx}`} data-series={s.id}>
              {area && <path d={area} className={`${fill} stroke-none`} />}
              {line && (
                <path
                  d={line}
                  fill="none"
                  className={`${stroke} transition-all duration-500 motion-reduce:transition-none`}
                  strokeWidth={3}
                  strokeLinecap="round"
                  strokeDasharray={s.dashed ? "2 7" : undefined}
                  vectorEffect="non-scaling-stroke"
                />
              )}
              {seg.length === 1 && (
                <line x1={seg[0]!.x} x2={seg[0]!.x} y1={seg[0]!.y} y2={seg[0]!.y} className={stroke} strokeWidth={8} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
              )}
            </g>
          );
        });
      })}
    </svg>
  );
}
