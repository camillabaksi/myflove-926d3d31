/**
 * Hälsologgning vs. aktivitet – en produktregel, samlad på ett ställe.
 *
 * MyFlove skiljer strikt på två saker:
 *
 *  1. Sådant användaren ska GÖRA  → uppgifter, kalender, Idag, Planera.
 *  2. Sådant användaren REGISTRERAR om sig själv → energi, mående, sömn,
 *     stress, kroppsliga observationer, återhämtning, "vad som påverkar".
 *
 * Hälsodata är alltid DATA. Den får aldrig på egen hand bli en aktivitet,
 * hamna i dagens lista eller räknas som "en sak att göra idag". Endast ett
 * aktivt användarval (t.ex. "Ja, lägg till en paus") får skapa en aktivitet.
 *
 * Filen innehåller bara ren logik och används av QuickFlow-tolkningen så att
 * en hälsoobservation föreslås som energi-/måendelogg i stället för kalender.
 */

/** Ord som betyder "det här är en bokad sak att göra", inte en observation. */
const ACTIVITY_INTENT =
  /(boka|bokat|ring|ringa|beställ|avboka|omboka|tid hos|besök hos|träna|träning|gym|pass\b|promenad|recept|hämta ut|apoteket)/;

/** Ord som betyder "det här är något jag registrerar om mig själv". */
const HEALTH_OBSERVATION =
  /(sov \d|sovit|sömn|somna|vaknade|trött|utmattad|orkade inte|orkeslös|energi\s*\d|låg energi|hög energi|batteriet|mår (bra|dåligt|sådär)|mående|nedstämd|ångest|stress(ad|en)?\b|överbelast|huvudvärk|migrän|illamående|yr\b|smärta|värk|ont i|kropp\w*|återhämt|vilade|vilat|krasch|överstimulerad|för mycket ljud|infektion|feber|mens)/;

/**
 * Är texten en hälsoobservation (loggning) snarare än en aktivitet?
 * "Sov 5 timmar" → true. "Boka läkare" / "Träning kl 18" → false.
 */
export function isHealthObservation(text: string): boolean {
  const t = text.toLowerCase();
  if (ACTIVITY_INTENT.test(t)) return false;
  return HEALTH_OBSERVATION.test(t);
}
