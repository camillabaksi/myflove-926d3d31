import type { MoodEntry, Task } from "@/hooks/use-data";

function toDateString(timestamp: number): string {
  return dayOf(timestamp) ?? todayISO();
}

function daysBetween(a: string, b: string): number {
  return Math.round((new Date(a).getTime() - new Date(b).getTime()) / (1000 * 60 * 60 * 24));
}

function getCheckinStreak(moods: MoodEntry[]): number {
  if (moods.length === 0) return 0;
  const uniqueDays = Array.from(new Set(moods.map((m) => toDateString(m.date))))
    .sort()
    .reverse();
  let streak = 0;
  let cursor = todayISO();

  for (const day of uniqueDays) {
    const diff = daysBetween(cursor, day);
    if (diff === 0 || diff === 1) {
      streak += 1;
      cursor = day;
    } else {
      break;
    }
  }
  return streak;
}

export interface Achievement {
  id: string;
  emoji: string;
  title: string;
  description: string;
  unlocked: boolean;
}

export interface AchievementInput {
  moods: MoodEntry[];
  completedTasks: Task[];
  pomodoroTotalSessions: number;
  completedFocusCount: number;
  medicationLogCount: number;
}

export function getAchievements(input: AchievementInput): Achievement[] {
  const { moods, completedTasks, pomodoroTotalSessions, completedFocusCount, medicationLogCount } =
    input;
  const checkinStreak = getCheckinStreak(moods);

  return [
    {
      id: "first-checkin",
      emoji: "💚",
      title: "Första steget",
      description: "Checka in ditt mående för första gången",
      unlocked: moods.length >= 1,
    },
    {
      id: "streak-3",
      emoji: "🔥",
      title: "3 dagar i rad",
      description: "Checka in ditt mående 3 dagar i rad",
      unlocked: checkinStreak >= 3,
    },
    {
      id: "streak-7",
      emoji: "🌟",
      title: "En vecka stark",
      description: "Checka in ditt mående 7 dagar i rad",
      unlocked: checkinStreak >= 7,
    },
    {
      id: "tasks-5",
      emoji: "✅",
      title: "Uppgiftsproffs",
      description: "Klara av 5 uppgifter",
      unlocked: completedTasks.length >= 5,
    },
    {
      id: "tasks-20",
      emoji: "🏆",
      title: "Att göra-mästare",
      description: "Klara av 20 uppgifter",
      unlocked: completedTasks.length >= 20,
    },
    {
      id: "focus-1",
      emoji: "🎯",
      title: "Fokuserad",
      description: "Slutför ditt första dagliga fokus",
      unlocked: completedFocusCount >= 1,
    },
    {
      id: "focus-10",
      emoji: "🧭",
      title: "Målinriktad",
      description: "Slutför dagens fokus 10 gånger",
      unlocked: completedFocusCount >= 10,
    },
    {
      id: "pomodoro-1",
      emoji: "⏱️",
      title: "Första fokuspasset",
      description: "Genomför ditt första Pomodoro-pass",
      unlocked: pomodoroTotalSessions >= 1,
    },
    {
      id: "pomodoro-10",
      emoji: "🧠",
      title: "Fokusmästare",
      description: "Genomför 10 Pomodoro-pass",
      unlocked: pomodoroTotalSessions >= 10,
    },
    {
      id: "medication-1",
      emoji: "💊",
      title: "Medicinrutin startad",
      description: "Bocka av en medicin för första gången",
      unlocked: medicationLogCount >= 1,
    },
  ];
}
