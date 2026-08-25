import flowAsset from "@/assets/flow-mascot.png.asset.json";
import { cn } from "@/lib/utils";

/**
 * Flow – MyFloves officiella maskot.
 * Bilden i src/assets/flow-mascot.png.asset.json är source of truth.
 * Skapa aldrig parallella varianter – återanvänd denna komponent.
 */

export const FLOW_MASCOT_SRC = flowAsset.url;

const SIZES = {
  xs: "h-8 w-8",
  sm: "h-12 w-12",
  md: "h-20 w-20",
  lg: "h-32 w-32",
  xl: "h-48 w-48",
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
  className?: string;
  /** Extra klasser på bilden, t.ex. responsiva storlekar. */
  imgClassName?: string;
  alt?: string;
}) {
  return (
    <span
      data-flow-mascot
      data-flow-mood={mood ?? (wave ? "wave" : float ? "float" : "none")}
      className={cn("relative inline-flex shrink-0 items-center justify-center", className)}
    >
      {glow && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 rounded-full bg-[#C4B5FD]/45 blur-2xl"
        />
      )}
      <img
        src={FLOW_MASCOT_SRC}
        alt={alt}
        loading="lazy"
        decoding="async"
        className={cn(
          "object-contain drop-shadow-[0_8px_24px_rgba(124,92,224,0.25)]",
          SIZES[size],
          mood
            ? MOODS[mood]
            : cn(float && !wave && "floaty", wave && "wave-hello"),
          imgClassName,
        )}
      />
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
      <div className="w-full min-w-0 rounded-2xl border border-[#2A2140]/5 bg-white px-4 py-3 text-sm leading-relaxed text-pretty text-[#2A2140] shadow-sm">
        {children}
      </div>
    </div>
  );


}

