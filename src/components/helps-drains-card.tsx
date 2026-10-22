import { useMemo } from "react";
import { Leaf, Wind } from "lucide-react";
import { useEnergyFlow } from "@/hooks/use-energy-flow";
import { buildHelpsDrains, MIN_ANSWERS, type HelpDrainItem } from "@/lib/helps-drains";

function Column({ title, icon: Icon, items, tone }: { title: string; icon: typeof Leaf; items: HelpDrainItem[]; tone: "primary" | "accent" }) {
  return (
    <div className="min-w-0 rounded-2xl bg-secondary/40 p-[12px] sm:p-[16px]">
      <h3 className="mb-3 flex items-center gap-2 font-semibold text-ink">
        <Icon size={18} aria-hidden className={tone === "primary" ? "text-primary" : "text-accent-foreground"} />
        {title}
      </h3>
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
    </div>
  );
}

/** Insikter: vad som oftast hjälpt och tagit energi, ur användarens egna svar. */
export default function HelpsDrainsCard() {
  const { entries } = useEnergyFlow();
  const { helps, drains } = useMemo(() => buildHelpsDrains(entries), [entries]);
  const hasPatterns = helps.length > 0 || drains.length > 0;
  return (
    <section className="@container min-w-0 rounded-3xl border border-border bg-card p-[12px] font-sans @[22rem]:p-[20px]" aria-labelledby="helps-drains-title" data-testid="helps-drains">
      <h2 id="helps-drains-title" className="font-semibold text-ink">Vad ger och tar energi?</h2>
      {hasPatterns ? (
        <>
          <p className="mt-1 text-xs text-muted-foreground">Möjliga mönster från dina egna svar.</p>
          <div className={`mt-3 grid grid-cols-1 gap-3 ${helps.length && drains.length ? "@[30rem]:grid-cols-2" : ""}`}>
            {helps.length > 0 && <Column title="Ger energi" icon={Leaf} tone="primary" items={helps} />}
            {drains.length > 0 && <Column title="Tar energi" icon={Wind} tone="accent" items={drains} />}
          </div>
          {(helps.length === 0 || drains.length === 0) && (
            <p className="mt-3 text-xs text-muted-foreground">
              {helps.length === 0 ? "Inget tydligt mönster för vad som ger energi ännu." : "Inget tydligt mönster för vad som tar energi ännu."}
            </p>
          )}
        </>
      ) : (
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Inga tydliga mönster ännu. När samma sorts aktivitet har minst {MIN_ANSWERS} svar
          kan vi börja se vad som brukar hjälpa eller ta energi.
        </p>
      )}
    </section>
  );
}
