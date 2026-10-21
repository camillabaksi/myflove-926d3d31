import { useMemo } from "react";
import { Leaf, Wind } from "lucide-react";
import { useEnergyFlow } from "@/hooks/use-energy-flow";
import { buildHelpsDrains, MIN_ANSWERS, type HelpDrainItem } from "@/lib/helps-drains";

function Column({ title, icon: Icon, items, tone, empty }: { title: string; icon: typeof Leaf; items: HelpDrainItem[]; tone: "primary" | "accent"; empty: string }) {
  return (
    <div className="min-w-0 rounded-2xl bg-secondary/40 p-[12px] sm:p-[16px]">
      <h3 className="mb-3 flex items-center gap-2 font-semibold text-ink">
        <Icon size={18} aria-hidden className={tone === "primary" ? "text-primary" : "text-accent-foreground"} />
        {title}
      </h3>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{empty}</p>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.category} className="min-w-0">
              <div className="flex items-baseline justify-between gap-2 text-sm">
                <span className="min-w-0 break-words font-medium text-foreground"><span aria-hidden>{item.emoji} </span>{item.label}</span>
                <span className="shrink-0 text-muted-foreground">{item.share} %</span>
              </div>
              <div aria-hidden className="mt-1 h-2 overflow-hidden rounded-full bg-background">
                <div className={`h-full rounded-full ${tone === "primary" ? "bg-primary/70" : "bg-accent-foreground/50"}`} style={{ width: `${item.share}%` }} />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{item.share} % av {item.answers} svar</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Insikter: vad som oftast hjälpt och tagit energi, ur användarens egna svar. */
export default function HelpsDrainsCard() {
  const { entries } = useEnergyFlow();
  const { helps, drains } = useMemo(() => buildHelpsDrains(entries), [entries]);
  return (
    <section className="@container min-w-0 rounded-3xl border border-border bg-card p-[12px] font-sans @[22rem]:p-[20px]" aria-labelledby="helps-drains-title" data-testid="helps-drains">
      <h2 id="helps-drains-title" className="font-semibold text-ink">Det som hjälper dig – och det som tar energi</h2>
      <p className="mt-1 text-sm text-muted-foreground">Ur dina egna svar om hur saker kändes. Ett mönster, inte en regel.</p>
      <div className="mt-4 grid grid-cols-1 gap-3 @[30rem]:grid-cols-2">
        <Column title="Ger dig ofta energi" icon={Leaf} tone="primary" items={helps} empty={`Visas när en sorts aktivitet fått minst ${MIN_ANSWERS} svar.`} />
        <Column title="Tar ofta energi" icon={Wind} tone="accent" items={drains} empty={`Visas när en sorts aktivitet fått minst ${MIN_ANSWERS} svar.`} />
      </div>
    </section>
  );
}
