/** Evening reflection only: do not add duplicate energy observations for an
 * activity that has already been explicitly logged during the same local day.
 * The caller must supply entries filtered to that calendar day.
 */
export function eveningEnergySourceKey(title: string): string {
  return title.toLocaleLowerCase("sv-SE").replace(/\s+/g, " ").trim();
}

export function pendingEveningEnergySources(
  chosen: readonly string[],
  recorded: readonly { title: string; direction: string }[],
  acknowledged: ReadonlySet<string> = new Set(),
): string[] {
  const seen = new Set([...acknowledged]);
  for (const entry of recorded) {
    if (entry.direction === "gives" || entry.direction === "both") {
      seen.add(eveningEnergySourceKey(entry.title));
    }
  }
  const pending: string[] = [];
  for (const title of chosen) {
    const key = eveningEnergySourceKey(title);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    pending.push(title.trim());
  }
  return pending;
}
