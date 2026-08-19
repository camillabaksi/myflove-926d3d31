import { useMemo, useState } from "react";
import { Link } from "wouter";
import HomeShortcuts from "@/components/home-shortcuts";
import UnusedBlocksHint from "@/components/unused-blocks-hint";
import Layout from "@/components/layout";
import { FlowItemActions } from "@/components/flow-item-actions";
import OverwhelmedModal from "@/components/overwhelmed-modal";
import HelpMeModal from "@/components/help-me-modal";
import WeatherCard from "@/components/weather-card";
import ProactiveSuggestions from "@/components/proactive-suggestions";
import { MyFloveSparkle } from "@/components/myflove/motion";
import { MyFloveLinkButton } from "@/components/myflove";
import QuickflowCapture from "@/components/quickflow-capture";
import QuickflowList from "@/components/quickflow-list";
import PersonalNote from "@/components/personal-note";
import HomeSection from "@/components/home-section";
import DailyFlowCard from "@/components/daily-flow-card";
import LifePuzzleCard from "@/components/life-puzzle-card";
import QuickflowTriage from "@/components/quickflow-triage";
import FlowReset from "@/components/flow-reset";
import DayRebuild from "@/components/day-rebuild";

import FlowOnboarding from "@/components/flow-onboarding";
import StreakCard from "@/components/streak-card";
import WeekInFlow from "@/components/week-in-flow";
import { celebrateFromEvent } from "@/lib/celebrate";
import { EnablePushButton } from "@/components/enable-push-button";
import { PersonalPushSettings } from "@/components/personal-push-settings";
import WakeUpCard from "@/components/wake-up-card";
import WakeUpSettings from "@/components/wake-up-settings";
import { QuietModeSettings } from "@/components/quiet-mode-settings";
import { AdaptiveLeadSettings } from "@/components/adaptive-lead-settings";
import { useReminderSync } from "@/hooks/use-reminder-sync";
import { AreaSwitcher } from "@/components/area-switcher";
import { AreaOnboarding } from "@/components/area-onboarding";
import { AREA_META, filterByArea, useActiveArea, type LifeArea } from "@/lib/life-areas";
import ViewModeToggle from "@/components/view-mode-toggle";
import HomeCustomize from "@/components/home-customize";
import { useHiddenHomeSections, useHomeSectionOrder } from "@/lib/home-sections";
import { useViewMode } from "@/lib/view-mode";

/**
 * Vilka block som hör hemma i vilket rum. Är du i ett rum visas bara
 * det rummets saker – "Allt" lägger ihop hela hemskärmen igen.
 */
const SECTION_AREAS: Record<string, LifeArea[]> = {
  livspussel: ["vardag", "privat", "studier", "jobb"],
  dailyflow: ["vardag", "privat", "studier", "jobb"],
  reset: ["vardag", "privat", "studier", "jobb"],
  quickflow: ["vardag", "privat", "studier", "jobb"],
  streak: ["vardag"],
  weather: ["vardag", "privat"],
  shortcuts: ["vardag", "privat", "studier", "jobb"],
  week: ["vardag", "privat", "studier", "jobb"],
  suggestions: ["vardag", "privat"],
  today: ["vardag", "privat", "studier", "jobb"],
  bills: ["privat"],
  medication: ["vardag", "privat"],
  push: ["vardag"],
  help: ["vardag", "privat"],
};

/** Vad som är kvar i förenklad vy – det du faktiskt behöver just nu. */
const SIMPLE_SECTIONS = ["livspussel", "dailyflow", "today", "shortcuts", "help"];

import {
  useFocus,
  useTasks,
  useReminders,
  useFinances,
  useMedications,
  type Task,
} from "@/hooks/use-data";
import { useSharedShoppingList } from "@/hooks/use-shared-shopping-list";
import { getGreeting } from "@/lib/greeting";
import IntroTour from "@/components/intro-tour";
import { useUserProfile } from "@/hooks/use-user-profile";
import { emptyState } from "@/lib/flow-voice";
import { buildHelpPlan, type HelpFeelingId, type HelpPlan } from "@/lib/help-me";
import { HeartHandshake, CheckCircle2, Circle, Pill, Sparkles, ArrowRight } from "lucide-react";

