import { useEffect, useMemo, useState } from "react";
import { FlowMascot } from "@/components/flow-mascot";
import { MyFlovePageGrid, MyFloveWide } from "@/components/myflove/block";
import { ExpandableBlock } from "@/components/myflove/expandable-block";

import { useHomeLayout, type HomeBlockId } from "@/lib/home-layout";
import RoutinesMedicationToday from "@/components/routines-medication-today";

import { Link } from "wouter";
import Layout from "@/components/layout";
import { useEnergyBattery } from "@/hooks/use-energy-battery";
import { useUserProfile } from "@/hooks/use-user-profile";
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
import { useFlowSettings } from "@/hooks/use-flow-settings";

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
  const { name, setName, lastVisit: _lastVisit } = useUserProfile();
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(name);
  const { activeArea } = useActiveArea();
  const { reading, suggestions } = useEnergyBattery();
  const { energyValue } = useQuickCheckin();
  const { activeTasks } = useTasks();
  const { activeReminders } = useReminders();
  const { openItems } = useQuickflow();
  const { settings: flowSettings } = useFlowSettings();
  const todayIso = todayISO();

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

  const nextTimed = todayEntries.filter((e) => e.time).slice(0, 3);
  const battery = Math.round(reading.now);
  const batteryLine =
    battery >= 70
      ? "Du har gott om kraft kvar idag."
      : battery >= 40
        ? "Du har lite kvar att ge idag."
        : "Ganska tomt just nu – ta det lugnt.";

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

  const hour = new Date().getHours();
  const heroGradient =
    hour < 10
      ? "linear-gradient(135deg, hsl(var(--sky) / 0.65) 0%, hsl(var(--cream)) 60%, hsl(var(--lavender) / 0.8) 100%)"
      : hour < 17
        ? "linear-gradient(135deg, hsl(var(--lavender) / 0.85) 0%, hsl(var(--cream)) 62%, hsl(var(--mint) / 0.6) 100%)"
        : hour < 22
          ? "linear-gradient(135deg, hsl(var(--blush) / 0.75) 0%, hsl(var(--cream)) 60%, hsl(var(--lavender) / 0.8) 100%)"
          : "linear-gradient(135deg, hsl(var(--lavender) / 0.65) 0%, hsl(var(--card)) 72%)";

  return (
    <Layout>
      <IntroTour />
      <FlowOnboarding />

      <MyFlovePageGrid className="gap-5 xl:grid-cols-6">
        {/* Hero – personligt men litet. */}
        <MyFloveWide
          className="relative overflow-hidden rounded-3xl border border-border/60 p-5 shadow-lifted pop-in"
          style={{ background: heroGradient }}
        >
          <div className="pointer-events-none absolute -top-16 -right-12 h-32 w-32 rounded-full bg-blush opacity-50 blur-md" />
          <div
            className="pointer-events-none absolute right-3 top-1 select-none sm:right-6"
            aria-hidden
          >
            <FlowMascot size="sm" mood="calm" className="flow-alive" alt="" />
          </div>

          <div className="relative min-w-0 pr-16 space-y-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-ink">
              {name ? `Hej ${name}!` : "Hej!"} <span aria-hidden>💜</span>
            </h1>
            <p className="text-sm text-muted-foreground">Vad behöver du just nu?</p>
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
        </MyFloveWide>

        {/* Tre huvudkort: Quickflow, Batteriet, Kalendern – som i mockupen. */}
        <MyFloveWide style={{ order: 1 }} className="min-w-0">
          <div
            className="grid grid-cols-3 gap-2.5 sm:gap-4"
            data-testid="home-widgets"
            aria-label="Vad vill du göra just nu?"
          >
            <button
              type="button"
              onClick={openQuickflow}
              data-testid="home-widget-quickflow"
              className="group flex min-h-[104px] flex-col items-center justify-center gap-1.5 rounded-3xl border border-border/60 bg-card p-3 text-center shadow-soft transition hover:shadow-lifted"
            >
              <Brain className="h-7 w-7 text-primary" aria-hidden />
              <span className="text-sm font-semibold text-ink">Quickflow</span>
              <span className="text-xs text-muted-foreground leading-snug">Få ner det snabbt</span>
            </button>

            <Link
              href="/mitt-batteri"
              onClick={() => track("home_widget_opened", { source: "batteri" })}
              data-testid="home-widget-batteri"
              className="flex min-h-[104px] flex-col items-center justify-center gap-1.5 rounded-3xl border border-border/60 bg-card p-3 text-center shadow-soft transition hover:shadow-lifted"
            >
              <BatteryMedium className="h-7 w-7 text-primary" aria-hidden />
              <span className="text-sm font-semibold text-ink">Batteriet</span>
              <span className="text-xs text-muted-foreground leading-snug">
                Din energi idag · {battery}%
              </span>
            </Link>

            <Link
              href="/kalender"
              onClick={() => track("home_widget_opened", { source: "kalender" })}
              data-testid="home-widget-kalender"
              className="flex min-h-[104px] flex-col items-center justify-center gap-1.5 rounded-3xl border border-border/60 bg-card p-3 text-center shadow-soft transition hover:shadow-lifted"
            >
              <CalendarDays className="h-7 w-7 text-primary" aria-hidden />
              <span className="text-sm font-semibold text-ink">Kalendern</span>
              <span className="text-xs text-muted-foreground leading-snug">Din överblick</span>
            </Link>
          </div>
        </MyFloveWide>

        {/* Ditt batteri – stort, lugnt, som i mockupen. */}
        <MyFloveWide style={{ order: 2 }} className="min-w-0">
          <section
            aria-label="Ditt batteri"
            data-testid="home-recovery"
            className="rounded-3xl border border-border/60 bg-card p-5 shadow-soft"
          >
            <h2 className="text-base font-semibold text-ink">Ditt batteri</h2>
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
                  <span className="mt-1 block text-sm text-muted-foreground">Gott jobbat!</span>
                </div>
              </div>
              <div className="min-w-0">
                <p className="text-sm text-ink">Du har {battery}% energi</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{batteryLine}</p>
              </div>
            </div>
            <Link
              href="/mitt-batteri"
              onClick={() => track("home_widget_opened", { source: "logga" })}
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
            >
              {energyValue != null ? "Tips för mer energi" : "Logga energi & mående"}{" "}
              <ArrowRight size={14} />
            </Link>
          </section>
        </MyFloveWide>

        {/* Idag – tider och saker, som i mockupen. */}
        <MyFloveWide style={{ order: 3 }} className="min-w-0">
          <section
            aria-label="Idag"
            data-testid="home-today"
            className="rounded-3xl border border-border/60 bg-card p-5 shadow-soft"
          >
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
              <h2 className="truncate text-base font-semibold text-ink">Idag</h2>
              <Link
                href="/idag"
                className="shrink-0 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
              >
                Visa dagsschema <ChevronRight size={15} />
              </Link>
            </div>
            {todayEntries.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">
                Inget inlagt för idag ännu. Det är också helt okej.
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
          </section>
        </MyFloveWide>

        {/* Från ditt huvud – senaste QuickFlow-tankarna. */}
        <MyFloveWide style={{ order: 4 }} className="min-w-0">
          <section
            aria-label="Från ditt huvud"
            data-testid="home-quickflow-latest"
            className="rounded-3xl border border-border/60 bg-lavender/25 p-4 shadow-soft"
          >
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
              <h2 className="truncate text-base font-semibold text-ink">Från ditt huvud</h2>
              <Link
                href="/quickflow"
                className="shrink-0 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                Visa alla <ArrowRight size={13} />
              </Link>
            </div>
            {openItems.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">
                Inget som snurrar just nu – tryck på Quickflow när något dyker upp.
              </p>
            ) : (
              <ul className="mt-3 space-y-1.5">
                {openItems.slice(0, 3).map((item) => (
                  <li key={item.id} className="flex items-start gap-2 text-sm text-ink">
                    <Sparkles size={14} className="mt-0.5 shrink-0 text-primary" aria-hidden />
                    <span className="min-w-0 truncate">{item.text}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </MyFloveWide>

        {/* Uppmuntrande citat – lugnt avslut, som i mockupen. */}
        <MyFloveWide style={{ order: 5 }} className="min-w-0">
          <section
            aria-label="Dagens tanke"
            className="rounded-3xl border border-border/60 bg-lavender/25 p-5 shadow-soft"
          >
            <div className="flex items-start gap-3">
              <Heart className="mt-0.5 h-6 w-6 shrink-0 text-primary" aria-hidden />
              <p className="text-sm text-ink leading-relaxed">
                Små steg varje dag
                <br />
                skapar stora förändringar.
              </p>
            </div>
          </section>
        </MyFloveWide>

        {/* Liten insikt – bara när Flow faktiskt har något att säga. */}
        {flowSettings.enabled && flowSettings.learning && (
          <div style={{ order: 5 }} data-testid="home-flow-note" className="min-w-0 xl:col-span-6">
            <ExpandableBlock
              title="MyFlove har lagt märke till…"
              titleText="MyFlove har lagt märke till"
              area="flow"
              visual={<FlowMascot size="xs" mood="calm" bump className="flow-alive" alt="" />}
              subtitle="Små mönster i din egen data"
              status="Insikter"
              tone="lavender"
              surface="lavender"
              href="/insight"
              onNavigate={() => track("flow_learning_opened", { source: "hem" })}
            />
          </div>
        )}

        {/* Dagens medicin – samma data och samma avbockning som i Rutiner & medicin */}
        {shows("medicin") && (
          <section
            className="min-w-0 xl:col-span-3"
            style={pos("medicin")}
            aria-label="Rutiner och medicin"
          >
            <ExpandableBlock
              title="Rutiner & medicin"
              titleText="Rutiner och medicin"
              area="halsa"
              icon={Pill}
              subtitle="Dagens rutiner och doser"
              status="Idag"
              tone="blush"
              surface="blush"
            >
              <RoutinesMedicationToday />
            </ExpandableBlock>
          </section>
        )}

        {/* Områdesväljare – litet, längst ner */}
        {shows("omrade") && (
          <MyFloveWide style={pos("omrade")} className="space-y-2 pt-2">
            <AreaSwitcher size="sm" />
            <p className="text-xs text-muted-foreground">
              {activeArea === "alla"
                ? "MyFlove ser hela din dag – oavsett vilket rum sakerna hör till."
                : `Du är i ${AREA_META[activeArea].label.toLowerCase()}rummet. Resten väntar tills du vill se det.`}
            </p>
          </MyFloveWide>
        )}

        <MyFloveWide style={{ order: 98 }} className="space-y-3 pt-2">
          <AreaOnboarding />
        </MyFloveWide>

        {/* Liten, diskret notering längst ner – konkurrerar inte med korten. */}
        <MyFloveWide style={{ order: 98.5 }} data-testid="home-install-note" className="pt-1">
          <PwaInstallCard compact />
        </MyFloveWide>

        <MyFloveWide
          style={{ order: 99 }}
          className="flex flex-wrap items-center justify-center gap-4 pb-2 text-center"
        >
          <Link
            href="/oversikt"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
          >
            <Compass size={13} /> Så funkar MyFlove
          </Link>
          <Link
            href="/anpassa-hem"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
          >
            <SlidersHorizontal size={13} /> Anpassa hemskärmen
          </Link>
        </MyFloveWide>
      </MyFlovePageGrid>
    </Layout>
  );
}
