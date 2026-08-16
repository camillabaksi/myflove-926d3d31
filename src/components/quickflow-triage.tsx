import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Wand2 } from "lucide-react";
import { useQuickflow } from "@/hooks/use-quickflow";
import { useTasks, useReminders } from "@/hooks/use-data";
import { useFlowUsage } from "@/hooks/use-daily-flow";
import { suggestWhen, formatWhen, type QuickflowItem } from "@/lib/quickflow";

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

  const stale = useMemo(
    () =>
      openItems.filter(
        (i) => Date.now() - (i.askedAt ?? i.createdAt) > 3 * DAY && !i.remindAt,
      ),
    [openItems],
  );

  if (openItems.length === 0) return null;

  const toTask = (item: QuickflowItem) => {
    addTask(item.text);
    complete(item.id);
    log("planering");
    toast.success("Den ligger nu bland dina uppgifter. 💙");
  };

  const toReminder = (item: QuickflowItem) => {
    const s = suggestWhen(item.level, item.text);
    const d = new Date(s.at);
    addReminder(
      item.text,
      d.toISOString().slice(0, 10),
      `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`,
    );
    complete(item.id);
    toast.success(`Jag säger till ${formatWhen(s.at).toLowerCase()}.`, { description: s.why });
  };

  const toCalendar = (item: QuickflowItem) => {
    const s = suggestWhen(item.level, item.text);
    const d = new Date(s.at);
    addTask(item.text, d.toISOString().slice(0, 10), {
      time: `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`,
    });
    complete(item.id);
    log("planering");
    toast.success("Inlagd i kalendern – ändra tiden när du vill.");
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
            return (
              <div key={item.id} className="surface-card p-4 space-y-3">
                <div className="flex items-start gap-2">
                  <span className="text-lg">{TYPE_META[type].emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-ink">{item.text}</p>
                    <p className="text-xs text-muted-foreground">
                      Mitt förslag: {TYPE_META[type].label} – du bestämmer.
                    </p>
                  </div>
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
