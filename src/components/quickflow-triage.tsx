import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Wand2 } from "lucide-react";
import { useQuickflow } from "@/hooks/use-quickflow";
import { useTasks, useReminders, useDumpIdeas } from "@/hooks/use-data";
import { useSharedShoppingList } from "@/hooks/use-shared-shopping-list";
import { useFlowUsage } from "@/hooks/use-daily-flow";
import {
  suggestWhen,
  formatWhen,
  guessArea,
  guessChild,
  shoppingTitleFrom,
  parseWhenFromText,
  DESTINATION_META,
  DESTINATION_AREA,
  type QuickflowDestination,
  type QuickflowItem,
} from "@/lib/quickflow";
import { AREA_META, ALL_AREAS, type LifeArea } from "@/lib/life-areas";
import { useQuickflowRules } from "@/hooks/use-quickflow-rules";
import { resolveDestination, titleForRule } from "@/lib/quickflow-rules";
import { useNotes } from "@/hooks/use-notes";
import { useEnergyFlow } from "@/hooks/use-energy-flow";
import { useChildren } from "@/hooks/use-children";



const DAY = 86_400_000;

/**
 * QuickFlow ska inte bli en ny anteckningshög.
 * Här hjälper MyFlove till att sortera – aldrig automatiskt, aldrig skuldbeläggande.
 */
