import { useEffect, useState } from "react";
import QuickAddSheet from "@/components/quick-add-sheet";
import NowCard from "@/components/home/now-card";
import CloseDay from "@/components/home/close-day";

import CapacityPlanCard from "@/components/home/capacity-plan-card";
import HowItWorksGuide from "@/components/home/how-it-works-guide";
import DailyFlowList from "@/components/day/daily-flow-list";
import ChildrenDaySummary from "@/components/home/children-day-summary";
import { FlowMascot } from "@/components/flow-mascot";
import { MyFlovePageGrid, MyFloveWide } from "@/components/myflove/block";
import { ExpandableBlock } from "@/components/myflove/expandable-block";

import { useHomeLayout, type HomeBlockId } from "@/lib/home-layout";
import RoutinesMedicationToday from "@/components/routines-medication-today";
import HomeShortcuts from "@/components/home-shortcuts";

import { Link } from "wouter";
import Layout from "@/components/layout";
import { useUserProfile } from "@/hooks/use-user-profile";
import { useLang } from "@/hooks/use-language";
import { useCapacityMode } from "@/hooks/use-capacity-mode";
import { useTasks, useReminders } from "@/hooks/use-data";
import { useQuickflow } from "@/hooks/use-quickflow";
import { useNotes } from "@/hooks/use-notes";
import { isOverdue, shouldAskAboutThought } from "@/lib/quickflow";

import { AreaOnboarding } from "@/components/area-onboarding";
import PwaInstallCard from "@/components/pwa-install-card";
import { AreaSwitcher } from "@/components/area-switcher";
import { AREA_META, useActiveArea } from "@/lib/life-areas";
import IntroTour from "@/components/intro-tour";
import {
  SlidersHorizontal,
  CalendarDays,
  Brain,
  BatteryMedium,
  Pill,
  ArrowRight,
  Wind,
  NotebookPen,
} from "lucide-react";
import { todayISO } from "@/lib/day";
import { track } from "@/lib/analytics";
import EveningCheck from "@/components/journey/evening-check";
import CollapsibleSection from "@/components/collapsible-section";
import NextLectureHomeRow from "@/components/study/next-lecture-home-row";
import { useNpfSettings } from "@/lib/npf-mode";
import { Button } from "@/components/ui/button";

/**
 * Hem = en lugn personlig kontrollpanel.
 *
 * Prioritering: QuickFlow (få ut det ur huvudet) → Batteriet (förstå energin)
 * → Kalendern (förstå dagen) → Idag (vad som faktiskt behöver göras).
 * Allt bygger på befintlig datamodell och befintliga vyer – Hem ändrar bara
 * presentation och informationshierarki.
 */

