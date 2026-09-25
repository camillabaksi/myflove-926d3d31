import { useEffect, useMemo, useState } from "react";
import { sceneForTask } from "@/components/flow/scenes";
import type { FlowScene } from "@/components/flow/flow-character";
import { useTasks, useReminders, useMedications } from "@/hooks/use-data";
import { useChildren } from "@/hooks/use-children";
import { useCapacityMode } from "@/hooks/use-capacity-mode";
import { useQuickCheckin } from "@/hooks/use-quick-checkin";
import { useWeather } from "@/hooks/use-weather";
import { useWeatherForecast, forecastAt, isWetHour } from "@/hooks/use-weather-forecast";
import { isWetWeather } from "@/components/flow/scenes";
import { useFlowLearning } from "@/hooks/use-flow-learning";
import { useFlowSettings } from "@/hooks/use-flow-settings";
import { learningMessage } from "@/lib/flow-learning";
import { todayISO } from "@/lib/day";
import { FLOW_DONE_EVENT } from "@/lib/flow-signal";
import { linkForPriority, priorityForTitle, withinWindow } from "@/lib/flow-priorities";
import { batteryLine, completionReaction, missedTaskLine } from "@/lib/flow-tone";
import { track } from "@/lib/analytics";

/**
 * Flow i den inloggade appen.
 *
 * Väljer EN kontext åt gången ur data som redan finns i MyFlove:
 * medicin, barn, väder, dagens aktivitet, batteri och incheckning.
 * Ingen ny datamodell – bara en prioritering av det som är mest relevant nu.
 *
 * Flow är proaktiv men aldrig tjatig: varje mening har ett id, kan viftas
 * bort för dagen och tystas helt i Flows inställningar.
 */

export interface FlowMoment {
  /** Stabilt id för meddelandet – används för "inte nu, tack". */
  id: string;
  scene: FlowScene;
  /** Kort mening i Flows röst. */
  message: string;
  /** Valfri knapp som använder befintlig logik. */
  action?: { label: string; run: () => void };
  /** Länk vidare till den vy som hör ihop med kontexten. */
  link?: { href: string; label: string };
  energy: number;
  kids: number;
  rain: boolean;
  /** Nyckel för variantval – stabil per kontext. */
  seed: number;
  /** Flow har inget att säga just nu (tyst läge eller bortviftat). */
  silent?: boolean;
  /** Meddelandet handlar om vad Flow lärt sig om dig. */
  learning?: boolean;
}

const toMinutes = (t?: string): number | null => {
  if (!t) return null;
  const [h, m] = t.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
};

const isKidTitle = (title: string) =>
  /barn|lämna|hämta|förskola|skolan|dagis|tjejer|killar/i.test(title);

const isOutdoorTitle = (title: string) =>
  /promenad|ut |ute|hund|träning|löp|cykel|lämna|hämta|handla|resa|buss|tåg|marknad/i.test(title);

/** Vart Flow ska länka beroende på vad som är på gång. */
const linkForTitle = (title: string) => linkForPriority(priorityForTitle(title));

