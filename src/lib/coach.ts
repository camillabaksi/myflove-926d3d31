// TODO: Replace this simulated heuristic logic with a real LLM-backed coach if richer,
// more personalized guidance is needed. For now it reasons over local activity data.

import type { MoodEntry, Task, Focus, Reminder } from "@/hooks/use-data";
import { dayOf, todayISO } from "@/lib/day";

export interface CoachMessage {
  emoji: string;
  text: string;
  ctaLabel?: string;
  ctaHref?: string;
}

function toDateString(timestamp: number): string {
  return dayOf(timestamp) ?? todayISO();
}

export interface CoachInput {
  moods: MoodEntry[];
  activeTasks: Task[];
  currentFocus: Focus | null;
  activeReminders: Reminder[];
  pomodoroTodaySessions: number;
}

export function generateCoachMessage(input: CoachInput): CoachMessage {
  const { moods, activeTasks, currentFocus, activeReminders, pomodoroTodaySessions } = input;
  const todayStr = todayISO();
  const todayMoods = moods.filter((m) => toDateString(m.date) === todayStr);
  const lastMood = todayMoods[0];

  if (lastMood && lastMood.score <= 2) {
    return {
      emoji: "🫂",
      text: "Du checkade in att det känns tungt idag. Vill du ta det lugnt och bara välja en enda liten sak att göra?",
      ctaLabel: "Jag är överväldigad",
      ctaHref: "/",
    };
  }

  if (!lastMood) {
    return {
      emoji: "👋",
      text: "Du har inte checkat in ditt mående idag än. Ett par sekunder räcker för att sätta ord på hur du har det.",
      ctaLabel: "Checka in mående",
      ctaHref: "/mitt-batteri",
    };
  }

  if (!currentFocus) {
    return {
      emoji: "🎯",
      text: "Du har inte valt ett fokus för idag. Vad är den enda sak som skulle göra dagen bra om du klarade den?",
      ctaLabel: "Sätt dagens fokus",
      ctaHref: "/flow",
    };
  }

  if (currentFocus && !currentFocus.completed && pomodoroTodaySessions === 0) {
    return {
      emoji: "⏱️",
      text: `Ditt fokus idag är "${currentFocus.text}". Ett 25-minuters fokuspass kan vara ett bra sätt att komma igång.`,
      ctaLabel: "Starta ett fokuspass",
      ctaHref: "/pomodoro",
    };
  }

  if (currentFocus?.completed) {
    return {
      emoji: "🎉",
      text: `Du har redan klarat dagens fokus "${currentFocus.text}". Vill du välja något mer att göra, eller är det en bra dag att stanna där?`,
    };
  }

  if (activeReminders.length > 0) {
    const next = activeReminders[0]!;
    return {
      emoji: "🔔",
      text: `Du har "${next.title}" inplanerat. Vill du förbereda dig lite för det?`,
    };
  }

  if (activeTasks.length > 3) {
    return {
      emoji: "📋",
      text: `Du har ${activeTasks.length} saker kvar på din att göra-lista. Det behöver inte göras allt idag — välj en och låt resten vänta.`,
      ctaLabel: "Se att göra-listan",
      ctaHref: "/tasks",
    };
  }

  return {
    emoji: "✨",
    text: "Det ser lugnt ut just nu. Bra läge att göra något som fyller på energin, eller bara vila lite.",
  };
}
