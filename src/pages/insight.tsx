import { useEffect, useMemo, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { ArrowLeft, Check, ChevronRight, Home, Info, Plus, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { useSmartBack } from "@/hooks/use-smart-back";
import Layout from "@/components/layout";

import { Button } from "@/components/ui/button";
import { PaceContent, PacePage, PacePageTitle, PaceButton } from "@/components/paceable/design-system";
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
import { optionalSupportForInsight } from "@/lib/insight-optional-support";
import { prioritizedInsights, insightEvidenceLabel } from "@/lib/insight-priority";
import { useFlowLearning } from "@/hooks/use-flow-learning";
import { useEverydayPatterns } from "@/hooks/use-everyday-patterns";
import { useVisitStreak } from "@/hooks/use-visit-streak";
import { useIsAdmin } from "@/hooks/use-is-admin";
import { track } from "@/lib/analytics";
import CollapsibleSection from "@/components/collapsible-section";
import InsightApplySetting from "@/components/insight-apply-setting";
import WhyHint from "@/components/why-hint";
import { mergedInsightPatterns } from "@/lib/insight-merged-patterns";
import { personalSavedStrategies } from "@/lib/saved-strategy-planning";
import EnergyMoodTrend from "@/components/energy-mood-trend";
import HelpsDrainsCard from "@/components/helps-drains-card";

const ANALYSIS_STEPS = [
  "Identifierar styrkor",
  "Identifierar områden som kan kräva stöd",
  "Matchar möjliga strategier",
  "Förbereder Paceable-förslag",
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
          <div key={area.id} className="@container min-w-0 overflow-hidden rounded-3xl border border-border bg-card">
            <button
              onClick={() => setOpenArea(isOpen ? null : area.id)}
              className="flex w-full min-w-0 flex-wrap items-center gap-[12px] p-[16px] text-left @[22rem]:flex-nowrap @[22rem]:gap-[16px] @[22rem]:p-[20px]"
              aria-expanded={isOpen}
            >
              <span className="shrink-0 text-2xl" aria-hidden>
                {area.emoji}
              </span>
              <span className="order-3 min-w-0 basis-full @[22rem]:order-none @[22rem]:flex-1 @[22rem]:basis-auto">
                <span className="block font-medium">{area.label}</span>
                {!isOpen && (
                  <span className="block text-sm text-muted-foreground">{area.intro}</span>
                )}
              </span>
              <ChevronRight
                size={18}
                className={`order-2 ml-auto shrink-0 text-muted-foreground transition-transform @[22rem]:order-none ${isOpen ? "rotate-90" : ""}`}
              />
            </button>

            {isOpen && (
              <div className="space-y-3 px-[16px] pb-[16px] sm:px-[20px] sm:pb-[20px]">
                <p className="text-sm text-muted-foreground">{area.intro}</p>
                <p className="font-medium text-sm">Exempel på strategier</p>
                {strategiesForArea(area.id).map((s) => {
                  const added = hasStrategy(s.id);
                  const fitsNow = s.friction <= maxFriction;
                  return (
                    <div
                      key={s.id}
                      className="space-y-2 rounded-2xl border border-border bg-secondary/40 p-[12px] sm:p-[16px]"
                    >
                      <p className="font-medium">{s.title}</p>
                      <p className="text-sm text-muted-foreground">{s.why}</p>
                      <p className="text-xs text-muted-foreground">
                        Svårighetsgrad {s.friction}/10 · ca {s.minutes} min
                        {fitsNow ? " · Ett litet steg att överväga." : ""}
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
                            <Check size={14} /> Sparat stöd
                          </>
                        ) : (
                          <>
                            <Plus size={14} /> Välj hur du vill använda
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
  const [showFeaturedSupport, setShowFeaturedSupport] = useState(false);
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
  const insightsByEvidence = useMemo(() => prioritizedInsights(personal.insights), [personal.insights]);
  const featuredInsight = insightsByEvidence[0];
  const personalSaved = useMemo(() => personalSavedStrategies(saved), [saved]);
  const hasPersonalStrategy = (id: string) => personalSaved.some((entry) => entry.strategyId === id);
  const mergedPatterns = useMemo(
    () => mergedInsightPatterns(insightsByEvidence.slice(1), patterns, insightEvidenceLabel),
    [insightsByEvidence, patterns],
  );
  const featuredSupport = useMemo(
    () => optionalSupportForInsight(featuredInsight, flow.maxFriction),
    [featuredInsight, flow.maxFriction],
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

  const saveSupportOnly = () => {
    if (!addFlow) return;
    const { strategy } = addFlow;
    addStrategy({
      strategyId: strategy.id,
      title: strategy.title,
      areaId: strategy.areaId,
      contexts,
      friction: strategy.friction,
      minutes: strategy.minutes,
      nudges: [],
      profileId: profile?.id,
      source: demoMode ? "demo" : "personal",
    });
    setAddFlow(null);
    setShowFeaturedSupport(false);
    toast.success("Sparat bland dina frivilliga stöd.", {
      description: "Inget har lagts in som uppgift eller påminnelse. Du hittar stödet under Idag och Planera.",
    });
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
      source: demoMode ? "demo" : "personal",
    });
    // Koppling till MyFlow: strategin blir en uppgift (och ev. påminnelser).
    addTask(strategy.title, undefined, {
      kind: "uppgift",
      steps: withNudges ? nudges.map((n) => `${n.when} – ${n.text}`) : [],
      ...(withNudges && nudges[0] ? { time: nudges[0].when, reminderMinutesBefore: 0 } : {}),
    });
    setAddFlow(null);
    toast.success("Tillagd som uppgift 💙", {
      description: withNudges
        ? "Påminnelserna ligger som steg på uppgiften – du kan ändra dem när du vill."
        : "Du kan lägga till påminnelser senare.",
    });
  };

  const goBack = useSmartBack("/idag");

  const toggleContext = (c: InsightContext) =>
    setContexts((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));

  return (
    <Layout>
      <PacePage className="pace-compact-page page-enter px-[16px]! pb-28 sm:px-[24px]! lg:px-[32px]!">
        <PaceContent width="list" className="@container pace-compact-stack">
        <header className="min-w-0 space-y-4" data-testid="insight-header">
          <div className="grid grid-cols-[44px_minmax(0,1fr)] items-center gap-[8px] sm:flex sm:justify-between">
            <PaceButton
              type="button"
              variant="ghost"
              size="icon"
              onClick={goBack}
              aria-label="Tillbaka"
              className="min-w-[44px] w-[44px] shrink-0 rounded-full text-foreground"
            >
              <ArrowLeft size={18} strokeWidth={2.2} />
            </PaceButton>
            <PaceButton asChild variant="ghost" className="min-w-[44px] justify-self-end gap-1 rounded-full px-2 text-foreground">
              <Link to="/idag" aria-label="Till Idag">
                <Home size={14} /> Idag
              </Link>
            </PaceButton>
          </div>
          <div className="min-w-0 space-y-2">
              <PacePageTitle className="text-[var(--pace-primary)] dark:text-foreground">
                Insikter
              </PacePageTitle>
              <p className="font-sans text-sm leading-relaxed text-muted-foreground">
                Se dina egna mönster och hitta ett litet nästa steg.
              </p>

              <div className="mt-2 [&_[role=region]]:max-w-full">
                <WhyHint label="insikter">
                  När du loggar över tid kan Pace hjälpa dig upptäcka vad som brukar ge eller ta
                  energi.
                </WhyHint>
              </div>
          </div>
        </header>

        {!demoMode && (
          <section data-testid="insight-personal" className="min-w-0 space-y-4">
            {/* The first screen should answer "what did I learn?" – not score the user. */}
            <div className="min-w-0 rounded-3xl border border-border bg-card p-4 @[22rem]:p-5" data-testid="insight-observations">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Det här har vi lagt märke till</p>
              {personal.ready && featuredInsight ? (
                <div className="mt-3 space-y-2">
                  <p className="text-xs text-muted-foreground" data-testid="insight-evidence">
                    {insightEvidenceLabel(featuredInsight.confidence)}
                  </p>
                  <p className="text-base leading-relaxed text-ink" data-testid="insight-featured">{featuredInsight.text}</p>
                  <p className="text-xs leading-relaxed text-muted-foreground">En observation utifrån dina registreringar – inte en regel om hur du fungerar.</p>
                  {featuredSupport && (
                    <div className="pt-2" data-testid="insight-featured-support">
                      {hasPersonalStrategy(featuredSupport.id) ? (
                        <p className="rounded-xl bg-secondary/40 px-3 py-2 text-sm text-muted-foreground">
                          Du har redan sparat det här stödet. Du hittar det under Mina stöd i Utforska mer.
                        </p>
                      ) : (
                        <>
                          <button
                            type="button"
                            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-primary/25 bg-secondary/30 px-4 text-sm font-medium text-primary hover:bg-secondary/50"
                            aria-expanded={showFeaturedSupport}
                            aria-controls="insight-featured-support-preview"
                            onClick={() => setShowFeaturedSupport(open => !open)}
                          >
                            <Sparkles size={16} aria-hidden />
                            {showFeaturedSupport ? "Dölj det lilla steget" : "Visa ett litet steg att prova"}
                          </button>
                          {showFeaturedSupport && (
                            <div id="insight-featured-support-preview" className="mt-3 space-y-3 rounded-2xl border border-border bg-secondary/30 p-3" data-testid="insight-support-preview">
                              <p className="text-xs font-medium text-muted-foreground">Ett möjligt stöd – bara om det passar dig</p>
                              <p className="text-sm font-semibold text-ink">{featuredSupport.title}</p>
                              <p className="text-sm leading-relaxed text-muted-foreground">{featuredSupport.why}</p>
                              <p className="text-xs text-muted-foreground">Ungefär {featuredSupport.minutes} minuter. Inget läggs till förrän du väljer det.</p>
                              <div className="flex flex-wrap items-center gap-2">
                                <Button type="button" className="min-h-11 rounded-xl" onClick={() => openAdd(featuredSupport)}>
                                  <Plus size={16} aria-hidden /> Välj hur du vill använda det
                                </Button>
                                <Button type="button" variant="ghost" className="min-h-11 rounded-xl" onClick={() => setShowFeaturedSupport(false)}>
                                  Inte nu
                                </Button>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div data-testid="insight-empty" className="mt-3 space-y-2">
                  <p className="text-sm leading-relaxed text-foreground">
                    Här samlar vi försiktiga observationer när det finns tillräckligt med underlag.
                    Du behöver inte registrera mer än du själv vill.
                  </p>
                  <details className="text-sm text-muted-foreground">
                    <summary className="min-h-11 cursor-pointer py-3 font-medium text-primary">Exempel på vad du kan få syn på</summary>
                    <ul className="space-y-1.5 pb-2">
                      {INSIGHT_EXAMPLES.map((example) => <li key={example}>· {example}</li>)}
                    </ul>
                  </details>
                </div>
              )}
            </div>

            <HelpsDrainsCard />

            <CollapsibleSection
              id="insight-deeper"
              title="Utforska mer"
              description="Mina mönster, mina stöd och valfri fördjupning"
              defaultCollapsed
              className="min-w-0 rounded-3xl border border-border/70 bg-card p-4 @[22rem]:p-5"
              headingClassName="text-base font-semibold"
            >
              <div className="space-y-3" data-testid="insight-deeper-content">
                {mergedPatterns.length > 0 && (
                  <CollapsibleSection
                    id="insight-merged-patterns"
                    title="Mina mönster"
                    description="Egna observationer och mönster i din planering"
                    defaultCollapsed
                    className="min-w-0 rounded-2xl bg-secondary/25 px-3 py-2.5"
                    headingClassName="text-base font-semibold"
                  >
                    <ul data-testid="insight-personal-list" className="space-y-2">
                      {mergedPatterns.map((item) => (
                        <li key={item.id} className="space-y-1 rounded-xl bg-card/70 p-3">
                          <p className="text-xs text-muted-foreground">{item.context}</p>
                          <p className="text-sm leading-relaxed text-ink">{item.text}</p>
                        </li>
                      ))}
                    </ul>
                    <p className="text-xs text-muted-foreground">
                      Planerade aktiviteter visar hur schemat ser ut, inte vad du säkert genomförde eller vad som orsakade en energiförändring.
                    </p>
                  </CollapsibleSection>
                )}

                {(personalSaved.length > 0 || (personal.ready && personal.areas.length > 0)) && (
                  <CollapsibleSection
                    id="insight-saved-and-optional-supports"
                    title="Mina stöd"
                    description="Sparade stöd och andra frivilliga förslag"
                    defaultCollapsed
                    className="min-w-0 rounded-2xl bg-secondary/25 px-3 py-2.5"
                    headingClassName="text-base font-semibold"
                  >
                    {personalSaved.length > 0 && (
                      <div className="space-y-2" data-testid="insight-saved-supports">
                        <h3 className="text-sm font-medium text-ink">Sparade stöd</h3>
                        <p className="text-xs text-muted-foreground">Samma stöd finns även i Idag och Planera.</p>
                        {personalSaved.map((support) => (
                          <div key={support.id} className="flex min-w-0 items-start gap-3 rounded-xl bg-card/70 p-3">
                            <span className="mt-0.5 shrink-0" aria-hidden>{AREA_BY_ID[support.areaId]?.emoji}</span>
                            <div className="min-w-0 flex-1 space-y-1">
                              <p className="break-words text-sm font-medium">{support.title}</p>
                              {support.nudges.length > 0 && (
                                <p className="text-xs text-muted-foreground">
                                  {support.nudges.length} valda påminnelsesteg
                                </p>
                              )}
                              <InsightApplySetting strategyId={support.strategyId} />
                            </div>
                            <button
                              type="button"
                              onClick={() => removeStrategy(support.id)}
                              aria-label={`Ta bort stödet ${support.title}`}
                              className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-xl text-muted-foreground hover:bg-secondary/70 hover:text-destructive"
                            >
                              <X size={16} aria-hidden />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    {personal.ready && personal.areas.length > 0 && (
                      <div className="space-y-2">
                        <h3 className="text-sm font-medium text-ink">Fler stöd att prova</h3>
                        <p className="text-xs text-muted-foreground">Du väljer själv om du vill spara ett stöd eller lägga till det i din plan.</p>
                        <AreaStrategies
                          areas={personal.areas}
                          openArea={openArea}
                          setOpenArea={setOpenArea}
                          hasStrategy={hasPersonalStrategy}
                          maxFriction={flow.maxFriction}
                          onAdd={openAdd}
                        />
                      </div>
                    )}
                  </CollapsibleSection>
                )}

                <EnergyMoodTrend />

                <details className="min-w-0 rounded-2xl bg-secondary/25 px-3 py-2.5" data-testid="insight-method">
                  <summary className="flex min-h-11 cursor-pointer items-center text-sm font-semibold text-ink">
                    Så fungerar mina insikter
                  </summary>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    Insikter bygger på dina egna incheckningar och aktiviteter. Uppgifter som bara planerats räknas inte som genomförda,
                    och ett sammanträffande betyder inte att en aktivitet orsakade en energiförändring.
                  </p>
                  <dl className="mt-3 grid grid-cols-1 gap-2 text-sm sm:grid-cols-3">
                    <div className="rounded-xl bg-card/70 p-3"><dt className="text-muted-foreground">Aktiva dagar</dt><dd className="font-semibold tabular-nums">{totalDays}</dd></div>
                    <div className="rounded-xl bg-card/70 p-3"><dt className="text-muted-foreground">Avslutade uppgifter</dt><dd className="font-semibold tabular-nums">{completedTasks.length}</dd></div>
                    <div className="rounded-xl bg-card/70 p-3"><dt className="text-muted-foreground">Energiincheckningar</dt><dd className="font-semibold tabular-nums">{energyLog?.length ?? 0}</dd></div>
                  </dl>
                  <p className="mt-2 text-xs text-muted-foreground">Antal registreringar är inget betyg och ger inte i sig säkra slutsatser.</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Detaljer om batteri och aktivitetstid hittar du under Mitt batteri.
                  </p>
                </details>
              </div>
            </CollapsibleSection>
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

            <div className="pace-card-surface p-5 rounded-3xl bg-card border border-border">
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
                  className="pace-card-surface w-full text-left p-5 rounded-3xl bg-card border border-border hover:shadow-lifted transition-all active:scale-[0.99] flex items-center gap-4"
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
              className="pace-card-surface p-5 rounded-3xl bg-card border border-border"
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
              <p className="text-xs leading-relaxed text-muted-foreground">
                Du kan behålla idén utan att lägga något på dagens att-göra-lista.
              </p>
              <Button type="button" className="min-h-12 w-full rounded-2xl" onClick={saveSupportOnly}>
                Spara som frivilligt stöd
              </Button>
              <p className="text-xs text-muted-foreground">Ingen uppgift och ingen påminnelse skapas.</p>
              {addFlow && addFlow.nudges.length > 0 && (
                <Button className="w-full h-12 rounded-2xl" onClick={() => confirmAdd(true)}>
                  Lägg till som uppgift med påminnelser
                </Button>
              )}
              <Button
                variant="secondary"
                className="w-full h-12 rounded-2xl"
                onClick={() => confirmAdd(false)}
              >
                Lägg till som uppgift utan påminnelser
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
          <DialogContent className="max-w-md rounded-2xl">
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
        </PaceContent>
      </PacePage>
    </Layout>
  );
}
