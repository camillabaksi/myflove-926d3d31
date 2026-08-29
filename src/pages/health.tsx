import { useEffect } from "react";
import { Link } from "wouter";
import { ArrowRight, Battery, Dumbbell, Pill } from "lucide-react";
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
    what: "Pass efter din ork – och promenadrutter nära dig.",
  },
  {
    href: "/daglig-rutin",
    icon: Pill,
    title: "Rutiner & medicin",
    what: "Morgonstart, fasta rutiner och dagens doser.",
  },
];

export default function HealthPage() {
  useEffect(() => {
    track("health_viewed", { source: "sida" });
  }, []);

  return (
    <Layout>
      <MyFlovePageGrid>
        <MyFloveWide>
          <MyFloveHeader
            title="Hälsa"
            emojiKey="wellness"
            description="Hur du mår – energi, träning, medicin och vila på ett ställe."
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
          <ul className="grid grid-cols-2 items-start gap-3">
            {AREAS.map((a) => {
              const Icon = a.icon;
              return (
                <li key={a.title} className="min-w-0">
                  <Link
                    href={a.href}
                    className="surface-card flex h-full min-w-0 flex-col items-start gap-2 p-3 transition-colors hover:bg-secondary/40 sm:flex-row sm:gap-3 sm:p-4"
                  >
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                      <Icon size={20} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium text-ink">{a.title}</span>
                      <span className="block text-sm text-muted-foreground">{a.what}</span>
                    </span>
                    <ArrowRight
                      size={16}
                      className="mt-1 hidden shrink-0 text-muted-foreground sm:block"
                    />
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
