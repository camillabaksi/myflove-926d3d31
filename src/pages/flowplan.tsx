import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import Layout from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Loader2, ListOrdered, Sparkles, Clock, Battery, RotateCcw } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { planFlowSequence, type FlowPlanResult } from "@/lib/flowplan.functions";
import { useTasks, useFocus } from "@/hooks/use-data";
import { supabase } from "@/integrations/supabase/client";
import { useLocalStorage } from "@/lib/storage";

type StoredPlan = { plan: FlowPlanResult; savedAt: string; date: string };

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

export default function FlowPlanPage() {
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
  const setPlan = (p: FlowPlanResult | null) => {
    if (!p) {
      setStoredPlan(null);
      return;
    }
    setStoredPlan({
      plan: p,
      savedAt: new Date().toISOString(),
      date: new Date().toISOString().split("T")[0] as string,
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
          tasks: activeTasks.slice(0, 15).map((t) => ({
            id: t.id,
            title: t.title,
            dueDate: t.dueDate,
          })),
        },
      });
      setPlan(result);
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

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <ListOrdered size={20} />
            </div>
            <div>
              <h1 className="text-3xl font-bold leading-tight">FlowPlan</h1>
              <p className="text-sm text-muted-foreground">
                Sätt dagens fokus och låt Flow föreslå en ordning som passar dagen – inte en lista på allt du "borde" hinna.
              </p>
            </div>
          </div>
        </div>

        <DailyFocusCard />


        <div className="bg-card border border-border rounded-2xl p-5 space-y-5">
          <div>
            <div className="flex items-center justify-between mb-2 gap-2">
              <label className="text-sm font-medium">Hur är energin just nu?</label>
              {energyAuto && !energyManual && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Battery size={12} className="text-primary" />
                  Från Energikarta ({LEVEL_LABELS[energyAuto.level]}, {timeAgo(energyAuto.loggedAt)})
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
                <Link to="/ma-bra" className="text-xs text-primary hover:underline flex items-center gap-1">
                  <Battery size={12} /> Logga energi
                </Link>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {(Object.keys(ENERGY_LABELS) as Energy[]).map((e) => (
                <button
                  key={e}
                  onClick={() => {
                    setEnergy(e);
                    setEnergyManual(true);
                  }}
                  className={`px-3 py-3 rounded-xl border text-sm text-left transition-colors ${
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
              ? "Du har inga aktiva uppgifter just nu – lägg till några under Att göra först."
              : `${activeTasks.length} aktiv${activeTasks.length === 1 ? "" : "a"} uppgift${
                  activeTasks.length === 1 ? "" : "er"
                } tas med i planeringen.`}
          </div>

          <Button
            onClick={handlePlan}
            disabled={!canPlan}
            className="rounded-xl h-11 px-5 bg-primary hover:bg-primary/90 text-white w-full sm:w-auto"
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
            <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-xl px-3 py-2">
              {error}
            </div>
          )}
        </div>

        {plan && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-muted-foreground">
                {storedPlan?.date === new Date().toISOString().split("T")[0]
                  ? "Sparad plan för idag"
                  : `Sparad plan från ${storedPlan?.date}`}
              </span>
              <button
                onClick={() => setPlan(null)}
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                <RotateCcw size={12} /> Rensa
              </button>
            </div>
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-2xl">
              <p className="text-sm leading-relaxed">{plan.intro}</p>
            </div>

            <div className="space-y-3">
              {plan.plan
                .sort((a, b) => a.order - b.order)
                .map((item) => {
                  const title = taskById.get(item.taskId);
                  if (!title) return null;
                  return (
                    <div
                      key={item.taskId}
                      className="bg-card border border-border rounded-2xl p-4 flex items-start gap-4"
                    >
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 font-medium text-sm">
                        {item.order}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between gap-3">
                          <p className="font-medium">{title}</p>
                          <span className="text-xs text-muted-foreground shrink-0">
                            ~{item.estimatedMin} min
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{item.why}</p>
                        <button
                          onClick={() => toggleTask(item.taskId)}
                          className="text-xs text-primary hover:underline mt-2"
                        >
                          Markera som klar
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>

            <div className="p-4 bg-secondary/60 rounded-2xl text-sm text-muted-foreground leading-relaxed">
              {plan.note}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
