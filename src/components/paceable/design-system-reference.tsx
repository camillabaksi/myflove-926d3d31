import { useState, type CSSProperties } from "react";
import { ArrowLeft, Copy, Image, Minimize2, MoreHorizontal, Plus } from "lucide-react";
import { BrandLogo } from "./brand-logo";
import { AppBrandHeader } from "./app-brand-header";
import { DayGreeting } from "@/components/day/day-greeting";
import { PacePage, PaceContent, PaceHeading, PaceSection, PaceCard, PaceInfoBlock, PaceField, PaceInput, PaceTextarea, PaceChoiceGroup, PaceChoice, PaceActions, PaceButton, PaceHelp, PaceSwitch, PaceDialogContent, PaceStatus, PaceSelectTrigger, PaceSelectContent } from "./design-system";
import { Dialog, DialogContent, DialogHeader, DialogTrigger, DialogClose, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DailyActivityRow } from "@/components/day/daily-activity-row";
import type { FlowItem } from "@/lib/flow-items";
import { Select, SelectItem, SelectValue } from "@/components/ui/select";
import { HealthToolLinks } from "@/components/health-tool-links";
import { TrainingCreationChoice } from "@/components/workout/training-creation-choice";
import { TrainingSessionVisual } from "@/components/workout/training-session-visual";
import { ManualExercises } from "@/components/workout/manual-exercises";
import type { Workout, WorkoutBlock } from "@/lib/workout-generator";
import { EnergyChoices, MoodChoices } from "@/components/checkin-choices";
import { orkFromValue10 } from "@/lib/ork";

const SAMPLE_WORKOUT: Workout = {
  id: "reference-only", title: "Ett lugnt styrkepass", note: "Ett fristående exempel.", createdAt: 0,
  minutes: 10, energy: "normal", place: "hemma", equipment: ["kroppsvikt"], focus: ["helkropp"], limitations: [], intent: "styrka", kcalLow: 0, kcalHigh: 0,
  blocks: [{ exerciseId: "sit-to-stand", sets: 2, reps: 8, restSeconds: 30, section: "huvuddel" }],
};

const SAMPLE_DAY: FlowItem[] = [
  { id: "example-breakfast", title: "Göra frukost", source: "rutin", area: "vardag", time: "06:00", done: true, completable: true, priority: "idag", emoji: "" },
  { id: "example-calendar", title: "Ett lugnt besök", source: "kalender", area: "vardag", time: "10:30", done: false, completable: true, priority: "idag", emoji: "" },
  { id: "example-evening", title: "Förbereda morgondagen", source: "uppgift", area: "vardag", time: "18:30", done: false, completable: true, priority: "idag", emoji: "" },
];

function CalendarDayToolsExample() {
  const [items, setItems] = useState(SAMPLE_DAY);
  const [pictograms, setPictograms] = useState(false);
  return <Dialog><DialogTrigger asChild><PaceButton variant="outline">Öppna Dagens verktyg – mobilbredd</PaceButton></DialogTrigger>
    <DialogContent className="pace-next-page pace-calendar-day-tools max-w-xs rounded-3xl sm:max-w-xs">
      <DialogHeader><DialogTitle>Dagens verktyg</DialogTitle><DialogDescription>Söndag 11 oktober · exempel</DialogDescription></DialogHeader>
      <div className="space-y-3">
        <div className="pace-calendar-actions flex flex-wrap items-center gap-2">
          <button type="button" disabled className="flex items-center rounded-2xl"><Plus size={16} aria-hidden />Lägg till</button>
          <button type="button" disabled className="flex items-center rounded-2xl"><Plus size={16} aria-hidden />Påminnelse</button>
          <button type="button" disabled className="flex items-center rounded-2xl"><Copy size={16} aria-hidden />Kopiera dagen</button>
          <button type="button" aria-pressed={pictograms} onClick={() => setPictograms(!pictograms)} className="flex items-center rounded-2xl"><Image size={16} aria-hidden />Bildstöd</button>
        </div>
        <div className="border-t border-border/60 pt-1"><ul className="divide-y divide-border/50" aria-label="Dagens innehåll – exempel">{items.map(item => <li key={item.id}><DailyActivityRow item={item} integrated showPictograms={pictograms} onToggle={() => setItems(current => current.map(row => row.id === item.id ? { ...row, done: !row.done } : row))} actions={<Button variant="ghost" size="icon" disabled aria-label={`Fler val för ${item.title} – exempel`} className="h-11 w-11 text-muted-foreground"><MoreHorizontal size={14} /></Button>} /></li>)}</ul></div>
      </div>
    </DialogContent>
  </Dialog>;
}

