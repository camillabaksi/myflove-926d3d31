import { useEffect, useMemo, useState } from "react";
import FlowLearningCard from "@/components/flow/flow-learning-card";
import { FlowMascot } from "@/components/flow-mascot";

import { useHomeLayout, type HomeBlockId } from "@/lib/home-layout";
import { TaskQuickAdd, type QuickAddResult } from "@/components/task-quick-add";
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
import { useTasks, useReminders, useMedications, type Task, type Reminder } from "@/hooks/use-data";
import { useCloudSyncedStorage } from "@/lib/cloud-storage";
import type { Routine } from "@/pages/routines";
import { useStudySchedule } from "@/hooks/use-study-schedule";
import { suggestNow, type NowSuggestion } from "@/lib/flow-engine";

import { AreaOnboarding } from "@/components/area-onboarding";
import PwaInstallCard from "@/components/pwa-install-card";
import { AreaSwitcher } from "@/components/area-switcher";
import { AREA_META, useActiveArea } from "@/lib/life-areas";
import IntroTour from "@/components/intro-tour";
import FlowOnboarding from "@/components/flow-onboarding";
import { CalendarDays, Sparkles, ArrowRight, SlidersHorizontal, Compass } from "lucide-react";
import { todayISO } from "@/lib/day";
import { track } from "@/lib/analytics";
import { homeContextLine } from "@/lib/flow-tone";
import { useQuickCheckin } from "@/hooks/use-quick-checkin";

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
    href: "/idag",

    emoji: "🗓️",
    thought: "Jag behöver planera min dag",
    action: "Idag – hela dagens lista",
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
  const todayIso = todayISO();
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
  const { addTask } = useTasks();
  const { activeArea } = useActiveArea();
  const nextEvent = useNextEvent();
  const suggestion = useFlowSuggestion();
  const { reading } = useEnergyBattery();
  const { energyValue } = useQuickCheckin();
  const { tasks, activeTasks } = useTasks();
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
    nextTitle: nextEvent?.title ?? null,
    checkedIn: energyValue != null,
  });
  /* Samma sak ska aldrig visas både som "Nästa" och som Flows förslag. */
  const samsomNasta =
    !!suggestion.task &&
    !!nextEvent &&
    suggestion.task.title.trim().toLowerCase() === nextEvent.title.trim().toLowerCase();

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
        </div>

        {/* Mitt batteri – högst upp och ett enda helt klickbart kort. */}
        {shows("batteri") && (
          <section style={pos("batteri")} aria-label="Mitt batteri" className="space-y-2">
            <CollapsibleSection
              id="hem::mitt-batteri"
              title="Mitt batteri"
              headingClassName="text-sm font-semibold uppercase tracking-wide text-muted-foreground"
              className="space-y-2"
            >
              <EnergyBattery
                href="/mitt-batteri"
                onNavigate={() => track("battery_opened", { source: "hem" })}
              />
            </CollapsibleSection>
          </section>
        )}

        {/* Flow – en liten notering längst ner, konkurrerar inte med dagen. */}
        <div style={{ order: 98.4 }} data-testid="home-flow-note" className="pt-1">
          <FlowLearningCard />
        </div>

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
              <p className="text-xs text-muted-foreground">
                Det som händer närmast – tryck för att se hela dagen.
              </p>
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

        {/* Dagens medicin – samma data och samma avbockning som i Rutiner & medicin */}
        {shows("medicin") && (
          <section
            style={pos("medicin")}
            className="rounded-3xl border border-border/60 bg-card p-5 shadow-soft"
            aria-label="Rutiner och medicin"
          >
            <CollapsibleSection
              id="hem::rutiner-medicin"
              title={
                <span className="flex items-center gap-2">
                  <span aria-hidden>🔁💊</span> Rutiner &amp; medicin
                </span>
              }
              headingClassName="text-sm font-semibold uppercase tracking-wide text-muted-foreground"
              className="space-y-3"
            >
              <RoutinesMedicationToday />
            </CollapsibleSection>
          </section>
        )}

        {/* Dagens översikt – bara en sammanfattning. Hela listan bor i Idag. */}

        {shows("idag") && (
          <div style={pos("idag")}>
            <DaySummary />
          </div>
        )}

        {/* Flow just nu – samma förslag som i Planera, tydligt signerat Flow */}
        {shows("forslag") && (
          <section
            style={pos("forslag")}
            className="rounded-3xl border border-primary/20 bg-primary/5 p-5 shadow-soft"
            aria-label="Flows förslag just nu"
          >
            <CollapsibleSection
              id="hem::flow-forslag"
              title={
                <span className="flex items-center gap-2">
                  <FlowMascot size="xs" mood="nod" bump className="flow-alive" alt="" />
                  <Sparkles size={16} className="text-primary" aria-hidden="true" /> Flow · just nu
                </span>
              }
              headingClassName="text-sm font-semibold uppercase tracking-wide text-muted-foreground"
              className="space-y-3"
            >
              <p className="text-ink leading-relaxed">{suggestion.headline}</p>
              <p className="text-xs text-muted-foreground">
                Det här tror jag skulle passa bäst just nu. Du väljer själv.
              </p>
              {suggestion.task && !samsomNasta && (
                <p className="mt-2 text-sm text-muted-foreground">
                  <span className="font-medium text-ink">{suggestion.task.title}</span>
                  {suggestion.minutes ? ` · ca ${suggestion.minutes} min` : ""}
                  {suggestion.reason ? ` – ${suggestion.reason}` : ""}
                </p>
              )}
              <Link
                href={suggestion.task ? "/idag" : "/quickflow"}
                className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
              >
                {suggestion.task ? "Planera i Idag" : "Fånga något i QuickFlow"}{" "}
                <ArrowRight size={14} />
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
              Lägg till något i dagen – med tid om du vill.
            </p>
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
                <p className="text-xs text-muted-foreground">
                  Välj känslan du har just nu – Flow tar dig till rätt ställe.
                </p>
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

        <div style={{ order: 98 }} className="space-y-3 pt-2">
          <AreaOnboarding />
        </div>

        {/* Liten, diskret notering längst ner – konkurrerar inte med dagen. */}
        <div style={{ order: 98.5 }} data-testid="home-install-note" className="pt-1">
          <PwaInstallCard compact />
        </div>

        <div
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
        </div>
      </div>
    </Layout>
  );
}

/**
 * Dagens översikt på Hem – bara en sammanfattning i siffror.
 * Hela listan (och avbockningen) bor i Min dag, så samma sak aldrig
 * visas som två kort på startsidan.
 */
function DaySummary() {
  const { todayOpen, todayDone } = useFlowItems();
  const total = todayOpen.length + todayDone.length;

  return (
    <section
      className="rounded-3xl border border-border/60 bg-card p-5 shadow-soft"
      aria-label="Dagens översikt"
    >
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Dagens översikt
      </h2>
      <p className="mt-2 text-ink">
        {total === 0
          ? "Inget inplanerat idag ännu."
          : `${total} ${total === 1 ? "sak" : "saker"} idag · ${todayDone.length} ${
              todayDone.length === 1 ? "klar" : "klara"
            } · ${todayOpen.length} kvar`}
      </p>
      <Link
        href="/idag"
        className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
      >
        Se hela dagen i Idag <ArrowRight size={14} />
      </Link>
    </section>
  );
}
