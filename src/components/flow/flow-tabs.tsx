import { Link } from "@tanstack/react-router";
import { ListOrdered, MessageCircle, Sparkles } from "lucide-react";

export type FlowTab = "flow" | "planera" | "chatt";

const TABS: { id: FlowTab; to: string; label: string; icon: typeof Sparkles }[] = [
  { id: "flow", to: "/flow", label: "Flow", icon: Sparkles },
  { id: "planera", to: "/flowplan", label: "Planera", icon: ListOrdered },
  { id: "chatt", to: "/assistant", label: "Chatta", icon: MessageCircle },
];

/**
 * En enda ingång till Flow. Hjälp, planering och chatt är lägen i samma
 * upplevelse – varje läge har kvar sin egen adress så länkar och bakåtknapp
 * fortsätter fungera.
 */
export default function FlowTabs({ active }: { active: FlowTab }) {
  return (
    <nav
      aria-label="Flow"
      className="mb-4 grid grid-cols-3 gap-1 rounded-3xl border-2 border-border bg-muted/50 p-1"
    >
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = tab.id === active;
        return (
          <Link
            key={tab.id}
            to={tab.to}
            aria-current={isActive ? "page" : undefined}
            className={`flex min-w-0 items-center justify-center gap-1.5 rounded-2xl px-3 py-2.5 text-sm font-medium transition-colors ${
              isActive ? "bg-card text-ink shadow-soft" : "text-muted-foreground hover:text-ink"
            }`}
          >
            <Icon size={16} aria-hidden />
            <span className="truncate">{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