export default function QuickflowTriage() {
  const { openItems, complete, remove, snooze, update } = useQuickflow();
  const { addTask } = useTasks();
  const { addReminder } = useReminders();
  const { addItem: addShoppingItem } = useSharedShoppingList();
  const { addIdea } = useDumpIdeas();
  const { log } = useFlowUsage();
  const { rules } = useQuickflowRules();

  const { addNote } = useNotes();
  const { addFactor } = useEnergyFlow();
  const { children, addItem: addChildItem } = useChildren();

  const [sorting, setSorting] = useState(false);
  /** Vilken tanke som väntar på svar om energin gav eller tog. */
  const [energyFor, setEnergyFor] = useState<string | null>(null);
  /** Riktning vald i energipanelen – nästa steg är hur mycket den påverkar. */
  const [energyDir, setEnergyDir] = useState<"gives" | "drains">("drains");
  /** Vilken tanke som väntar på "vilket barn och vad blir det?". */
  const [childFor, setChildFor] = useState<string | null>(null);
  const [childPick, setChildPick] = useState<string | null>(null);
  /** Användarens svar när tolkningen var otydlig. */
  const [choices, setChoices] = useState<Record<string, { at: number; allDay: boolean }>>({});

  const stale = useMemo(
    () =>
      openItems.filter(
        (i) => Date.now() - (i.askedAt ?? i.createdAt) > 3 * DAY && !i.remindAt,
      ),
    [openItems],
  );

  if (openItems.length === 0) return null;

  /** Egen regel först, sedan MyFloves gissning. */
  const ruleFor = (item: QuickflowItem) => {
    const resolved = resolveDestination(item, rules);
    // Nämns ett av barnen vid namn väger det tyngre än den generella gissningen.
    if (!resolved.rule && guessChild(item.text, children)) {
      return { ...resolved, destination: "barn" as QuickflowDestination };
    }
    return resolved;
  };

  const areaOf = (item: QuickflowItem): LifeArea =>
    item.area ??
    ruleFor(item).area ??
    DESTINATION_AREA[ruleFor(item).destination] ??
    guessArea(item.text);

  /** Titeln som regeln vill ha ("köpa schampo" → "schampo"). */
  const titleOf = (item: QuickflowItem): string => {
    const r = ruleFor(item).rule;
    return r ? titleForRule(item.text, r) : item.text;
  };

  /** Klockslag från regeln, om användaren satt ett. */
  const ruleTimeOn = (item: QuickflowItem, at: number): number => {
    const time = ruleFor(item).time;
    if (!time) return at;
    const [h, m] = time.split(":").map(Number);
    const d = new Date(at);
    d.setHours(h ?? 9, m ?? 0, 0, 0);
    return d.getTime();
  };

  /** Vilken tid vi faktiskt använder – null betyder "jag behöver fråga först". */
  const planFor = (item: QuickflowItem) => {
    const s = suggestWhen(item.level, item.text);
    const chosen = choices[item.id];
    if (chosen) return { ...s, at: chosen.at, allDay: chosen.allDay, ambiguous: undefined };
    if (s.ambiguous) return { ...s, resolved: false as const };
    return { ...s, allDay: s.allDay ?? false };
  };

  const timeString = (at: number) => {
    const d = new Date(at);
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  };

  const needsAnswer = (item: QuickflowItem) => {
    const p = planFor(item);
    if (p.ambiguous) {
      toast("Jag vill inte gissa fel", { description: p.ambiguous });
      return true;
    }
    return false;
  };

  const toTask = (item: QuickflowItem) => {
    addTask(titleOf(item), undefined, { area: areaOf(item) });
    complete(item.id);
    log("planering");
    toast.success(`Den ligger nu bland dina uppgifter i ${AREA_META[areaOf(item)].label}. 💙`);
  };

  const toReminder = (item: QuickflowItem) => {
    if (needsAnswer(item)) return;
    const s = planFor(item);
    const d = new Date(s.at);
    // En påminnelse behöver ett klockslag – heldag blir en lugn morgonpuff kl 09.
    if (s.allDay) d.setHours(9, 0, 0, 0);
    d.setTime(ruleTimeOn(item, d.getTime()));
    addReminder(titleOf(item), d.toISOString().slice(0, 10), timeString(d.getTime()));
    complete(item.id);
    toast.success(`Jag säger till ${formatWhen(d.getTime()).toLowerCase()}.`, {
      description: s.allDay ? "Ingen tid stod i texten, så jag valde morgonen." : s.why,
    });
  };

  const toCalendar = (item: QuickflowItem) => {
    if (needsAnswer(item)) return;
    const s = planFor(item);
    const d = new Date(s.at);
    const ruleTime = ruleFor(item).time;
    addTask(titleOf(item), d.toISOString().slice(0, 10), {
      // Utan klockslag lägger vi in det som heldag – om inte en egen regel säger tid.
      ...(ruleTime ? { time: ruleTime } : s.allDay ? {} : { time: timeString(s.at) }),
      area: areaOf(item),
    });
    complete(item.id);
    log("planering");
    toast.success(
      s.allDay ? "Inlagd som heldag – lägg till en tid när du vill." : "Inlagd i kalendern – ändra tiden när du vill.",
    );
  };
  const toShopping = (item: QuickflowItem) => {
    const r = ruleFor(item).rule;
    const title = r ? titleForRule(item.text, r) : shoppingTitleFrom(item.text);
    addShoppingItem(title);
    complete(item.id);
    toast.success(`"${title}" ligger nu i inköpslistan. 🛒`);
  };

  const toIdea = (item: QuickflowItem) => {
    addIdea(titleOf(item));
    complete(item.id);
    toast.success("Sparad i idébanken – den finns kvar när du vill titta på den.");
  };

  /** Anteckning: får bara finnas. Ingen deadline, inget krav på åtgärd. */
  const toNote = (item: QuickflowItem) => {
    addNote(titleOf(item), item.area ?? ruleFor(item).area);
    complete(item.id);
    toast.success("Sparad som anteckning – du kan göra något av den senare om du vill. 💜");
  };

  const toAreaTask = (item: QuickflowItem, area: LifeArea) => {
    addTask(titleOf(item), undefined, { area });
    complete(item.id);
    log("planering");
    toast.success(`Den ligger nu i ${AREA_META[area].label}.`);
  };

  const toEnergy = async (
    item: QuickflowItem,
    direction: "gives" | "drains",
    strength: number,
  ) => {
    await addFactor({ title: titleOf(item), direction, strength, category: "annat" });
    complete(item.id);
    setEnergyFor(null);
    toast.success(
      direction === "gives"
        ? "Sparad som något som ger energi. 🔋"
        : "Sparad som något som tar energi. 🪫",
    );
  };

  /** Barn: tanken landar hos rätt barn, som aktivitet, uppgift eller anteckning. */
  const toChild = async (
    item: QuickflowItem,
    childId: string,
    kind: "activity" | "task" | "note",
  ) => {
    const child = children.find((c) => c.id === childId);
    const plan = parseWhenFromText(item.text) ? planFor(item) : null;
    const at = plan && !plan.ambiguous ? new Date(plan.at) : null;
    await addChildItem({
      childId,
      kind,
      title: titleOf(item),
      ...(kind === "activity" && at
        ? {
            date: at.toISOString().slice(0, 10),
            ...(plan?.allDay ? {} : { time: timeString(at.getTime()) }),
          }
        : {}),
    });
    complete(item.id);
    setChildFor(null);
    setChildPick(null);
    toast.success(`Sparad hos ${child?.name ?? "barnet"}. 👧`);
  };

  const openChildPanel = (item: QuickflowItem) => {
    setChildFor(item.id);
    setChildPick(guessChild(item.text, children)?.id ?? children[0]?.id ?? null);
  };

  /** En knapp per ställe tanken kan hamna. Förslaget ligger först. */
  const runDestination = (item: QuickflowItem, d: QuickflowDestination) => {
    if (d === "inkop") return toShopping(item);
    if (d === "kalender") return toCalendar(item);
    if (d === "uppgift") return toTask(item);
    if (d === "paminnelse") return toReminder(item);
    if (d === "barn") {
      if (children.length === 0) {
        toast("Inga barn tillagda än", {
          description: "Lägg till barnen under Barn så kan jag föreslå vem det gäller.",
        });
        return toAreaTask(item, "privat");
      }
      return openChildPanel(item);
    }
    if (d === "anteckning") return toNote(item);
    if (d === "energi") return setEnergyFor(item.id);
    if (d === "ide") return toIdea(item);
    const area = DESTINATION_AREA[d];
    if (area) return toAreaTask(item, area);
    return update(item.id, { askedAt: Date.now() });
  };

  const DESTINATIONS: QuickflowDestination[] = [
    "uppgift",
    "kalender",
    "paminnelse",
    "barn",
    "familj",
    "studier",
    "jobb",
    "hemma",
    "halsa",
    "ekonomi",
    "inkop",
    "anteckning",
    "energi",
    "ide",
    "behall",
  ];

  return (

    <div className="space-y-3">
      {!sorting ? (
        <div className="surface-card p-4 flex flex-wrap items-center gap-3">
          <p className="flex-1 min-w-[12rem] text-sm text-ink">
            Du har {openItems.length} {openItems.length === 1 ? "sak" : "saker"} i QuickFlow. Vill du
            att jag hjälper dig sortera dem?
          </p>
          <button
            type="button"
            onClick={() => setSorting(true)}
            className="rounded-full bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold inline-flex items-center gap-2"
          >
            <Wand2 size={16} /> Ja, hjälp mig
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {openItems.map((item) => {
            const resolved = ruleFor(item);
            const type = resolved.destination;
            const plan = parseWhenFromText(item.text) ? planFor(item) : null;
            return (
              <div key={item.id} className="surface-card p-4 space-y-3">
                <div className="flex items-start gap-2">
                  <span className="text-lg">{DESTINATION_META[type].emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-ink">{item.text}</p>
                    <p className="text-xs text-muted-foreground">
                      {resolved.rule
                        ? `Din regel "${resolved.rule.phrase}": ${DESTINATION_META[type].label}.`
                        : `Mitt förslag: ${DESTINATION_META[type].label} – du bestämmer.`}

                    </p>
                    {plan && !plan.ambiguous && (
                      <p className="text-xs text-primary">
                        Jag hittade ett datum i texten: {formatWhen(plan.at, new Date(), plan.allDay)}
                        {plan.allDay ? " (ingen tid angavs)" : ""}
                      </p>
                    )}
                  </div>
                </div>
                {plan?.ambiguous && (
                  <div className="rounded-2xl border border-gold/40 bg-gold/10 p-3 space-y-2">
                    <p className="text-sm text-ink">{plan.ambiguous}</p>
                    <div className="flex flex-wrap gap-2">
                      {plan.options?.map((o) => (
                        <button
                          key={o.label}
                          type="button"
                          onClick={() =>
                            setChoices((prev) => ({ ...prev, [item.id]: { at: o.at, allDay: o.allDay } }))
                          }
                          className="rounded-full border border-border bg-card px-3 py-1.5 text-sm font-medium hover:border-primary/50"
                        >
                          {o.label}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() =>
                          setChoices((prev) => ({
                            ...prev,
                            [item.id]: { at: plan.at, allDay: true },
                          }))
                        }
                        className="rounded-full border border-border bg-card px-3 py-1.5 text-sm font-medium hover:border-primary/50"
                      >
                        Heldag
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs text-muted-foreground">Hör hemma i:</span>
                  {ALL_AREAS.map((a) => {
                    const active = areaOf(item) === a;
                    return (
                      <button
                        key={a}
                        type="button"
                        onClick={() => update(item.id, { area: a })}
                        aria-pressed={active}
                        className={`press rounded-pill border px-3 py-1 text-xs font-medium transition-colors ${
                          active
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border bg-card text-muted-foreground"
                        }`}
                      >
                        {AREA_META[a].emoji} {AREA_META[a].label}
                      </button>
                    );
                  })}
                </div>
                {energyFor === item.id ? (
                  <div className="flex flex-wrap gap-2">
                    <Action onClick={() => void toEnergy(item, "gives")}>🔋 Gav energi</Action>
                    <Action onClick={() => void toEnergy(item, "drains")}>🪫 Tog energi</Action>
                    <Action onClick={() => setEnergyFor(null)}>Avbryt</Action>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {[type, ...DESTINATIONS.filter((d) => d !== type)].map((d) => (
                      <Action
                        key={d}
                        onClick={() => runDestination(item, d)}
                        highlight={d === type}
                        title={DESTINATION_META[d].hint}
                      >
                        {DESTINATION_META[d].emoji} {DESTINATION_META[d].label}
                      </Action>
                    ))}
                    <Action onClick={() => remove(item.id)}>Ta bort</Action>
                  </div>
                )}

              </div>
            );
          })}
          <button
            type="button"
            onClick={() => setSorting(false)}
            className="text-sm text-muted-foreground underline underline-offset-2"
          >
            Klar för nu
          </button>
        </div>
      )}

      {/* Saker som legat ett tag – varsam fråga, ingen skuld. */}
      {!sorting &&
        stale.slice(0, 2).map((item) => (
          <div key={item.id} className="surface-card p-4 space-y-3 border-gold/40">
            <div>
              <p className="text-sm text-muted-foreground">
                Du bad mig komma ihåg detta för några dagar sedan.
              </p>
              <p className="font-medium text-ink">{item.text}</p>
              <p className="text-sm text-muted-foreground">Vill du fortfarande ha kvar det?</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Action onClick={() => update(item.id, { askedAt: Date.now() })}>Ja, behåll</Action>
              <Action onClick={() => snooze(item.id, Date.now() + 2 * DAY)}>Påminn mig senare</Action>
              <Action onClick={() => toTask(item)}>Gör till uppgift</Action>
              <Action onClick={() => remove(item.id)}>Ta bort</Action>
            </div>
          </div>
        ))}
    </div>
  );
}

function Action({
  onClick,
  children,
  highlight,
  title,
}: {
  onClick: () => void;
  children: React.ReactNode;
  /** Markerar MyFloves förslag – bara som hjälp, inget tvång. */
  highlight?: boolean;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`rounded-full border px-3.5 py-2 text-sm font-medium transition-colors ${
        highlight
          ? "border-primary bg-primary/10 text-primary"
          : "border-border bg-card hover:border-primary/50"
      }`}
    >
      {children}
    </button>
  );
}
