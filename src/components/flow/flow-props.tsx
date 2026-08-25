/**
 * Flow-rekvisita – små, lätta SVG-attribut i Flows egen stil.
 *
 * Ren presentation: inga data, inga hooks. Alla mått är i procent av
 * "scenen" (kvadraten runt Flow) så att rekvisitan skalar med maskoten.
 */

import { cn } from "@/lib/utils";

type PropProps = { className?: string; style?: React.CSSProperties };

/* ── Väder ──────────────────────────────────────────────────────── */

export function Umbrella({ className, style }: PropProps) {
  return (
    <svg data-flow-prop="umbrella" viewBox="0 0 100 110" className={className} style={style} aria-hidden>
      <path
        d="M4 46C4 22 25 5 50 5s46 17 46 41c0 3-3 4-5 2-6-6-13-9-19-3-3 3-6 3-9 0-6-6-13-6-19 0-3 3-6 3-9 0-6-6-13-3-19 3-2 2-6 1-6-2Z"
        className="fill-primary"
      />
      <path
        d="M50 5c9 0 15 18 15 41 0 3-3 4-5 2-6-6-13-6-19 0-3 3-6 3-6-2C35 23 41 5 50 5Z"
        className="fill-accent"
      />
      <path
        d="M50 46v46c0 7-5 12-12 12s-12-5-12-12"
        className="stroke-ink/70"
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

export function RainDrops({ count = 7 }: { count?: number }) {
  return (
    <div data-flow-prop="rainDrops" aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: count }).map((_, i) => (
        <span
          key={i}
          className="flow-rain absolute top-[10%] block h-3 w-[3px] rounded-full bg-primary/45"
          style={{ left: `${8 + i * 12}%`, animationDelay: `${(i % 4) * 0.45}s` }}
        />
      ))}
    </div>
  );
}

/* ── Sömn & vila ────────────────────────────────────────────────── */

export function BedFrame({ className, style }: PropProps) {
  return (
    <svg data-flow-prop="bedFrame" viewBox="0 0 200 80" className={className} style={style} aria-hidden>
      <rect x="4" y="34" width="192" height="30" rx="12" className="fill-card stroke-border" strokeWidth="3" />
      <rect x="10" y="24" width="52" height="22" rx="11" className="fill-secondary" />
      <path d="M62 40h128a10 10 0 0 1 10 10v14H62z" className="fill-primary/70" />
      <rect x="14" y="60" width="10" height="16" rx="5" className="fill-border" />
      <rect x="176" y="60" width="10" height="16" rx="5" className="fill-border" />
    </svg>
  );
}

export function Zzz({ className }: PropProps) {
  return (
    <div data-flow-prop="zzz" aria-hidden className={cn("pointer-events-none absolute", className)}>
      {["z", "z", "z"].map((z, i) => (
        <span
          key={i}
          className="flow-zzz absolute font-display font-bold text-primary/70"
          style={{
            left: `${i * 14}px`,
            bottom: `${i * 10}px`,
            fontSize: `${12 + i * 6}px`,
            animationDelay: `${i * 0.7}s`,
          }}
        >
          {z}
        </span>
      ))}
    </div>
  );
}

export function Cushion({ className, style }: PropProps) {
  return (
    <svg data-flow-prop="cushion" viewBox="0 0 160 44" className={className} style={style} aria-hidden>
      <ellipse cx="80" cy="24" rx="78" ry="18" className="fill-primary/35" />
      <ellipse cx="80" cy="19" rx="60" ry="13" className="fill-accent/40" />
    </svg>
  );
}

export function BreathRing({ className }: PropProps) {
  return (
    <span
 data-flow-prop="breathRing"      aria-hidden
      className={cn(
        "flow-breath-ring pointer-events-none absolute rounded-full border-2 border-primary/40",
        className,
      )}
    />
  );
}

/* ── Paus & mat ─────────────────────────────────────────────────── */