export default function Home() {
  const { name, setName, lastVisit } = useUserProfile();
  const { t } = useLang();
  const { mode: capacityMode } = useCapacityMode();
  const isLowCapacity = capacityMode === "lagt";
  const [editingName, setEditingName] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [nameDraft, setNameDraft] = useState(name);
  const { activeArea } = useActiveArea();
  const { activeTasks } = useTasks();
  const { activeReminders } = useReminders();
  const { openItems } = useQuickflow();
  const { openNotes } = useNotes();
  const { settings: npf } = useNpfSettings();
  const todayIso = todayISO();

  const openQuickflow = () => {
    track("home_widget_opened", { source: "quickflow" });
    window.dispatchEvent(new CustomEvent("myflove:quickflow"));
  };

  useEffect(() => {
    track("home_viewed");
  }, []);

  const [firstVisit, setFirstVisit] = useState(false);
  useEffect(() => {
    if (!window.localStorage.getItem("myflove-home-start-seen")) {
      setFirstVisit(true);
      window.localStorage.setItem("myflove-home-start-seen", "1");
    }
  }, []);

  const { visible, checklistPreview } = useHomeLayout();
  const shows = (id: HomeBlockId) => visible.includes(id);
  const pos = (id: HomeBlockId) => ({ order: visible.indexOf(id) + 10 });

  const awayForDays = lastVisit ? Date.now() - lastVisit >= 3 * 24 * 60 * 60 * 1000 : false;
  const todayLoad =
    activeTasks.filter((task) => task.dueDate === todayIso).length +
    activeReminders.filter((reminder) => reminder.date === todayIso && !reminder.canceled).length;
  const dayLoad = todayLoad + openItems.length;
  const glowLevel = dayLoad <= 3 ? "light" : dayLoad <= 7 ? "busy" : "overloaded";
  const hasSavedItems = openItems.length > 0 || openNotes.length > 0;
  const hasWaitingQuickflow = openItems.some(
    (item) => shouldAskAboutThought(item) || isOverdue(item),
  );
  const savedItemsHref = openItems.length > 0 ? "/quickflow" : "/anteckningar";
  const savedItemCounts = [
    openItems.length > 0
      ? `${openItems.length} ${openItems.length === 1 ? t("sak") : t("saker")} ${t("i QuickFlow")}`
      : null,
    openNotes.length > 0
      ? `${openNotes.length} ${openNotes.length === 1 ? t("anteckning") : t("anteckningar")}`
      : null,
  ].filter((value): value is string => value != null);

  return (
    <Layout>
      <QuickAddSheet open={addOpen} onOpenChange={setAddOpen} />
      <IntroTour />

      <MyFlovePageGrid className="gap-5 xl:grid-cols-6">
        <MyFloveWide className="home-ambient-shell" data-glow-level={glowLevel}>
          <section className="home-main-surface pop-in" aria-label={t("Din lugna start")}>
            <div className="home-ambient-glow" aria-hidden />
            <header className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
              <div className="min-w-0">
                <p className="mb-1 text-xs font-semibold uppercase text-primary">
                  {t("Din dag, i din takt")}
                </p>
                <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">
                  {name ? `${t("Hej")} ${name}` : t("Hej")}
                </h1>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
                  {t("Vad behöver du just nu?")}
                  {awayForDays && <span className="block text-xs">{t("Vi tar det lugnt idag, oavsett hur dagarna har varit.")}</span>}
                </p>
                {editingName ? (
                  <form
                    onSubmit={(event) => {
                      event.preventDefault();
                      setName(nameDraft);
                      setEditingName(false);
                    }}
                    className="mt-3 flex flex-wrap items-center gap-2"
                  >
                    <input
                      autoFocus
                      value={nameDraft}
                      onChange={(event) => setNameDraft(event.target.value)}
                      placeholder={t("Vad ska jag kalla dig?")}
                      className="min-w-0 rounded-full border border-border bg-background px-3 py-1.5 text-sm"
                      maxLength={32}
                    />
                    <Button type="submit" size="sm">
                      {t("Spara")}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setNameDraft(name);
                        setEditingName(false);
                      }}
                    >
                      {t("Avbryt")}
                    </Button>
                  </form>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setNameDraft(name);
                      setEditingName(true);
                    }}
                    className="mt-2 text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
                  >
                    {name ? t("Byt namn") : t("Vad ska jag kalla dig?")}
                  </button>
                )}
              </div>
              <div className="pointer-events-none shrink-0 select-none" aria-hidden>
                <FlowMascot
                  size="md"
                  mood="calm"
                  className={npf.stillness ? undefined : "flow-alive"}
                  alt=""
                />
              </div>
            </header>

            <nav
              className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4"
              data-testid="home-widgets"
              aria-label={t("Genvägar")}
              data-npf="optional"
            >
              {[
                { href: "/kalender", icon: CalendarDays, label: t("Kalender"), src: "kalender" },
                { href: "/mitt-batteri", icon: BatteryMedium, label: t("Mitt batteri"), src: "batteri" },
                { href: "/assistant", icon: Wind, label: t("Prata med Flow"), src: "flow" },
              ].map((s) => (
                <Link
                  key={s.href}
                  href={s.href}
                  onClick={() => track("home_widget_opened", { source: s.src })}
                  className="flex min-h-16 flex-col items-center justify-center gap-1 rounded-2xl border border-border/60 bg-card/70 p-2 text-center text-[11px] font-semibold text-ink"
                >
                  <s.icon className="h-5 w-5 text-primary" aria-hidden />
                  {s.label}
                </Link>
              ))}
              <Button
                variant="outline"
                type="button"
                onClick={openQuickflow}
                data-testid="home-widget-quickflow"
                className="flex min-h-16 flex-col items-center justify-center gap-1 rounded-2xl border border-border/60 bg-card/70 p-2 text-center text-[11px] font-semibold text-ink"
              >
                <Brain className="h-5 w-5 text-primary" aria-hidden />
                QuickFlow
              </Button>
            </nav>

            {firstVisit && (
              <p className="mt-4 rounded-2xl bg-secondary/50 px-4 py-2 text-sm font-medium text-ink">
                {t("Börja här – en sak i taget.")}
              </p>
            )}

            <div className="mt-4 space-y-4">
              <NowCard onAdd={() => setAddOpen(true)} />
              {shows("lage") && <CapacityPlanCard />}
              {!isLowCapacity && shows("checklista") && (
              <CollapsibleSection
                id="home-daily-checklist"
                title={t("Dagens checklista")}
                description={t("Möten, vardag och rutiner i samma lista.")}
                defaultCollapsed
                className="rounded-3xl border border-border/60 bg-card/80 p-4 shadow-soft"
                headingClassName="font-display text-base font-bold text-ink"
              >
                <DailyFlowList previewCount={checklistPreview === 0 ? undefined : checklistPreview} />
              </CollapsibleSection>
              )}

              {!isLowCapacity && shows("barnens-dag") && (
                <div data-npf="optional">
                  <ChildrenDaySummary />
                </div>
              )}

              {/* Kvällen: en varm avslutning utan skuld. */}
              {!isLowCapacity && <CollapsibleSection id="home-close-day" title={t("Stäng dagen")} defaultCollapsed className="rounded-3xl border border-border/60 bg-card/70 p-4 shadow-soft" headingClassName="text-base font-semibold text-ink"><CloseDay /></CollapsibleSection>}
            </div>


            <div data-npf="optional">
              {!isLowCapacity && hasSavedItems && (
                <Link
                  href={savedItemsHref}
                  data-testid="home-saved-items-reminder"
                  className="mt-4 flex min-w-0 items-center gap-3 rounded-2xl border border-border/60 bg-card/70 px-3.5 py-3 shadow-soft"
                >
                  <NotebookPen className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                  <span className="min-w-0 flex-1 text-sm">
                    <span className="block font-semibold text-ink">
                      {hasWaitingQuickflow
                        ? t("Du har något sparat som väntar på dig")
                        : t("Du har saker sparade")}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {savedItemCounts.join(" · ")}
                    </span>
                  </span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                </Link>
              )}
            </div>

            {/* Återhämtning – en lugn, tydligt centrerad trygghetsväg. */}
            {!isLowCapacity && <div className="mt-4 flex w-full justify-center">
              <Link
                href="/aterhamtning"
                onClick={() => track("home_widget_opened", { source: "paus" })}
                data-testid="home-pause-entry"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-border/60 bg-card/70 px-6 text-sm font-semibold text-ink shadow-soft transition-colors hover:border-primary/35 hover:bg-card"
              >
                <Wind className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                {t("Återhämtning")}
              </Link>
            </div>}
          </section>
        </MyFloveWide>

        {/* Kvällscheck – frivillig, dyker upp när dagen lider mot sitt slut. */}

        {!isLowCapacity && shows("kvall") && new Date().getHours() >= 18 && (
          <MyFloveWide style={{ order: 0.7 }} className="min-w-0" data-npf="optional">
            <CollapsibleSection id="home-evening-check" title={t("Kvällscheck")} defaultCollapsed className="rounded-3xl border border-border/60 bg-card p-4 shadow-soft" headingClassName="text-base font-semibold text-ink"><EveningCheck /></CollapsibleSection>
          </MyFloveWide>
        )}

        {/* Allt annat ligger kvar – men ur vägen tills du vill se det. */}
        {!isLowCapacity && <MyFloveWide style={{ order: 6 }} className="min-w-0" data-npf="optional">
          <CollapsibleSection
            id="mer-i-myflove"
            title={t("Mer i MyFlove")}
            description={t("Rutiner & medicin och dina mönster.")}
            defaultCollapsed
            className="rounded-3xl border border-border/60 bg-card/60 p-4 shadow-soft"
            headingClassName="text-base font-semibold text-ink"
          >
            <div className="grid gap-4">
              {shows("mina-genvagar") && <HomeShortcuts />}
              <NextLectureHomeRow />
              {/* Rutiner & medicin – dagens doser och rutiner. */}
              {shows("medicin") && (
                <MyFloveWide style={{ order: 9 }} className="min-w-0">
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
            </div>
          </CollapsibleSection>
        </MyFloveWide>}

        {/* Områdesväljare – litet, längst ner */}
        {!isLowCapacity && shows("omrade") && (
          <MyFloveWide style={pos("omrade")} className="space-y-2 pt-2" data-npf="optional">
            <AreaSwitcher size="sm" />
            <p className="text-xs text-muted-foreground">
              {activeArea === "alla"
                ? t("MyFlove ser hela din dag – oavsett vilket rum sakerna hör till.")
                : `Du är i ${AREA_META[activeArea].label.toLowerCase()}rummet. Resten väntar tills du vill se det.`}
            </p>
          </MyFloveWide>
        )}

        {!isLowCapacity && <MyFloveWide style={{ order: 98 }} className="space-y-3 pt-2" data-npf="optional">
          <AreaOnboarding />
        </MyFloveWide>}

        {/* Liten, diskret notering längst ner – konkurrerar inte med korten. */}
        {!isLowCapacity && <MyFloveWide
          style={{ order: 98.5 }}
          data-testid="home-install-note"
          className="pt-1"
          data-npf="optional"
        >
          <PwaInstallCard compact />
        </MyFloveWide>}

        <MyFloveWide style={{ order: 100 }} className="min-w-0 pb-2">
          <HowItWorksGuide />
        </MyFloveWide>
        <MyFloveWide
          style={{ order: 101 }}
          className="flex items-center justify-center pb-2 text-center"
          data-npf="optional"
        >
          <Link
            href="/anpassa-hem"
            className="inline-flex min-h-10 items-center gap-1.5 text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
          >
            <SlidersHorizontal size={13} /> {t("Anpassa hemskärmen")}
          </Link>
        </MyFloveWide>
      </MyFlovePageGrid>
    </Layout>
  );
}
