import { useEffect, useMemo, useState } from "react";
import FlowLearningCard from "@/components/flow/flow-learning-card";
import { FlowMascot } from "@/components/flow-mascot";
import { MyFlovePageGrid, MyFloveWide } from "@/components/myflove/block";
import { ExpandableBlock } from "@/components/myflove/expandable-block";

import { useHomeLayout, type HomeBlockId } from "@/lib/home-layout";
import DidThisCta from "@/components/did-this-cta";
import { useFlowItems } from "@/hooks/use-flow-items";
import RoutinesMedicationToday from "@/components/routines-medication-today";

import { Link } from "wouter";
import Layout from "@/components/layout";
import CollapsibleSection from "@/components/collapsible-section";
import EnergyBattery from "@/components/energy-battery";
import { useEnergyBattery } from "@/hooks/use-energy-battery";
import { useUserProfile } from "@/hooks/use-user-profile";
import { getGreeting } from "@/lib/greeting";
import { useTasks } from "@/hooks/use-data";
import { suggestNow, type NowSuggestion } from "@/lib/flow-engine";

import { AreaOnboarding } from "@/components/area-onboarding";
import PwaInstallCard from "@/components/pwa-install-card";
import { AreaSwitcher } from "@/components/area-switcher";
import { AREA_META, useActiveArea } from "@/lib/life-areas";
import IntroTour from "@/components/intro-tour";
import FlowOnboarding from "@/components/flow-onboarding";
import { ArrowRight, SlidersHorizontal, Compass, Check, Pill } from "lucide-react";
import { todayISO } from "@/lib/day";
import { track } from "@/lib/analytics";
import { homeContextLine } from "@/lib/flow-tone";
import { useQuickCheckin } from "@/hooks/use-quick-checkin";
import { useFlowSettings } from "@/hooks/use-flow-settings";

/**
 * Tre vanliga situationer, formulerade som användarens egen tanke.
 * Ersätter produktnamn som "QuickFlow" och "Planera" på startsidan.
 */
interface Situation {
  href: string;
  emoji: string;
  thought: string;
  action: string;
  didThis?: boolean;
}

const SITUATIONS: Situation[] = [
  {
    href: "/flowplan",

    emoji: "🗓️",
    thought: "Jag behöver planera min dag",
    action: "Planera – ett förslag på dagens ordning",
  },
  {
    href: "/flow",
    emoji: "💜",
    thought: "Jag vet inte vad jag ska göra nu",
    action: "Flow hjälper dig – ett förslag i taget",
  },
  {
    href: "/quickflow",
    emoji: "⚡",
    thought: "Jag har mycket i huvudet",
    action: "QuickFlow – fånga tanken på tre sekunder",
  },
];

/**
 * Ett enda Flow-förslag – hämtat från samma motor som Flow → NU,
 * så att Hem, Idag och Flow alltid säger samma sak.
 */
function useFlowSuggestion(): NowSuggestion {
  const { reading } = useEnergyBattery();
  const { activeTasks } = useTasks();

  return useMemo(
    () =>
      suggestNow({
        tasks: activeTasks,
        batteryNow: reading.now,
        peakLabel: reading.peak?.label ?? null,
      }),
    [activeTasks, reading.now, reading.peak],
  );
}

