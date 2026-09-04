import { translate, type Lang } from "@/lib/i18n";

// Warm, friend-like greetings. Picks a variant based on time of day, first
// name, and how long since the user was last here — with light rotation so
// it doesn't feel canned.

function pick<T>(arr: T[], seed: number): T {
  return arr[Math.abs(seed) % arr.length];
}

function daySeed(): number {
  const d = new Date();
  return d.getFullYear() * 1000 + d.getMonth() * 40 + d.getDate();
}

type Slot = "night" | "morning" | "midday" | "afternoon" | "evening" | "latenight";

function slotFor(hour: number): Slot {
  if (hour < 5) return "night";
  if (hour < 10) return "morning";
  if (hour < 13) return "midday";
  if (hour < 17) return "afternoon";
  if (hour < 22) return "evening";
  return "latenight";
}

const SALUTATIONS: Record<Slot, string[]> = {
  night: ["Hej på dig", "God natt-timme", "Fint att du tittar in"],
  morning: ["God morgon", "Hej på morgonen", "Mysig morgon", "Godmorgon"],
  midday: ["Hej i dagen", "Skön förmiddag", "Kul att se dig"],
  afternoon: ["God eftermiddag", "Hej", "Trevlig eftermiddag"],
  evening: ["God kväll", "Skön kväll", "Fint att du är här"],
  latenight: ["Sen kväll?", "Hej, nattlugn", "Fin sen kväll"],
};

const RETURN_LINES = [
  "Kul att se dig igen.",
  "Fint att du kom tillbaka.",
  "Skönt att ha dig här.",
  "Välkommen tillbaka.",
];

const AWAY_LINES = [
  "Välkommen tillbaka efter pausen.",
  "Hoppas du haft det bra sen sist.",
  "Kul att du hittade tillbaka.",
];

const FIRST_TIME_LINES = [
  "Vad kul att du är här!",
  "Välkommen. Ta det i din takt.",
  "Så fint att du hittade hit.",
];

const SOFT_ENDINGS = ["🌸", "✨", "🌿", "☕", "🧡", ""];

export type Greeting = {
  title: string;
  subtitle: string;
};

export function getGreeting(opts?: {
  name?: string | null;
  lastVisit?: number | null;
  lang?: Lang;
}): Greeting {
  const lang: Lang = opts?.lang === "en" ? "en" : "sv";
  const tr = (s: string) => translate(s, lang);
  const name = opts?.name?.trim() || "";
  const hour = new Date().getHours();
  const slot = slotFor(hour);
  const seed = daySeed() + hour;

  const salutation = tr(pick(SALUTATIONS[slot], seed));
  const ending = pick(SOFT_ENDINGS, seed + 3);
  const title = name
    ? `${salutation}, ${name}${ending ? " " + ending : ""}`
    : `${salutation}${ending ? " " + ending : ""}`;

  let subtitle = tr("Här är en lugn överblick över idag.");
  const last = opts?.lastVisit ?? null;
  if (!last) {
    subtitle = tr(pick(FIRST_TIME_LINES, seed));
  } else {
    const daysAway = Math.floor((Date.now() - last) / (24 * 60 * 60 * 1000));
    if (daysAway >= 3) subtitle = tr(pick(AWAY_LINES, seed));
    else if (daysAway >= 1) subtitle = tr(pick(RETURN_LINES, seed));
  }

  return { title, subtitle };
}
