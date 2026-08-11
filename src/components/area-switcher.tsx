import {
  AREA_META,
  areaChipStyle,
  areaColor,
  useActiveArea,
  type AreaFilter,
  type LifeArea,
} from "@/lib/life-areas";

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
        const area = o.value === "alla" ? null : (o.value as LifeArea);
        const style = area
          ? isActive
            ? areaChipStyle(area, true)
            : { borderColor: areaColor(area) + "", opacity: 0.95 }
          : undefined;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => setActiveArea(o.value)}
            aria-pressed={isActive}
            style={area ? { ...style, ...(isActive ? {} : { borderColor: undefined }) } : undefined}
            className={`${pad} rounded-full border transition-colors ${
              isActive
                ? area
                  ? "font-medium"
                  : "border-primary bg-primary/10 text-primary font-medium"
                : "border-border bg-card text-muted-foreground hover:bg-secondary"
            }`}
          >
            {area ? (
              <span
                aria-hidden="true"
                className="inline-block w-2 h-2 rounded-full mr-1.5 align-middle"
                style={{ backgroundColor: areaColor(area) }}
              />
            ) : null}
            {o.emoji ? <span aria-hidden="true">{o.emoji} </span> : null}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export default AreaSwitcher;
