import { useState } from "react";
import { BookOpen, Check, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { emitActivityDone } from "@/lib/activity-energy-event";
import { todayISO } from "@/lib/flow-items";
import { track } from "@/lib/analytics";
import { useLang } from "@/hooks/use-language";
import { cn } from "@/lib/utils";

type Strategy = { id: string; title: string; minutes: string; why: string; steps: string[] };
type Group = { id: string; label: string; hint: string; items: Strategy[] };

/** Återhämtningsbibliotek – vardagliga strategier, inga medicinska råd. */
const LIBRARY: Group[] = [
  {
    id: "kropp",
    label: "Kropp",
    hint: "När kroppen känns spänd eller rastlös",
    items: [
      { id: "andning", title: "Lugn andning 4–2–6", minutes: "2 min", why: "Ger hjärnan en paus att landa i.", steps: ["Andas in genom näsan i 4", "Håll kvar i 2", "Andas ut långsamt i 6", "Upprepa 5 gånger"] },
      { id: "strack", title: "Sträck ut axlar och nacke", minutes: "3 min", why: "Släpper spänningar efter stillasittande.", steps: ["Rulla axlarna bakåt 5 gånger", "Luta huvudet mot ena axeln, sedan andra", "Sträck armarna upp mot taket"] },
      { id: "promenad", title: "Kort promenad", minutes: "10 min", why: "Rörelse och dagsljus kan ge ny energi.", steps: ["Gå ut utan mål", "Lägg märke till tre saker du ser", "Gå i din egen takt"] },
    ],
  },
  {
    id: "sinnen",
    label: "Sinnen",
    hint: "När det blir för mycket ljud, ljus eller intryck",
    items: [
      { id: "morkt", title: "Dämpa intrycken", minutes: "5–10 min", why: "Färre intryck ger hjärnan vila.", steps: ["Släck eller dämpa ljuset", "Hörlurar eller öronproppar", "Blunda eller titta på något stilla"] },
      { id: "54321", title: "5-4-3-2-1", minutes: "3 min", why: "Hjälper dig tillbaka till nuet.", steps: ["5 saker du ser", "4 saker du kan röra", "3 saker du hör", "2 saker du känner doft av", "1 sak du smakar"] },
      { id: "tyngd", title: "Något tungt eller mjukt", minutes: "10 min", why: "Tryck och värme känns lugnande för många.", steps: ["Ta en tung filt eller kudde", "Sätt eller lägg dig bekvämt", "Andas lugnt"] },
    ],
  },
  {
    id: "tankar",
    label: "Tankar",
    hint: "När huvudet är fullt",
    items: [
      { id: "toma", title: "Töm huvudet på papper", minutes: "5 min", why: "Det du skrivit ner behöver du inte hålla i.", steps: ["Skriv allt som snurrar", "Ringa in en enda sak", "Resten får vänta"] },
      { id: "enSak", title: "Välj en enda sak", minutes: "2 min", why: "Minskar känslan av att allt är bråttom.", steps: ["Vad är viktigast den närmaste timmen?", "Gör bara det", "Allt annat är okej att skjuta på"] },
      { id: "snall", title: "Var snäll mot dig själv", minutes: "2 min", why: "Du gör så gott du kan idag.", steps: ["Säg: det här är en tung stund", "Tänk vad du skulle säga till en vän", "Säg det till dig själv"] },
    ],
  },
  {
    id: "vardag",
    label: "Vardag & glädje",
    hint: "Små saker som brukar fylla på",
    items: [
      { id: "drick", title: "Ät eller drick något", minutes: "5 min", why: "Låg ork kan ibland bero på tom tank.", steps: ["Ett glas vatten", "Något litet att äta", "Sitt ner medan du äter"] },
      { id: "musik", title: "En låt du tycker om", minutes: "4 min", why: "Musik kan byta stämning snabbt.", steps: ["Välj en låt", "Gör inget annat under tiden"] },
      { id: "kontakt", title: "Hör av dig till någon", minutes: "5 min", why: "Kontakt med någon trygg kan ge energi.", steps: ["Skicka ett kort meddelande", "Eller ring någon du gillar"] },
    ],
  },
];

export default function RecoveryLibrary() {
  const { t } = useLang();
  const [group, setGroup] = useState(LIBRARY[0]!.id);
  const [open, setOpen] = useState<string | null>(null);
  const active = LIBRARY.find((g) => g.id === group) ?? LIBRARY[0]!;

  return (
    <section className="rounded-3xl border border-border/60 bg-card p-4 shadow-soft" aria-label={t("Återhämtningsbibliotek")} data-testid="recovery-library">
      <div className="flex items-start gap-3">
        <span aria-hidden className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-secondary text-primary">
          <BookOpen className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-ink">{t("Återhämtningsbibliotek")}</h2>
          <p className="text-xs text-muted-foreground">{t("Välj det som passar dig just nu. Allt är frivilligt.")}</p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2" role="tablist">
        {LIBRARY.map((g) => (
          <button key={g.id} type="button" role="tab" aria-selected={g.id === group}
            onClick={() => { setGroup(g.id); setOpen(null); }}
            className={cn("min-h-10 rounded-full px-3 text-sm font-medium transition-colors",
              g.id === group ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground")}>
            {t(g.label)}
          </button>
        ))}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{t(active.hint)}</p>

      <ul className="mt-2 space-y-2">
        {active.items.map((s) => {
          const isOpen = open === s.id;
          return (
            <li key={s.id} className="rounded-2xl border border-border/60 bg-background/60">
              <button type="button" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : s.id)}
                className="flex min-h-14 w-full items-center gap-3 px-3 py-2 text-left">
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-ink">{t(s.title)}</span>
                  <span className="block text-xs text-muted-foreground">{s.minutes} · {t(s.why)}</span>
                </span>
                <ChevronDown className={cn("h-4 w-4 shrink-0 text-primary transition-transform", isOpen && "rotate-180")} aria-hidden />
              </button>
              {isOpen && (
                <div className="px-3 pb-3">
                  <ol className="list-decimal space-y-1 pl-5 text-sm text-foreground">
                    {s.steps.map((st) => <li key={st}>{t(st)}</li>)}
                  </ol>
                  <Button type="button" size="sm" className="mt-3 rounded-full"
                    onClick={() => {
                      track("recovery_viewed");
                      emitActivityDone({ id: `recovery-${s.id}-${Date.now()}`, title: s.title, dueDate: todayISO() });
                      setOpen(null);
                    }}>
                    <Check className="h-4 w-4" /> {t("Jag gjorde det")}
                  </Button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
