/**
 * MyFlove Living UI – ett återanvändbart rörelsesystem.
 *
 * Varje funktion i appen har sitt eget lilla liv: QuickFlow fångar,
 * kalendern rör sig i tid, resor rör sig framåt, ekonomi hittar balans,
 * Insight samlar punkter till ett mönster.
 *
 * Regler:
 *  - Rörelsen ska svara på "vad händer?" – annars finns den inte här.
 *  - Allt kontinuerligt respekterar prefers-reduced-motion och NPF-läget.
 *  - Inget här är nödvändigt för att förstå appen.
 */
import * as React from "react";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Grund: känner appen av att användaren vill ha mindre rörelse?       */
/* ------------------------------------------------------------------ */

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = React.useState(false);
  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const npfStill = document.documentElement.getAttribute("data-npf-still") === "true";
    const update = () => setReduced(mq.matches || npfStill);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return reduced;
}

/** Energi 1–5 → hur livlig appen får vara just nu. */
export type MyFloveMood = "calm" | "steady" | "lively" | "focus";

export function moodFromEnergy(energy?: number | null): MyFloveMood {
  if (!energy) return "steady";
  if (energy <= 2) return "calm";
  if (energy >= 4) return "lively";
  return "steady";
}

/** Sekunder per "andetag" – långsammare när energin är låg. */
export function moodTempo(mood: MyFloveMood): number {
  switch (mood) {
    case "calm":
      return 7.5;
    case "lively":
      return 3.2;
    case "focus":
      return 9;
    default:
      return 5;
  }
}

/* ------------------------------------------------------------------ */
/* Hjärtat – appens referenspunkt                                      */
/* ------------------------------------------------------------------ */

