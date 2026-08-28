/**
 * Samtalshistorik för "Prata med Flow".
 *
 * Ren logik utan React eller nätverk: titlar, relativa datum och sortering.
 * Chatthistorik är medvetet SKILT från Flows långsiktiga lärande – inget här
 * skriver till learning/insights, det är bara en personlig samtalslista.
 */

export interface ConversationSummary {
  id: string;
  title: string;
  updated_at: string;
}

/** Titel som är kort och mänsklig – aldrig "Chat 1" eller "New conversation". */
export function makeConversationTitle(firstMessage: string): string {
  const clean = (firstMessage ?? "").trim().replace(/\s+/g, " ");
  if (clean.length < 3) return "Nytt samtal";
  // Ta första meningen om den är lagom kort, annars klipp mjukt vid ordgräns.
  const sentence = clean.split(/(?<=[.!?])\s/)[0] ?? clean;
  const base = sentence.length >= 3 && sentence.length <= 48 ? sentence : clean;
  if (base.length <= 48) return base.replace(/[.!?]+$/, "");
  const cut = base.slice(0, 48);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > 20 ? cut.slice(0, lastSpace) : cut).trim()}…`;
}

/** Städar en titel användaren själv skriver. Tom text ger "Nytt samtal". */
export function normalizeConversationTitle(title: string): string {
  const clean = (title ?? "").trim().replace(/\s+/g, " ");
  if (!clean) return "Nytt samtal";
  return clean.length > 60 ? `${clean.slice(0, 60).trim()}…` : clean;
}

function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/** "Idag", "Igår", "I förrgår" – annars ett vanligt datum. */
export function relativeDayLabel(iso: string, now: Date = new Date()): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const days = Math.round((startOfDay(now) - startOfDay(date)) / 86_400_000);
  if (days <= 0) return "Idag";
  if (days === 1) return "Igår";
  if (days === 2) return "I förrgår";
  const sameYear = date.getFullYear() === now.getFullYear();
  return date.toLocaleDateString("sv-SE", {
    day: "numeric",
    month: "short",
    ...(sameYear ? {} : { year: "numeric" }),
  });
}

/** Senast använda samtal först. */
export function sortConversations<T extends ConversationSummary>(list: T[]): T[] {
  return [...list].sort(
    (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
  );
}
