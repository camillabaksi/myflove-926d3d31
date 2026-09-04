// QuickFlow – lång text vs flera saker.
//
// Ren logik som avgör OM en text *ser ut* som en längre anteckning.
// Den bestämmer aldrig något själv: UI:t frågar alltid användaren,
// och originaltexten sparas alltid oförändrad.

/** Texter längre än så här är nästan alltid en tanketömning, inte en lista. */
const LONG_CHARS = 180;
/** Reflekterande texter räknas som anteckning redan vid den här längden. */
const REFLECTIVE_CHARS = 100;
const LONG_WORDS = 35;

const REFLECTIVE_PHRASES = [
  "jag känner",
  "jag tänker",
  "jag funderar",
  "behöver fundera",
  "snurrar i huvudet",
  "det är så mycket",
  "jag vet inte",
  "jag orkar inte",
  "jag skulle vilja",
  "jag drömmer",
  "hur vi ska",
  "hur jag ska",
];

export function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Ser texten ut som en längre anteckning?
 * Ett förslag – aldrig ett beslut.
 */
export function looksLikeLongNote(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;
  if (trimmed.length >= LONG_CHARS) return true;
  if (wordCount(trimmed) >= LONG_WORDS) return true;
  const lower = trimmed.toLowerCase();
  return (
    trimmed.length >= REFLECTIVE_CHARS && REFLECTIVE_PHRASES.some((p) => lower.includes(p))
  );
}

/** Förslag på titel – första meningen, kortad. Aldrig obligatorisk. */
export function suggestNoteTitle(text: string, max = 60): string {
  const first = text.trim().split(/(?<=[.!?])\s+/)[0]?.trim() ?? text.trim();
  if (first.length <= max) return first;
  const cut = first.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > 20 ? cut.slice(0, lastSpace) : cut).trim()}…`;
}
