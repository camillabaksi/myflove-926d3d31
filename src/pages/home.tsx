import { useEffect, useMemo, useState } from "react";
import QuickAddSheet from "@/components/quick-add-sheet";
import { FlowMascot } from "@/components/flow-mascot";
import { MyFlovePageGrid, MyFloveWide } from "@/components/myflove/block";
import { ExpandableBlock } from "@/components/myflove/expandable-block";

import { useHomeLayout, type HomeBlockId } from "@/lib/home-layout";
import RoutinesMedicationToday from "@/components/routines-medication-today";

import { Link } from "wouter";
import Layout from "@/components/layout";
import { useEnergyBattery } from "@/hooks/use-energy-battery";
import { useUserProfile } from "@/hooks/use-user-profile";
import { useLang } from "@/hooks/use-language";
import { useTasks, useReminders } from "@/hooks/use-data";
import { useQuickflow } from "@/hooks/use-quickflow";

import { AreaOnboarding } from "@/components/area-onboarding";
import PwaInstallCard from "@/components/pwa-install-card";
import { AreaSwitcher } from "@/components/area-switcher";
import { AREA_META, useActiveArea } from "@/lib/life-areas";
import IntroTour from "@/components/intro-tour";
import FlowOnboarding from "@/components/flow-onboarding";
import {
  SlidersHorizontal,
  Compass,
  CalendarDays,
  Brain,
  BatteryMedium,
  Heart,
  Pill,
  ArrowRight,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { todayISO } from "@/lib/day";
import { track } from "@/lib/analytics";
import { useQuickCheckin } from "@/hooks/use-quick-checkin";
import { useFeatureUsage, type FeatureId } from "@/lib/feature-usage";
import { orkFromValue10 } from "@/lib/ork";
import { heroGradient } from "@/lib/hero-gradient";
import WeekReviewCard from "@/components/week-review-card";
import FlowHomeCard from "@/components/flow/flow-home-card";
import JourneySteps from "@/components/journey/journey-steps";
import NextStepCard from "@/components/journey/next-step-card";
import EveningCheck from "@/components/journey/evening-check";
import CollapsibleSection from "@/components/collapsible-section";
import { useWeekReview } from "@/hooks/use-activity-history";
import { useNpfSettings } from "@/lib/npf-mode";
import { weekStartISO } from "@/lib/week-review";
import { parseISODate } from "@/lib/day";
import { Button } from "@/components/ui/button";
import CalmMode from "@/components/calm-mode";
import CalmChoices from "@/components/journey/calm-choices";

/**
 * Hem = en lugn personlig kontrollpanel.
 *
 * Prioritering: QuickFlow (få ut det ur huvudet) → Batteriet (förstå energin)
 * → Kalendern (förstå dagen) → Idag (vad som faktiskt behöver göras).
 * Allt bygger på befintlig datamodell och befintliga vyer – Hem ändrar bara
 * presentation och informationshierarki.
 */

interface TodayEntry {
  id: string;
  time?: string;
  title: string;
  note?: string;
}

export default function Home() {
  const { name, setName, lastVisit } = useUserProfile();
  const { t } = useLang();
  const [editingName, setEditingName] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [nameDraft, setNameDraft] = useState(name);
  const [calmMode, setCalmMode] = useState<"acute" | "micro" | null>(null);
  const { activeArea } = useActiveArea();
  const { reading } = useEnergyBattery();
  const { energyValue } = useQuickCheckin();
  const { activeTasks } = useTasks();
  const { activeReminders } = useReminders();
  const { openItems } = useQuickflow();
  const { settings: npf, update: updateNpf } = useNpfSettings();
  /** Enkelt läge följer det val som faktiskt gömmer innehåll. */
  const simpleMode = npf.less;
  const toggleSimpleMode = () =>
    updateNpf(
      simpleMode
        ? { less: false, stillness: false }
        : { less: true, calm: true, stillness: true, plainWords: true },
    );
  const { record: recordFeature, order: featureOrder, adaptive, top } = useFeatureUsage();
  const todayIso = todayISO();
  // Veckoöversikten hör hemma på söndagen – veckan som varit, i lugn takt.
  const isSunday = parseISODate(todayIso).getDay() === 0;
  const weekReview = useWeekReview(weekStartISO(todayIso));

  /** Dagens saker – samma data som kalendern och Min dag, bara kortare. */
  const todayEntries = useMemo<TodayEntry[]>(() => {
    const fromReminders: TodayEntry[] = activeReminders
      .filter((r) => r.date === todayIso && !r.canceled)
      .map((r) => ({ id: `r-${r.id}`, time: r.time, title: r.title, note: r.note }));
    const fromTasks: TodayEntry[] = activeTasks
      .filter((t) => t.dueDate === todayIso)
      .map((t) => ({ id: `t-${t.id}`, time: t.time, title: t.title }));
    return [...fromReminders, ...fromTasks]
      .sort((a, b) => (a.time ?? "99:99").localeCompare(b.time ?? "99:99"))
      .slice(0, 5);
  }, [activeReminders, activeTasks, todayIso]);

  const battery = Math.round(reading.now);
  const orkLabel = orkFromValue10(energyValue)?.label ?? null;
  const batteryLine =
    battery >= 70
      ? t("Du har gott om kraft kvar idag.")
      : battery >= 40
        ? t("Du har lite kvar att ge idag.")
        : t("Ganska tomt just nu – ta det lugnt.");

  /** Samma tre kort för alla – ordningen anpassas först när data finns. */
  const FEATURE_CARDS: Record<
    FeatureId,
    { id: FeatureId; title: string; subtitle: string; href: string; icon: typeof Brain }
  > = {
    quickflow: {
      id: "quickflow",
      title: t("Quickflow"),
      subtitle: t("Få ner det snabbt"),
      href: "/quickflow",
      icon: Brain,
    },
    batteri: {
      id: "batteri",
      title: t("Batteriet"),
      subtitle: orkLabel ? `${t("Din ork idag")} · ${orkLabel}` : t("Hur mycket ork har du?"),
      href: "/mitt-batteri",
      icon: BatteryMedium,
    },
    kalender: {
      id: "kalender",
      title: t("Kalendern"),
      subtitle: t("Din överblick"),
      href: "/kalender",
      icon: CalendarDays,
    },
  };
  const featureCards = featureOrder.map((id) => FEATURE_CARDS[id]);

  /** Försiktigt förslag – bara när det bygger på faktisk användning. */
  const adaptiveNote =
    adaptive && top
      ? top === "quickflow"
        ? t("Du använder Quickflow mest, så den ligger först här nu.")
        : top === "kalender"
          ? t("Du använder kalendern mest, så den ligger först här nu.")
          : t("Du checkar in i batteriet ofta, så det ligger först här nu.")
      : null;

  const openQuickflow = () => {
    track("home_widget_opened", { source: "quickflow" });
    window.dispatchEvent(new CustomEvent("myflove:quickflow"));
  };

  useEffect(() => {
    track("home_viewed");
  }, []);

  const { visible } = useHomeLayout();
  const shows = (id: HomeBlockId) => visible.includes(id);
  const pos = (id: HomeBlockId) => ({ order: visible.indexOf(id) + 10 });

  const gradient = heroGradient();
  const awayForDays = lastVisit ? Date.now() - lastVisit >= 3 * 24 * 60 * 60 * 1000 : false;

  return (
    <Layout>
      <QuickAddSheet open={addOpen} onOpenChange={setAddOpen} />
      <IntroTour />
      <FlowOnboarding />
      <CalmMode
        kind={calmMode ?? "acute"}
        open={calmMode != null}
        onOpenChange={(open) => !open && setCalmMode(null)}
      />

      <MyFlovePageGrid className="gap-5 xl:grid-cols-6">
        {/* Hero – personligt men litet. */}
        <MyFloveWide
          className="relative overflow-hidden rounded-3xl border border-border/60 p-5 shadow-lifted pop-in"
          style={{ background: gradient }}
        >
          <div
            data-npf="optional"
            className="pointer-events-none absolute -top-16 -right-12 h-32 w-32 rounded-full bg-blush opacity-50 blur-md"
          />
          <div
            className="pointer-events-none absolute right-2 top-0 select-none sm:right-5"
            aria-hidden
          >
            <FlowMascot size="md" mood="calm" className="flow-alive" alt="" />
          </div>

          <div className="relative min-w-0 pr-24 space-y-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-ink">
                {name ? `${t("Hej")} ${name}` : t("Hej")}
              </h1>
              <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted-foreground">
                {awayForDays
                  ? t("Vad skönt att se dig. Vi tar det lugnt idag, oavsett hur dagarna har varit.")
                  : t("Vi tar reda på vad som känns rimligt idag.")}
              </p>
            </div>
            <div className="flex w-fit items-center gap-3 rounded-2xl border border-border/50 bg-card/55 px-4 py-3">
              <BatteryMedium className="h-8 w-8 shrink-0 text-primary" aria-hidden />
              <div>
                <span className="block text-xs font-medium text-muted-foreground">
                  {t("Mitt batteri")}
                </span>
                <span className="block text-2xl font-bold tabular-nums text-ink">{battery}%</span>
              </div>
            </div>
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
                  placeholder={t("Vad ska jag kalla dig?")}
                  className="rounded-full bg-background/80 border border-border px-3 py-1 text-sm min-w-0"
                  maxLength={32}
                />
                <button type="submit" className="text-xs font-medium text-primary hover:underline">
                  {t("Spara")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setNameDraft(name);
                    setEditingName(false);
                  }}
                  className="text-xs text-muted-foreground hover:underline"
                >
                  {t("Avbryt")}
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
                {name ? t("Byt namn") : t("Vad ska jag kalla dig?")}
              </button>
            )}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setCalmMode("acute")}
            className="absolute bottom-4 right-4 rounded-full border border-border/60 bg-card/60 text-xs text-muted-foreground hover:bg-card hover:text-foreground"
          >
            {t("Akut Lugn")}
          </Button>
        </MyFloveWide>

        <MyFloveWide style={{ order: 0 }} className="min-w-0">
          <CalmChoices onPause={() => setCalmMode("micro")} />
        </MyFloveWide>

        {/* Enkelt läge – ett tryck för den som vill ha det lugnare. */}
        <MyFloveWide style={{ order: 0.1 }} className="min-w-0">
          <button
            type="button"
            onClick={toggleSimpleMode}
            aria-pressed={simpleMode}
            className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card/70 px-3.5 py-2 text-xs font-medium text-muted-foreground shadow-soft transition-colors hover:text-foreground hover:bg-muted"
          >
            <Sparkles size={13} aria-hidden className="text-primary" />
            {simpleMode
              ? t("Enkelt läge är på – visa allt igen")
              : t("Vill du ha det lugnare? Visa mindre på skärmen")}
          </button>
        </MyFloveWide>

        {/* Dagens tre steg – den primära vägen genom MyFlove. */}
        <MyFloveWide style={{ order: 0.3 }} className="min-w-0">
          <JourneySteps onAddOpen={() => setAddOpen(true)} />
        </MyFloveWide>

        {/* Flow finns kvar, men efter dagens två tydliga val. */}
        <MyFloveWide style={{ order: 0.4 }} className="min-w-0" data-npf="optional">
          <FlowHomeCard />
        </MyFloveWide>

        {/* Ett tydligt nästa steg – aldrig en lista. */}
        <MyFloveWide style={{ order: 0.5 }} className="min-w-0" data-npf="optional">
          <NextStepCard />
        </MyFloveWide>

        {/* Kvällscheck – frivillig, dyker upp när dagen lider mot sitt slut. */}
        {new Date().getHours() >= 18 && (
          <MyFloveWide style={{ order: 0.7 }} className="min-w-0" data-npf="optional">
            <EveningCheck />
          </MyFloveWide>
        )}

        {/* Allt annat ligger kvar – men ur vägen tills du vill se det. */}
        <MyFloveWide style={{ order: 6 }} className="min-w-0" data-npf="optional">
          <CollapsibleSection
            id="mer-i-myflove"
            title={t("Mer i MyFlove")}
            description={t("Quickflow, batteriet, dagens lista och dina mönster.")}
            defaultCollapsed
            className="rounded-3xl border border-border/60 bg-card/60 p-4 shadow-soft"
            headingClassName="text-base font-semibold text-ink"
          >
            <div className="grid gap-4">
              {/* Tre huvudkort: Quickflow, Batteriet, Kalendern.
            Alla börjar i samma ordning – den anpassas först när MyFlove sett

            tillräckligt mycket av din egen användning. */}
              <MyFloveWide style={{ order: 1 }} className="min-w-0">
                <div
                  className="grid grid-cols-3 gap-2.5 sm:gap-4"
                  data-testid="home-widgets"
                  aria-label={t("Vad vill du göra just nu?")}
                >
                  {featureCards.map((card) =>
                    card.id === "quickflow" ? (
                      <button
                        key={card.id}
                        type="button"
                        onClick={() => {
                          recordFeature("quickflow");
                          openQuickflow();
                        }}
                        data-testid="home-widget-quickflow"
                        className="group flex min-h-[104px] flex-col items-center justify-center gap-1.5 rounded-3xl border border-border/60 bg-card p-3 text-center shadow-soft transition hover:shadow-lifted"
                      >
                        <card.icon className="h-7 w-7 text-primary" aria-hidden />
                        <span className="text-sm font-semibold text-ink">{card.title}</span>
                        <span className="text-xs text-muted-foreground leading-snug">
                          {card.subtitle}
                        </span>
                      </button>
                    ) : (
                      <Link
                        key={card.id}
                        href={card.href}
                        onClick={() => {
                          recordFeature(card.id);
                          track("home_widget_opened", { source: card.id });
                        }}
                        data-testid={`home-widget-${card.id}`}
                        className="flex min-h-[104px] flex-col items-center justify-center gap-1.5 rounded-3xl border border-border/60 bg-card p-3 text-center shadow-soft transition hover:shadow-lifted"
                      >
                        <card.icon className="h-7 w-7 text-primary" aria-hidden />
                        <span className="text-sm font-semibold text-ink">{card.title}</span>
                        <span className="text-xs text-muted-foreground leading-snug">
                          {card.subtitle}
                        </span>
                      </Link>
                    ),
                  )}
                </div>
              </MyFloveWide>

              {/* Ditt batteri – stort, lugnt, som i mockupen. */}
              <MyFloveWide style={{ order: 2 }} className="min-w-0">
                <CollapsibleSection
                  id="home-battery-summary"
                  title={t("Ditt batteri")}
                  data-testid="home-recovery"
                  className="rounded-3xl border border-border/60 bg-card p-5 shadow-soft"
                  headingClassName="text-base font-semibold text-ink"
                >
                  <div className="mt-3 grid grid-cols-[auto_minmax(0,1fr)] items-center gap-4">
                    <div className="flex items-center gap-3 rounded-2xl bg-lavender/30 px-4 py-3">
                      <BatteryMedium
                        className="h-10 w-10 text-primary"
                        aria-hidden
                        strokeWidth={1.75}
                      />
                      <div>
                        <span className="block text-3xl font-bold tabular-nums text-ink leading-none">
                          {battery}%
                        </span>
                        <span className="mt-1 block text-sm text-muted-foreground">
                          {t("Precis som det är just nu")}
                        </span>
                      </div>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-ink">
                        {t("Du har")} {battery}% {t("energi")}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{batteryLine}</p>
                    </div>
                  </div>
                  <Link
                    href="/mitt-batteri"
                    onClick={() => track("home_widget_opened", { source: "logga" })}
                    className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                  >
                    {energyValue != null ? t("Tips för mer energi") : t("Logga energi & mående")}{" "}
                    <ArrowRight size={14} />
                  </Link>
                </CollapsibleSection>
              </MyFloveWide>

              {/* Idag – tider och saker, som i mockupen. */}
              <MyFloveWide style={{ order: 3 }} className="min-w-0">
                <CollapsibleSection
                  id="home-today-summary"
                  title={t("Idag")}
                  actions={
                    <Link
                      href="/idag"
                      className="shrink-0 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                    >
                      {t("Visa dagsschema")} <ChevronRight size={15} />
                    </Link>
                  }
                  data-testid="home-today"
                  className="rounded-3xl border border-border/60 bg-card p-5 shadow-soft"
                  headingClassName="text-base font-semibold text-ink"
                >
                  {todayEntries.length === 0 ? (
                    <p className="mt-3 text-sm text-muted-foreground">
                      {t("Inget inlagt för idag ännu. Det är också helt okej.")}
                    </p>
                  ) : (
                    <ul className="mt-2">
                      {todayEntries.map((e) => (
                        <li key={e.id}>
                          <Link
                            href="/idag"
                            className="grid grid-cols-[3.2rem_minmax(0,1fr)_auto] items-center gap-3 border-b border-border/40 px-1 py-3 last:border-b-0"
                          >
                            <span className="shrink-0 text-sm font-semibold tabular-nums text-muted-foreground">
                              {e.time ?? "–"}
                            </span>
                            <span className="min-w-0">
                              <span className="block truncate text-sm font-semibold text-ink">
                                {e.title}
                              </span>
                              {e.note && (
                                <span className="block truncate text-xs text-muted-foreground">
                                  {e.note}
                                </span>
                              )}
                            </span>
                            <ChevronRight size={18} className="shrink-0 text-muted-foreground" />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </CollapsibleSection>
              </MyFloveWide>

              {/* Från ditt huvud – senaste QuickFlow-tankarna. */}
              <MyFloveWide style={{ order: 4 }} className="min-w-0">
                <CollapsibleSection
                  id="home-quickflow-latest"
                  title={t("Från ditt huvud")}
                  actions={
                    <Link
                      href="/quickflow"
                      className="shrink-0 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                    >
                      {t("Visa alla")} <ArrowRight size={13} />
                    </Link>
                  }
                  data-testid="home-quickflow-latest"
                  className="rounded-3xl border border-border/60 bg-lavender/25 p-4 shadow-soft"
                  headingClassName="text-base font-semibold text-ink"
                >
                  {openItems.length === 0 ? (
                    <p className="mt-3 text-sm text-muted-foreground">
                      {t("Inget som snurrar just nu – tryck på Quickflow när något dyker upp.")}
                    </p>
                  ) : (
                    <ul className="mt-3 space-y-1.5">
                      {openItems.slice(0, 3).map((item) => (
                        <li key={item.id} className="flex items-start gap-2 text-sm text-ink">
                          <Sparkles
                            size={14}
                            className="mt-0.5 shrink-0 text-primary"
                            aria-hidden
                          />
                          <span className="min-w-0 truncate">{item.text}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </CollapsibleSection>
              </MyFloveWide>
            </div>
          </CollapsibleSection>
        </MyFloveWide>

        {/* Uppmuntrande citat – lugnt avslut, som i mockupen. */}
        <MyFloveWide style={{ order: 5 }} className="min-w-0" data-npf="optional">
          <CollapsibleSection
            id="home-daily-thought"
            title={t("Dagens tanke")}
            className="rounded-3xl border border-border/60 bg-lavender/25 p-5 shadow-soft"
            headingClassName="text-base font-semibold text-ink"
          >
            <div className="flex items-start gap-3">
              <Heart className="mt-0.5 h-6 w-6 shrink-0 text-primary" aria-hidden />
              <p className="text-sm text-ink leading-relaxed">
                {t("Små steg varje dag")}
                <br />
                {t("skapar stora förändringar.")}
              </p>
            </div>
          </CollapsibleSection>
        </MyFloveWide>

        {/* 💜 Din vecka – visas på söndagar som en lugn sammanfattning. */}
        {isSunday && (
          <MyFloveWide style={{ order: 4.4 }} className="min-w-0" data-npf="optional">
            <WeekReviewCard review={weekReview} />
          </MyFloveWide>
        )}

        {/* Rutiner & medicin – dagens doser och rutiner. */}
        {shows("medicin") && (
          <MyFloveWide style={{ order: 9 }} className="min-w-0" data-npf="optional">
            <section aria-label={t("Rutiner och medicin")}>
              <ExpandableBlock
                title={t("Rutiner & medicin")}
                titleText={t("Rutiner och medicin")}
                area="halsa"
                icon={Pill}
                subtitle={t("Dagens rutiner och doser")}
                status={t("Idag")}
                tone="blush"
                surface="blush"
              >
                <RoutinesMedicationToday />
              </ExpandableBlock>
            </section>
          </MyFloveWide>
        )}

        {/* Områdesväljare – litet, längst ner */}
        {shows("omrade") && (
          <MyFloveWide style={pos("omrade")} className="space-y-2 pt-2" data-npf="optional">
            <AreaSwitcher size="sm" />
            <p className="text-xs text-muted-foreground">
              {activeArea === "alla"
                ? t("MyFlove ser hela din dag – oavsett vilket rum sakerna hör till.")
                : `Du är i ${AREA_META[activeArea].label.toLowerCase()}rummet. Resten väntar tills du vill se det.`}
            </p>
          </MyFloveWide>
        )}

        <MyFloveWide style={{ order: 98 }} className="space-y-3 pt-2" data-npf="optional">
          <AreaOnboarding />
        </MyFloveWide>

        {/* Liten, diskret notering längst ner – konkurrerar inte med korten. */}
        <MyFloveWide
          style={{ order: 98.5 }}
          data-testid="home-install-note"
          className="pt-1"
          data-npf="optional"
        >
          <PwaInstallCard compact />
        </MyFloveWide>

        <MyFloveWide
          style={{ order: 99 }}
          className="flex flex-wrap items-center justify-center gap-4 pb-2 text-center"
          data-npf="optional"
        >
          <Link
            href="/oversikt"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
          >
            <Compass size={13} /> {t("Så funkar MyFlove")}
          </Link>
          <Link
            href="/anpassa-hem"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
          >
            <SlidersHorizontal size={13} /> {t("Anpassa hemskärmen")}
          </Link>
        </MyFloveWide>
      </MyFlovePageGrid>
    </Layout>
  );
}
