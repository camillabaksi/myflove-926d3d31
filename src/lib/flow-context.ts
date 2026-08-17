// Flow ska veta var i appen du står, så första förslaget passar platsen.

export interface FlowPlace {
  path: string;
  label: string;
  /** Kort mening som Flow kan utgå från. */
  prompt: string;
}

const PLACES: Record<string, { label: string; prompt: string }> = {
  "/hem": { label: "Hem", prompt: "Vad är viktigast för mig just nu?" },
  "/min-dag": { label: "Min dag", prompt: "Hjälp mig göra dagens plan rimlig." },
  "/tasks": { label: "Att göra", prompt: "Hjälp mig välja vad jag ska börja med." },
  "/kalender": { label: "Kalendern", prompt: "Hur ser min dag ut och vad hinner jag?" },
  "/daglig-rutin": { label: "Daglig rutin", prompt: "Hjälp mig komma igång med rutinen." },
  "/studyflow": { label: "Studier", prompt: "Vad borde jag plugga på just nu?" },
  "/studybuddy": { label: "Studier", prompt: "Hjälp mig plugga på ett lugnt sätt." },
  "/jobb": { label: "Jobb", prompt: "Hjälp mig prioritera på jobbet idag." },
  "/workflow": { label: "Jobb", prompt: "Vad tar jag härnäst på jobbet?" },
  "/ma-bra": { label: "Må bra", prompt: "Jag känner så här idag – vad är rimligt?" },
  "/traning": { label: "Träning", prompt: "Vad orkar jag röra på mig idag?" },
  "/shopping": { label: "Inköp", prompt: "Hjälp mig få ordning på inköpen." },
  "/matlista": { label: "Matlista", prompt: "Hjälp mig planera maten enkelt." },
  "/stadning": { label: "Städning", prompt: "Vad är minsta möjliga hemmafix idag?" },
  "/finances": { label: "Ekonomi", prompt: "Hjälp mig få koll på pengarna utan stress." },
  "/familj": { label: "Familj", prompt: "Hur får vi ihop familjens dag?" },
  "/barn": { label: "Barn", prompt: "Hjälp mig med barnens dag." },
  "/quickflow": { label: "QuickFlow", prompt: "Hjälp mig sortera det jag skrivit ner." },
  "/flowscore": { label: "FlowScore", prompt: "Vad är rimligt med den ork jag har?" },
};

const KEY = "myflove-flow-place";

export function placeFor(path: string): FlowPlace {
  const hit = PLACES[path];
  if (hit) return { path, label: hit.label, prompt: hit.prompt };
  return { path, label: "MyFlove", prompt: "Vad snurrar i huvudet just nu?" };
}

/** Sparas när man navigerar, så Flow vet varifrån man kom. */
export function rememberPlace(path: string) {
  if (typeof window === "undefined") return;
  if (path.startsWith("/assistant")) return;
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
