/**
 * Bildstöd: enkel nyckelordsmatchning från titel till en tydlig symbol.
 * Tanken är AKK-liknande stöd – en stor bild per händelse gör dagen
 * lättare att läsa av utan att behöva läsa texten.
 */

type Rule = { emoji: string; words: string[] };

const RULES: Rule[] = [
  { emoji: "🦷", words: ["tandläkare", "tandvård", "tandhygien"] },
  { emoji: "🏥", words: ["läkare", "vårdcentral", "sjukhus", "bvc", "vaccin", "besök hos", "mottagning"] },
  { emoji: "💊", words: ["medicin", "tablett", "dosett", "apotek"] },
  { emoji: "🧠", words: ["terapi", "psykolog", "kurator", "samtal"] },
  { emoji: "🎓", words: ["föreläsning", "lektion", "skola", "plugg", "studie", "tenta", "prov", "seminarium", "kurs"] },
  { emoji: "💼", words: ["jobb", "arbete", "möte", "avstämning", "kund", "deadline"] },
  { emoji: "🛒", words: ["handla", "mat", "ica", "coop", "inköp", "affär", "matbutik"] },
  { emoji: "🍽️", words: ["middag", "lunch", "frukost", "fika", "äta", "matlåda"] },
  { emoji: "🧺", words: ["tvätt", "tvättstuga", "vika", "städ", "damma", "diska"] },
  { emoji: "🏃", words: ["träning", "gym", "löpning", "spring", "promenad", "yoga", "simning", "pass"] },
  { emoji: "⚽", words: ["fotboll", "träningsmatch", "match", "innebandy", "hockey"] },
  { emoji: "🚌", words: ["buss", "tåg", "pendel", "resa", "avgång", "tunnelbana"] },
  { emoji: "🚗", words: ["köra", "bil", "hämta", "lämna", "skjuts"] },
  { emoji: "🎂", words: ["födelsedag", "kalas", "fest"] },
  { emoji: "🐣", words: ["förskola", "dagis", "fritids", "barn"] },
  { emoji: "🐶", words: ["hund", "katt", "husdjur", "rasta"] },
  { emoji: "💰", words: ["räkning", "faktura", "betala", "budget", "lön"] },
  { emoji: "📞", words: ["ring", "samtal", "telefon"] },
  { emoji: "✉️", words: ["mejl", "mail", "brev", "post"] },
  { emoji: "🛏️", words: ["sova", "sovtid", "läggdags", "vila"] },
  { emoji: "🚿", words: ["dusch", "bada", "morgonrutin", "borsta"] },
  { emoji: "🎉", words: ["fira", "helg", "semester", "ledig"] },
];

/** Symbol för en händelse. `fallback` används när inget nyckelord matchar. */
export function pictogramFor(title: string, fallback = "📌"): string {
  const t = (title ?? "").toLowerCase();
  for (const rule of RULES) {
    if (rule.words.some((w) => t.includes(w))) return rule.emoji;
  }
  return fallback;
}
