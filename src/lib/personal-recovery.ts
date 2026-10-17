import type { EnergyFactorEntry } from "@/lib/energy-flow";

/** Read-only suggestions based on actual, user-recorded energy effects. */
export interface PersonalRecoverySuggestion {
  title: string;
  positiveCount: number;
  latestAt: string;
  repeated: boolean;
}

export function personalRecoverySuggestions(
  entries: EnergyFactorEntry[],
  options: { now?: number; max?: number } = {},
): PersonalRecoverySuggestion[] {
  const now = options.now ?? Date.now();
  const groups = new Map<string, { title: string; positiveCount: number; latestAt: string; latestMs: number; negativeCount: number }>();
  for (const entry of entries) {
    const title = entry.title.trim();
    const key = title.toLocaleLowerCase("sv-SE").replace(/\\s+/g, " ");
    const timestamp = Date.parse(entry.occurredAt);
    if (!title || !Number.isFinite(timestamp) || timestamp > now || timestamp < now - 60 * 86400000) continue;
    if (entry.direction !== "gives" && entry.direction !== "drains" && entry.direction !== "both") continue;
    const existing = groups.get(key) ?? { title, positiveCount: 0, latestAt: entry.occurredAt, latestMs: timestamp, negativeCount: 0 };
    if (entry.direction === "gives") existing.positiveCount += 1;
    else existing.negativeCount += 1;
    if (timestamp > existing.latestMs) {
      existing.title = title;
      existing.latestAt = entry.occurredAt;
      existing.latestMs = timestamp;
    }
    groups.set(key, existing);
  }
  return [...groups.values()]
    .filter(group => group.positiveCount > 0 && group.negativeCount === 0)
    .sort((a, b) => b.positiveCount - a.positiveCount || b.latestMs - a.latestMs)
    .slice(0, options.max ?? 3)
    .map(({ title, positiveCount, latestAt }) => ({ title, positiveCount, latestAt, repeated: positiveCount >= 2 }));
}
