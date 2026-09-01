import { track } from "@/lib/analytics";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { MyFloveBlock, MyFlovePageGrid, MyFloveWide } from "@/components/myflove/block";
import { MyFloveHeader } from "@/components/myflove";

import { MyFloveThinking } from "@/components/myflove/motion";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  ListOrdered,
  Sparkles,
  Clock,
  Battery,
  RotateCcw,
  BellRing,
  ArrowUp,
  ArrowDown,
  Check,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { planFlowSequence, type FlowPlanResult } from "@/lib/flowplan.functions";
import { useTasks, useFocus } from "@/hooks/use-data";
import { supabase } from "@/integrations/supabase/client";
import { useLocalStorage } from "@/lib/storage";
import WhyHint from "@/components/why-hint";
import { useFlowExplainer } from "@/hooks/use-flow-explainer";

type DeadlineInfo = { daysUntilDue: number; hasReminder: boolean; activeNow: boolean };

/** Uppgiften prioriteras upp om AI:n flaggat den eller om en påminnelse redan är aktiv. */
function item2Boost(
  item: { taskId: string; deadlineBoost?: boolean },
  info: Map<string, DeadlineInfo>,
) {
  return Boolean(item.deadlineBoost) || Boolean(info.get(item.taskId)?.activeNow);
}

type StoredPlan = {
  plan: FlowPlanResult;
  savedAt: string;
  date: string;
  /** "forslag" = Flow har föreslagit, du har inte sagt ja än. */
  status?: "forslag" | "min";
  /** Din egen ordning (uppgifts-id). Tom = Flows förslag gäller. */
  customOrder?: string[];
};

type Energy = "low" | "medium" | "high";

const ENERGY_LABELS: Record<Energy, string> = {
  low: "Låg – ta det försiktigt",
  medium: "Vanlig – som en normal dag",
  high: "Hög – jag är peppad",
};

const LEVEL_LABELS: Record<number, string> = {
  1: "Tom",
  2: "Låg",
  3: "Ok",
  4: "På",
  5: "Fullt laddad",
};

function levelToEnergy(level: number): Energy {
  if (level <= 2) return "low";
  if (level >= 4) return "high";
  return "medium";
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just nu";
  if (mins < 60) return `${mins} min sedan`;
  const hrs = Math.round(mins / 60);
  return `${hrs} h sedan`;
}