export function Mug({ className, style }: PropProps) {
  return (
    <svg data-flow-prop="mug" viewBox="0 0 90 80" className={className} style={style} aria-hidden>
      <path d="M12 30h56v28a16 16 0 0 1-16 16H28a16 16 0 0 1-16-16z" className="fill-card stroke-primary" strokeWidth="4" />
      <path d="M68 38h6a12 12 0 0 1 0 24h-6" className="stroke-primary" strokeWidth="4" fill="none" />
      <rect x="16" y="34" width="48" height="9" rx="4" className="fill-accent/70" />
    </svg>
  );
}

export function Steam({ className }: PropProps) {
  return (
    <div data-flow-prop="steam" aria-hidden className={cn("pointer-events-none absolute flex gap-1", className)}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="flow-steam block h-4 w-[3px] rounded-full bg-muted-foreground/40"
          style={{ animationDelay: `${i * 0.5}s` }}
        />
      ))}
    </div>
  );
}

export function ChefHat({ className, style }: PropProps) {
  return (
    <svg data-flow-prop="chefHat" viewBox="0 0 120 80" className={className} style={style} aria-hidden>
      <path
        d="M24 46a22 22 0 1 1 9-42 24 24 0 0 1 54 0 22 22 0 1 1 9 42z"
        className="fill-card stroke-border"
        strokeWidth="3"
      />
      <rect x="24" y="44" width="72" height="20" rx="8" className="fill-secondary stroke-border" strokeWidth="3" />
    </svg>
  );
}

export function Pan({ className, style }: PropProps) {
  return (
    <svg data-flow-prop="pan" viewBox="0 0 120 50" className={className} style={style} aria-hidden>
      <ellipse cx="42" cy="26" rx="38" ry="16" className="fill-ink/70" />
      <ellipse cx="42" cy="22" rx="30" ry="11" className="fill-accent/60" />
      <rect x="76" y="20" width="42" height="9" rx="4" className="fill-ink/60" />
    </svg>
  );
}

/* ── Göra-saker ─────────────────────────────────────────────────── */

