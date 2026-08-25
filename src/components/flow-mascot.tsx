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
} as const;

export type FlowMascotSize = keyof typeof SIZES;

export function FlowMascot({
  size = "md",
  float = false,
  glow = false,
  className,
  alt = "Flow – MyFloves följeslagare",
}: {
  size?: FlowMascotSize;
  float?: boolean;
  glow?: boolean;
  className?: string;
  alt?: string;
}) {
  return (
    <span className={cn("relative inline-flex shrink-0 items-center justify-center", className)}>
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
          float && "animate-flow-float",
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
}: {
  children: React.ReactNode;
  size?: FlowMascotSize;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start gap-3", className)}>
      <FlowMascot size={size} float />
      <div className="rounded-3xl rounded-tl-md border border-[#2A2140]/5 bg-white px-4 py-3 text-sm leading-relaxed text-[#2A2140] shadow-sm">
        {children}
      </div>
    </div>
  );
}
