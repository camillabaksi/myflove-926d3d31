// Äkta insikter: allt här härleds ur användarens egen data.
//
// Regler:
//  • Ingen påhittad slutsats. Saknas underlag returneras en tom lista och
//    vyn visar ett lugnt tomläge i stället för en generisk uppmuntran.
//  • Varje insikt bär med sig sitt underlag (`basis`) så att användaren ser
//    vad påståendet bygger på.
//  • Minsta underlag per insikt, så att en enstaka logg aldrig blir ett mönster.

import type { MoodEntry, Task, Focus } from "@/hooks/use-data";
import { dayOf, todayISO } from "@/lib/day";

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

export interface FlowInsight {
  emoji: string;
  text: string;
  /** Vad påståendet bygger på – visas diskret under insikten. */
  basis: string;
}

/** Minsta antal loggar/händelser innan vi vågar säga något om ett mönster. */
export const MIN_MOOD_ENTRIES = 3;
export const MIN_STREAK_DAYS = 2;

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/** När blev uppgiften klar? Faller tillbaka på createdAt endast om tidpunkt saknas. */
function completedTime(task: Task): number | undefined {
  if (!task.completed) return undefined;
  return task.completedAt ?? undefined;
}

export function generateFlowInsights(
  moods: MoodEntry[],
  tasks: Task[],
  focusHistory: Focus | null,
): FlowInsight[] {
  const insights: FlowInsight[] = [];
  const now = Date.now();
  const weekAgo = now - WEEK_MS;

  /* Incheckningar i rad – bara när det faktiskt är flera dagar. */
  const checkinStreak = getCheckinStreak(moods);
  if (checkinStreak >= MIN_STREAK_DAYS) {
    insights.push({
      emoji: "🔥",
      text: `Du har checkat in ditt mående ${checkinStreak} dagar i rad.`,
      basis: `${checkinStreak} dagar med incheckning`,
    });
  }

  /* Måendetrend – kräver minst tre loggar den senaste veckan. */
  const recentMoods = moods.filter((m) => m.date >= weekAgo);
  if (recentMoods.length >= MIN_MOOD_ENTRIES) {
    const avg = recentMoods.reduce((sum, m) => sum + m.score, 0) / recentMoods.length;
    if (avg >= 3.5) {
      insights.push({
        emoji: "🌤️",
        text: "Ditt mående har legat på den ljusare sidan den senaste veckan.",
        basis: `${recentMoods.length} incheckningar, snitt ${avg.toFixed(1)} av 5`,
      });
    } else if (avg <= 2.5) {
      insights.push({
        emoji: "🌱",
        text: "Veckan har varit tyngre än vanligt. Det kan vara läge att ta i mindre bitar.",
        basis: `${recentMoods.length} incheckningar, snitt ${avg.toFixed(1)} av 5`,
      });
    } else {
      insights.push({
        emoji: "🌤️",
        text: "Ditt mående har legat ganska jämnt den senaste veckan.",
        basis: `${recentMoods.length} incheckningar, snitt ${avg.toFixed(1)} av 5`,
      });
    }
  }

  /* Avklarade uppgifter – räknas på när de faktiskt blev klara. */
  const completedThisWeek = tasks.filter((t) => {
    const at = completedTime(t);
    return at != null && at >= weekAgo;
  });
  if (completedThisWeek.length > 0) {
    insights.push({
      emoji: "✅",
      text: `Du har klarat av ${completedThisWeek.length} ${
        completedThisWeek.length === 1 ? "uppgift" : "uppgifter"
      } den senaste veckan.`,
      basis: "avklarade uppgifter senaste 7 dagarna",
    });
  }

  /* Dagens fokus – en faktisk händelse, inte ett mönster. */
  if (focusHistory?.completed && focusHistory.date === todayISO()) {
    insights.push({
      emoji: "🎯",
      text: `Du klarade dagens fokus: "${focusHistory.text}".`,
      basis: "dagens fokus",
    });
  }

  return insights;
}
