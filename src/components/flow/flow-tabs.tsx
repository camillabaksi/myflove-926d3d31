import { ListOrdered, MessageCircle } from "lucide-react";
import { APP_DESTINATIONS } from "@/lib/app-destinations";
import { Button } from "@/components/ui/button";

export type FlowTab = "flow" | "planera" | "chatt";

const TABS: { id: FlowTab; label: string; icon: typeof MessageCircle }[] = [
  { id: "planera", label: APP_DESTINATIONS["/flowplan"].label, icon: ListOrdered },
  { id: "chatt", label: APP_DESTINATIONS["/assistant"].label, icon: MessageCircle },
];

/**
 * Lägesväljare i Flow-vyn. Hjälp, planering och chatt visas i samma vy –
 * byte av läge sker direkt utan att lämna sidan.
 */
export default function FlowTabs({
  active,
  onChange,
}: {
  active: FlowTab;
  onChange: (tab: FlowTab) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Pace"
      className="mb-4 grid grid-cols-2 gap-1 rounded-3xl border-2 border-border bg-muted/50 p-1"
    >
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = tab.id === active;
        return (
          <Button
            key={tab.id}
            type="button"
            variant="ghost"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={`h-auto min-w-0 justify-center gap-1.5 rounded-2xl px-3 py-2.5 text-sm font-medium transition-colors hover:bg-transparent hover:text-ink ${
              isActive ? "bg-card text-ink shadow-soft hover:bg-card" : "text-muted-foreground"
            }`}
          >
            <Icon size={16} aria-hidden />
            <span className="truncate">{tab.label}</span>
          </Button>
        );
      })}
    </div>
  );
}