/** Isolated examples only. Never imports account stores, analytics or mutations. */
export default function DesignSystemReference() {
  const [dark, setDark] = useState(false);
  const [still, setStill] = useState(false);
  const [draft, setDraft] = useState("");
  const [choice, setChoice] = useState("Hemma");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [trainingExample, setTrainingExample] = useState<"pace" | "manual" | null>(null);
  const [manualBlocks, setManualBlocks] = useState<WorkoutBlock[]>([]);
  const [sampleEnergy, setSampleEnergy] = useState(6);
  const [sampleMood, setSampleMood] = useState<number | null>(6);
  const [largeChoices, setLargeChoices] = useState(false);
  return <div className={dark ? "dark" : undefined}>
    <PacePage className={still ? "pace-ds-still" : undefined}>
      <PaceContent width="wide">
        <header className="pace-ds-reference-header"><BrandLogo compact className="pace-app-brand" /><div className="pace-ds-actions"><PaceButton variant="outline" onClick={() => setDark(!dark)}>{dark ? "Ljust läge" : "Mörkt läge"}</PaceButton><PaceButton variant="outline" aria-pressed={still} onClick={() => setStill(!still)}>Stilla läge</PaceButton></div></header>
        <PaceHeading editorial>Din vardag, i din takt.</PaceHeading>
        <p className="pace-ds-help">Paceables gemensamma designreferens · Fristående exempel, inget sparas på ditt konto.</p>
        <PaceSection title="Välkomsthierarki – mobilbredd">
          <div className="max-w-xs overflow-hidden rounded-3xl border border-border bg-background">
            <div className="border-b border-border/50 p-3"><AppBrandHeader back={<PaceButton variant="ghost" disabled aria-label="Tillbaka – exempel" className="h-11 w-11 p-0"><ArrowLeft size={22} /></PaceButton>} actions={<PaceButton variant="outline" disabled><Minimize2 size={14} />Minimera allt</PaceButton>} /></div>
            <div className="space-y-5 p-4">
              <DayGreeting tagline="Din dag, i din takt" greeting="Hej" name="Cam" date="Söndag 11 oktober" />
              <PaceHeading level={2}>Din dag</PaceHeading>
              <div><PaceHeading level={3}>En sak i taget</PaceHeading><p>Det finns plats för en lugn start.</p><p className="pace-type-help text-muted-foreground">Ett fristående exempel på appens textstorlekar.</p></div>
            </div>
          </div>
        </PaceSection>
        <PaceSection title="Grund och sidram">
          <PaceInfoBlock><PaceHeading level={3}>Samma roller, innehållsstyrd höjd</PaceHeading><p>16 px sidmarginal på liten mobil, 24 px från 640 px och 32 px från 1024 px. Läsning använder högst 42rem, listor 52rem och breda verktyg 60rem.</p></PaceInfoBlock>
          <div className="pace-ds-reference-grid">
            <PaceCard><PaceHeading level={3}>Kort för ett avgränsat verktyg</PaceHeading><p>16 px inre luft på mobil och 20 px på större skärmar. Kortets höjd följer alltid innehållet.</p><PaceButton variant="outline">Visa planen</PaceButton></PaceCard>
            <PaceInfoBlock><PaceHeading level={3}>Informationsblock</PaceHeading><p>Lugn tonad yta, tunn kant och utan extra upphöjning. Informationsblock läggs inte inuti kort som dekoration.</p><PaceStatus state="empty">Inget planerat här ännu.</PaceStatus></PaceInfoBlock>
          </div>
        </PaceSection>
        <PaceSection title="Typografi och handlingar">
          <PaceInfoBlock><PaceHeading editorial level={3}>Rubriker och klockslag i Fraunces</PaceHeading><p className="pace-type-activity text-lg">Aktiviteter och lästext i Lora</p><p>Logotypen är störst. Välkomsttext och sidrubriker: 28. Hälsning: 24. Sektionsrubriker: 20. Kortrubriker: 18. Brödtext och kontroller: 16. Hjälptext och underkategorier: 14. Små etiketter: 12. Storlekarna följer din inställning för större text.</p></PaceInfoBlock>
          <div className="max-w-xs"><PaceHeading level={2}>Tider idag</PaceHeading><div className="mt-3 grid grid-cols-[3.5rem_minmax(0,1fr)] gap-3"><time className="pace-type-time font-semibold tabular-nums">18:30</time><div><p className="pace-type-activity">Lugn promenad</p><p className="pace-type-category text-muted-foreground">Hälsa · Egen tid</p></div></div></div>
          <CalendarDayToolsExample />
          <PaceActions><PaceButton>Primär handling</PaceButton><PaceButton variant="outline">Sekundär handling</PaceButton><PaceButton variant="ghost">Diskret handling</PaceButton><PaceButton variant="destructive">Destruktiv handling</PaceButton></PaceActions>
          <p className="pace-ds-help">Kontroller kan se 36–40 px höga ut men behåller minst 44×44 px faktisk tryckyta.</p>
        </PaceSection>
        <PaceSection title="Min plats – mobilbredd">
          <PaceCard className="pace-next-page pace-next-place max-w-xs">
            <p className="pace-place-section-title font-sans font-semibold text-ink">Mer inom hälsa</p>
            <HealthToolLinks />
          </PaceCard>
        </PaceSection>
        <PaceSection title="Träning – fristående exempel">
          <div className="max-w-xs space-y-3">
            <TrainingCreationChoice onPace={() => setTrainingExample("pace")} onManual={() => setTrainingExample("manual")} />
            {trainingExample === "pace" && <div className="surface-card p-4"><p className="font-semibold">{SAMPLE_WORKOUT.title}</p><p className="text-sm text-muted-foreground">Exempel på ett bildpass, inget skapas eller sparas på ditt konto här.</p><TrainingSessionVisual workout={SAMPLE_WORKOUT} /></div>}
            {trainingExample === "manual" && <div className="surface-card p-4"><ManualExercises blocks={manualBlocks} onChange={setManualBlocks} /></div>}
          </div>
        </PaceSection>
        <PaceSection title="Incheckning – mobilbredd">
          <PaceButton variant="outline" aria-pressed={largeChoices} onClick={() => setLargeChoices(!largeChoices)}>200 % text i incheckningsexemplet</PaceButton>
          <div data-testid="checkin-choices-reference" className="pace-form pace-checkin max-w-xs space-y-4 rounded-3xl border border-border bg-card p-4" style={largeChoices ? { "--pace-type-body": "2rem", "--pace-type-help": "1.75rem" } as CSSProperties : undefined}>
            <p className="font-semibold">Hur mycket ryms idag?</p>
            <EnergyChoices value={orkFromValue10(sampleEnergy)?.id} onChange={setSampleEnergy} />
            <p className="font-semibold">Hur känns det just nu?</p>
            <MoodChoices value={sampleMood} onChange={setSampleMood} />
          </div>
          <p className="pace-ds-help">Fristående val, inget sparas på ditt konto.</p>
        </PaceSection>
        <PaceSection title="Formulär och val">
          <PaceContent width="reading"><form className="pace-ds-card pace-ds-field" onSubmit={(event) => { event.preventDefault(); if (!draft.trim()) { setError("Skriv ett namn innan du fortsätter."); setSaved(false); return; } setError(""); setSaved(true); }} noValidate>
          <PaceField label="Vad vill du kalla planen?" required help="Du kan ändra namnet senare." error={error}><PaceInput value={draft} onChange={(event) => { setDraft(event.target.value); setSaved(false); }} /></PaceField>
          <PaceField label="Några ord för dig själv" help="Valfritt."><PaceTextarea placeholder="Vad vill du komma ihåg?" /></PaceField>
          <PaceChoiceGroup label="Var passar det bäst?">{["Hemma", "På väg", "En plats med ett längre beskrivande namn"].map((name) => <PaceChoice key={name} type="button" selected={choice === name} onClick={() => setChoice(name)}>{name}</PaceChoice>)}</PaceChoiceGroup>
          <Select defaultValue="later"><PaceField label="När?"><PaceSelectTrigger><SelectValue /></PaceSelectTrigger></PaceField><PaceSelectContent className={dark ? "dark" : undefined}><SelectItem value="later">Senare, när det finns utrymme</SelectItem><SelectItem value="today">I dag</SelectItem></PaceSelectContent></Select>
          <PaceSwitch label="Visa en påminnelse i exemplet" help="Inställningen gäller bara denna sida." />
          <PaceActions><PaceHelp type="button" onClick={() => setError("Detta är ett exempel; inget skickas eller sparas på ditt konto.")}>Varför?</PaceHelp><PaceButton type="submit">Spara exempel</PaceButton></PaceActions>
          {saved && <PaceStatus state="saved">Exemplet är klart; inget har sparats på ditt konto.</PaceStatus>}
          </form></PaceContent>
        </PaceSection>
        <PaceSection title="Tillstånd och dialog">
        <PaceStatus state="loading">Hämtar innehåll…</PaceStatus><PaceStatus state="saving">Sparar…</PaceStatus><PaceStatus state="error">Det gick inte att spara. Dina val finns kvar.</PaceStatus>
        <PaceActions><PaceButton disabled>Inte tillgängligt</PaceButton><PaceButton variant="destructive">Ta bort exempel</PaceButton>
          <Dialog><DialogTrigger asChild><PaceButton variant="outline">Öppna dialog</PaceButton></DialogTrigger>
            <PaceDialogContent className={dark ? `dark${still ? " pace-ds-still" : ""}` : still ? "pace-ds-still" : undefined}>
              <DialogTitle>En stund för dig</DialogTitle><DialogDescription>Dialoger använder upphöjd yta, synlig fokusmarkering och ett kryss med minst 44×44 px tryckyta.</DialogDescription>
              <PaceField label="En egen anteckning"><PaceTextarea defaultValue="Ett osparat exempel" /></PaceField><PaceActions><DialogClose asChild><PaceButton variant="outline">Avbryt</PaceButton></DialogClose><DialogClose asChild><PaceButton>Klart</PaceButton></DialogClose></PaceActions>
            </PaceDialogContent>
          </Dialog>
        </PaceActions>
        </PaceSection>
      </PaceContent>
    </PacePage>
  </div>;
}
