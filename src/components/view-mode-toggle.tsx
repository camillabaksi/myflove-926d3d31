import { LayoutGrid, Rows2 } from "lucide-react";
import { useViewMode, type ViewMode } from "@/lib/view-mode";
import type { LifeArea } from "@/lib/life-areas";

/**
 * Välj vanlig eller förenklad vy för rummet du är i.
 * Valet ligger kvar tills du byter.
 */
export default function ViewModeToggle({
  area,
  className = "",
}: {
  area: LifeArea | string;
  className?: string;
}) {
  const { mode, setMode } = useViewMode(area);

  const options: { id: ViewMode; label: string; icon: typeof Rows2 }[] = [
    { id: "vanlig", label: "Vanlig vy", icon: LayoutGrid },
    { id: "forenklad", label: "Förenklad", icon: Rows2 },
  ];

  return (
    <div
      role="group"
      aria-label="Välj vy"
      className={`inline-flex items-center gap-1 rounded-full border border-border/60 bg-card/80 p-1 ${className}`}
    >
      {options.map((opt) => {
        const active = mode === opt.id;
        const Icon = opt.icon;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => setMode(opt.id)}
            aria-pressed={active}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              active
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <Icon size={14} aria-hidden="true" />
            <span>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
