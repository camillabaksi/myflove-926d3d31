import { useEffect } from "react";
import { Link } from "wouter";
import { ArrowRight, Battery, Dumbbell, Pill, Zap, Moon } from "lucide-react";
import Layout from "@/components/layout";
import { MyFloveHeader } from "@/components/myflove";
import EnergyBattery from "@/components/energy-battery";
import { track } from "@/lib/analytics";

/**
 * ❤️ Hälsa – ett samlat hem för allt som handlar om hur du mår.
 * Sidan äger ingen egen data: den länkar vidare till de befintliga
 * vyerna (Mitt batteri, Träning, Rutiner & medicin, Energins historik).
 */
const AREAS: {
  href: string;
  icon: typeof Battery;
  title: string;
  what: string;
}[] = [
  {
    href: "/mitt-batteri",
    icon: Battery,
    title: "Energi & mående",
    what: "Checka in på några sekunder. Här bor dagens kurva och historiken.",
  },
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
  {
    href: "/mitt-batteri",
    icon: Moon,
    title: "Sömn & vila",
    what: "Dagens början och slut loggar du i Mitt batteri.",
  },
  {
    href: "/energifloede",
    icon: Zap,
    title: "Energins historik",
    what: "Vad som brukar ge och ta energi över tid.",
  },
];

export default function HealthPage() {
  useEffect(() => {
    track("health_viewed", { source: "sida" });
  }, []);

  return (
    <Layout>
      <div className="space-y-6">
        <MyFloveHeader
          title="Hälsa"
          emojiKey="wellness"
          description="Hur du mår – energi, träning, medicin och vila på ett ställe."
        />

        <EnergyBattery href="/mitt-batteri" />

        <ul className="space-y-3">
          {AREAS.map((a) => {
            const Icon = a.icon;
            return (
              <li key={a.title}>
                <Link
                  href={a.href}
                  className="surface-card flex items-start gap-3 p-4 transition-colors hover:bg-secondary/40"
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                    <Icon size={20} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium text-ink">{a.title}</span>
                    <span className="block text-sm text-muted-foreground">{a.what}</span>
                  </span>
                  <ArrowRight size={16} className="mt-1 shrink-0 text-muted-foreground" />
                </Link>
              </li>
            );
          })}
        </ul>

        <p className="text-sm text-muted-foreground">
          Allt du fyller i här är samma information som Flow använder för att föreslå saker – inget
          dubbellagras.
        </p>
      </div>
    </Layout>
  );
}
