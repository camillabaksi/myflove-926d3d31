import { useEffect } from "react";
import { Link } from "wouter";
import { ArrowRight, Battery, Dumbbell, Pill, Sunrise, MessageCircle } from "lucide-react";
import Layout from "@/components/layout";
import { MyFloveHeader } from "@/components/myflove";
import EnergyBattery from "@/components/energy-battery";
import CollapsibleSection from "@/components/collapsible-section";
import { useCapacityMode } from "@/hooks/use-capacity-mode";
import { CAPACITY_META } from "@/lib/priority-engine";
import { useLang } from "@/hooks/use-language";
import { track } from "@/lib/analytics";
import { MyFlovePageGrid, MyFloveWide } from "@/components/myflove/block";

/**
 * ❤️ Hälsa – ett samlat hem för allt som handlar om hur du mår.
 * Sidan äger ingen egen data: den länkar vidare till de befintliga
 * vyerna (Mitt batteri, Träning och Rutiner & medicin). Energihistoriken
 * finns redan som en flik inne i Mitt batteri och är inte en egen ingång här.
 */
const AREAS: {
  href: string;
  icon: typeof Battery;
  title: string;
  what: string;
}[] = [
  {
    href: "/traning",
    icon: Dumbbell,
    title: "Träning & promenader",
    what: "Pass efter din ork.",
  },
  {
    href: "/daglig-rutin",
    icon: Pill,
    title: "Rutiner & medicin",
    what: "Rutiner och dagens doser.",
  },
  {
    href: "/morgonstart",
    icon: Sunrise,
    title: "Morgonstart",
    what: "En lugn start på dagen.",
  },
];

export default function HealthPage() {
  const { mode } = useCapacityMode();
  const { t } = useLang();
  useEffect(() => {
    track("health_viewed", { source: "sida" });
  }, []);

  return (
    <Layout>
      <MyFlovePageGrid area="halsa">
        <MyFloveWide>
          <MyFloveHeader
            title="Hälsa"
            area="halsa"
            emojiKey="wellness"
            description="Hur är läget idag?"
          />
        </MyFloveWide>

        <MyFloveWide className="space-y-2">
          <Link href="/mitt-batteri" className="press flex items-center gap-3 rounded-3xl border border-border/60 bg-card p-4 shadow-soft">
            <Battery className="h-7 w-7 shrink-0 text-primary" aria-hidden />
            <span className="min-w-0 flex-1"><span className="block font-display text-lg font-bold text-ink">Mitt batteri</span><span className="block text-sm text-muted-foreground">Dagens val: {t(CAPACITY_META[mode].label)}. Logga hur du mår eller se ditt energimönster.</span></span>
            <ArrowRight className="h-5 w-5 shrink-0 text-primary" aria-hidden />
          </Link>
        </MyFloveWide>

        <MyFloveWide>
          <Link href="/assistant" className="press flex items-center gap-3 rounded-3xl border border-border/60 bg-card p-4 shadow-soft">
            <MessageCircle className="h-6 w-6 shrink-0 text-primary" aria-hidden />
            <span className="min-w-0 flex-1"><span className="block font-display font-bold text-ink">Prata med Flow</span><span className="block text-sm text-muted-foreground">Berätta vad du behöver göra så hjälper Flow dig att hitta ett nästa steg.</span></span>
            <ArrowRight className="h-5 w-5 shrink-0 text-primary" aria-hidden />
          </Link>
        </MyFloveWide>

        <MyFloveWide>
          <CollapsibleSection id="health-other" title="Mer inom hälsa" defaultCollapsed className="rounded-3xl border border-border/60 bg-card p-4 shadow-soft" headingClassName="font-display text-base font-bold text-ink">
          <ul className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,9rem),1fr))] items-stretch gap-3">
            {AREAS.map((a) => {
              const Icon = a.icon;
              return (
                <li key={a.title} className="min-w-0">
                  <Link
                    href={a.href}
                    className="press area-border flex h-full min-h-[9rem] min-w-0 flex-col gap-2 rounded-3xl border-2 bg-card p-3 shadow-soft transition-shadow hover:shadow-lifted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:p-4"
                  >
                    <span className="flex min-w-0 items-start gap-2.5">
                      <span className="area-bg-soft area-text grid h-10 w-10 shrink-0 place-items-center rounded-xl">
                        <Icon size={20} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-display text-base font-bold leading-tight text-ink">
                          {a.title}
                        </span>
                        <span className="block text-xs text-muted-foreground">{a.what}</span>
                      </span>
                      <ArrowRight size={16} className="mt-0.5 shrink-0 text-muted-foreground" />
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
          </CollapsibleSection>
        </MyFloveWide>
      </MyFlovePageGrid>
    </Layout>
  );
}
