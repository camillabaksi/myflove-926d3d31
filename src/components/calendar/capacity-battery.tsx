import { capacityTone } from "@/lib/day-capacity";
import { cn } from "@/lib/utils";

const FILL = { high: "bg-sage", middle: "bg-honey", low: "bg-coral" } as const;

/** Mjukt batteri. Procenten visas alltid som text; färgen är bara stöd. */
export function CapacityBattery({ percent, size = "md", className }: { percent: number | null; size?: "xs" | "sm" | "md" | "lg"; className?: string }) {
  const dims = { xs: "h-1.5 w-8 rounded-full", sm: "h-2.5 w-10 rounded-md", md: "h-4 w-24 rounded-lg", lg: "h-7 min-w-0 flex-1 rounded-xl" }[size];
  const text = { xs: "text-[10px]", sm: "text-[11px]", md: "text-sm", lg: "text-3xl" }[size];
  return <span className={cn("inline-flex min-w-0 items-center gap-1.5", className)}>
    <span className={cn("inline-flex items-center", size === "lg" && "flex min-w-0 flex-1 max-w-60")} aria-hidden>
      <span className={cn("relative overflow-hidden border border-border bg-secondary/70", size !== "xs" && "p-0.5", dims)}>
        {percent != null && <span className={cn("block h-full rounded-[inherit] transition-[width] motion-reduce:transition-none", FILL[capacityTone(percent)])} style={{ width: `${Math.max(4, percent)}%` }} />}
      </span>
      {size !== "xs" && <span className={cn("ml-0.5 rounded-r-sm bg-border", size === "lg" ? "h-3 w-1.5" : "h-1.5 w-1")} />}
    </span>
    <span className={cn("shrink-0 font-display font-bold tabular-nums text-foreground", text)}>{percent == null ? "–" : `${percent} %`}</span>
  </span>;
}
