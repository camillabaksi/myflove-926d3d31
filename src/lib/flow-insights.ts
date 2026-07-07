// TODO: Replace this simulated logic with a real analysis/LLM call if richer insight is needed.
// For now, it uses simple heuristics over locally stored activity to reinforce what's going well.

import type { MoodEntry, Task, Focus } from "@/hooks/use-data";

function toDateString(timestamp: number): string {
  return new Date(timestamp).toISOString().split('T')[0] as string;
}

function daysBetween(a: string, b: string): number {
  return Math.round((new Date(a).getTime() - new Date(b).getTime()) / (1000 * 60 * 60 * 24));
}

function getCheckinStreak(moods: MoodEntry[]): number {
  if (moods.length === 0) return 0;
  const uniqueDays = Array.from(new Set(moods.map(m => toDateString(m.date)))).sort().reverse();
  let streak = 0;
  let cursor = new Date().toISOString().split('T')[0] as string;

  for (const day of uniqueDays) {
    const diff = daysBetween(cursor, day);
    if (diff === 0) {
      streak += 1;
      cursor = day;
    } else if (diff === 1) {
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
}

export function generateFlowInsights(moods: MoodEntry[], tasks: Task[], focusHistory: Focus | null): FlowInsight[] {
  const insights: FlowInsight[] = [];

  const checkinStreak = getCheckinStreak(moods);
  if (checkinStreak >= 2) {
    insights.push({
      emoji: "🔥",
      text: `Du har checkat in ditt mående ${checkinStreak} dagar i rad. Den vanan bygger självkännedom över tid.`,
    });
  } else if (moods.length > 0) {
    insights.push({
      emoji: "💚",
      text: "Du har börjat checka in ditt mående — bra start, fortsätt gärna imorgon också.",
    });
  }

  const now = Date.now();
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
  const recentMoods = moods.filter(m => m.date >= sevenDaysAgo);
  if (recentMoods.length > 0) {
    const avg = recentMoods.reduce((sum, m) => sum + m.score, 0) / recentMoods.length;
    if (avg >= 3.5) {
      insights.push({
        emoji: "🌤️",
        text: "Ditt mående har legat på den ljusare sidan den senaste veckan. Vad du än gör – det verkar fungera.",
      });
    } else if (recentMoods.length >= 3) {
      insights.push({
        emoji: "🌱",
        text: "Du har checkat in flera gånger denna vecka, även när det varit tungt. Det är i sig ett styrkebesked.",
      });
    }
  }

  const completedThisWeek = tasks.filter(
    t => t.completed && (Date.now() - t.createdAt) < 7 * 24 * 60 * 60 * 1000
  );
  if (completedThisWeek.length > 0) {
    insights.push({
      emoji: "✅",
      text: `Du har klarat av ${completedThisWeek.length} ${completedThisWeek.length === 1 ? "uppgift" : "uppgifter"} den senaste veckan. Bra jobbat!`,
    });
  }

  if (focusHistory?.completed) {
    insights.push({
      emoji: "🎯",
      text: `Du klarade dagens fokus "${focusHistory.text}". Att välja en enda sak och genomföra den är inte alltid lätt.`,
    });
  }

  if (insights.length === 0) {
    insights.push({
      emoji: "✨",
      text: "Du är här och tar dig tid att reflektera — det räcker som ett bra steg idag.",
    });
  }

  return insights;
}
