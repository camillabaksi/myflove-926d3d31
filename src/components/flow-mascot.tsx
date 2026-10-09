import flowAsset from "@/assets/flow-mascot.png.asset.json";
import { cn } from "@/lib/utils";

// Original asset and technical API retained; the approved presentation has no mascot image.
export const FLOW_MASCOT_SRC = flowAsset.url;
export type FlowStatus = "idle" | "listening" | "thinking" | "done";
export type FlowMascotSize = "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";
export type FlowMood = "none" | "wave" | "float" | "nod" | "bounce" | "sway" | "think" | "pulse" | "cheer" | "calm";

export function FlowMascot(_props: {
  size?: FlowMascotSize;
  float?: boolean;
  glow?: boolean;
  /** Flow vinkar som en hälsning. */
  wave?: boolean;
  /** Flows kroppsspråk för vyn han står i. */
  mood?: FlowMood;
  /** Levande detaljer: andning, blinkningar och blick som följer. */
  alive?: boolean;
  /** Förhandsgranskning av osparat rörelseval i Min Flow. */
  motionOverride?: "mjuk" | "still";
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
  return null;
}

/** Existing message content remains available without a decorative image column. */
export function FlowSays({ children, className }: {
  children: React.ReactNode;
  size?: FlowMascotSize;
  className?: string;
  wave?: boolean;
  glow?: boolean;
  mood?: FlowMood;
}) {
  return (
    <div className={cn("text-left", className)}>
      <div className="w-full min-w-0 rounded-2xl border border-border bg-card px-4 py-3 text-sm leading-relaxed text-pretty text-ink shadow-soft">
        {children}
      </div>
    </div>
  );
}
