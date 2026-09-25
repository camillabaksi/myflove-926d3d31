/**
 * Startmotorn – ett löjligt litet första steg.
 *
 * Vid NPF är det sällan uppgiften i sig som stoppar, utan tröskeln att
 * initiera. Här översätts en aktivitet till EN konkret handling som tar
 * några sekunder, så att kroppen kommer igång innan hjärnan hinner emot.
 * Ren logik utan lagring – inget nytt datasystem.
 */

interface Rule {
  match: RegExp;
  step: string;
}

const RULES: Rule[] = [
  { match: /disk|diskmaskin/i, step: "Ställ dig vid diskbänken och ta bara ut det översta." },
  { match: /tvätt|tvätta/i, step: "Gå till tvättkorgen och lägg i en enda maskin." },
  {
    match: /städ|damm|dammsug|plocka|undan|rensa|sortera|garderob|bädda|golv/i,
    step: "Plocka undan tre saker. Sen får du sluta.",
  },

  { match: /mat|middag|frukost|lunch|laga|koka/i, step: "Öppna kylen och ta fram en enda sak." },
  { match: /handla|inköp|affär/i, step: "Skriv de tre viktigaste sakerna på listan." },
  {
    match: /plugg|läs|studer|tenta|prov|uppsats|lektion/i,
    step: "Sätt dig vid bordet och läs bara rubriken.",
  },
  { match: /mejl|mail|svara|ringa|samtal/i, step: "Öppna det och läs första meningen." },
  { match: /jobb|arbete|rapport|möte/i, step: "Öppna dokumentet och skriv en enda rad." },
  { match: /träna|promenad|gå ut|löp|gym/i, step: "Ta på dig skorna. Bara det." },
  { match: /dusch|tänder|morgon|kväll|sova/i, step: "Gå in i badrummet och tänd lampan." },
  { match: /medicin|tablett|vård|läkare/i, step: "Ta fram förpackningen och ställ den framför dig." },
  { match: /hämta|lämna|skjuts|förskola|skola/i, step: "Ta fram nycklar och ytterkläder." },
  { match: /betal|räkning|faktura|ekonomi/i, step: "Öppna appen och titta på summan." },
  { match: /pappers|blankett|ansök|formulär/i, step: "Lägg fram pappret och skriv ditt namn." },
];

/** Ett litet, konkret första steg för aktiviteten. */
export function microStepFor(title: string): string {
  const rule = RULES.find((r) => r.match.test(title));
  if (rule) return rule.step;
  return "Gör bara det allra första – res dig upp och gå dit saken ska göras.";
}

/** Startmotorns längd i sekunder. */
export const START_SECONDS = 120;

/** Landa-pausens längd i sekunder. */
export const LANDING_SECONDS = 120;

export function formatCountdown(secondsLeft: number): string {
  const m = Math.floor(secondsLeft / 60);
  const s = secondsLeft % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
