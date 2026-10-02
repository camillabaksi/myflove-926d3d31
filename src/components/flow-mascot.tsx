import { useEffect, useRef, useState } from "react";
import flowAsset from "@/assets/flow-mascot.png.asset.json";
import { cn } from "@/lib/utils";
import { useNpfSettings } from "@/lib/npf-mode";
import { useMyFlowAppearance } from "@/hooks/use-my-flow";

/**
 * Flows samtalsstatus – styr andningstempo, blinkrytm och blick
 * så att maskoten följer med i chatten i stället för att leva sitt eget liv.
 */
export type FlowStatus = "idle" | "listening" | "thinking" | "done";

interface StatusTempo {
  /** Andningens längd. */
  breath: string;
  /** Hjärtglödets längd. */
  glow: string;
  /** Väntetid mellan blinkningar (min, slumpspann). */
  blinkMin: number;
  blinkSpan: number;
  /** Hur mycket blicken följer pekaren. */
  gaze: number;
}

const STATUS_TEMPO: Record<FlowStatus, StatusTempo> = {
  // Lugn grundpuls.
  idle: { breath: "4.2s", glow: "3.8s", blinkMin: 2600, blinkSpan: 4200, gaze: 1 },
  // Du skriver: Flow lutar sig fram, blinkar oftare, andas lite snabbare.
  listening: { breath: "3.2s", glow: "2.8s", blinkMin: 1600, blinkSpan: 2200, gaze: 1.5 },
  // Flow tänker: djupa andetag, sällsynta blinkningar, blicken vandrar bort.
  thinking: { breath: "5.4s", glow: "1.9s", blinkMin: 4200, blinkSpan: 5200, gaze: 0.25 },
  // Klart: kort, ljus puls.
  done: { breath: "2.6s", glow: "1.4s", blinkMin: 1400, blinkSpan: 1600, gaze: 1.2 },
};

/** Slumpad blinkning – Flow blinkar som en levande varelse, inte som en metronom. */
function useFlowBlink(enabled: boolean, tempo: StatusTempo) {
  const [blinking, setBlinking] = useState(false);
  const { blinkMin, blinkSpan } = tempo;
  useEffect(() => {
    if (!enabled) return;
    if (typeof window === "undefined") return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    let blinkTimer: ReturnType<typeof setTimeout>;
    let resetTimer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      const wait = blinkMin + Math.random() * blinkSpan;
      blinkTimer = setTimeout(() => {
        setBlinking(true);
        resetTimer = setTimeout(() => {
          setBlinking(false);
          schedule();
        }, 240);
      }, wait);
    };
    schedule();
    return () => {
      clearTimeout(blinkTimer);
      clearTimeout(resetTimer);
    };
  }, [enabled, blinkMin, blinkSpan]);
  return blinking;
}

