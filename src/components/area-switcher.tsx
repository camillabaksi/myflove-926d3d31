import { AREA_META, useActiveArea, type AreaFilter } from "@/lib/life-areas";

interface Props {
  /** Kompakt läge för sidor med ont om plats */
  size?: "sm" | "md";
  className?: string;
}

/**
 * Rumsväljare: låter användaren gå in i ett livsområde utan att appen
 * blir tio appar. "Allt" är Flows helhetsvy.
 */
export function AreaSwitcher({ size = "md", className = "" }: Props) {
  const { activeArea, setActiveArea, enabled } = useActiveArea();

  const options: { value: AreaFilter; label: string; emoji?: string }[] = [
    { value: "alla", label: "Allt" },
    ...enabled.map((a) => ({
      value: a as AreaFilter,
      label: AREA_META[a].label,
      emoji: AREA_META[a].emoji,
    })),
  ];

  const pad = size === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm";

  return (
    <div
      role="group"
      aria-label="Välj livsområde"
      className={`flex flex-wrap gap-2 ${className}`}
    >
      {options.map((o) => {
        const isActive = activeArea === o.value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => setActiveArea(o.value)}
            aria-pressed={isActive}
            className={`${pad} rounded-full border transition-colors ${
              isActive
                ? "border-primary bg-primary/10 text-primary font-medium"
                : "border-border bg-card text-muted-foreground hover:bg-secondary"
            }`}
          >
            {o.emoji ? <span aria-hidden="true">{o.emoji} </span> : null}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export default AreaSwitcher;
