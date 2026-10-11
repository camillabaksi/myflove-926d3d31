// Flow ska veta var i appen du står, så första förslaget passar platsen.

import type { LifeArea } from "./life-areas";

export interface FlowPlace {
  path: string;
  label: string;
  /** Kort mening som Flow kan utgå från. */
  prompt: string;
  /** Vilken del av livet platsen hör till. */
  area: LifeArea;
}

export interface FlowShortcut {
  href: string;
  label: string;
  emoji: string;
}

/** Genvägar per livsområde – hämtade ur appen, inga nya menyval. */
export const AREA_SHORTCUTS: Record<LifeArea, FlowShortcut[]> = {
  vardag: [
    { href: "/idag", label: "Idag", emoji: "❤️" },
    { href: "/tasks", label: "Att göra", emoji: "✅" },
    { href: "/daglig-rutin", label: "Rutiner", emoji: "🔁" },
    { href: "/flowscore", label: "FlowScore", emoji: "🔋" },
  ],
  privat: [
    { href: "/relationer", label: "Relationer", emoji: "❤️" },
    { href: "/shopping", label: "Inköp", emoji: "🛒" },
    { href: "/matlista", label: "Matlista", emoji: "🍽️" },
    { href: "/finances", label: "Ekonomi", emoji: "💰" },
  ],
  barn: [
    { href: "/barn", label: "Barn", emoji: "🧒" },
    { href: "/kalender", label: "Schema", emoji: "🗓️" },
    { href: "/tasks", label: "Att göra", emoji: "✅" },
    { href: "/shopping", label: "Inköp", emoji: "🛒" },
  ],
  studier: [
    { href: "/studyflow", label: "StudyFlow", emoji: "🎓" },
    { href: "/studybuddy", label: "Plugga", emoji: "📚" },
    { href: "/kalender", label: "Schema", emoji: "🗓️" },
    { href: "/pomodoro", label: "Fokus", emoji: "⏱️" },
  ],
  jobb: [
    { href: "/jobb", label: "Jobb", emoji: "💼" },
    { href: "/tasks", label: "Att göra", emoji: "✅" },
    { href: "/kalender", label: "Möten", emoji: "🗓️" },
    { href: "/pomodoro", label: "Fokus", emoji: "⏱️" },
  ],
  halsa: [
    { href: "/mitt-batteri", label: "Mitt batteri", emoji: "❤️" },
    { href: "/daglig-rutin", label: "Rutiner & medicin", emoji: "💊" },
    { href: "/traning", label: "Träning", emoji: "🏃" },
    { href: "/flowscore", label: "FlowScore", emoji: "🔋" },
  ],
  ekonomi: [
    { href: "/finances", label: "Ekonomi", emoji: "💰" },
    { href: "/shopping", label: "Inköp", emoji: "🛒" },
    { href: "/tasks", label: "Att göra", emoji: "✅" },
    { href: "/kalender", label: "Kalender", emoji: "🗓️" },
  ],
  socialt: [
    { href: "/relationer", label: "Relationer", emoji: "🤝" },
    { href: "/kalender", label: "Kalender", emoji: "🗓️" },
    { href: "/tasks", label: "Att göra", emoji: "✅" },
    { href: "/idag", label: "Idag", emoji: "❤️" },
  ],
  egentid: [
    { href: "/mitt-batteri", label: "Mitt batteri", emoji: "🌙" },
    { href: "/anteckningar", label: "Anteckningar", emoji: "📝" },
    { href: "/pomodoro", label: "Fokus", emoji: "⏱️" },
    { href: "/idag", label: "Idag", emoji: "❤️" },
  ],
};

const PLACES: Record<string, { label: string; prompt: string; area: LifeArea }> = {
  "/hem": { label: "Hem", prompt: "Vad är viktigast för mig just nu?", area: "vardag" },
  "/idag": { label: "Idag", prompt: "Hjälp mig göra dagens plan rimlig.", area: "vardag" },
  "/tasks": { label: "Att göra", prompt: "Hjälp mig välja vad jag ska börja med.", area: "vardag" },
  "/kalender": {
    label: "Kalendern",
    prompt: "Hur ser min dag ut och vad hinner jag?",
    area: "vardag",
  },
  "/daglig-rutin": {
    label: "Rutiner & medicin",
    prompt: "Hjälp mig komma igång med rutinen.",
    area: "vardag",
  },
  "/studyflow": { label: "Studier", prompt: "Vad borde jag plugga på just nu?", area: "studier" },
  "/studybuddy": {
    label: "Studier",
    prompt: "Hjälp mig plugga på ett lugnt sätt.",
    area: "studier",
  },
  "/jobb": { label: "Jobb", prompt: "Hjälp mig prioritera på jobbet idag.", area: "jobb" },
  "/mitt-batteri": {
    label: "Mitt batteri",
    prompt: "Jag känner så här idag – vad är rimligt?",
    area: "halsa",
  },
  "/aterhamtning": {
    label: "Återhämtning",
    prompt: "Hjälp mig hitta en lugn paus som passar just nu.",
    area: "halsa",
  },
  "/traning": { label: "Träning", prompt: "Vad orkar jag röra på mig idag?", area: "vardag" },
  "/shopping": { label: "Inköp", prompt: "Hjälp mig få ordning på inköpen.", area: "privat" },
  "/matlista": { label: "Matlista", prompt: "Hjälp mig planera maten enkelt.", area: "privat" },
  "/stadning": {
    label: "Städning",
    prompt: "Vad är minsta möjliga hemmafix idag?",
    area: "privat",
  },
  "/finances": {
    label: "Ekonomi",
    prompt: "Hjälp mig få koll på pengarna utan stress.",
    area: "privat",
  },
  "/familj": { label: "Familj", prompt: "Hur får vi ihop familjens dag?", area: "privat" },
  "/relationer": { label: "Relationer", prompt: "Vem vill jag ge lite tid idag?", area: "privat" },
  "/barn": { label: "Barn", prompt: "Hjälp mig med barnens dag.", area: "privat" },
  "/quickflow": {
    label: "QuickFlow",
    prompt: "Hjälp mig sortera det jag skrivit ner.",
    area: "vardag",
  },
  "/flowscore": {
    label: "FlowScore",
    prompt: "Vad är rimligt med den ork jag har?",
    area: "vardag",
  },
};

const KEY = "myflove-flow-place";

export function placeFor(path: string): FlowPlace {
  const hit = PLACES[path];
  if (hit) return { path, label: hit.label, prompt: hit.prompt, area: hit.area };
  return { path, label: "Paceable", prompt: "Vad snurrar i huvudet just nu?", area: "vardag" };
}

/** Genvägar som passar platsen: först området, sen platsens egen sida sist bort. */
export function shortcutsFor(place: FlowPlace): FlowShortcut[] {
  return AREA_SHORTCUTS[place.area].filter((s) => s.href !== place.path).slice(0, 4);
}

/** Sparas när man navigerar, så Flow vet varifrån man kom. */
export function rememberPlace(path: string) {
  if (typeof window === "undefined") return;
  if (path.startsWith("/assistant") || path.startsWith("/flow")) return;
  try {
    window.sessionStorage.setItem(KEY, path);
  } catch {
    /* ignorerar privat läge */
  }
}

export function lastPlace(): FlowPlace {
  if (typeof window === "undefined") return placeFor("/hem");
  try {
    return placeFor(window.sessionStorage.getItem(KEY) ?? "/hem");
  } catch {
    return placeFor("/hem");
  }
}
