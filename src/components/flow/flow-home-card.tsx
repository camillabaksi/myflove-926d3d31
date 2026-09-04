import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { X, ArrowRight } from "lucide-react";
import { FlowMascot } from "@/components/flow-mascot";
import ActivityEnergyPrompt from "@/components/activity-energy-prompt";
import { useFlowHome } from "@/hooks/use-flow-home";
import { useFeatureUsage, type FeatureId } from "@/lib/feature-usage";
import { useQuickflow } from "@/hooks/use-quickflow";
import { useQuickflowHabits, type QuickflowAction } from "@/hooks/use-quickflow-habits";
import { useNoteFolders } from "@/hooks/use-note-folders";
import { useNotes } from "@/hooks/use-notes";
import { useTasks, useReminders } from "@/hooks/use-data";
import { useEnergyBattery } from "@/hooks/use-energy-battery";
import { suggestNow } from "@/lib/flow-engine";
import { guessArea } from "@/lib/quickflow";
import { todayISO } from "@/lib/day";
import { CHOICE_LABELS, type FlowHomeChoiceId } from "@/lib/flow-home";
import type { FlowItem } from "@/lib/flow-items";
import { track } from "@/lib/analytics";

/**
 * Flow på startsidan – lugn följeslagare, inte chatbot.
 *
 * En sak i taget, korta meningar, få val och alltid möjligt att stänga.
 * Alla knappar går till befintliga funktioner och befintlig data:
 * Quickflow, Kalendern, Batteriet, aktivitetshistoriken och anteckningarna.
 */
