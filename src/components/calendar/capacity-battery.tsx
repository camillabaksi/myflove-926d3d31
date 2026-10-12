import { cn } from "@/lib/utils";

/** Registrerad kapacitet, visualiserad utan mål- eller värderingsfärg. */
export function CapacityBattery({ percent, size = "md", className }: { percent: number | null; size?: "xs" | "sm" | "md" | "lg"; className?: string }) {
  const dims = { xs: "h-1.5 w-8 rounded-full", sm: "h-2.5 w-10 rounded-md", md: "h-4 w-24 rounded-lg", lg: "h-7 min-w-0 flex-1 rounded-xl" }[size];
  const text = { xs: "text-[10px]", sm: "text-[11px]", md: "text-sm", lg: "text-3xl" }[size];
  return <span data-capacity-size={size} className={cn("inline-flex min-w-0 items-center gap-1.5", className)}>
    <span data-capacity-track className={cn("inline-flex items-center", size === "lg" && "flex min-w-0 flex-1 max-w-60")} aria-hidden>
      <span className={cn("pace-inset-track relative overflow-hidden border border-border bg-secondary/70", size !== "xs" && "p-0.5", dims)}>
        {percent != null && <span className="block h-full rounded-[inherit] bg-capacity transition-[width] motion-reduce:transition-none" style={{ width: `${Math.max(0, Math.min(100, percent))}%` }} />}
      </span>
      {size !== "xs" && <span className={cn("ml-0.5 rounded-r-sm bg-border", size === "lg" ? "h-3 w-1.5" : "h-1.5 w-1")} />}
    </span>
    <span className={cn("shrink-0 font-display font-bold tabular-nums text-foreground", text)}>{percent == null ? "–" : `${percent} %`}</span>
  </span>;
}