export function FlowPlanContent() {
  const { explain } = useFlowExplainer();
  const planExplainer = explain("planering");
  const { activeTasks, toggleTask, setTaskDueDate } = useTasks();
  const { currentFocus } = useFocus();
  const [energy, setEnergy] = useState<Energy>("medium");
  const [energyAuto, setEnergyAuto] = useState<{ level: number; loggedAt: string } | null>(null);
  const [energyManual, setEnergyManual] = useState(false);
  const [timeAvailable, setTimeAvailable] = useState<number>(120);
  const [storedPlan, setStoredPlan] = useLocalStorage<StoredPlan | null>("myflow-flowplan", null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const plan = storedPlan?.plan ?? null;
  const isSuggestion = (storedPlan?.status ?? "forslag") === "forslag";
  const setPlan = (p: FlowPlanResult | null) => {
    if (!p) {
      setStoredPlan(null);
      return;
    }
    setStoredPlan({
      plan: p,
      savedAt: new Date().toISOString(),
      date: new Date().toISOString().split("T")[0] as string,
      status: "forslag",
      customOrder: [],
    });
  };

  const run = useServerFn(planFlowSequence);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) return;
      const since = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();
      const { data } = await supabase
        .from("energy_logs")
        .select("level, logged_at")
        .eq("user_id", uid)
        .gte("logged_at", since)
        .order("logged_at", { ascending: false })
        .limit(1);
      if (!mounted || !data || data.length === 0) return;
      const latest = data[0];
      setEnergyAuto({ level: latest.level, loggedAt: latest.logged_at });
      setEnergy((prev) => (energyManual ? prev : levelToEnergy(latest.level)));
    })();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Deadline-info per uppgift: dagar kvar + om en påminnelse redan är aktiv. */
  const deadlineInfo = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const m = new Map<string, { daysUntilDue: number; hasReminder: boolean; activeNow: boolean }>();
    for (const t of activeTasks) {
      if (!t.dueDate) continue;
      const due = new Date(t.dueDate + "T00:00:00");
      const days = Math.round((due.getTime() - today.getTime()) / 86_400_000);
      const leads = t.deadlineLeadDays ?? [];
      const hasReminder = leads.length > 0;
      m.set(t.id, {
        daysUntilDue: days,
        hasReminder,
        activeNow: hasReminder && days <= Math.max(...leads, 0),
      });
    }
    return m;
  }, [activeTasks]);

  const taskById = useMemo(() => {
    const m = new Map<string, string>();
    for (const t of activeTasks) m.set(t.id, t.title);
    return m;
  }, [activeTasks]);

  const canPlan = activeTasks.length > 0 && !loading;

  const handlePlan = async () => {
    setError(null);
    setPlan(null);
    setLoading(true);
    try {
      const result = await run({
        data: {
          energy,
          focus: currentFocus?.text,
          timeAvailableMin: timeAvailable,
          tasks: [...activeTasks]
            // Se till att uppgifter med aktiv deadline-påminnelse alltid kommer med.
            .sort((a, b) => {
              const ia = deadlineInfo.get(a.id);
              const ib = deadlineInfo.get(b.id);
              const pa = ia?.activeNow ? 0 : ia ? 1 : 2;
              const pb = ib?.activeNow ? 0 : ib ? 1 : 2;
              if (pa !== pb) return pa - pb;
              return (ia?.daysUntilDue ?? 999) - (ib?.daysUntilDue ?? 999);
            })
            .slice(0, 15)
            .map((t) => {
              const info = deadlineInfo.get(t.id);
              return {
                id: t.id,
                title: t.title,
                dueDate: t.dueDate,
                daysUntilDue: info?.daysUntilDue,
                hasDeadlineReminder: info?.hasReminder,
                reminderActiveNow: info?.activeNow,
              };
            }),
        },
      });
      setPlan(result);
      track("plan_created", { source: "flowplan", result: "completed" });
      // Förankra planens uppgifter i dagens kalender så inget "försvinner".
      const today = new Date().toISOString().split("T")[0] as string;
      for (const item of result.plan) {
        const t = activeTasks.find((x) => x.id === item.taskId);
        if (t && !t.dueDate) setTaskDueDate(t.id, today);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Något gick fel.");
    } finally {
      setLoading(false);
    }
  };

  /** Flows föreslagna ordning (deadline först, sedan AI:ns ordning). */
  const suggestedOrder = useMemo(() => {
    if (!plan) return [] as string[];
    return [...plan.plan]
      .sort((a, b) => {
        const ba = item2Boost(a, deadlineInfo) ? 0 : 1;
        const bb = item2Boost(b, deadlineInfo) ? 0 : 1;
        if (ba !== bb) return ba - bb;
        return a.order - b.order;
      })
      .map((i) => i.taskId);
  }, [plan, deadlineInfo]);

  /** Din ordning om du ändrat något, annars Flows förslag. */
  const orderedItems = useMemo(() => {
    if (!plan) return [];
    const byId = new Map(plan.plan.map((i) => [i.taskId, i] as const));
    const custom = storedPlan?.customOrder ?? [];
    const ids = custom.length
      ? [
          ...custom.filter((id) => byId.has(id)),
          ...suggestedOrder.filter((id) => !custom.includes(id)),
        ]
      : suggestedOrder;
    return ids
      .map((id) => byId.get(id))
      .filter((item): item is FlowPlanResult["plan"][number] => item !== undefined);
  }, [plan, storedPlan?.customOrder, suggestedOrder]);

  const hasCustomOrder = (storedPlan?.customOrder ?? []).length > 0;

  /** Flytta en uppgift ett steg upp eller ner – din ordning sparas. */
  const move = (taskId: string, dir: -1 | 1) => {
    if (!storedPlan) return;
    const ids = orderedItems.map((i) => i.taskId);
    const from = ids.indexOf(taskId);
    const to = from + dir;
    if (from < 0 || to < 0 || to >= ids.length) return;
    const next = [...ids];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved as string);
    setStoredPlan({ ...storedPlan, customOrder: next });
  };

  const acceptPlan = () => {
    if (!storedPlan) return;
    setStoredPlan({ ...storedPlan, status: "min" });
  };

  const resetOrder = () => {
    if (!storedPlan) return;
    setStoredPlan({ ...storedPlan, customOrder: [] });
  };

  return (
    <MyFlovePageGrid area="planera">
      <MyFloveWide>
        <MyFloveHeader
          title="Planera"
          emojiKey="flowplan"
          description={`Här bestämmer du ordningen på dagen${planExplainer ? ` ${planExplainer}` : ""}`}
          why={
            <WhyHint label="planera">
              Planering kan hjälpa dig använda din energi på sådant som är viktigt för dig.
            </WhyHint>
          }
        />
      </MyFloveWide>

      <MyFloveBlock
        title="Hur ser dagen ut?"
        subtitle="Välj energi och tid – Flow ger ett förslag"
        eyebrow="Steg 1"
        icon={ListOrdered}
        tone="lavender"
        surface="lavender"
        area="planera"
        span
        collapsible
        collapseId="planering::steg-lage"
      >
        <div className="surface-card p-5 space-y-5">
          <div>
            <div className="flex items-center justify-between mb-2 gap-2">
              <label className="text-sm font-medium">Hur är energin just nu?</label>
              {energyAuto && !energyManual && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Battery size={12} className="text-primary" />
                  Från Energikarta ({LEVEL_LABELS[energyAuto.level]}, {timeAgo(energyAuto.loggedAt)}
                  )
                </span>
              )}
              {energyAuto && energyManual && (
                <button
                  type="button"
                  onClick={() => {
                    setEnergyManual(false);
                    setEnergy(levelToEnergy(energyAuto.level));
                  }}
                  className="text-xs text-primary hover:underline"
                >
                  Använd loggad energi
                </button>
              )}
              {!energyAuto && (
                <Link
                  to="/mitt-batteri"
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                  <Battery size={12} /> Logga energi
                </Link>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(ENERGY_LABELS) as Energy[]).map((e) => (
                <button
                  key={e}
                  onClick={() => {
                    setEnergy(e);
                    setEnergyManual(true);
                  }}
                  className={`px-3 py-3 rounded-2xl border text-sm text-left transition-colors ${
                    energy === e
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-background hover:bg-secondary"
                  }`}
                >
                  {ENERGY_LABELS[e]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 flex items-center gap-2">
              <Clock size={14} /> Ungefär hur mycket tid har du?
            </label>
            <div className="flex flex-wrap gap-2">
              {[30, 60, 120, 240, 480].map((m) => (
                <button
                  key={m}
                  onClick={() => setTimeAvailable(m)}
                  className={`px-4 py-2 rounded-full text-sm border transition-colors ${
                    timeAvailable === m
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-background hover:bg-secondary"
                  }`}
                >
                  {m < 60 ? `${m} min` : `${m / 60} h`}
                </button>
              ))}
            </div>
          </div>

          <div className="text-sm text-muted-foreground">
            {activeTasks.length === 0
              ? "Du har inga aktiva uppgifter just nu – lägg till några under Alla uppgifter först."
              : `${activeTasks.length} aktiv${activeTasks.length === 1 ? "" : "a"} uppgift${
                  activeTasks.length === 1 ? "" : "er"
                } tas med i planeringen.`}
          </div>

          {loading && (
            <MyFloveThinking
              steps={["📋", "⚡", "🎯", "✨"]}
              label="Jag lägger uppgifterna i en ordning som håller…"
            />
          )}

          <Button
            onClick={handlePlan}
            disabled={!canPlan}
            className="rounded-2xl h-11 px-5 bg-primary hover:bg-primary/90 text-primary-foreground w-full sm:w-auto"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Flow planerar…
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" /> Skapa min FlowPlan
              </>
            )}
          </Button>

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-2xl px-3 py-2">
              {error}
            </div>
          )}
        </div>
      </MyFloveBlock>

      {plan && (
        <MyFloveBlock
          title="Ändra ordningen"
          subtitle="Det här är bara ett förslag – flytta tills det känns rätt"
          eyebrow="Steg 2"
          icon={ListOrdered}
          tone="sky"
          surface="sky"
          area="planera"
          span
          collapsible
          collapseId="planering::steg-ordning"
        >
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-muted-foreground">
                {isSuggestion ? "Flows förslag" : "Din plan"}
                {" · "}
                {storedPlan?.date === new Date().toISOString().split("T")[0]
                  ? "idag"
                  : storedPlan?.date}
                {hasCustomOrder ? " · du har ändrat ordningen" : ""}
              </span>
              <div className="flex items-center gap-3">
                {hasCustomOrder && (
                  <button
                    onClick={resetOrder}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Tillbaka till Flows ordning
                  </button>
                )}
                <button
                  onClick={() => setPlan(null)}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                >
                  <RotateCcw size={12} /> Rensa
                </button>
              </div>
            </div>
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-2xl">
              <p className="text-sm leading-relaxed">{plan.intro}</p>
            </div>

            <div className="space-y-3">
              {orderedItems.map((item, idx) => {
                const title = taskById.get(item.taskId);
                if (!title) return null;
                const info = deadlineInfo.get(item.taskId);
                const boosted = item2Boost(item, deadlineInfo);
                return (
                  <div key={item.taskId} className="surface-card p-4 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 font-medium text-sm">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-3">
                        <p className="font-medium">{title}</p>
                        <span className="text-xs text-muted-foreground shrink-0">
                          ~{item.estimatedMin} min
                        </span>
                      </div>
                      {boosted && info && (
                        <p className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-medium text-primary bg-primary/10 border border-primary/20 rounded-full px-2.5 py-1">
                          <BellRing size={12} />
                          {info.daysUntilDue < 0
                            ? `Deadline passerad – prioriterad idag`
                            : info.daysUntilDue === 0
                              ? "Deadline idag – prioriterad först"
                              : `Deadline om ${info.daysUntilDue} dag${info.daysUntilDue === 1 ? "" : "ar"} – påminnelsen har gått igång`}
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground mt-1">{item.why}</p>
                      <button
                        onClick={() => toggleTask(item.taskId)}
                        className="text-xs text-primary hover:underline mt-2"
                      >
                        Markera som klar
                      </button>
                    </div>
                    <div className="flex flex-col gap-1 shrink-0">
                      <button
                        type="button"
                        aria-label={`Flytta upp: ${title}`}
                        onClick={() => move(item.taskId, -1)}
                        disabled={idx === 0}
                        className="w-8 h-8 rounded-full bg-secondary text-muted-foreground flex items-center justify-center hover:text-primary transition-colors disabled:opacity-30"
                      >
                        <ArrowUp size={15} />
                      </button>
                      <button
                        type="button"
                        aria-label={`Flytta ner: ${title}`}
                        onClick={() => move(item.taskId, 1)}
                        disabled={idx === orderedItems.length - 1}
                        className="w-8 h-8 rounded-full bg-secondary text-muted-foreground flex items-center justify-center hover:text-primary transition-colors disabled:opacity-30"
                      >
                        <ArrowDown size={15} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {isSuggestion && (
              <div className="surface-card p-4 space-y-3">
                <p className="text-sm text-muted-foreground">
                  Det här är bara ett förslag. Flytta upp och ner tills ordningen känns rätt – säg
                  sedan ja, eller be Flow föreslå på nytt.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={acceptPlan}
                    className="rounded-2xl h-10 px-4 bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    <Check className="mr-2 h-4 w-4" /> Ja, kör den här ordningen
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handlePlan}
                    disabled={!canPlan}
                    className="rounded-2xl h-10 px-4"
                  >
                    <Sparkles className="mr-2 h-4 w-4" /> Föreslå på nytt
                  </Button>
                </div>
              </div>
            )}

            <div className="p-4 bg-secondary/60 rounded-2xl text-sm text-muted-foreground leading-relaxed">
              {plan.note}
            </div>
          </div>
        </MyFloveBlock>
      )}
    </MyFlovePageGrid>
  );
}

/** Egen adress för planeringsläget – renderar den gemensamma Flow-vyn. */
export default function FlowPlanPage() {
  return <FlowView initialTab="planera" />;
}