export default function FlowHomeCard() {
  const { prompt, stale, pending } = useFlowHome();
  const { record: recordFeature } = useFeatureUsage();
  const { remove, update, complete } = useQuickflow();
  const { recordAction, topAction, topFolderId } = useQuickflowHabits();
  const { folders } = useNoteFolders();
  const { addNote } = useNotes();
  const { activeTasks } = useTasks();
  const { addReminder } = useReminders();
  const { reading } = useEnergyBattery();
  const [, navigate] = useLocation();

  const [closed, setClosed] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [energyItem, setEnergyItem] = useState<FlowItem | null>(null);

  if (closed) return null;

  const go = (id: FlowHomeChoiceId) => {
    track("flow_interaction", { source: id });
    if (id === "quickflow") {
      recordFeature("quickflow");
      window.dispatchEvent(new CustomEvent("myflove:quickflow"));
      return;
    }
    if (id === "valj") {
      setSuggesting(true);
      return;
    }
    if (id === "vecka") {
      navigate("/historik");
      return;
    }
    recordFeature(id as FeatureId);
    navigate(id === "kalender" ? "/kalender" : "/mitt-batteri");
  };

  /** Ett rimligt nästa steg ur befintlig uppgiftsdata – Flow föreslår, du bestämmer. */
  const suggestion = suggesting
    ? suggestNow({ tasks: activeTasks, batteryNow: Math.round(reading.now) })
    : null;

  /** Något har blivit liggande – vi påstår aldrig att du glömt något. */
  const staleActions: { key: QuickflowAction; label: string; onClick: () => void }[] = stale
    ? [
        {
          key: "kalender",
          label: "📅 Lägg i kalendern",
          onClick: () => {
            addReminder(stale.text, todayISO(), "09:00");
            remove(stale.id);
            recordAction("kalender");
            toast.success("Den ligger i kalendern idag kl 09:00 – ändra när du vill.");
          },
        },
        {
          key: "paminn",
          label: "🔔 Påminn mig",
          onClick: () => {
            update(stale.id, { remindAt: Date.now() + 4 * 60 * 60 * 1000, notifiedAt: undefined });
            recordAction("paminn");
            toast.success("Jag hör av mig om fyra timmar.");
          },
        },
        {
          key: "mapp",
          label: "📁 Flytta till mapp",
          onClick: () => {
            const folder = folders.find((f) => f.id === topFolderId) ?? folders[0];
            addNote(stale.text, guessArea(stale.text));
            if (folder) recordAction("mapp", folder.id);
            else recordAction("anteckning");
            remove(stale.id);
            toast.success(
              folder
                ? `Sparad i ${folder.emoji} ${folder.name} bland anteckningarna.`
                : "Sparad bland anteckningarna – där kan du skapa en mapp.",
            );
          },
        },
        {
          key: "klart",
          label: "✓ Klar",
          onClick: () => {
            complete(stale.id);
            recordAction("klart");
          },
        },
        {
          key: "bort",
          label: "🗑️ Inte längre relevant",
          onClick: () => {
            remove(stale.id);
            recordAction("bort");
          },
        },
      ]
    : [];

  // Adaptivt: den handling du oftast väljer hamnar först.
  const sortedStale = topAction
    ? [...staleActions].sort((a, b) => (b.key === topAction ? 1 : 0) - (a.key === topAction ? 1 : 0))
    : staleActions;

  const askEnergy = () => {
    if (!pending) return;
    setEnergyItem({
      id: pending.sourceId,
      title: pending.title,
      source: "uppgift",
      area: "vardag",
      emoji: "✅",
      dueDate: pending.date,
      priority: "idag",
    });
  };

  return (
    <section
      aria-label="Flow"
      data-testid="home-flow"
      className="relative overflow-hidden rounded-3xl border border-border/60 bg-card p-4 shadow-soft sm:p-5"
    >
      <button
        type="button"
        aria-label="Stäng Flow"
        onClick={() => setClosed(true)}
        className="absolute right-3 top-3 rounded-full p-1 text-muted-foreground/70 transition hover:text-foreground"
      >
        <X size={15} />
      </button>

      <div className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3">
        <FlowMascot
          size="sm"
          mood={prompt.mood === "think" ? "think" : prompt.mood === "wave" ? "wave" : "calm"}
          className="flow-alive shrink-0"
          alt=""
        />
        <div className="min-w-0 space-y-3 pr-5">
          <p className="text-sm font-medium leading-snug text-ink">{prompt.message}</p>

          {prompt.mode === "liggande" && stale && (
            <div className="space-y-2">
              <p className="rounded-2xl bg-secondary/50 px-3 py-2 text-sm text-ink">{stale.text}</p>
              <div className="flex flex-wrap gap-2">
                {sortedStale.map((action, index) => (
                  <button
                    key={action.key}
                    type="button"
                    onClick={action.onClick}
                    className={`press rounded-full px-3.5 py-1.5 text-xs font-medium ${
                      index === 0
                        ? "bg-primary text-primary-foreground"
                        : "border border-border bg-card text-ink"
                    }`}
                  >
                    {action.label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => update(stale.id, { askedAt: Date.now() })}
                  className="rounded-full px-3 py-1.5 text-xs text-muted-foreground hover:underline"
                >
                  Låt den ligga kvar
                </button>
              </div>
            </div>
          )}

          {prompt.mode === "energi" && pending && (
            <div className="space-y-2">
              <p className="rounded-2xl bg-secondary/50 px-3 py-2 text-sm text-ink">
                {pending.title}
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={askEnergy}
                  className="press rounded-full bg-primary px-3.5 py-1.5 text-xs font-medium text-primary-foreground"
                >
                  Svara på hur den kändes
                </button>
                <button
                  type="button"
                  onClick={() => setClosed(true)}
                  className="rounded-full px-3 py-1.5 text-xs text-muted-foreground hover:underline"
                >
                  Inte nu
                </button>
              </div>
            </div>
          )}

          {prompt.choices.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {prompt.choices.map((choice, index) => (
                <button
                  key={choice}
                  type="button"
                  onClick={() => go(choice)}
                  data-testid={`flow-choice-${choice}`}
                  className={`press rounded-full px-3.5 py-1.5 text-xs font-medium transition ${
                    index === 0
                      ? "bg-primary text-primary-foreground"
                      : "border border-border bg-card text-ink hover:border-primary"
                  }`}
                >
                  {CHOICE_LABELS[choice]}
                </button>
              ))}
            </div>
          )}

          {suggestion && (
            <div className="space-y-2 rounded-2xl bg-lavender/30 p-3">
              <p className="text-sm text-ink">{suggestion.headline}</p>
              {suggestion.task ? (
                <>
                  <p className="text-sm font-medium text-ink">{suggestion.task.title}</p>
                  {suggestion.reason && (
                    <p className="text-xs text-muted-foreground">{suggestion.reason}</p>
                  )}
                  <div className="flex flex-wrap gap-2 pt-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        track("flow_interaction", { source: "valj-ja" });
                        navigate("/idag");
                      }}
                      className="press inline-flex items-center gap-1 rounded-full bg-primary px-3.5 py-1.5 text-xs font-medium text-primary-foreground"
                    >
                      {suggestion.ctaLabel} <ArrowRight size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setSuggesting(false)}
                      className="rounded-full px-3 py-1.5 text-xs text-muted-foreground hover:underline"
                    >
                      Inte nu
                    </button>
                  </div>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setSuggesting(false)}
                  className="rounded-full px-3 py-1.5 text-xs text-muted-foreground hover:underline"
                >
                  Okej
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <ActivityEnergyPrompt item={energyItem} onClose={() => setEnergyItem(null)} />
    </section>
  );
}