function sortTasksByPriority(tasks: Task[]): Task[] {
  const withDueDate = tasks
    .filter((t) => t.dueDate)
    .sort((a, b) => (a.dueDate ?? "").localeCompare(b.dueDate ?? ""));
  const withoutDueDate = tasks.filter((t) => !t.dueDate).sort((a, b) => a.createdAt - b.createdAt);
  return [...withDueDate, ...withoutDueDate];
}

export default function Home() {
  const { name, setName, lastVisit } = useUserProfile();
  const greeting = getGreeting({ name, lastVisit });
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(name);
  const { currentFocus, toggleFocusCompleted } = useFocus();
  const { activeTasks, toggleTask } = useTasks();
  const { activeArea } = useActiveArea();
  const { isSimple } = useViewMode(activeArea);
  const { isHidden } = useHiddenHomeSections();
  const { orderOf } = useHomeSectionOrder();
  const ord = (id: string) => ({ order: orderOf(id) });
  const showSection = (id: string) => {
    const inArea = activeArea === "alla" || (SECTION_AREAS[id] ?? []).includes(activeArea);
    if (!inArea) return false;
    if (isHidden(id)) return false;
    // Förenklad vy: bara det viktigaste i rummet du står i.
    return isSimple ? SIMPLE_SECTIONS.includes(id) : true;
  };

  const { activeReminders: _activeReminders } = useReminders();
  const { transactions } = useFinances();
  const { medications, isTaken } = useMedications();
  const { activeItems: _shoppingItems } = useSharedShoppingList();

  const [helpModalOpen, setHelpModalOpen] = useState(false);
  const [overwhelmedOpen, setOverwhelmedOpen] = useState(false);
  const [helpPlan, setHelpPlan] = useState<HelpPlan | null>(null);
  const [showAllTasks, setShowAllTasks] = useState(false);

  useReminderSync();

  // Prov och automatiska repetitionspass ska aldrig dyka upp bland dagens
  // viktigaste – de känns övermäktiga. De syns bara om man lägger in dem själv.
  const areaTasks = useMemo(
    () =>
      sortTasksByPriority(
        filterByArea(activeTasks, activeArea).filter(
          (t) => !t.syncKey?.includes(":exam:") && !t.syncKey?.includes(":revision:"),
        ),
      ),
    [activeTasks, activeArea],
  );

  // Saker med ett datum framåt hör hemma på sin egen dag – inte här.
  const prioritizedTasks = useMemo(() => focusTasksForToday(areaTasks), [areaTasks]);

  const limit = helpPlan?.taskLimit ?? 3;
  const visibleTasks = showAllTasks ? areaTasks : prioritizedTasks.slice(0, limit);
  const hiddenTaskCount = Math.max(0, areaTasks.length - prioritizedTasks.slice(0, limit).length);


  const now = Date.now();
  const pastOrTodayTransactions = transactions.filter((t) => t.date <= now);
  const balance = pastOrTodayTransactions.reduce(
    (sum, t) => sum + (t.type === "income" ? t.amount : -t.amount),
    0,
  );
  const upcomingBills = transactions
    .filter((t) => t.type === "expense" && t.date > now)
    .sort((a, b) => a.date - b.date);
  const upcomingBillsTotal = upcomingBills.reduce((sum, t) => sum + t.amount, 0);
  const moneyLeftAfterPlanned = balance - upcomingBillsTotal;

  const medicationsDueToday = medications
    .map((med) => ({
      med,
      nextTime: med.times.find((time) => !isTaken(med.id, time)),
    }))
    .filter(
      (entry): entry is { med: (typeof medications)[number]; nextTime: string } => !!entry.nextTime,
    )
    .sort((a, b) => a.nextTime.localeCompare(b.nextTime));
  const nextMedication = medicationsDueToday[0];

  const handleSelectFeeling = (feeling: HelpFeelingId) => {
    if (feeling === "overwhelmed") {
      setOverwhelmedOpen(true);
      return;
    }
    setHelpPlan(buildHelpPlan(feeling));
  };

  // Hemskärmen skiftar med dygnet – morgonljus, dagsvärme, kvällsdis.
  const hour = new Date().getHours();
  const heroGradient =
    hour < 10
      ? "linear-gradient(135deg, hsl(var(--sky) / 0.75) 0%, hsl(var(--cream)) 55%, hsl(var(--lavender) / 0.85) 100%)"
      : hour < 17
        ? "linear-gradient(135deg, hsl(var(--lavender) / 0.9) 0%, hsl(var(--cream)) 58%, hsl(var(--mint) / 0.7) 100%)"
        : hour < 22
          ? "linear-gradient(135deg, hsl(var(--blush) / 0.8) 0%, hsl(var(--cream)) 55%, hsl(var(--lavender) / 0.85) 100%)"
          : "linear-gradient(135deg, hsl(var(--lavender) / 0.7) 0%, hsl(var(--card)) 70%)";

  return (
    <Layout>
      <IntroTour />
      <FlowOnboarding />
      <div className="flex flex-col gap-8">
        {/* Hero header with preview-style warmth */}
        <div
          className="relative overflow-hidden rounded-3xl p-6 shadow-lifted border border-border/60 pop-in"
          style={{ order: -1, background: heroGradient }}
        >
          <div className="pointer-events-none absolute -top-20 -right-16 h-40 w-40 rounded-full bg-blush opacity-60 blur-md" />
          <div className="pointer-events-none absolute -bottom-16 -left-10 h-32 w-32 rounded-full bg-mint opacity-50 blur-[2px]" />
          <div
            className="pointer-events-none absolute top-6 right-6 text-4xl breathe select-none"
            aria-hidden
          >
            💜
          </div>

          <div className="relative space-y-2">
            <h1 className="text-4xl font-bold text-ink pr-14">{greeting.title}</h1>
            <p className="text-muted-foreground">{greeting.subtitle}</p>
            {editingName ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setName(nameDraft);
                  setEditingName(false);
                }}
                className="flex flex-wrap items-center gap-2 pt-1"
              >
                <input
                  autoFocus
                  value={nameDraft}
                  onChange={(e) => setNameDraft(e.target.value)}
                  placeholder="Vad ska jag kalla dig?"
                  className="rounded-full bg-background/80 border border-border px-3 py-1 text-sm min-w-0"
                  maxLength={32}
                />
                <button type="submit" className="text-xs font-medium text-primary hover:underline">
                  Spara
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setNameDraft(name);
                    setEditingName(false);
                  }}
                  className="text-xs text-muted-foreground hover:underline"
                >
                  Avbryt
                </button>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setNameDraft(name);
                  setEditingName(true);
                }}
                className="text-xs text-muted-foreground/80 hover:text-foreground underline underline-offset-2"
              >
                {name ? "Byt namn" : "Vad ska jag kalla dig?"}
              </button>
            )}
          </div>
        </div>

        <Link
          href="/vad-nu"
          style={{ order: -1 }}
          className="press group relative flex items-center gap-4 overflow-hidden rounded-3xl border border-primary/25 bg-card p-5 shadow-sm transition-colors hover:border-primary/50"
        >
          <span className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-lavender opacity-70" />
          <span className="relative grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
            <Sparkles size={22} />
          </span>
          <span className="relative min-w-0">
            <span className="block font-display text-lg font-bold text-ink">
              Vad ska jag göra nu?
            </span>
            <span className="block text-sm text-muted-foreground">
              Ett förslag i taget, utifrån din tid och energi.
            </span>
          </span>
        </Link>

        <div style={{ order: -1 }}>
          <PersonalNote />
        </div>

        {showSection("livspussel") && (
          <HomeSection
            style={ord("livspussel")}
            id="livspussel"
            title="Livspusslet"
            help="Hur dagens olika delar hänger ihop – energi, deadlines, familj, jobb och studier. Låg kapacitet ger färre krav, inte fler."
          >
            <LifePuzzleCard />
          </HomeSection>
        )}

        {showSection("dailyflow") && (
          <HomeSection
            style={ord("dailyflow")}
            id="dailyflow"
            title="Daily Flow"
            help="Berätta hur dagen ser ut så föreslår jag ett par saker som faktiskt går att göra. Du bestämmer alltid själv."
          >
            <div className="space-y-4">
              <DayRebuild />
              <DailyFlowCard />
            </div>
          </HomeSection>
        )}

        {showSection("quickflow") && (
          <HomeSection
            style={ord("quickflow")}
            id="quickflow"
            title="Quickflow"
            help="Skriv ner det du kommer på, direkt. Du behöver inte bestämma när eller hur – sortera senare."
          >
            <div className="space-y-4">
              <QuickflowCapture />
              <QuickflowTriage />
              <QuickflowList />
            </div>
          </HomeSection>
        )}

        <div style={{ order: -2 }}>
          <WakeUpCard />
        </div>

        <div style={{ order: -1 }}>
          <AreaOnboarding />
        </div>

        <div style={{ order: -1 }} className="space-y-2">
          <AreaSwitcher size="sm" />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">
              {activeArea === "alla"
                ? "Flow ser hela din dag – oavsett vilket rum sakerna hör till."
                : `Du är i ${AREA_META[activeArea].label.toLowerCase()}rummet. Resten väntar tills du vill se det.`}
            </p>
            <ViewModeToggle area={activeArea} />
          </div>
          {isSimple && (
            <p className="text-xs text-muted-foreground">
              Förenklad vy: bara dagens saker, genvägar och hjälp. Byt till vanlig vy när du vill se
              allt.
            </p>
          )}
          <HomeCustomize />
        </div>

        {showSection("streak") && (
          <HomeSection
            style={ord("streak")}
            id="streak"
            title="Din svit"
            help="Antal dagar i rad du gjort något i appen. Bryts den händer inget – den finns bara som en liten morot."
          >
            <StreakCard />
          </HomeSection>
        )}

        {showSection("weather") && (
          <HomeSection
            style={ord("weather")}
            id="weather"
            title="Väder"
            help="Vädret där du är just nu. Används också för tips, som att ta med paraply."
          >
            <WeatherCard />
          </HomeSection>
        )}

        {showSection("shortcuts") && (
          <HomeSection
            style={ord("shortcuts")}
            id="shortcuts"
            title="Genvägar"
            help="Dina fyra egna knappar. Tryck på pennan för att byta ut dem mot det du använder mest."
          >
            <HomeShortcuts />
          </HomeSection>
        )}

        {showSection("week") && (
          <HomeSection
            style={ord("week")}
            id="week"
            title="Veckan i flow"
            help="En snabb bild av veckan. Tryck på en dag för att se vad som ligger där."
          >
            <WeekInFlow />
          </HomeSection>
        )}

        {showSection("suggestions") && (
          <div style={ord("suggestions")}>
            <ProactiveSuggestions />
          </div>
        )}

        {showSection("help") && (
          <button
            type="button"
            onClick={() => setHelpModalOpen(true)}
            className="group relative w-full overflow-hidden flex items-center gap-4 p-6 rounded-3xl text-primary-foreground shadow-lifted transition-transform text-left active:scale-[0.99]"
            style={{
              ...ord("help"),
              background:
                "linear-gradient(135deg, hsl(var(--forest)) 0%, hsl(var(--forest-deep)) 100%)",
            }}
          >
            <div className="absolute inset-0 bg-primary-foreground/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            <MyFloveSparkle count={3} className="opacity-40" />

            <div className="w-14 h-14 rounded-full bg-primary-foreground/15 flex items-center justify-center shrink-0 backdrop-blur-sm">
              <HeartHandshake size={28} className="breathe" style={{ animationDuration: "6s" }} />
            </div>
            <div className="flex-1 relative">
              <p className="text-xl font-semibold">Hjälp mig</p>
              <p className="text-primary-foreground/85 text-sm">
                Känns det tungt just nu? Berätta hur du mår, så gör jag idag lite mindre.
              </p>
            </div>
          </button>
        )}

        {helpPlan && (
          <div
            style={ord("today")}
            className="bg-sage/30 border border-sage rounded-2xl p-5 flex items-start gap-3 animate-in fade-in slide-in-from-top-2"
          >
            <Sparkles size={20} className="text-ink shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-ink leading-relaxed">{helpPlan.message}</p>
              <button
                type="button"
                onClick={() => setHelpPlan(null)}
                className="text-sm font-medium text-primary mt-2 underline underline-offset-2"
              >
                Visa allt igen
              </button>
            </div>
          </div>
        )}

        {showSection("today") && (
          <HomeSection
            style={ord("today")}
            id="today"
            title={helpPlan ? "Det viktigaste just nu" : "Dagens viktigaste"}
            help="Det som är närmast i tid idag. Tryck på en rad för att bocka av den."
          >
            <div className="space-y-4">
              {currentFocus && !helpPlan && (
                <button
                  onClick={(e) => {
                    if (!currentFocus.completed) celebrateFromEvent(e);
                    toggleFocusCompleted();
                  }}
                  className={`w-full text-left p-5 rounded-2xl border-2 transition-all flex items-center gap-4 ${
                    currentFocus.completed
                      ? "bg-primary/10 border-primary/20 text-primary"
                      : "bg-card border-primary/40 shadow-sm"
                  }`}
                >
                  {currentFocus.completed ? (
                    <CheckCircle2
                      size={24}
                      className="fill-primary text-primary-foreground shrink-0"
                    />
                  ) : (
                    <Circle size={24} className="text-primary shrink-0" />
                  )}
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground mb-0.5">
                      Dagens fokus
                    </p>
                    <p
                      className={`font-medium ${currentFocus.completed ? "line-through opacity-70" : ""}`}
                    >
                      {currentFocus.text}
                    </p>
                  </div>
                </button>
              )}

              {visibleTasks.length === 0 && !currentFocus ? (
                <div className="text-center py-10 px-6 bg-secondary/30 rounded-3xl border border-dashed border-border animate-fade-in">
                  <div className="mx-auto mb-3 w-14 h-14 rounded-full bg-sage/40 flex items-center justify-center">
                    <Sparkles size={26} className="text-primary" />
                  </div>
                  <p className="text-ink font-medium">{emptyState.tasks}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Vill du sätta en enda sak för idag? Det räcker gott.
                  </p>
                  <MyFloveLinkButton href="/flowplan" variant="primary" size="sm" className="mt-4">
                    Sätt dagens fokus
                  </MyFloveLinkButton>
                </div>
              ) : (
                <div className="space-y-3">
                  {visibleTasks.map((task, i) => (
                    <div
                      key={task.id}
                      style={{ animationDelay: `${i * 60}ms` }}
                      className="w-full flex items-center gap-3 p-4 surface-card hover:border-primary/40 hover:shadow-lifted transition-all text-left animate-fade-in"
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          toggleTask(task.id);
                          celebrateFromEvent(e);
                        }}
                        aria-label={`Klarmarkera ${task.title}`}
                        className="flex flex-1 items-center gap-3 text-left active:scale-[0.99]"
                      >
                        <Circle size={20} className="text-muted-foreground shrink-0" />
                        <span className="flex-1">{task.title}</span>
                        {task.dueDate && (
                          <span className="text-xs text-muted-foreground shrink-0">
                            {task.dueDate}
                          </span>
                        )}
                      </button>
                      <FlowItemActions itemId={`task-${task.id}`} size={15} />
                    </div>
                  ))}
                </div>
              )}

              {(hiddenTaskCount > 0 || showAllTasks) && (
                <button
                  type="button"
                  onClick={() => setShowAllTasks((v) => !v)}
                  className="w-full text-sm font-medium text-primary hover:underline pt-1"
                >
                  {showAllTasks
                    ? "Visa bara det viktigaste"
                    : `Visa alla uppgifter som inte är klara (${prioritizedTasks.length})`}
                </button>
              )}
            </div>
          </HomeSection>
        )}

        {upcomingBills.length > 0 && showSection("bills") && (
          <HomeSection
            style={ord("bills")}
            id="bills"
            title="Kommande räkningar"
            help="Räkningar med förfallodatum inom kort. Läggs in under Ekonomi."
          >
            <div className="space-y-3">
              {upcomingBills.slice(0, 3).map((bill) => (
                <div key={bill.id} className="flex items-center justify-between p-4 surface-card">
                  <div>
                    <p className="font-medium">{bill.category}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(bill.date).toLocaleDateString("sv-SE", {
                        month: "short",
                        day: "numeric",
                      })}
                      {bill.note ? ` · ${bill.note}` : ""}
                    </p>
                  </div>
                  <span className="font-semibold">{bill.amount} kr</span>
                </div>
              ))}
            </div>
          </HomeSection>
        )}

        {nextMedication && showSection("medication") && (
          <HomeSection
            style={ord("medication")}
            id="medication"
            title="Medicinpåminnelse"
            help="Bocka av när du tagit din medicin. Tiden ställer du in under Må bra."
          >
            <Link
              href="/daglig-rutin"
              className="flex items-center gap-4 p-5 surface-card hover:border-primary/40 transition-colors"
            >
              <div className="w-12 h-12 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center shrink-0">
                <Pill size={22} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">
                  {nextMedication.med.name}
                  {nextMedication.med.dosage ? ` · ${nextMedication.med.dosage}` : ""}
                </p>
                <p className="text-sm text-muted-foreground">{nextMedication.nextTime}</p>
              </div>
              <ArrowRight size={16} className="text-muted-foreground shrink-0" />
            </Link>
          </HomeSection>
        )}

        {showSection("reset") && new Date().getHours() >= 17 && (
          <HomeSection
            style={ord("reset")}
            id="reset"
            title="Flow Reset"
            help="Ett frivilligt sätt att avsluta dagen. Det som inte blev gjort får bara flytta med."
          >
            <FlowReset />
          </HomeSection>
        )}

        {showSection("push") && (
          <HomeSection
            style={ord("push")}
            id="push"
            title="Påminnelser"
            help="Slå på notiser i mobilen så påminner appen dig även när den är stängd."
          >
            <div className="space-y-4">
              <div className="surface-card p-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-ink">Påminnelser även när appen är stängd</p>
                  <p className="text-sm text-muted-foreground">
                    Medicin, tvätt, väder och tider – som en varsam knuff när det behövs.
                  </p>
                </div>
                <EnablePushButton />
              </div>

              <QuietModeSettings />
              <AdaptiveLeadSettings />

              <PersonalPushSettings />
              <WakeUpSettings />
            </div>
          </HomeSection>
        )}

        <div style={{ order: 999 }}>
          <UnusedBlocksHint />
        </div>
      </div>

      <HelpMeModal
        open={helpModalOpen}
        onOpenChange={setHelpModalOpen}
        onSelectFeeling={handleSelectFeeling}
      />
      <OverwhelmedModal open={overwhelmedOpen} onOpenChange={setOverwhelmedOpen} />
    </Layout>
  );
}