export function OpenBook({ className, style }: PropProps) {
  return (
    <svg data-flow-prop="openBook" viewBox="0 0 140 70" className={className} style={style} aria-hidden>
      <path d="M70 16C56 4 30 6 8 12v50c22-6 48-8 62 4z" className="fill-card stroke-primary" strokeWidth="3" />
      <path d="M70 16c14-12 40-10 62-4v50c-22-6-48-8-62 4z" className="fill-card stroke-primary" strokeWidth="3" />
      <path d="M20 26h34M20 36h30M86 26h34M86 36h30" className="stroke-border" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function Glasses({ className, style }: PropProps) {
  return (
    <svg data-flow-prop="glasses" viewBox="0 0 120 40" className={className} style={style} aria-hidden>
      <circle cx="30" cy="20" r="16" className="fill-none stroke-ink/70" strokeWidth="4" />
      <circle cx="90" cy="20" r="16" className="fill-none stroke-ink/70" strokeWidth="4" />
      <path d="M46 20h28" className="stroke-ink/70" strokeWidth="4" />
    </svg>
  );
}

export function Laptop({ className, style }: PropProps) {
  return (
    <svg data-flow-prop="laptop" viewBox="0 0 140 80" className={className} style={style} aria-hidden>
      <rect x="26" y="6" width="88" height="56" rx="6" className="fill-card stroke-ink/60" strokeWidth="4" />
      <rect x="34" y="14" width="72" height="40" rx="3" className="fill-primary/25" />
      <path d="M6 62h128l-8 12H14z" className="fill-secondary stroke-ink/50" strokeWidth="3" />
    </svg>
  );
}

export function Vacuum({ className, style }: PropProps) {
  return (
    <svg data-flow-prop="vacuum" viewBox="0 0 90 130" className={className} style={style} aria-hidden>
      <path d="M45 8v70" className="stroke-ink/60" strokeWidth="7" strokeLinecap="round" />
      <rect x="26" y="0" width="38" height="12" rx="6" className="fill-ink/60" />
      <rect x="22" y="72" width="46" height="34" rx="10" className="fill-primary" />
      <path d="M10 120h70l-8-16H18z" className="fill-secondary stroke-border" strokeWidth="3" />
    </svg>
  );
}

export function Car({ className, style }: PropProps) {
  return (
    <svg data-flow-prop="car" viewBox="0 0 200 90" className={className} style={style} aria-hidden>
      <path d="M14 62c0-16 12-24 26-28l14-14h56l18 14c18 4 30 12 30 28z" className="fill-primary" />
      <path d="M58 26h38l14 12H50z" className="fill-card/80" />
      <rect x="6" y="58" width="188" height="14" rx="7" className="fill-primary/80" />
      <circle cx="48" cy="74" r="13" className="fill-ink/75" />
      <circle cx="152" cy="74" r="13" className="fill-ink/75" />
    </svg>
  );
}

export function Bus({ className, style }: PropProps) {
  return (
    <svg data-flow-prop="bus" viewBox="0 0 200 100" className={className} style={style} aria-hidden>
      <rect x="10" y="16" width="180" height="62" rx="14" className="fill-accent" />
      <rect x="22" y="26" width="60" height="26" rx="6" className="fill-card/85" />
      <rect x="92" y="26" width="40" height="26" rx="6" className="fill-card/85" />
      <rect x="142" y="26" width="38" height="26" rx="6" className="fill-card/85" />
      <circle cx="52" cy="82" r="13" className="fill-ink/75" />
      <circle cx="152" cy="82" r="13" className="fill-ink/75" />
    </svg>
  );
}

/* ── Energi & firande ───────────────────────────────────────────── */

export function Battery({ level, className, style }: PropProps & { level: number }) {
  const pct = Math.max(4, Math.min(100, level));
  const low = pct < 40;
  return (
    <svg data-flow-prop="battery" viewBox="0 0 70 140" className={className} style={style} aria-hidden>
      <rect x="24" y="2" width="22" height="10" rx="4" className="fill-border" />
      <rect x="6" y="12" width="58" height="124" rx="14" className="fill-card stroke-border" strokeWidth="4" />
      <rect
        x="14"
        y={20 + (108 * (100 - pct)) / 100}
        width="42"
        height={(108 * pct) / 100}
        rx="8"
        className={low ? "fill-accent/70" : "fill-primary"}
      />
    </svg>
  );
}

export function Bolt({ className, style }: PropProps) {
  return (
    <svg data-flow-prop="bolt" viewBox="0 0 40 60" className={className} style={style} aria-hidden>
      <path d="M24 2 4 34h12l-4 24 24-34H24l4-22z" className="fill-accent" />
    </svg>
  );
}

export function Confetti({ count = 12 }: { count?: number }) {
  const tones = ["bg-primary", "bg-accent", "bg-secondary", "bg-primary/60"];
  return (
    <div data-flow-prop="confetti" aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: count }).map((_, i) => (
        <span
          key={i}
          className={cn("flow-confetti absolute top-[-6%] block h-3 w-2 rounded-[2px]", tones[i % tones.length])}
          style={{ left: `${5 + i * 7.5}%`, animationDelay: `${(i % 5) * 0.35}s` }}
        />
      ))}
    </div>
  );
}

export function Stars({ className }: PropProps) {
  return (
    <div data-flow-prop="stars" aria-hidden className={cn("pointer-events-none absolute inset-0", className)}>
      {[
        "left-[8%] top-[14%]",
        "right-[10%] top-[20%]",
        "left-[16%] bottom-[24%]",
        "right-[14%] bottom-[18%]",
      ].map((spot, i) => (
        <span
          key={spot}
          className={cn("flow-twinkle absolute text-lg", spot)}
          style={{ animationDelay: `${i * 0.4}s` }}
        >
          ⭐
        </span>
      ))}
    </div>
  );
}