/** Flow lutar sig mjukt mot pekaren – blicken följer dig. */
function useFlowGaze(enabled: boolean) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  useEffect(() => {
    if (!enabled) return;
    if (typeof window === "undefined") return;
    if (!window.matchMedia?.("(pointer: fine)").matches) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const onMove = (event: PointerEvent) => {
      const el = ref.current;
      if (!el) return;
      const box = el.getBoundingClientRect();
      if (!box.width || !box.height) return;
      const dx = (event.clientX - (box.left + box.width / 2)) / window.innerWidth;
      const dy = (event.clientY - (box.top + box.height / 2)) / window.innerHeight;
      setTilt({
        x: Math.max(-1, Math.min(1, dx * 2)),
        y: Math.max(-1, Math.min(1, dy * 2)),
      });
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [enabled]);
  return { ref, tilt };
}

/**
 * Flow – MyFloves officiella maskot.
 * Bilden i src/assets/flow-mascot.png.asset.json är source of truth.
 * Skapa aldrig parallella varianter – återanvänd denna komponent.
 */

export const FLOW_MASCOT_SRC = flowAsset.url;

const SIZES = {
  xs: "h-10 w-10",
  sm: "h-14 w-14",
  md: "h-24 w-24",
  lg: "h-36 w-36",
  xl: "h-52 w-52",
  "2xl": "h-64 w-64",
  "3xl": "h-80 w-80",
} as const;

export type FlowMascotSize = keyof typeof SIZES;

/** Flows kroppsspråk – anpassas efter vilken vy han står i. */
const MOODS = {
  none: "",
  wave: "wave-hello",
  float: "floaty",
  nod: "flow-nod",
  bounce: "flow-bounce",
  sway: "flow-sway",
  think: "flow-think",
  pulse: "flow-pulse",
  cheer: "flow-cheer",
  calm: "flow-calm",
} as const;

export type FlowMood = keyof typeof MOODS;

export function FlowMascot({
  size = "md",
  float = false,
  glow = false,
  wave = false,
  mood,
  alive = true,
  status = "idle",
  bump = false,
  className,
  imgClassName,
  alt = "Flow – MyFloves följeslagare",
}: {
  size?: FlowMascotSize;
  float?: boolean;
  glow?: boolean;
  /** Flow vinkar som en hälsning. */
  wave?: boolean;
  /** Flows kroppsspråk för vyn han står i. */
  mood?: FlowMood;
  /** Levande detaljer: andning, blinkningar och blick som följer. */
  alive?: boolean;
  /** Samtalsstatus: lyssnar när du skriver, tänker vid väntan, andas ut när det är klart. */
  status?: FlowStatus;
  /**
   * Gör Flow optiskt större utan att ta mer plats: platsen i layouten
   * behåller sin storlek och bilden skalas inuti rutan.
   */
  bump?: boolean;
  className?: string;
  /** Extra klasser på bilden, t.ex. responsiva storlekar. */
  imgClassName?: string;
  alt?: string;
}) {
  const tempo = STATUS_TEMPO[status];
  // "Ingen rörelse" (NPF-läget) stoppar även blinkningar och blicken,
  // som styrs via JavaScript och inte fångas av CSS-regeln.
  const { settings: npf } = useNpfSettings();
  const [appearance] = useMyFlowAppearance();
  const lively = alive && appearance.motion !== "still" && !npf.stillness;
  const blinking = useFlowBlink(lively, tempo);
  const { ref, tilt } = useFlowGaze(lively);
  // Under tänkandet vandrar blicken uppåt/bort i stället för att följa pekaren.
  const gx = tilt.x * tempo.gaze;
  const gy = tilt.y * tempo.gaze - (status === "thinking" ? 0.35 : 0);
  return (
    <span
      ref={ref}
      data-flow-mascot
      data-flow-mood={mood ?? (wave ? "wave" : float ? "float" : "none")}
      data-flow-alive={alive ? "true" : "false"}
      data-flow-status={status}
      data-flow-bump={bump ? "true" : "false"}
      style={
        {
          "--flow-breath": tempo.breath,
          "--flow-glow": tempo.glow,
        } as React.CSSProperties
      }
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center",
        // Rutan i layouten är låst till storleken, så en större bild
        // aldrig knuffar text eller ändrar radhöjd.
        bump && cn(SIZES[size], "overflow-visible"),
        className,
      )}
    >
      {glow && (
        <span
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-0 -z-10 rounded-full bg-[#C4B5FD]/45 blur-2xl",
          lively && "flow-heart-glow",
          )}
        />
      )}
      <span
        aria-hidden={false}
        className={cn(
          lively && "flow-gaze inline-flex",
          blinking && "flow-blinking",
          bump && "absolute inset-0 inline-flex items-center justify-center",
        )}
        style={
          lively
            ? {
                transform: `translate3d(${gx * 3}px, ${gy * 2}px, 0) rotate(${gx * 2}deg)`,
              }
            : undefined
        }
      >
        <img
          src={FLOW_MASCOT_SRC}
          alt={alt}
          loading="lazy"
          decoding="async"
          data-flow-blink={blinking ? "true" : "false"}
          className={cn(
            "object-contain drop-shadow-[0_8px_24px_rgba(124,92,224,0.25)]",
            SIZES[size],
            // Skalas i mitten – rutan runtom står stilla.
            bump && "origin-center scale-125",
            lively && (mood ? MOODS[mood] : cn(float && !wave && "floaty", wave && "wave-hello")),
            lively && !mood && !wave && !float && "flow-breathe-body",
            imgClassName,
          )}
        />
      </span>
    </span>
  );
}

/** Liten pratbubbla från Flow. */
export function FlowSays({
  children,
  size = "sm",
  className,
  wave,
  glow,
  mood,
}: {
  children: React.ReactNode;
  size?: FlowMascotSize;
  className?: string;
  wave?: boolean;
  glow?: boolean;
  mood?: FlowMood;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 justify-items-center gap-3 text-left sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center sm:justify-items-stretch",
        className,
      )}
    >
      <div className="shrink-0">
        <FlowMascot size={size} float={!wave} wave={wave} glow={glow} mood={mood} />
      </div>
      <div className="w-full min-w-0 rounded-2xl border border-border bg-card px-4 py-3 text-sm leading-relaxed text-pretty text-ink shadow-soft">
        {children}
      </div>
    </div>
  );
}
