import { useEffect, useMemo, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { ArrowLeft, Brain, Check, ChevronRight, Home, Info, Plus, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { useSmartBack } from "@/hooks/use-smart-back";
import Layout from "@/components/layout";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useTasks } from "@/hooks/use-data";
import { useFlowScore } from "@/hooks/use-flowscore";
import { useInsightStrategies } from "@/hooks/use-insight";
import { useCloudSyncedStorage } from "@/lib/cloud-storage";
import {
  AREA_BY_ID,
  CONTEXTS,
  DEMO_PROFILES,
  INSIGHT_AREAS,
  matchAreasFromNeeds,
  strategiesForArea,
  type DemoProfile,
  type InsightAreaId,
  type InsightContext,
  type InsightStrategy,
  type StrategyNudge,
} from "@/lib/insight";
import { buildPersonalInsight, INSIGHT_EXAMPLES } from "@/lib/insight-personal";
import { useFlowLearning } from "@/hooks/use-flow-learning";
import { useEverydayPatterns } from "@/hooks/use-everyday-patterns";
import { useVisitStreak } from "@/hooks/use-visit-streak";
import { useIsAdmin } from "@/hooks/use-is-admin";
import { track } from "@/lib/analytics";
import CollapsibleSection from "@/components/collapsible-section";
import InsightApplySetting from "@/components/insight-apply-setting";
import { MyFloveInsightGather } from "@/components/myflove/motion";
import WhyHint from "@/components/why-hint";
import BatteryLoadTrend from "@/components/battery-load-trend";

const ANALYSIS_STEPS = [
  "Identifierar styrkor",
  "Identifierar områden som kan kräva stöd",
  "Matchar möjliga strategier",
  "Förbereder MyFlow-förslag",
];

function AnalysisView({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (step >= ANALYSIS_STEPS.length) {
      const t = setTimeout(onDone, 500);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setStep((s) => s + 1), 700);
    return () => clearTimeout(t);
  }, [step, onDone]);

  return (
    <div className="p-6 rounded-3xl bg-card border border-border space-y-4">
      <p className="text-lg font-medium flex items-center gap-2">
        <Sparkles size={18} className="text-primary animate-pulse" /> Analyserar underlaget…
      </p>
      <ul className="space-y-3">
        {ANALYSIS_STEPS.map((label, i) => (
          <li
            key={label}
            className={`flex items-center gap-3 transition-opacity ${i < step ? "opacity-100" : "opacity-40"}`}
          >
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center ${
                i < step ? "bg-primary text-primary-foreground" : "bg-secondary"
              }`}
            >
              {i < step ? (
                <Check size={14} />
              ) : (
                <span className="w-2 h-2 rounded-full bg-muted-foreground/50" />
              )}
            </span>
            <span>{label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

interface AddFlowState {
  strategy: InsightStrategy;
  nudges: StrategyNudge[];
  anchor: string;
}

/** Behovsområden med strategiförslag – används både i den personliga vyn och i demoläget. */
function AreaStrategies({
  areas,
  openArea,
  setOpenArea,
  hasStrategy,
  maxFriction,
  onAdd,
}: {
  areas: InsightAreaId[];
  openArea: InsightAreaId | null;
  setOpenArea: (id: InsightAreaId | null) => void;
  hasStrategy: (id: string) => boolean;
  maxFriction: number;
  onAdd: (s: InsightStrategy) => void;
}) {
  return (
    <div className="space-y-3">
      {INSIGHT_AREAS.filter((a) => areas.includes(a.id)).map((area) => {
        const isOpen = openArea === area.id;
        return (
          <div key={area.id} className="rounded-3xl bg-card border border-border overflow-hidden">
            <button
              onClick={() => setOpenArea(isOpen ? null : area.id)}
              className="w-full p-5 flex items-center gap-4 text-left"
              aria-expanded={isOpen}
            >
              <span className="text-2xl" aria-hidden>
                {area.emoji}
              </span>
              <span className="flex-1">
                <span className="block font-medium">{area.label}</span>
                {!isOpen && (
                  <span className="block text-sm text-muted-foreground">{area.intro}</span>
                )}
              </span>
              <ChevronRight
                size={18}
                className={`text-muted-foreground transition-transform ${isOpen ? "rotate-90" : ""}`}
              />
            </button>

            {isOpen && (
              <div className="px-5 pb-5 space-y-3">
                <p className="text-sm text-muted-foreground">{area.intro}</p>
                <p className="font-medium text-sm">Exempel på strategier</p>
                {strategiesForArea(area.id).map((s) => {
                  const added = hasStrategy(s.id);
                  const fitsNow = s.friction <= maxFriction;
                  return (
                    <div
                      key={s.id}
                      className="p-4 rounded-2xl bg-secondary/40 border border-border space-y-2"
                    >
                      <p className="font-medium">{s.title}</p>
                      <p className="text-sm text-muted-foreground">{s.why}</p>
                      <p className="text-xs text-muted-foreground">
                        Svårighetsgrad {s.friction}/10 · ca {s.minutes} min
                        {fitsNow ? " · Det här verkar vara en bra uppgift att göra nu." : ""}
                      </p>
                      <Button
                        size="sm"
                        variant={added ? "secondary" : "default"}
                        className="rounded-full"
                        disabled={added}
                        onClick={() => onAdd(s)}
                      >
                        {added ? (
                          <>
                            <Check size={14} /> Tillagd i MyFlow
                          </>
                        ) : (
                          <>
                            <Plus size={14} /> Lägg till i MyFlow
                          </>
                        )}
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function InsightPage() {
  const [seenIntro, setSeenIntro] = useCloudSyncedStorage<boolean>("myflove-insight-intro", false);
  const [introOpen, setIntroOpen] = useState(!seenIntro);
  const [profile, setProfile] = useState<DemoProfile | null>(null);
  const [customNeeds, setCustomNeeds] = useState("");
  const [customName, setCustomName] = useState("");
  const [phase, setPhase] = useState<"start" | "analys" | "resultat">("start");
  const [openArea, setOpenArea] = useState<InsightAreaId | null>(null);
  const [addFlow, setAddFlow] = useState<AddFlowState | null>(null);
  const [contexts, setContexts] = useState<InsightContext[]>(["vardag"]);

  const { addTask, completedTasks } = useTasks();
  const { flow } = useFlowScore();
  const { saved, addStrategy, removeStrategy, hasStrategy } = useInsightStrategies();

  // Demoläge är en adminfunktion och kräver både explicit URL-flagga och
  // servervaliderad admin-roll. Vanliga användare kan aldrig öppna testprofiler.
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const requestedDemoMode = useRouterState({
    select: (s) => (s.location.search as Record<string, unknown> | undefined)?.["demo"] === "1",
  });
  const demoMode = requestedDemoMode && isAdmin && !adminLoading;

  const knowledge = useFlowLearning();
  const { totalDays } = useVisitStreak();
  const [energyLog] = useCloudSyncedStorage<unknown[]>("myflove-energy-log", []);
  const patterns = useEverydayPatterns();

  const personal = useMemo(
    () =>
      buildPersonalInsight(knowledge, {
        activeDays: totalDays,
        completedCount: completedTasks.length,
        energyCount: energyLog?.length ?? 0,
      }),
    [knowledge, totalDays, completedTasks.length, energyLog],
  );

  useEffect(() => {
    if (demoMode) track("insight_demo_opened", { source: "insight" });
    else track("insight_viewed", { result: personal.ready ? "completed" : "cancelled" });
    // Bara vy och beredskapsläge – aldrig några råvärden om användaren.
  }, [demoMode, personal.ready]);

  const areas = useMemo<InsightAreaId[]>(() => {
    if (profile) return profile.areas;
    if (customNeeds.trim()) return matchAreasFromNeeds(customNeeds.split("\n"));
    return [];
  }, [profile, customNeeds]);

  const startAnalysis = (p: DemoProfile | null) => {
    setProfile(p);
    setOpenArea(null);
    setPhase("analys");
  };

  const openAdd = (s: InsightStrategy) => {
    const anchor = "08:30";
    setContexts(["vardag"]);
    setAddFlow({ strategy: s, anchor, nudges: s.makeNudges ? s.makeNudges(anchor) : [] });
  };

  const confirmAdd = (withNudges: boolean) => {
    if (!addFlow) return;
    const { strategy, nudges } = addFlow;
    addStrategy({
      strategyId: strategy.id,
      title: strategy.title,
      areaId: strategy.areaId,
      contexts,
      friction: strategy.friction,
      minutes: strategy.minutes,
      nudges: withNudges ? nudges : [],
      profileId: profile?.id,
    });
    // Koppling till MyFlow: strategin blir en uppgift (och ev. påminnelser).
    addTask(strategy.title, undefined, {
      kind: "uppgift",
      steps: withNudges ? nudges.map((n) => `${n.when} – ${n.text}`) : [],
      ...(withNudges && nudges[0] ? { time: nudges[0].when, reminderMinutesBefore: 0 } : {}),
    });
    setAddFlow(null);
    toast.success("Tillagd i MyFlow 💙", {
      description: withNudges
        ? "Påminnelserna ligger som steg på uppgiften – du kan ändra dem när du vill."
        : "Du kan lägga till påminnelser senare.",
    });
  };

  const goBack = useSmartBack("/hem");

  const toggleContext = (c: InsightContext) =>
    setContexts((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));

  return (
    <Layout>
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6 pb-28 page-enter">
        <header
          className="rounded-3xl border-2 border-border/60 p-5 shadow-soft"
          style={{
            backgroundImage:
              "linear-gradient(135deg, hsl(var(--lavender)) 0%, hsl(var(--cream)) 60%, hsl(var(--mint) / 0.8) 100%)",
          }}
        >
          <div className="flex items-start gap-3">
            <button
              type="button"
              onClick={goBack}
              aria-label="Tillbaka"
              className="press mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-pill bg-card/70 text-ink"
            >
              <ArrowLeft size={18} strokeWidth={2.2} />
            </button>
            <MyFloveInsightGather emoji="🧠" />
            <div className="min-w-0 flex-1">
              <h1 className="font-display text-2xl font-bold text-ink">MyFlove Insight</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Förstå behov. Hitta strategier. Gör vardagen enklare.
              </p>
              <div className="mt-2">
                <WhyHint label="insikter">
                  När du loggar över tid kan Flow hjälpa dig upptäcka vad som brukar ge eller ta
                  energi.
                </WhyHint>
              </div>
            </div>
            <Link
              to="/hem"
              aria-label="Till hem"
              className="press mt-0.5 inline-flex h-9 shrink-0 items-center gap-1 rounded-pill bg-card/70 px-3 text-xs font-medium text-ink"
            >
              <Home size={14} /> Hem
            </Link>
          </div>
        </header>

        {!demoMode && (
          <section data-testid="insight-personal" className="space-y-5">
            <div className="p-5 rounded-3xl bg-card border border-border space-y-3">
              <p className="font-medium">Vad Flow lärt sig om dig</p>
              <p className="text-sm text-muted-foreground">{personal.label}</p>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-700"
                  style={{ width: `${Math.max(6, personal.level)}%` }}
                />
              </div>
            </div>

            <BatteryLoadTrend />

            {patterns.ready && (
              <CollapsibleSection
                id="insight-everyday-patterns"
                title="Din vardag"
                description="Det här har MyFlove lärt sig av dina egna dagar"
                data-testid="insight-everyday-patterns"
                className="rounded-3xl border border-border bg-card p-5"
                headingClassName="font-semibold"
              >
                <ul className="mt-3 space-y-2">
                  {patterns.lines.map((line) => (
                    <li key={line} className="flex items-start gap-2 text-sm text-ink">
                      <Sparkles size={14} className="mt-0.5 shrink-0 text-primary" aria-hidden />
                      <span className="min-w-0">{line}</span>
                    </li>
                  ))}
                </ul>
              </CollapsibleSection>
            )}

            {personal.ready ? (
              <>
                <ul data-testid="insight-personal-list" className="space-y-3">
                  {personal.insights.map((i) => (
                    <li
                      key={i.id}
                      className="p-4 rounded-2xl bg-secondary/40 border border-border leading-relaxed"
                    >
                      {i.text}
                    </li>
                  ))}
                </ul>

                {personal.areas.length > 0 && (
                  <>
                    <p className="leading-relaxed">
                      Utifrån det här kan de här områdena vara relevanta för dig just nu.
                    </p>
                    <AreaStrategies
                      areas={personal.areas}
                      openArea={openArea}
                      setOpenArea={setOpenArea}
                      hasStrategy={hasStrategy}
                      maxFriction={flow.maxFriction}
                      onAdd={openAdd}
                    />
                  </>
                )}
              </>
            ) : (
              <div
                data-testid="insight-empty"
                className="p-5 rounded-3xl bg-card border border-border space-y-3"
              >
                <p className="leading-relaxed">
                  Jag har inte lärt känna dig tillräckligt ännu. Använd MyFlove några dagar så
                  börjar mönstren synas – jag hittar inte på något innan dess. 💜
                </p>
                <p className="text-sm font-medium">Exempel på vad som kan komma längre fram</p>
                <ul className="space-y-1.5 text-sm text-muted-foreground">
                  {INSIGHT_EXAMPLES.map((e) => (
                    <li key={e}>· {e}</li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}

        {demoMode && phase === "start" && (
          <>
            <div className="p-5 rounded-3xl bg-amber-500/10 border border-border">
              <p className="text-sm leading-relaxed">
                <strong>Demoläge.</strong> Här visas fiktiva testprofiler – inget av detta är din
                egen data.
              </p>
            </div>

            <div className="p-5 rounded-3xl bg-card border border-border">
              <p className="leading-relaxed">
                Insight hjälper dig att omvandla information om behov och styrkor till konkreta
                strategier i vardagen.
              </p>
            </div>

            <CollapsibleSection title="Prova med en exempelprofil" headingClassName="font-semibold">
              {DEMO_PROFILES.map((p) => (
                <button
                  key={p.id}
                  onClick={() => startAnalysis(p)}
                  className="w-full text-left p-5 rounded-3xl bg-card border border-border hover:shadow-lifted transition-all active:scale-[0.99] flex items-center gap-4"
                >
                  <span className="text-2xl" aria-hidden>
                    {p.emoji}
                  </span>
                  <span className="flex-1">
                    <span className="block font-medium">
                      {p.name}, {p.age}
                    </span>
                    <span className="block text-sm text-muted-foreground">
                      {p.needs.slice(0, 2).join(" · ")}
                    </span>
                  </span>
                  <ChevronRight size={18} className="text-muted-foreground" />
                </button>
              ))}
            </CollapsibleSection>

            <CollapsibleSection
              title="Skapa en egen testprofil"
              headingClassName="font-semibold"
              className="p-5 rounded-3xl bg-card border border-border"
              description="Skriv fiktiva exempel – ett behov per rad. Inga riktiga uppgifter."
            >
              <input
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="Fiktivt namn, t.ex. Kim"
                className="w-full h-12 px-4 rounded-2xl border border-border bg-background"
              />
              <textarea
                value={customNeeds}
                onChange={(e) => setCustomNeeds(e.target.value)}
                rows={4}
                placeholder={"svårt med övergångar\ntidsuppfattning"}
                className="w-full p-4 rounded-2xl border border-border bg-background"
              />
              <Button
                className="w-full h-12 rounded-2xl"
                disabled={!customNeeds.trim()}
                onClick={() => startAnalysis(null)}
              >
                Analysera testprofilen
              </Button>
            </CollapsibleSection>
          </>
        )}

        {demoMode && phase === "analys" && <AnalysisView onDone={() => setPhase("resultat")} />}

        {demoMode && phase === "resultat" && (
          <div className="space-y-5">
            <div className="p-5 rounded-3xl bg-card border border-border space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">
                    {profile
                      ? `${profile.name}, ${profile.age}`
                      : customName.trim() || "Egen testprofil"}
                  </p>
                  <p className="text-sm text-muted-foreground">Fiktivt underlag (demo)</p>
                </div>
                <button
                  onClick={() => setPhase("start")}
                  className="text-sm underline text-muted-foreground"
                >
                  Byt profil
                </button>
              </div>
              {profile && (
                <>
                  <p className="text-sm leading-relaxed text-muted-foreground">{profile.report}</p>
                  <p className="text-sm">
                    <strong>Styrkor:</strong> {profile.strengths.join(", ")}
                  </p>
                </>
              )}
            </div>

            <p className="leading-relaxed">
              Jag har hittat några områden som kan vara relevanta att ta hänsyn till.
            </p>

            <AreaStrategies
              areas={areas}
              openArea={openArea}
              setOpenArea={setOpenArea}
              hasStrategy={hasStrategy}
              maxFriction={flow.maxFriction}
              onAdd={openAdd}
            />
          </div>
        )}

        <p className="text-center text-sm">
          {demoMode ? (
            <Link
              to="/insight"
              search={{ demo: undefined }}
              data-testid="insight-leave-demo"
              className="underline text-muted-foreground"
            >
              Tillbaka till mina egna insikter
            </Link>
          ) : isAdmin && !adminLoading ? (
            <Link
              to="/insight"
              search={{ demo: "1" }}
              data-testid="insight-open-demo"
              className="underline text-muted-foreground"
            >
              Öppna demoläge med fiktiva testprofiler
            </Link>
          ) : null}
        </p>

        {saved.length > 0 && (
          <CollapsibleSection
            id="valda-strategier"
            title={
              <span className="flex items-center gap-2">
                <Brain size={18} className="text-primary" /> Dina valda strategier
              </span>
            }
            headingClassName="font-semibold"
          >
            {saved.map((s) => (
              <div
                key={s.id}
                className="p-4 rounded-2xl bg-card border border-border flex items-start gap-3"
              >
                <span className="text-xl" aria-hidden>
                  {AREA_BY_ID[s.areaId]?.emoji}
                </span>
                <div className="flex-1">
                  <p className="font-medium">{s.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {s.contexts
                      .map((c) => CONTEXTS.find((x) => x.id === c))
                      .filter(Boolean)
                      .map((c) => `${c!.emoji} ${c!.label}`)
                      .join(" · ")}
                  </p>
                  {s.nudges.length > 0 && (
                    <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                      {s.nudges.map((n, i) => (
                        <li key={i}>
                          {n.when} – {n.text}
                        </li>
                      ))}
                    </ul>
                  )}
                  <InsightApplySetting strategyId={s.strategyId} />
                </div>
                <button
                  onClick={() => removeStrategy(s.id)}
                  aria-label="Ta bort strategi"
                  className="p-2 text-muted-foreground hover:text-destructive"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </CollapsibleSection>
        )}

        {/* Var vill du använda den? + konkret förslag att acceptera, ändra eller avvisa */}
        <Dialog open={!!addFlow} onOpenChange={(o) => !o && setAddFlow(null)}>
          <DialogContent className="max-w-lg rounded-3xl">
            <DialogHeader>
              <DialogTitle className="text-xl">Var vill du använda den?</DialogTitle>
              <DialogDescription>{addFlow?.strategy.title}</DialogDescription>
            </DialogHeader>

            <div className="flex flex-wrap gap-2">
              {CONTEXTS.map((c) => (
                <button
                  key={c.id}
                  onClick={() => toggleContext(c.id)}
                  className={`px-4 py-2 rounded-full border text-sm ${
                    contexts.includes(c.id)
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background border-border"
                  }`}
                >
                  {c.emoji} {c.label}
                </button>
              ))}
            </div>

            {addFlow && addFlow.nudges.length > 0 && (
              <div className="space-y-3 p-4 rounded-2xl bg-secondary/40 border border-border">
                <p className="text-sm">
                  Ett möjligt upplägg om något börjar{" "}
                  <input
                    type="time"
                    value={addFlow.anchor}
                    onChange={(e) => {
                      const anchor = e.target.value || "08:30";
                      setAddFlow((prev) =>
                        prev
                          ? {
                              ...prev,
                              anchor,
                              nudges: prev.strategy.makeNudges?.(anchor) ?? prev.nudges,
                            }
                          : prev,
                      );
                    }}
                    className="px-2 py-1 rounded-lg border border-border bg-background"
                  />
                </p>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {addFlow.nudges.map((n, i) => (
                    <li key={i}>
                      → {n.when}: "{n.text}"
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="space-y-2">
              {addFlow && addFlow.nudges.length > 0 && (
                <Button className="w-full h-12 rounded-2xl" onClick={() => confirmAdd(true)}>
                  Ja, lägg till med påminnelserna
                </Button>
              )}
              <Button
                variant="secondary"
                className="w-full h-12 rounded-2xl"
                onClick={() => confirmAdd(false)}
              >
                Lägg till utan påminnelser
              </Button>
              <Button
                variant="ghost"
                className="w-full h-11 rounded-2xl"
                onClick={() => setAddFlow(null)}
              >
                Inte nu
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Första gången: tydlig prototypinformation */}
        <Dialog
          open={demoMode && introOpen}
          onOpenChange={(o) => {
            setIntroOpen(o);
            if (!o) setSeenIntro(true);
          }}
        >
          <DialogContent className="max-w-md rounded-3xl">
            <DialogHeader>
              <DialogTitle className="text-xl flex items-center gap-2">
                <Info size={18} className="text-primary" /> Detta är en prototyp
              </DialogTitle>
              <DialogDescription className="leading-relaxed">
                Använd endast fiktiva exempel. Ladda inte upp riktiga NPF-utredningar, journaler
                eller andra dokument som innehåller personuppgifter. Insight ställer inga diagnoser
                och ersätter inte vård eller professionell bedömning.
              </DialogDescription>
            </DialogHeader>
            <Button
              className="w-full h-12 rounded-2xl"
              onClick={() => {
                setSeenIntro(true);
                setIntroOpen(false);
              }}
            >
              Jag förstår
            </Button>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
