/**
 * MyFlove / Flow – språk & tonalitet (Blueprint 2.0, kapitel 6)
 *
 * En central källa för mikrocopy så att hela appen låter som Flow:
 * varm, lugn, aldrig skuldbeläggande. Använd hellre en funktion
 * härifrån än att hitta på en egen formulering.
 *
 * Kärnprinciper:
 *  - Beskriv situationen, inte användarens brist. ("Det blev mycket idag"
 *    – inte "Du missade 5 uppgifter".)
 *  - Föreslå ett nästa litet steg istället för att räkna upp fel.
 *  - Undvik "måste", "borde", "misslyckades", "glömde", utropstecken.
 *  - Använd tid som en vän: "senare idag", "imorgon om det passar".
 *  - Alltid en väg vidare, aldrig en återvändsgränd.
 */

// ─── Empty states ─────────────────────────────────────────────────────────

export const emptyState = {
  tasks: "Inget att göra just nu. Det är okej att bara vara.",
  focus: "Inget fokus valt idag – välj något smått om du orkar.",
  shopping: "Listan är tom. En sak i taget räcker gott.",
  reminders: "Inget inplanerat – dagen är din.",
  calendar: "Lugn dag. Inget måste hända.",
  mood: "Du har inte loggat något än idag – bara om du vill.",
  medications: "Inga mediciner tillagda än – lägg till när det passar.",
  finances: "Inga transaktioner än – börja när du är redo.",
  dump: "Huvudet får vara tomt här. Skriv när det kommer något.",
  friction: "Inget skaver just nu – kul att höra.",
  generic: "Här är tomt. Det är också okej.",
} as const;

// ─── Bekräftelser (efter en handling) ─────────────────────────────────────

export const confirmations = {
  taskDone: "Klart. En sak mindre att bära.",
  taskAdded: "Sparat. Vi tar det när det passar.",
  moodLogged: "Tack för att du berättade.",
  itemBought: "Bockat. Bra jobbat.",
  saved: "Sparat.",
  focusSet: "Då kör vi på det – bara det, inget annat.",
} as const;

// ─── Fel (mjuka, aldrig anklagande) ───────────────────────────────────────

export const errors = {
  generic: "Det gick inte just nu. Prova igen om en stund.",
  network: "Det verkar knagga med anslutningen. Vi väntar in den.",
  saveFailed: "Sparningen fastnade. Din text finns kvar – prova igen.",
  loadFailed: "Kunde inte hämta det just nu.",
  aiUnavailable: "Pace är tyst just nu. Prova igen om en stund.",
  aiRateLimit: "Många frågar Pace just nu. Testa igen om en stund.",
  aiOutOfCredits: "AI-krediten är slut. Fyll på i inställningarna när det passar.",
} as const;

// ─── Beskriv en situation utan att skuldbelägga ───────────────────────────

/**
 * "Du har 7 obetalda uppgifter" → "Det ligger 7 saker och väntar. Vi tar en."
 */
export function describeBacklog(count: number): string {
  if (count <= 0) return "Ingenting väntar. Andas ut.";
  if (count === 1) return "En sak väntar. Ta den när det passar.";
  if (count <= 3) return `${count} saker väntar. Vi tar en åt gången.`;
  if (count <= 7) return `Det ligger ${count} saker och väntar. Vi tar en.`;
  return `Det har blivit mycket att bära – ${count} saker. Välj en enda till att börja med.`;
}

/**
 * "3 uppgifter försenade!" → "Några saker har fått vänta. Det är okej."
 */
export function describeOverdue(count: number): string {
  if (count <= 0) return "Allt är i fas.";
  if (count === 1) return "En sak har fått vänta. Det är okej.";
  return `Några saker har fått vänta (${count} st). Det är okej – välj en du orkar.`;
}

/**
 * "Du klarade bara 2 av 8" → "Du gjorde 2 saker idag. Det räknas."
 */
export function describeProgress(done: number, total: number): string {
  if (total === 0) return "En lugn dag. Det räknas också.";
  if (done === 0) return "Inget klart än – dagen är inte över.";
  if (done === total) return `Alla ${total} är gjorda. Otroligt fint jobbat.`;
  if (done === 1) return "Du gjorde en sak idag. Det räknas.";
  return `Du gjorde ${done} saker idag. Det räknas.`;
}

/**
 * "Du missade 5 påminnelser" → "Det blev mycket idag."
 */
export function describeMissed(count: number): string {
  if (count <= 0) return "Inget missat.";
  if (count <= 2) return "Det passade inte allt idag. Det är okej.";
  return "Det blev mycket idag. Vi börjar om imorgon.";
}

// ─── Tidsuttryck ──────────────────────────────────────────────────────────

/**
 * Ersätter "för sent!" / "överdue" med något som visar tid utan press.
 */
export function softWhen(date: Date, now: Date = new Date()): string {
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < -7) return "har legat ett tag";
  if (diffDays < -1) return `sedan ${-diffDays} dagar tillbaka`;
  if (diffDays === -1) return "sedan igår";
  if (diffDays === 0) return "idag";
  if (diffDays === 1) return "imorgon";
  if (diffDays <= 7) return `om ${diffDays} dagar`;
  return `om cirka ${Math.round(diffDays / 7)} veckor`;
}

// ─── Uppmuntran (Flow-ton) ────────────────────────────────────────────────

export const encouragement = {
  smallStep: "En liten sak räcker.",
  restIsWork: "Att vila är också att göra något.",
  goodEnough: "Bra nog är bra.",
  tomorrow: "Vi börjar om imorgon om det behövs.",
  onePersonAtATime: "En sak i taget. Du hinner.",
} as const;

// ─── Ord vi undviker (för review) ─────────────────────────────────────────

export const AVOID_WORDS = [
  "misslyckades",
  "glömde",
  "missade",
  "för sent",
  "överdue",
  "du måste",
  "du borde",
  "obetald",
  "fel!",
];