export function MyFloveHeart({
  size = 28,
  mood = "steady",
  className,
}: {
  size?: number;
  mood?: MyFloveMood;
  className?: string;
}) {
  const reduced = useReducedMotion();
  return (
    <span
      aria-hidden
      data-motion="living"
      className={cn("inline-block leading-none", !reduced && "heartbeat", className)}
      style={{ fontSize: size, animationDuration: `${moodTempo(mood) * 0.6}s` }}
    >
      💜
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Gnista – "något blev tydligt"                                       */
/* ------------------------------------------------------------------ */

export function MyFloveSparkle({ count = 3, className }: { count?: number; className?: string }) {
  const reduced = useReducedMotion();
  return (
    <span
      aria-hidden
      data-motion="living"
      className={cn("pointer-events-none absolute inset-0", className)}
    >
      {Array.from({ length: count }).map((_, i) => (
        <span
          key={i}
          className={cn("absolute text-primary", !reduced && "sparkling")}
          style={{
            left: `${12 + i * 31}%`,
            top: `${18 + ((i * 37) % 55)}%`,
            fontSize: 10 + (i % 3) * 4,
            animationDelay: `${i * 0.6}s`,
          }}
        >
          ✦
        </span>
      ))}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* MyFlove tänker – kalender → energi → mål → förslag                  */
/* ------------------------------------------------------------------ */

const THINK_STEPS = ["📅", "⚡", "🎯", "✨"];

export function MyFloveThinking({
  label = "Jag tittar på din situation...",
  steps = THINK_STEPS,
  className,
}: {
  label?: string;
  steps?: string[];
  className?: string;
}) {
  const reduced = useReducedMotion();
  const [active, setActive] = React.useState(0);
  React.useEffect(() => {
    if (reduced) return;
    const t = setInterval(() => setActive((a) => (a + 1) % steps.length), 520);
    return () => clearInterval(t);
  }, [reduced, steps.length]);

  return (
    <div
      className={cn("flex flex-col items-center gap-3 py-6 text-center", className)}
      data-motion="living"
    >
      <div className="flex items-center gap-2" aria-hidden>
        {steps.map((s, i) => (
          <React.Fragment key={s + i}>
            <span
              className="grid h-9 w-9 place-items-center rounded-2xl text-lg transition-all duration-300"
              style={{
                background: i <= active || reduced ? "hsl(var(--lavender))" : "hsl(var(--muted))",
                opacity: i <= active || reduced ? 1 : 0.45,
                transform: i === active && !reduced ? "translateY(-3px) scale(1.06)" : "none",
              }}
            >
              {s}
            </span>
            {i < steps.length - 1 && <span className="text-xs text-muted-foreground">→</span>}
          </React.Fragment>
        ))}
      </div>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Andning – fokusläge och lugna ytor                                  */
/* ------------------------------------------------------------------ */

export function MyFloveBreathing({
  size = 72,
  mood = "focus",
  children,
  className,
}: {
  size?: number;
  mood?: MyFloveMood;
  children?: React.ReactNode;
  className?: string;
}) {
  const reduced = useReducedMotion();
  return (
    <span
      data-motion="living"
      className={cn("relative grid place-items-center rounded-full bg-lavender/70", className)}
      style={{ width: size, height: size }}
    >
      {!reduced && (
        <span
          aria-hidden
          className="absolute inset-0 rounded-full bg-primary/15 breathe"
          style={{ animationDuration: `${moodTempo(mood)}s` }}
        />
      )}
      <span className="relative">{children}</span>
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Lyssnar – små staplar när du skriver eller pratar                   */
/* ------------------------------------------------------------------ */

export function MyFloveListening({
  active = true,
  label,
  className,
}: {
  active?: boolean;
  label?: string;
  className?: string;
}) {
  const reduced = useReducedMotion();
  return (
    <span
      className={cn("inline-flex items-center gap-2 text-xs text-muted-foreground", className)}
      data-motion="living"
    >
      <span aria-hidden className="flex h-4 items-end gap-0.5">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className="w-1 rounded-pill bg-primary/60"
            style={{
              height: 14,
              transformOrigin: "bottom",
              transform: active && !reduced ? undefined : "scaleY(0.35)",
              animation:
                active && !reduced
                  ? `myflove-listen ${0.9 + i * 0.12}s ease-in-out ${i * 0.1}s infinite`
                  : undefined,
            }}
          />
        ))}
      </span>
      {label && <span>{label}</span>}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Fångad tanke – bubblan flyger från fältet ner i listan              */
/* ------------------------------------------------------------------ */

export function MyFloveCaptureFlight({
  text,
  show,
  onDone,
}: {
  text: string;
  show: boolean;
  onDone?: () => void;
}) {
  const reduced = useReducedMotion();
  React.useEffect(() => {
    if (!show) return;
    const t = setTimeout(() => onDone?.(), reduced ? 600 : 1100);
    return () => clearTimeout(t);
  }, [show, reduced, onDone]);

  if (!show) return null;
  return (
    <span
      aria-hidden
      data-motion="living"
      className="pointer-events-none absolute left-1/2 top-4 z-20 max-w-[70%] -translate-x-1/2 truncate rounded-pill bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-soft"
      style={{
        animation: reduced ? "none" : "myflove-fly 1.05s cubic-bezier(0.3,0.8,0.4,1) forwards",
        ["--fly-y" as string]: "140px",
        opacity: reduced ? 0.9 : undefined,
      }}
    >
      {text}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Klart – checkmark som ritas + mjuk studs                            */
/* ------------------------------------------------------------------ */

export function MyFloveSuccess({ size = 28, className }: { size?: number; className?: string }) {
  const reduced = useReducedMotion();
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      data-motion="living"
      className={cn("text-primary", className)}
    >
      <circle cx="12" cy="12" r="10" className="fill-mint" />
      <path
        d="M7.5 12.4l3.1 3.1 6-6.4"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="32"
        style={{
          animation: reduced ? "none" : "myflove-check 0.5s ease-out forwards",
          strokeDashoffset: reduced ? 0 : undefined,
        }}
      />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Small wins – lugn celebration, aldrig prestationskrav               */
/* ------------------------------------------------------------------ */

export function MyFloveCelebration({
  level = 1,
  message,
  className,
}: {
  level?: 1 | 2 | 3;
  message?: string;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const emoji = level === 3 ? "💜" : level === 2 ? "✨" : "✓";
  return (
    <div
      data-motion="living"
      className={cn(
        "flex items-center gap-2 rounded-pill bg-mint/70 px-4 py-2 text-sm font-semibold text-ink",
        !reduced && "pop-in",
        className,
      )}
    >
      <span
        aria-hidden
        className={cn("text-base leading-none", !reduced && level > 1 && "sparkling")}
      >
        {emoji}
      </span>
      <span>{message ?? "Bra jobbat."}</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Energiprickar – fylls en efter en, tempo efter dagens energi        */
/* ------------------------------------------------------------------ */

export function MyFloveEnergyDots({
  value,
  max = 5,
  className,
}: {
  value: number;
  max?: number;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const [shown, setShown] = React.useState(reduced ? value : 0);
  React.useEffect(() => {
    if (reduced) {
      setShown(value);
      return;
    }
    setShown(0);
    let n = 0;
    const t = setInterval(() => {
      n += 1;
      setShown(n);
      if (n >= value) clearInterval(t);
    }, 160);
    return () => clearInterval(t);
  }, [value, reduced]);

  const mood = moodFromEnergy(value);
  return (
    <span
      className={cn("inline-flex items-center gap-1.5", className)}
      aria-hidden
      data-motion="living"
    >
      {Array.from({ length: max }).map((_, i) => (
        <span
          key={i}
          className={cn(
            "h-2.5 w-2.5 rounded-full transition-all duration-500",
            i < shown ? "bg-primary" : "bg-lavender",
            !reduced && i < shown && i === shown - 1 && "breathe",
          )}
          style={{ animationDuration: `${moodTempo(mood)}s` }}
        />
      ))}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Rutt – resor och flerstegsflöden rör sig framåt                     */
/* ------------------------------------------------------------------ */

export function MyFlovePath({
  steps,
  current = 0,
  className,
}: {
  steps: { emoji: string; label?: string }[];
  current?: number;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const pct =
    steps.length > 1 ? (Math.min(current, steps.length - 1) / (steps.length - 1)) * 100 : 0;
  return (
    <div className={cn("w-full", className)} data-motion="living">
      <div className="relative mx-2 h-1.5 rounded-pill bg-lavender">
        <div
          className="absolute inset-y-0 left-0 rounded-pill bg-primary"
          style={{
            width: `${pct}%`,
            transition: reduced ? "none" : "width 900ms cubic-bezier(0.22,1,0.36,1)",
          }}
        />
        <span
          aria-hidden
          className="absolute -top-2.5 text-base leading-none"
          style={{
            left: `calc(${pct}% - 8px)`,
            transition: reduced ? "none" : "left 900ms cubic-bezier(0.22,1,0.36,1)",
          }}
        >
          📍
        </span>
      </div>
      <div className="mt-3 flex items-start justify-between">
        {steps.map((s, i) => (
          <div key={i} className="flex w-16 flex-col items-center gap-1 text-center">
            <span
              aria-hidden
              className="text-lg leading-none transition-opacity duration-500"
              style={{ opacity: i <= current ? 1 : 0.4 }}
            >
              {s.emoji}
            </span>
            {s.label && (
              <span className="text-[11px] leading-tight text-muted-foreground">{s.label}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Balans – ekonomins staplar växer lugnt fram                         */
/* ------------------------------------------------------------------ */

export function MyFloveBalanceBars({
  bars,
  className,
}: {
  bars: { label: string; value: number; tone?: "primary" | "mint" | "blush" }[];
  className?: string;
}) {
  const reduced = useReducedMotion();
  const max = Math.max(1, ...bars.map((b) => Math.abs(b.value)));
  return (
    <div className={cn("flex items-end gap-4", className)} data-motion="living">
      {bars.map((b, i) => {
        const h = Math.max(6, (Math.abs(b.value) / max) * 100);
        const tone = b.tone === "mint" ? "bg-mint" : b.tone === "blush" ? "bg-blush" : "bg-primary";
        return (
          <div key={b.label} className="flex flex-1 flex-col items-center gap-2">
            <div className="flex h-24 w-full items-end">
              <div
                className={cn("w-full rounded-t-2xl", tone)}
                style={{
                  height: `${h}%`,
                  transformOrigin: "bottom",
                  animation: reduced
                    ? "none"
                    : `myflove-grow-bar 0.8s cubic-bezier(0.22,1,0.36,1) ${i * 0.12}s both`,
                }}
              />
            </div>
            <span className="text-xs text-muted-foreground">{b.label}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Insight – punkter samlas till ett mönster                           */
/* ------------------------------------------------------------------ */

export function MyFloveInsightGather({
  emoji = "💡",
  className,
}: {
  emoji?: string;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const dots = [
    { x: -34, y: -18 },
    { x: 30, y: -24 },
    { x: -26, y: 22 },
    { x: 32, y: 20 },
    { x: 0, y: -34 },
    { x: 4, y: 32 },
  ];
  return (
    <span
      className={cn("relative grid h-14 w-14 place-items-center", className)}
      aria-hidden
      data-motion="living"
    >
      {!reduced &&
        dots.map((d, i) => (
          <span
            key={i}
            className="absolute h-1.5 w-1.5 rounded-full bg-primary/70"
            style={{
              ["--from-x" as string]: `${d.x}px`,
              ["--from-y" as string]: `${d.y}px`,
              animation: `myflove-gather 2.4s ease-in-out ${i * 0.12}s infinite`,
            }}
          />
        ))}
      <span className={cn("relative text-2xl leading-none", !reduced && "breathe")}>{emoji}</span>
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Kvällsläge – stjärnor som tänds när dagen är över                   */
/* ------------------------------------------------------------------ */

export function MyFloveNightSky({ className }: { className?: string }) {
  const reduced = useReducedMotion();
  const stars = [
    { l: 8, t: 18 },
    { l: 26, t: 8 },
    { l: 47, t: 24 },
    { l: 68, t: 12 },
    { l: 84, t: 30 },
    { l: 92, t: 8 },
  ];
  return (
    <span
      aria-hidden
      data-motion="living"
      className={cn("pointer-events-none absolute inset-x-0 top-0 h-24", className)}
    >
      {stars.map((s, i) => (
        <span
          key={i}
          className={cn("absolute text-[10px] text-primary/70", !reduced && "twinkling")}
          style={{ left: `${s.l}%`, top: `${s.t}%`, animationDelay: `${i * 0.7}s` }}
        >
          ✦
        </span>
      ))}
      <span className={cn("absolute right-5 top-3 text-xl leading-none", !reduced && "floaty")}>
        🌙
      </span>
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Flytande dekor – långsamma organiska bakgrundsrörelser              */
/* ------------------------------------------------------------------ */

export function MyFloveFloatingElement({
  className,
  tone = "lavender",
  size = 120,
  mood = "steady",
  style,
}: {
  className?: string;
  tone?: "lavender" | "blush" | "mint" | "sky" | "sun";
  size?: number;
  mood?: MyFloveMood;
  style?: React.CSSProperties;
}) {
  const reduced = useReducedMotion();
  const bg = {
    lavender: "bg-lavender",
    blush: "bg-blush",
    mint: "bg-mint",
    sky: "bg-sky",
    sun: "bg-sun",
  }[tone];
  return (
    <span
      aria-hidden
      data-motion="living"
      className={cn(
        "pointer-events-none absolute rounded-full opacity-60 blur-md",
        bg,
        !reduced && "drifting",
        className,
      )}
      style={{ width: size, height: size, animationDuration: `${moodTempo(mood) * 3}s`, ...style }}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Mjuk övergång – innehåll som byts ut glider in i stället för att    */
/* bara hoppa fram                                                     */
/* ------------------------------------------------------------------ */

export function MyFloveTransition({
  transitionKey,
  children,
  className,
}: {
  transitionKey: string | number;
  children: React.ReactNode;
  className?: string;
}) {
  const reduced = useReducedMotion();
  return (
    <div key={transitionKey} className={cn(!reduced && "pop-in", className)} data-motion="living">
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Levande tomma tillstånd – appen vilar, den är inte död              */
/* ------------------------------------------------------------------ */

const EMPTY_ART: Record<string, { emoji: string; motion: "breathe" | "floaty" | "drifting" }> = {
  quickflow: { emoji: "😴", motion: "breathe" },
  travel: { emoji: "🧳", motion: "floaty" },
  calendar: { emoji: "🌤️", motion: "drifting" },
  finances: { emoji: "🐷", motion: "breathe" },
  documents: { emoji: "📄", motion: "floaty" },
  default: { emoji: "💜", motion: "breathe" },
};

export function MyFloveEmptyIllustration({
  kind = "default",
  className,
}: {
  kind?: keyof typeof EMPTY_ART | string;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const art = EMPTY_ART[kind] ?? EMPTY_ART.default;
  return (
    <span
      aria-hidden
      data-motion="living"
      className={cn("text-4xl leading-none", !reduced && art.motion, className)}
    >
      {art.emoji}
    </span>
  );
}
