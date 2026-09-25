import { useEffect } from "react";
import { Link } from "wouter";
import { ArrowRight, Battery, Dumbbell, Pill, Sunrise } from "lucide-react";
import Layout from "@/components/layout";
import { MyFloveHeader } from "@/components/myflove";
import EnergyBattery from "@/components/energy-battery";
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
            description="Hur du mår – energi, träning, medicin och vila på ett ställe."
            why="Allt om ditt mående ligger samlat här, så att dagens lista slipper blandas ihop med hur du känner dig."
          />
        </MyFloveWide>

        <MyFloveWide>
          <AreaFocus
            intent="Jag vill göra något bra för min hälsa idag"
            lowHint="Låg ork idag – vila och en kort promenad räcker."
            href="/mitt-batteri"
            hrefLabel="Checka in hur du mår"
          />
        </MyFloveWide>

        <MyFloveWide className="space-y-2">
          <EnergyBattery href="/mitt-batteri" />
          <p className="text-xs text-muted-foreground">
            Energi, mående, sömn och dagens början och slut checkar du in här – Mitt batteri är enda
            stället du behöver.
          </p>
        </MyFloveWide>

        <MyFloveWide>
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
        </MyFloveWide>

        <MyFloveWide>
          <p className="text-sm text-muted-foreground">
            Allt du fyller i här är samma information som Flow använder för att föreslå saker –
            inget dubbellagras.
          </p>
        </MyFloveWide>
      </MyFlovePageGrid>
    </Layout>
  );
}
