import { useMemo, useState } from "react";
import HomeShortcuts from "@/components/home-shortcuts";
import QuickCheckin from "@/components/quick-checkin";
import { useHomeLayout, type HomeBlockId } from "@/lib/home-layout";
import { TaskQuickAdd, type QuickAddResult } from "@/components/task-quick-add";
import DidThisCta from "@/components/did-this-cta";
import TodayTasks from "@/components/today-tasks";
import DayEnergyFlow from "@/components/day-energy-flow";
import { Link } from "wouter";
import Layout from "@/components/layout";
import CollapsibleSection from "@/components/collapsible-section";
import EnergyBattery from "@/components/energy-battery";
import { useEnergyBattery } from "@/hooks/use-energy-battery";
import { useUserProfile } from "@/hooks/use-user-profile";
import { getGreeting } from "@/lib/greeting";
import { useTasks, useReminders, useMedications, type Task, type Reminder } from "@/hooks/use-data";
import { useCloudSyncedStorage } from "@/lib/cloud-storage";
import type { Routine } from "@/pages/routines";
import { useStudySchedule } from "@/hooks/use-study-schedule";
import { suggestNow, type NowSuggestion } from "@/lib/flow-engine";

import { AreaOnboarding } from "@/components/area-onboarding";
import { AreaSwitcher } from "@/components/area-switcher";
import { AREA_META, useActiveArea } from "@/lib/life-areas";
import IntroTour from "@/components/intro-tour";
import FlowOnboarding from "@/components/flow-onboarding";
import { CalendarDays, Sparkles, ArrowRight, SlidersHorizontal } from "lucide-react";

/**
 * Fyra vanliga situationer, formulerade som användarens egen tanke.
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
    href: "/tasks",
    emoji: "➕",
    thought: "Jag behöver planera något",
    action: "Lägg till en sak – med tid om du vill",
  },
  {
    href: "#did-this",
    emoji: "✅",
    thought: "Jag gjorde redan något",
    action: "Registrera det du hunnit med",
    didThis: true,
  },
  {
    href: "/flow",
    emoji: "💜",
    thought: "Jag vet inte vad jag ska göra nu",
    action: "Få ett förslag i taget",
  },
  {
    href: "/quickflow",
    emoji: "⚡",
    thought: "Jag har mycket i huvudet",
    action: "Skriv av dig – jag sorterar sen",
  },
];

/**
 * Nästa relevanta aktivitet idag – påminnelser, uppgifter, rutiner,
 * medicin och lektioner, sorterat efter klockslag.
 */
interface NextEvent {
  id: string;
  title: string;
  time: string;
  endTime?: string;
  emoji: string;
  source: "påminnelse" | "uppgift" | "rutin" | "medicin" | "lektion";
}

function parseTime(t?: string): number | null {
  if (!t) return null;
  const [h, m] = t.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}

function useNextEvent(): NextEvent | null {
  const { activeReminders } = useReminders();
  const { activeTasks } = useTasks();
  const { medications, isTaken } = useMedications();
  const [routines] = useCloudSyncedStorage<Routine[]>("myflove-routines", []);
  const { lectures } = useStudySchedule();
  const todayIso = new Date().toISOString().split("T")[0] as string;
  const nowMin = new Date().getHours() * 60 + new Date().getMinutes();

  return useMemo(() => {
    const list: NextEvent[] = [];

    for (const r of activeReminders) {
      if (r.date !== todayIso || !r.time) continue;
      list.push({
        id: `rem-${r.id}`,
        title: r.title,
        time: r.time,
        endTime: r.endTime,
        emoji: "🔔",
        source: "påminnelse",
      });
    }

    for (const t of activeTasks) {
      if (t.dueDate && t.dueDate !== todayIso) continue;
      if (!t.time) continue;
      list.push({
        id: `task-${t.id}`,
        title: t.title,
        time: t.time,
        endTime: t.endTime,
        emoji: "✅",
        source: "uppgift",
      });
    }

    for (const r of routines ?? []) {
      if (!r.enabled || !r.time) continue;
      list.push({
        id: `routine-${r.id}`,
        title: r.title,
        time: r.time,
        emoji: "🔁",
        source: "rutin",
      });
    }

    for (const med of medications) {
      for (const time of med.times) {
        if (isTaken(med.id, time)) continue;
        list.push({
          id: `med-${med.id}-${time}`,
          title: med.name,
          time,
          emoji: "💊",
          source: "medicin",
        });
      }
    }

    const weekday = (new Date().getDay() + 6) % 7;
    for (const l of lectures.filter((x) => x.weekday === weekday)) {
      list.push({
        id: `lecture-${l.id}`,
        title: l.title,
        time: l.start,
        endTime: l.end,
        emoji: "🎓",
        source: "lektion",
      });
    }

    const future = list
      .map((e) => ({ e, min: parseTime(e.time) ?? 0 }))
      .filter(({ min }) => min > nowMin)
      .sort((a, b) => a.min - b.min);

    return future[0]?.e ?? null;
  }, [activeReminders, activeTasks, medications, isTaken, routines, lectures, todayIso, nowMin]);
}