export default function Home() {
  const { name, setName, lastVisit } = useUserProfile();
  const greeting = getGreeting({ name, lastVisit });
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(name);
  const { activeArea } = useActiveArea();
  const { reading } = useEnergyBattery();
  const { energyValue } = useQuickCheckin();
  const { tasks, activeTasks } = useTasks();
  const { settings: flowSettings } = useFlowSettings();
  const todayIso = todayISO();

  /* Hem säger olika saker beroende på dagen – samma kort, levande innehåll. */
  const completedToday = tasks.filter(
    (t) =>
      t.completed &&
      t.completedAt != null &&
      new Date(t.completedAt).toISOString().slice(0, 10) === todayIso,
  ).length;
  const remainingToday = activeTasks.filter((t) => !t.dueDate || t.dueDate === todayIso).length;
  const contextLine = homeContextLine({
    hour: new Date().getHours(),
    battery: Math.round(reading.now),
    completedToday,
    remainingToday,
    nextTitle: null,
    checkedIn: energyValue != null,
  });

  useEffect(() => {
    track("home_viewed");
  }, []);

  const { visible } = useHomeLayout();
  const shows = (id: HomeBlockId) => visible.includes(id);
  // Ordningen från "Anpassa hemskärmen" styrs via flex order.
  const pos = (id: HomeBlockId) => ({ order: visible.indexOf(id) });

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

      <MyFlovePageGrid className="gap-5">
        {/* Hero: välkommen, namn, kort undertext */}
        <MyFloveWide
           className="relative overflow-hidden rounded-3xl border border-border/60 p-6 pr-28 shadow-lifted pop-in sm:pr-36"
           style={{ background: heroGradient }}
         >
           <div className="pointer-events-none absolute -top-20 -right-16 h-40 w-40 rounded-full bg-blush opacity-60 blur-md" />
           <div className="pointer-events-none absolute -bottom-16 -left-10 h-32 w-32 rounded-full bg-mint opacity-50 blur-[2px]" />
           <div className="pointer-events-none absolute right-4 top-1 select-none sm:right-8" aria-hidden>
             <FlowMascot size="xl" mood="calm" className="flow-alive" alt="" />
           </div>

          <div className="relative space-y-2">
            <h1 className="text-3xl sm:text-4xl font-bold text-ink pr-14">{greeting.title}</h1>
            <p className="text-muted-foreground animate-fade-in">{contextLine}</p>
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

        {/* Mitt batteri – högst upp och ett enda helt klickbart kort. */}
        {shows("batteri") && (
          <section className="min-w-0" style={pos("batteri")} aria-label="Mitt batteri">
            <EnergyBattery
              widget
              href="/mitt-batteri"
              onNavigate={() => track("battery_opened", { source: "hem" })}
            />
          </section>
        )}

        {/* Flow – en liten notering, konkurrerar inte med dagen. */}
        {flowSettings.enabled && flowSettings.learning && (
          <div
            style={{ order: visible.indexOf("batteri") + 0.5 }}
            data-testid="home-flow-note"
            className="min-w-0"
          >
            <ExpandableBlock
              title="Flow lär känna dig"
              titleText="Flow lär känna dig"
              area="flow"
              visual={<FlowMascot size="xs" mood="calm" bump className="flow-alive" alt="" />}
              subtitle="Små mönster Flow lagt märke till"
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
          <section className="min-w-0" style={pos("medicin")} aria-label="Rutiner och medicin">
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

        {/* Dagens översikt – bara en sammanfattning. Hela listan bor i Idag. */}

        {shows("idag") && (
          <div className="min-w-0" style={pos("idag")}>
            <DaySummary />
          </div>
        )}

        {/* Vad behöver du just nu? – situationer, inte produktnamn */}
        {shows("vagar") && (
          <nav className="min-w-0" style={pos("vagar")} aria-label="Vad behöver du just nu">
            <ExpandableBlock
              title="Vad behöver du just nu?"
              titleText="Vad behöver du just nu"
              area="hem"
              icon={Compass}
              subtitle="Tre vanliga situationer"
              status="Välj väg"
              tone="lavender"
              surface="lavender"
            >
              <ul className="space-y-2">
                {SITUATIONS.map((s) => (
                  <li key={s.href}>
                    {s.didThis ? (
                      <DidThisCta
                        trigger={
                          <span className="group flex w-full items-center gap-3 rounded-2xl bg-card/70 px-3 py-3 text-left transition-colors hover:bg-card">
                            <span aria-hidden className="text-xl">
                              {s.emoji}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block text-sm text-ink">{s.thought}</span>
                              <span className="block text-xs text-muted-foreground">
                                {s.action}
                              </span>
                            </span>
                            <ArrowRight
                              size={16}
                              className="shrink-0 text-muted-foreground group-hover:text-foreground"
                            />
                          </span>
                        }
                      />
                    ) : (
                      <Link
                        href={s.href}
                        className="group flex items-center gap-3 rounded-2xl bg-card/70 px-3 py-3 transition-colors hover:bg-card"
                      >
                        <span aria-hidden className="text-xl">
                          {s.emoji}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm text-ink">{s.thought}</span>
                          <span className="block text-xs text-muted-foreground">{s.action}</span>
                        </span>
                        <ArrowRight
                          size={16}
                          className="shrink-0 text-muted-foreground group-hover:text-foreground"
                        />
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </ExpandableBlock>
          </nav>
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

        {/* Liten, diskret notering längst ner – konkurrerar inte med dagen. */}
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

import { MyFloveIcon } from "@/components/myflove";
import { areaProps } from "@/lib/areas";

/**
 * Dagens översikt på Hem – bara en sammanfattning i siffror.
 * Hela listan (och avbockningen) bor i Idag, så samma sak aldrig
 * visas som två kort på startsidan. Klick går till befintliga Idag-vyn.
 */
function DaySummary() {
  const { todayOpen, todayDone } = useFlowItems();
  const total = todayOpen.length + todayDone.length;

  // Komprimerat block i samma formspråk som Mitt batteri – klick går till
  // befintliga Idag-vyn.
  return (
    <Link
      href="/idag"
      data-testid="home-day-summary"
      aria-label={`Min dag, ${todayDone.length} av ${total} klart. Öppna Kalender – Idag.`}
      {...areaProps("idag")}
      className="press area-border relative flex min-h-[9rem] min-w-0 flex-col items-center gap-2.5 rounded-3xl border-2 bg-sky/50 p-4 text-center shadow-soft transition-shadow hover:shadow-lifted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:p-5"
    >
      <MyFloveIcon
        icon={Check}
        tone="sky"
        size="lg"
        className="area-bg-soft area-text rounded-full"
      />
      <span className="min-w-0">
        <span className="block font-display text-base font-bold leading-tight text-ink">
          Min dag
        </span>
        <span className="block text-xs text-muted-foreground">Öppna Kalender · Idag</span>
      </span>
      <span className="w-full space-y-1 border-t border-border/50 pt-3">
        <span className="area-text block font-display text-3xl font-bold leading-none">
          {total === 0 ? "0" : `${todayDone.length}/${total}`}
        </span>
        <span className="area-text block text-sm font-medium">
          {total === 0
            ? "Inget inplanerat"
            : total === todayDone.length
              ? "Allt klart"
              : `${todayDone.length} av ${total} klara · ${todayOpen.length} kvar`}
        </span>
      </span>
      <span
        aria-hidden="true"
        className="area-bg-soft area-text absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full"
      >
        <ArrowRight size={15} />
      </span>
    </Link>
  );
}
