import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Wand2 } from "lucide-react";
import { useQuickflow } from "@/hooks/use-quickflow";
import { useTasks, useReminders } from "@/hooks/use-data";
import { useFlowUsage } from "@/hooks/use-daily-flow";
import {
  suggestWhen,
  formatWhen,
  guessArea,
  parseWhenFromText,
  type QuickflowItem,
} from "@/lib/quickflow";
import { AREA_META, ALL_AREAS, type LifeArea } from "@/lib/life-areas";

type SuggestedType = "uppgift" | "paminnelse" | "kalender" | "ide" | "minne";

const TYPE_META: Record<SuggestedType, { emoji: string; label: string }> = {
  uppgift: { emoji: "📌", label: "Uppgift" },
  paminnelse: { emoji: "⏰", label: "Påminnelse" },
  kalender: { emoji: "📅", label: "Kalender" },
  ide: { emoji: "💡", label: "Idé" },
  minne: { emoji: "🧠", label: "Bara komma ihåg" },
};

/** Enkel, förklarbar gissning – användaren kan alltid ändra. */
function suggestType(item: QuickflowItem): SuggestedType {
  const t = item.text.toLowerCase();
  if (parseWhenFromText(item.text)) return "kalender";
  if (item.remindAt) return "paminnelse";
  if (/(möte|träff|läkare|tandläkare|besök|kl \d|klockan)/.test(t)) return "kalender";
  if (/(ring|boka|betala|maila|mejla|skicka|handla|fixa|hämta|tvätta)/.test(t)) return "uppgift";
  if (/(kanske|idé|ide|skulle vilja|drömmer|tänkte att)/.test(t)) return "ide";
  if (item.level === "viktigt") return "uppgift";
  return "minne";
}


const DAY = 86_400_000;

/**
 * QuickFlow ska inte bli en ny anteckningshög.
 * Här hjälper MyFlove till att sortera – aldrig automatiskt, aldrig skuldbeläggande.
 */
export default function QuickflowTriage() {
  const { openItems, complete, remove, snooze, update } = useQuickflow();
  const { addTask } = useTasks();
  const { addReminder } = useReminders();
  const { log } = useFlowUsage();
  const [sorting, setSorting] = useState(false);
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

  const areaOf = (item: QuickflowItem): LifeArea => item.area ?? guessArea(item.text);

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
    addTask(item.text, undefined, { area: areaOf(item) });
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
    addReminder(item.text, d.toISOString().slice(0, 10), timeString(d.getTime()));
    complete(item.id);
    toast.success(`Jag säger till ${formatWhen(d.getTime()).toLowerCase()}.`, {
      description: s.allDay ? "Ingen tid stod i texten, så jag valde morgonen." : s.why,
    });
  };

  const toCalendar = (item: QuickflowItem) => {
    if (needsAnswer(item)) return;
    const s = planFor(item);
    const d = new Date(s.at);
    addTask(item.text, d.toISOString().slice(0, 10), {
      // Utan klockslag lägger vi in det som heldag.
      ...(s.allDay ? {} : { time: timeString(s.at) }),
      area: areaOf(item),
    });
    complete(item.id);
    log("planering");
    toast.success(
      s.allDay ? "Inlagd som heldag – lägg till en tid när du vill." : "Inlagd i kalendern – ändra tiden när du vill.",
    );
  };


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
            const type = suggestType(item);
            const plan = parseWhenFromText(item.text) ? planFor(item) : null;
            return (
              <div key={item.id} className="surface-card p-4 space-y-3">
                <div className="flex items-start gap-2">
                  <span className="text-lg">{TYPE_META[type].emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-ink">{item.text}</p>
                    <p className="text-xs text-muted-foreground">
                      Mitt förslag: {TYPE_META[type].label} – du bestämmer.
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
                <div className="flex flex-wrap gap-2">
                  <Action onClick={() => toTask(item)}>📌 Uppgift</Action>
                  <Action onClick={() => toReminder(item)}>⏰ Påminnelse</Action>
                  <Action onClick={() => toCalendar(item)}>📅 Kalender</Action>
                  <Action onClick={() => update(item.id, { askedAt: Date.now() })}>
                    🧠 Behåll i QuickFlow
                  </Action>
                  <Action onClick={() => remove(item.id)}>Ta bort</Action>
                </div>
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

function Action({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full border border-border bg-card px-3.5 py-2 text-sm font-medium hover:border-primary/50 transition-colors"
    >
      {children}
    </button>
  );
}