export function useFlowMoment(): FlowMoment {
  const { activeTasks, updateTask } = useTasks();
  const { activeReminders } = useReminders();
  const { medications, isTaken, toggleTaken } = useMedications();
  const { children } = useChildren();
  const { percent: capacityPercent } = useCapacityMode();
  const { energyValue } = useQuickCheckin();
  const weather = useWeather();
  const forecast = useWeatherForecast();
  const knowledge = useFlowLearning();
  const { settings, isDismissed } = useFlowSettings();

  const [celebrating, setCelebrating] = useState(false);

  const [doneTitle, setDoneTitle] = useState<string | null>(null);
  const [doneMessage, setDoneMessage] = useState<string | null>(null);

  useEffect(() => {
    const onDone = (e: Event) => {
      const detail = (e as CustomEvent<{ title?: string; message?: string }>).detail;
      const title = detail?.title ?? null;
      setDoneTitle(title);
      setDoneMessage(detail?.message ?? null);
      setCelebrating(true);
      window.setTimeout(() => setCelebrating(false), 3200);
    };
    window.addEventListener(FLOW_DONE_EVENT, onDone);
    return () => window.removeEventListener(FLOW_DONE_EVENT, onDone);
  }, []);

  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const today = todayISO();
  const rain = isWetWeather(weather?.code);
  const sunny = weather != null && weather.code <= 1 && now.getHours() >= 7 && now.getHours() <= 19;
  const kids = children?.length ?? 0;
  const energy = capacityPercent;
  const level = settings.level;
  const learningOn = settings.learning;
  const knowledgeSeed = knowledge.level;
  const insightText = useMemo(
    () => learningMessage(knowledge, now.getDate() + now.getHours()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [knowledge, now.getDate()],
  );

  const todaysCount = useMemo(
    () =>
      activeTasks.filter((t) => !t.dueDate || t.dueDate === today).length +
      activeReminders.filter((r) => r.date === today).length,
    [activeTasks, activeReminders, today],
  );

  const waiting = useMemo(
    () =>
      activeTasks.filter((t) => !t.dueDate && Date.now() - t.createdAt > 1000 * 60 * 60 * 24 * 3)
        .length,
    [activeTasks],
  );

  const priorities = settings.priorities;
  const quietFrom = settings.quietFrom;
  const quietTo = settings.quietTo;
  const leadMinutes = settings.leadMinutes;

  return useMemo<FlowMoment>(() => {
    const base = { energy, kids, rain, seed: now.getDate() };
    const outsideWindow = !withinWindow(nowMin, quietFrom, quietTo);
    const quiet = level === "tyst" || outsideWindow;
    const wanted = (title: string) => priorities[priorityForTitle(title)] !== false;

    const pick = (moment: FlowMoment): FlowMoment =>
      isDismissed(moment.id)
        ? { ...base, id: "silent", scene: "rest", message: "", silent: true }
        : moment;

    if (celebrating) {
      /* Flows reaktion när något blir klart – varm, kort och kontextberoende. */
      const reaction = completionReaction({
        title: doneTitle,
        battery: energy,
        remainingToday: Math.max(0, todaysCount),
      });
      return {
        ...base,
        id: "done",
        scene: "done",
        message:
          doneMessage ??
          (reaction.followUp ? `${reaction.message} ${reaction.followUp}` : reaction.message),
        link: { href: "/idag", label: "Idag" },
      };
    }

    if (quiet) {
      return { ...base, id: "silent", scene: "rest", message: "", silent: true };
    }

    /* 1. Medicin – befintlig medicinlogik, kan stängas av i Flow-inställningarna. */
    if (priorities.medicin !== false)
      for (const med of medications) {
        for (const time of med.times ?? []) {
          const mins = toMinutes(time);
          if (mins == null) continue;
          if (nowMin < mins - 10 || nowMin > mins + 120) continue;
          if (isTaken(med.id, time)) continue;
          return pick({
            ...base,
            id: `med-${med.id}-${time}`,
            scene: "medicine",
            message: `Det är dags för ${med.name.toLowerCase()}.`,
            action: { label: "Jag har tagit den", run: () => toggleTaken(med.id, time) },
            link: { href: "/daglig-rutin", label: "Rutiner & medicin" },
          });
        }
      }

    /* 2. Morgonhälsning – Flow vinkar innan dagen börjat. */
    if (now.getHours() < 11 && energyValue == null) {
      return pick({
        ...base,
        id: `morning-${today}`,
        scene: "hello",
        message: "God morgon! 🌸 Hur känns dagen idag?",
        link: { href: "/idag", label: "Checka in" },
      });
    }

    /* 3. Nästa aktivitet idag – uppgifter och påminnelser som redan finns. */
    const upcoming = [
      ...activeTasks
        .filter((t) => (!t.dueDate || t.dueDate === today) && t.time)
        .map((t) => ({ title: t.title, mins: toMinutes(t.time) })),
      ...activeReminders
        .filter((r) => r.date === today && r.time)
        .map((r) => ({ title: r.title, mins: toMinutes(r.time) })),
    ]
      .filter((e): e is { title: string; mins: number } => e.mins != null)
      .filter((e) => e.mins >= nowMin - 30)
      .filter((e) => wanted(e.title))
      .sort((a, b) => a.mins - b.mins);

    const next = upcoming[0];

    /* 3a. Låg energi + mycket att göra – prioritera hellre än pusha. */
    if (energy <= 50 && todaysCount >= 4) {
      const veryLow = energy <= 30;
      return pick({
        ...base,
        id: `busy-low-${today}`,
        scene: "energyLow",
        message: veryLow
          ? `${todaysCount} saker står i dagen och energin är låg. Vi behöver inte allt idag – ska vi välja ut två?`
          : `Du har ${todaysCount} saker idag och energin verkar lite låg. Vill du att vi prioriterar tillsammans?`,
        link: { href: "/flowplan", label: "Prioritera med mig" },
      });
    }

    /* 3b. Regn när du ska vara utomhus – timprognos, inte bara vädret just nu. */
    const outdoor = upcoming.find(
      (e) => isOutdoorTitle(e.title) && e.mins - nowMin <= 360 && e.mins >= nowMin - 15,
    );
    if (outdoor) {
      const hour = Math.floor(outdoor.mins / 60);
      const at = forecastAt(forecast, hour);
      const wetThen = isWetHour(at) || (rain && outdoor.mins - nowMin <= 60);
      if (wetThen) {
        const time = `${String(hour).padStart(2, "0")}:${String(outdoor.mins % 60).padStart(2, "0")}`;
        const chance = at?.rainChance ?? 0;
        return pick({
          ...base,
          rain: true,
          id: `rain-out-${today}-${outdoor.mins}`,
          scene: "rain",
          message:
            chance >= 50 && !rain
              ? `Det ser ut att regna kring ${time} när du ska ut – ta med paraply. ☔`
              : `Det regnar när du ska ut kl ${time}. Paraply?`,
          link: { href: "/idag", label: "Idag" },
        });
      }
    }

    /* 3c. Viktig tid närmar sig – förvarning i god tid, med väg till rätt vy. */
    if (next && next.mins - nowMin > 10 && next.mins - nowMin <= Math.max(15, leadMinutes + 15)) {
      const inMins = Math.round((next.mins - nowMin) / 5) * 5;
      const clock = `${String(Math.floor(next.mins / 60)).padStart(2, "0")}:${String(next.mins % 60).padStart(2, "0")}`;
      return pick({
        ...base,
        id: `soon-${today}-${next.mins}`,
        scene: sceneForTask(next.title),
        message: `${next.title} kl ${clock} – om cirka ${inMins} minuter. Börja gärna göra dig klar nu.`,
        link: linkForTitle(next.title),
      });
    }

    if (next && next.mins - nowMin <= 120) {
      const time = `${String(Math.floor(next.mins / 60)).padStart(2, "0")}:${String(next.mins % 60).padStart(2, "0")}`;
      if (kids > 0 && isKidTitle(next.title)) {
        return pick({
          ...base,
          id: `kids-${today}-${next.mins}`,
          scene: "kids",
          message: rain
            ? `${next.title} kl ${time} – ta med paraply. ❤️`
            : `${next.title} kl ${time}. ❤️`,
          link: { href: "/idag", label: "Idag" },
        });
      }
      return pick({
        ...base,
        id: `next-${today}-${next.mins}`,
        scene: sceneForTask(next.title),
        message: `Härnäst: ${next.title} kl ${time}.`,
        link: { href: "/idag", label: "Idag" },
      });
    }

    /* 3d. Något passerade utan att bli gjort – aldrig skuld, alltid en väg vidare. */
    const missed = activeTasks
      .filter((t) => t.dueDate === today && t.time)
      .map((t) => ({ task: t, mins: toMinutes(t.time) }))
      .filter((e): e is { task: (typeof activeTasks)[number]; mins: number } => e.mins != null)
      .filter((e) => nowMin - e.mins >= 45 && nowMin - e.mins <= 600)
      .filter((e) => wanted(e.task.title))
      .sort((a, b) => a.mins - b.mins)[0];

    if (missed) {
      const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
      return pick({
        ...base,
        id: `missed-${missed.task.id}-${today}`,
        scene: energy <= 45 ? "energyLow" : "think",
        message: missedTaskLine(missed.task.title, energy),
        action: {
          label: "Flytta till imorgon",
          run: () => {
            track("flow_missed_task_action", { source: "flow", method: "flytta" });
            updateTask(missed.task.id, { dueDate: tomorrow });
          },
        },
        link: { href: "/idag", label: "Hantera i Idag" },
      });
    }

    /* 4. Saker som väntar – erbjud hjälp att sortera. */
    if (waiting >= 3) {
      return pick({
        ...base,
        id: `waiting-${today}`,
        scene: "think",
        message:
          "Jag hittade några saker som fortfarande väntar på dig. Vill du att jag hjälper dig sortera dem?",
        link: { href: "/quickflow", label: "Sortera med mig" },
      });
    }

    /* 5. Väder – bara när det påverkar något. */
    if (rain) {
      return pick({
        ...base,
        id: `rain-${today}`,
        scene: "rain",
        message: "Det regnar ute – ta med paraply om du ska ut.",
      });
    }
    if (sunny) {
      return pick({
        ...base,
        id: `sun-${today}`,
        scene: "sun",
        message: "Sol ute – passa på att få lite ljus.",
      });
    }

    /* 6. Energi – batteriet du redan har. */
    if (energy <= 35) {
      return pick({
        ...base,
        id: `energy-low-${today}`,
        scene: "energyLow",
        message: batteryLine(energy),
        link: { href: "/mitt-batteri", label: "Mitt batteri" },
      });
    }
    if (energy >= 70) {
      return pick({
        ...base,
        id: `energy-high-${today}`,
        scene: "energyHigh",
        message: batteryLine(energy),
        link: { href: "/mitt-batteri", label: "Mitt batteri" },
      });
    }

    /* 7. Kväll – vila och sömn. */
    if (now.getHours() >= 21) {
      return pick({
        ...base,
        id: `night-${today}`,
        scene: "sleep",
        message: "Dagen får landa nu. Sov gott. 🌙",
      });
    }

    /* 8. Lugnt läge – då kan Flow berätta vad han börjar lära sig. */
    if (learningOn && level === "aktiv") {
      return pick({
        ...base,
        id: `learning-${today}-${knowledgeSeed}`,
        scene: "think",
        message: insightText,
        learning: true,
        link: { href: "/insight", label: "Insikter" },
      });
    }

    if (energyValue == null) {
      return pick({
        ...base,
        id: `checkin-${today}`,
        scene: "think",
        message: "Hur känns det just nu? Registrera så anpassar jag förslagen.",
      });
    }

    return pick({
      ...base,
      id: "rest",
      scene: "rest",
      message: "Lugnt läge just nu. Jag finns här.",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    celebrating,
    doneTitle,
    doneMessage,
    priorities,
    quietFrom,
    quietTo,
    leadMinutes,

    medications,
    activeTasks,
    activeReminders,
    kids,
    rain,
    sunny,
    energy,
    energyValue,
    nowMin,
    today,
    todaysCount,
    waiting,
    updateTask,
    forecast,
    level,
    learningOn,
    insightText,
    knowledgeSeed,
    isDismissed,
  ]);
}
