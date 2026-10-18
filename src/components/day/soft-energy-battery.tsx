import { Link } from "wouter";

/** Calm, tactile energy display. Rings and segments share one self-reported percentage. */
export function SoftEnergyBattery({ percent, linked = true }: { percent: number | null; linked?: boolean }) {
  const known = percent !== null && Number.isFinite(percent);
  const value = known ? Math.max(0, Math.min(100, percent)) : 0;
  const activeTicks = known ? Math.round(value / 100 * 48) : 0;
  const activeSegments = known ? Math.round(value / 20) : 0;
  const visual = (
    <div aria-label={known ? `${value} procent registrerad kapacitet` : "Ingen kapacitet registrerad"} className="group inline-flex min-h-11 shrink-0 flex-col items-center justify-center rounded-2xl px-1 py-1 text-center">
      <svg viewBox="0 0 144 144" width="128" height="128" role="img" aria-hidden="true" className="max-w-full transition-transform duration-200 group-hover:scale-[1.03] motion-reduce:transition-none">
        <defs>
          <linearGradient id="softBatteryFrame" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#B8A2C2"/><stop offset="1" stopColor="#65456D"/></linearGradient>
          <linearGradient id="softBatteryFill" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#DAC7E3"/><stop offset="1" stopColor="#9B80AD"/></linearGradient>
          <filter id="softBatteryDepth" x="-30%" y="-30%" width="160%" height="180%"><feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#512654" floodOpacity=".17"/></filter>
        </defs>
        {Array.from({ length: 48 }, (_, i) => (
          <line key={i} x1="72" y1="5" x2="72" y2="12" stroke={i < activeTicks ? "#9C7DAE" : "#E4DBE6"} strokeWidth="2.7" strokeLinecap="round" transform={`rotate(${i * 7.5} 72 72)`} />
        ))}
        <g filter="url(#softBatteryDepth)">
          <rect x="59" y="34" width="26" height="10" rx="4" fill="#957BA2" />
          <rect x="48" y="41" width="48" height="69" rx="12" fill="#FCFAFB" stroke="url(#softBatteryFrame)" strokeWidth="3.5"/>
          {Array.from({ length: 5 }, (_, i) => (
            <rect key={i} x="54" y={48 + i * 11.2} width="36" height="8.2" rx="3.2" fill={i < activeSegments ? "url(#softBatteryFill)" : "#ECE6ED"} />
          ))}
          <path d="M53 50 Q52 44 61 44" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" opacity=".85"/>
        </g>
      </svg>
      <span className="mt-[-3px] text-sm font-semibold tabular-nums text-ink">{known ? `${value} %` : "– %"}</span>
      {linked && <span className="text-[11px] font-medium text-muted-foreground">Mitt batteri ↗</span>}
    </div>
  );
  return linked ? <Link href="/mitt-batteri" aria-label={known ? `Öppna Mitt batteri, ${value} procent registrerad kapacitet` : "Öppna Mitt batteri, ingen kapacitet registrerad"}>{visual}</Link> : visual;
}