/**
 * Ett enda Flow-förslag – hämtat från samma motor som Flow → NU,
 * så att Hem, Min dag och Flow alltid säger samma sak.
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
  const { addTask } = useTasks();
  const { activeArea } = useActiveArea();
  const nextEvent = useNextEvent();
  const suggestion = useFlowSuggestion();
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

      <div className="flex flex-col gap-6">
        {/* Hero: välkommen, namn, kort undertext */}
        <div
          className="relative overflow-hidden rounded-3xl p-6 shadow-lifted border border-border/60 pop-in"
          style={{ background: heroGradient }}
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
            <h1 className="text-3xl sm:text-4xl font-bold text-ink pr-14">{greeting.title}</h1>
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

        {shows("checkin") && (
          <div style={pos("checkin")}>
            <QuickCheckin />
          </div>
        )}

        {shows("batteri") && (
          <section style={pos("batteri")} aria-label="Mitt energibatteri">
            <CollapsibleSection
              id="hem::batteri"
              title="Mitt energibatteri"
              headingClassName="text-sm font-semibold uppercase tracking-wide text-muted-foreground"
              className="space-y-3"
            >
              <EnergyBattery />
            </CollapsibleSection>
          </section>
        )}

        {/* Energins historik – samma data som Min energi, direkt under batteriet */}
        {shows("energifloede") && (
          <section style={pos("energifloede")} aria-label="Energins historik">
            <CollapsibleSection
              id="hem::energins-historik"
              title="Energins historik"
              headingClassName="text-sm font-semibold uppercase tracking-wide text-muted-foreground"
              className="space-y-3"
            >
              <DayEnergyFlow />
            </CollapsibleSection>
          </section>
        )}


        {/* Nästa – nästa relevanta aktivitet */}
        {shows("nasta") && (
          <section
            style={pos("nasta")}
            className="rounded-3xl border border-border/60 bg-card p-5 shadow-soft"
            aria-label="Nästa aktivitet"
          >
            <CollapsibleSection
              id="hem::nasta"
              title={
                <span className="flex items-center gap-2">
                  <CalendarDays size={18} className="text-primary" aria-hidden="true" /> Nästa
                </span>
              }
              headingClassName="text-sm font-semibold uppercase tracking-wide text-muted-foreground"
              className="space-y-3"
            >
              {nextEvent ? (
                <Link
                  href="/idag"
                  className="group flex items-center gap-4 rounded-2xl bg-secondary/40 p-4 transition-colors hover:bg-secondary/60"
                >
                  <span aria-hidden className="text-2xl">
                    {nextEvent.emoji}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-ink truncate">{nextEvent.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {nextEvent.time
                        ? `kl ${nextEvent.time}${nextEvent.endTime ? `–${nextEvent.endTime}` : ""}`
                        : "Saknar klockslag"}
                    </p>
                  </div>
                  <ArrowRight
                    size={18}
                    className="shrink-0 text-muted-foreground group-hover:text-foreground transition-colors"
                  />
                </Link>
              ) : (
                <div className="rounded-2xl bg-secondary/30 p-4 text-sm text-muted-foreground">
                  Ingen aktivitet inplanerad just nu. Lägg till en påminnelse eller uppgift så dyker
                  den upp här.
                </div>
              )}
            </CollapsibleSection>
          </section>
        )}

        {/* Dagens uppgifter – samma kort och avbockning som i Min dag */}
        {shows("idag") && (
          <div style={pos("idag")}>
            <TodayTasks />
          </div>
        )}

        {/* En rekommendation – samma svar som i Planera → Just nu */}
        {shows("forslag") && (
          <section
            style={pos("forslag")}
            className="rounded-3xl border border-primary/20 bg-primary/5 p-5 shadow-soft"
            aria-label="Rekommendation just nu"
          >
            <CollapsibleSection
              id="hem::flow-forslag"
              title={
                <span className="flex items-center gap-2">
                  <Sparkles size={18} className="text-primary" aria-hidden="true" /> Just nu
                </span>
              }
              headingClassName="text-sm font-semibold uppercase tracking-wide text-muted-foreground"
              className="space-y-3"
            >
              <p className="text-ink leading-relaxed">{suggestion.headline}</p>
              {suggestion.task && (
                <p className="mt-2 text-sm text-muted-foreground">
                  <span className="font-medium text-ink">{suggestion.task.title}</span>
                  {suggestion.minutes ? ` · ca ${suggestion.minutes} min` : ""}
                  {suggestion.reason ? ` – ${suggestion.reason}` : ""}
                </p>
              )}
              <Link
                href="/flow"
                className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
              >
                {suggestion.task ? "Öppna i Planera" : "Lägg till något"} <ArrowRight size={14} />
              </Link>
            </CollapsibleSection>
          </section>
        )}

        {/* Lägg till – snabbknapp */}
        {shows("lagg-till") && (
          <div style={pos("lagg-till")}>
            <TaskQuickAdd
              onAdd={(result: QuickAddResult) => {
                addTask(result.title, result.dueDate, {
                  time: result.time,
                  energyImpact: result.energyImpact,
                  friction: result.friction,
                  area: activeArea === "alla" ? "vardag" : activeArea,
                });
              }}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Planera något – med tid om du vill.
            </p>
          </div>
        )}

        {/* Dina genvägar – fyra egna favoriter */}
        {shows("genvagar") && (
          <div style={pos("genvagar")}>
            <HomeShortcuts />
          </div>
        )}

        {/* Vad behöver du just nu? – situationer, inte produktnamn */}
        {shows("vagar") && (
          <nav
            style={pos("vagar")}
            aria-label="Vad behöver du just nu"
            className="rounded-3xl border border-border/60 bg-card p-4 shadow-soft"
          >
            <CollapsibleSection
              id="hem::vagar"
              title="Vad behöver du just nu?"
              headingClassName="text-sm font-semibold uppercase tracking-wide text-muted-foreground"
              className="space-y-3"
            >
              <ul className="space-y-2">
                {SITUATIONS.map((s) => (
                  <li key={s.href}>
                    {s.didThis ? (
                      <DidThisCta
                        trigger={
                          <span className="group flex w-full items-center gap-3 rounded-2xl bg-secondary/30 px-3 py-3 text-left transition-colors hover:bg-secondary/60">
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
                              className="shrink-0 text-muted-foreground transition-colors group-hover:text-foreground"
                            />
                          </span>
                        }
                      />
                    ) : (
                      <Link
                        href={s.href}
                        className="group flex items-center gap-3 rounded-2xl bg-secondary/30 px-3 py-3 transition-colors hover:bg-secondary/60"
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
                          className="shrink-0 text-muted-foreground transition-colors group-hover:text-foreground"
                        />
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </CollapsibleSection>
          </nav>
        )}


        {/* Områdesväljare – litet, längst ner */}
        {shows("omrade") && (
          <div style={pos("omrade")} className="space-y-2 pt-2">
            <AreaSwitcher size="sm" />
            <p className="text-xs text-muted-foreground">
              {activeArea === "alla"
                ? "MyFlove ser hela din dag – oavsett vilket rum sakerna hör till."
                : `Du är i ${AREA_META[activeArea].label.toLowerCase()}rummet. Resten väntar tills du vill se det.`}
            </p>
          </div>
        )}

        <div style={{ order: 98 }} className="pt-2">
          <AreaOnboarding />
        </div>

        <div style={{ order: 99 }} className="pb-2 text-center">
          <Link
            href="/anpassa-hem"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
          >
            <SlidersHorizontal size={13} /> Anpassa hemskärmen
          </Link>
        </div>
      </div>
    </Layout>
  );
}
