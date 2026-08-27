/**
 * Gemensam sanitizer för all appstatistik i MyFlove.
 *
 * Detta är den ENDA platsen där ett värde godkänns innan det lämnar klienten.
 * Reglerna är medvetet strikta: hellre tappa en etikett än att råka skicka
 * något personligt. Vi mäter användning – aldrig innehåll.
 *
 * Ett värde godkänns bara om det är en kort, teknisk etikett:
 * - max 32 tecken, inga mellanslag (fritext stoppas)
 * - bara bokstäver (a–z, å/ä/ö), siffror och - _ . : /
 * - aldrig e-post, URL, telefonnummer, personnummer eller belopp
 * - aldrig långa sifferserier (4+ siffror i rad)
 */

export const MAX_LABEL_LENGTH = 32;

const LABEL_PATTERN = /^[a-z0-9åäö._:/-]+$/i;
const LONG_DIGITS = /\d{4,}/;
const EMAIL_LIKE = /@/;
const URL_LIKE = /https?:|www\./i;

/** Nyckelord som aldrig får förekomma i en etikett, oavsett form. */
const FORBIDDEN_WORDS = [
  "mood",
  "humor",
  "humör",
  "energi",
  "energy",
  "medicin",
  "medication",
  "dos",
  "kr",
  "sek",
  "belopp",
  "amount",
  "note",
  "anteckning",
  "namn",
  "name",
  "email",
  "epost",
  "mail",
  "token",
  "password",
  "losenord",
  "lösenord",
];

/**
 * Returnerar en säker etikett, eller null om värdet inte får skickas.
 * Används för payload-värden såväl som för section/action-namn.
 */
export function sanitizeLabel(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > MAX_LABEL_LENGTH) return null;
  if (EMAIL_LIKE.test(trimmed) || URL_LIKE.test(trimmed)) return null;
  if (LONG_DIGITS.test(trimmed)) return null;
  if (!LABEL_PATTERN.test(trimmed)) return null;
  const lower = trimmed.toLowerCase();
  if (FORBIDDEN_WORDS.some((word) => lower.includes(word))) return null;
  return trimmed;
}

/**
 * Returnerar ett litet, avrundat antal (0–999) eller null.
 * Aldrig ett mätvärde om användaren – bara t.ex. antal steg.
 */
export function sanitizeCount(value: unknown): number | null {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.max(0, Math.min(999, Math.round(n)));
}

/** Sant om värdet är säkert att skicka som etikett. */
export function isSafeLabel(value: unknown): boolean {
  return sanitizeLabel(value) !== null;
}
