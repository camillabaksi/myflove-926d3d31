import { categoryEmoji, categoryLabel, type EnergyFactorEntry } from "@/lib/energy-flow";

/**
 * Sammanställer vad som oftast gett respektive tagit energi, per kategori.
 * Bygger enbart på användarens egna svar – visar aldrig titlar eller anteckningar.
 * En kategori visas först med minst MIN_ANSWERS svar.
 */
export const MIN_ANSWERS = 3;

export interface HelpDrainItem {
  category: string;
  label: string;
  emoji: string;
  answers: number;
  /** Andel svar åt det hållet, 0–100. */
  share: number;
}

export function buildHelpsDrains(entries: EnergyFactorEntry[]) {
  const byCat = new Map<string, { gives: number; drains: number; total: number }>();
  for (const e of entries) {
    const c = byCat.get(e.category) ?? { gives: 0, drains: 0, total: 0 };
    c.total += 1;
    if (e.direction === "gives") c.gives += 1;
    if (e.direction === "drains") c.drains += 1;
    byCat.set(e.category, c);
  }
  const helps: HelpDrainItem[] = [];
  const drains: HelpDrainItem[] = [];
  for (const [category, c] of byCat) {
    if (c.total < MIN_ANSWERS) continue;
    const base = { category, label: categoryLabel(category), emoji: categoryEmoji(category), answers: c.total };
    if (c.gives > c.drains) helps.push({ ...base, share: Math.round((c.gives / c.total) * 100) });
    else if (c.drains > c.gives) drains.push({ ...base, share: Math.round((c.drains / c.total) * 100) });
  }
  const sort = (a: HelpDrainItem, b: HelpDrainItem) => b.share - a.share || b.answers - a.answers;
  return { helps: helps.sort(sort).slice(0, 3), drains: drains.sort(sort).slice(0, 3) };
}
