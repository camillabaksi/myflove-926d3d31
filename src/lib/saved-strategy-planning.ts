import type { SavedStrategy } from "@/hooks/use-insight";

/** Legacy demo-profile strategies must not appear as personal daily suggestions. */
export function personalSavedStrategies(saved: readonly SavedStrategy[]): SavedStrategy[] {
  return saved.filter((s) => !s.profileId && !!s.title?.trim() && !!s.strategyId);
}

/** A strategy is only a draft until Planera's ordinary review and save steps. */
export function addStrategyToPlanningDraft(current: string, title: string): string {
  const trimmed = title.trim();
  if (!trimmed || trimmed.length > 240 || /[\r\n]/.test(trimmed)) return current;
  const lines = current.split(/\r?\n/).map((x) => x.trim()).filter(Boolean);
  if (lines.some((line) => line.toLocaleLowerCase("sv-SE") === trimmed.toLocaleLowerCase("sv-SE"))) return current;
  if (lines.length >= 50 || (current + trimmed).length >= 12500) return current;
  return current.trim() ? `${current.replace(/\s+$/, "")}\n${trimmed}` : trimmed;
}

export function strategyInPlanningDraft(current: string, title: string): boolean {
  return current.split(/\r?\n/).some(line => line.trim().toLocaleLowerCase("sv-SE") === title.trim().toLocaleLowerCase("sv-SE"));
}
