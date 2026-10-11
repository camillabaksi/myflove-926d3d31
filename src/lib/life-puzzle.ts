// Livspusslet™ – den gemensamma kontexten mellan MyFloves alla delar.
//
// Grundprincip (Blueprint): människan ska inte anpassa sig efter appen.
// Här samlas signaler från olika livsområden till EN bild, så att FlowScore,
// Flow och hemskärmen pratar om samma helhet – aldrig som ett betyg,
// alltid som "vad är rimligt för dig just nu?".

import { ALL_AREAS, AREA_META, type LifeArea } from "@/lib/life-areas";

export interface AreaLoad {
  area: LifeArea;
  /** Uppgifter med datum idag (eller utan datum men aktiva). */
  today: number;
  /** Passerade deadlines. */
  overdue: number;
  /** Deadlines inom 7 dagar. */
  soon: number;
  /** Närmaste deadline i antal dagar (negativt = passerad). */
  nextInDays?: number;
  /** Titeln på det närmaste. */
  nextTitle?: string;
}

export interface LifePuzzleInput {
  /** 0–100, kompatibilitetssiffra härledd från kapacitetsläget (inte prestation). */
  score: number;
  /** Användarens valda kapacitetsläge – den enda kapacitetskällan. */
  capacityLabel?: string;
  load: "låg" | "medel" | "hög";
  capacityMinutes: number;
  suggestedTasks: number;
  energy: number | null;
  mood: number | null;
  minutesLeft: number;
  openThoughts: number;
  areas: AreaLoad[];
  /** Namn på det som händer idag utanför uppgiftslistan (t.ex. barnaktivitet, lektion). */
  todaysEvents: string[];
  /** Min situation som text – vilka livssituationer som pågår just nu. */
  situationContext?: string;
  /** Frivillig jobbprofil som text – kontext, inte regler. */
  workContext?: string;
  /** Hur krävande arbetsdagen ser ut idag. */
  workDemand?: "lätt" | "normal" | "krävande";
  /** Frivillig studieprofil som text – kontext, inte regler. */
  studyContext?: string;
  /** Hur krävande studieveckan ser ut. */
  studyDemand?: "lätt" | "normal" | "krävande";
}

export interface PuzzleConnection {
  /** Kort rubrik, t.ex. "Studier möter låg energi". */
  title: string;
  /** Varm, icke-dömande förklaring av hur delarna hänger ihop. */
  body: string;
  /** Vad Flow föreslår som nästa lilla steg. */
  suggestion?: string;
  /** Vart användaren kan gå. */
  href?: string;
  hrefLabel?: string;
}

export interface LifePuzzle {
  headline: string;
  intro: string;
  /** Områden med något på gång, mest belastade först. */
  busiest: AreaLoad[];
  totalOpen: number;
  connections: PuzzleConnection[];
  /** Redo att skickas in i ett Flow-samtal. */
  flowPrompt: string;
  /** Sant när det är läge att erbjuda "flytta resten till imorgon". */
  offerRelief: boolean;
}

const areaLabel = (a: LifeArea) => `${AREA_META[a].emoji} ${AREA_META[a].label}`;

export function emptyAreaLoads(): AreaLoad[] {
  return ALL_AREAS.map((area) => ({ area, today: 0, overdue: 0, soon: 0 }));
}

function loadOf(a: AreaLoad): number {
  return a.overdue * 3 + a.today * 2 + a.soon;
}

/** Bygger en sammanhängande bild av livspusslet just nu. */
export function buildLifePuzzle(input: LifePuzzleInput): LifePuzzle {
  const busiest = input.areas.filter((a) => loadOf(a) > 0).sort((x, y) => loadOf(y) - loadOf(x));

  const totalOpen = input.areas.reduce((s, a) => s + a.today + a.overdue + a.soon, 0);
  const overdue = input.areas.reduce((s, a) => s + a.overdue, 0);
  const lowCapacity = input.score < 45;
  const manyAreas = busiest.length >= 2;

  const headline = lowCapacity
    ? "Mycket på en gång, lite ork kvar"
    : manyAreas
      ? "Flera delar av livet är igång"
      : totalOpen > 0
        ? "Lugnt läge – en sak i taget"
        : "Inget skriker på dig just nu";

  const intro = lowCapacity
    ? `Du har ${input.score}% kapacitet just nu. Det betyder inte att du ligger efter – bara att dagen behöver bli mindre.`
    : manyAreas
      ? `${busiest.map((a) => areaLabel(a.area)).join(" • ")} pågår samtidigt. Du behöver inte hålla ihop allt i huvudet – det gör jag.`
      : "Du har utrymme att ta något du brukar skjuta på – eller att bara vila i att det räcker som det är.";

  const connections: PuzzleConnection[] = [];

  // Energi × mängd
  if (lowCapacity && totalOpen > 0) {
    connections.push({
      title: "Energin styr planen",
      body: `Med ${input.energy != null ? `energi ${input.energy}/5` : "låg kapacitet"} är ${input.suggestedTasks} sak(er) och ungefär ${input.capacityMinutes} minuters fokus rimligt idag.`,
      suggestion: "Ska vi behålla det viktigaste och flytta resten till imorgon?",
      href: "/flow",
      hrefLabel: "Ta en sak i taget",
    });
  } else if (input.score >= 70 && totalOpen > 0) {
    connections.push({
      title: "Du har utrymme idag",
      body: `Ungefär ${input.capacityMinutes} minuters fokus finns i dagen. Det räcker för något tyngre du brukar skjuta på.`,
      href: "/flow",
      hrefLabel: "Öppna Pace",
    });
  }

  // Deadlines × energi
  const nearest = busiest
    .filter((a) => typeof a.nextInDays === "number")
    .sort((x, y) => (x.nextInDays as number) - (y.nextInDays as number))[0];
  if (nearest && typeof nearest.nextInDays === "number") {
    const d = nearest.nextInDays;
    const when = d < 0 ? `${Math.abs(d)} dag(ar) sen` : d === 0 ? "idag" : `om ${d} dag(ar)`;
    connections.push({
      title: `${areaLabel(nearest.area)} har en deadline ${when}`,
      body: nearest.nextTitle
        ? `"${nearest.nextTitle}" ligger närmast i tid.`
        : "Det närmaste i tid ligger här.",
      suggestion: lowCapacity
        ? "Vi tar en liten bit av den idag – inte hela."
        : "Ska vi dela upp den i mindre steg?",
      href:
        nearest.area === "studier" ? "/studyflow" : nearest.area === "jobb" ? "/jobb" : "/tasks",
      hrefLabel: "Dela upp den",
    });
  }

  // Flera områden samma dag
  if (manyAreas && input.todaysEvents.length > 0) {
    connections.push({
      title: "Dagen har fasta hållpunkter",
      body: `${input.todaysEvents.slice(0, 3).join(", ")} ligger redan i dagen. Det som är kvar behöver få plats runt det.`,
      href: "/kalender",
      hrefLabel: "Se dagen",
    });
  }

  // Jobbet väger mot resten av livspusslet
  if (input.workDemand === "krävande") {
    connections.push({
      title: "Jobbet tar mycket idag",
      body: "Arbetsdagen ser krävande ut. Då är det rimligt att kvällen blir liten – inte för att du är svag, utan för att orken redan gått åt.",
      suggestion: "Välj en sak till efter jobbet, och låt resten vänta.",
      href: "/idag",
      hrefLabel: "Se kvällen",
    });
  }

  // Studierna väger mot resten av livspusslet
  if (input.studyDemand === "krävande") {
    connections.push({
      title: "Studierna tar mycket den här veckan",
      body: "Prov och inlämningar ligger tätt. Då är det rimligt att annat får ta mindre plats – och att pluggandet delas upp i kortare pass.",
      suggestion: "Ta ett kort pass i taget och låt resten vänta.",
      href: "/studyflow",
      hrefLabel: "Se plugg-planen",
    });
  }

  // Mental belastning
  if (input.openThoughts > 5) {
    connections.push({
      title: "Huvudet är fullt",
      body: `${input.openThoughts} osorterade tankar ligger i Quickflow och tar plats även när du inte tänker på dem.`,
      suggestion: "Sortera tre av dem – kapaciteten stiger direkt.",
      href: "/quickflow",
      hrefLabel: "Sortera tankar",
    });
  }

  // Missat är inte misslyckat
  if (overdue > 0) {
    connections.push({
      title: "Något blev inte gjort",
      body: `${overdue} sak(er) har passerat sitt datum. Det är okej – planen får ändras när livet gör det.`,
      suggestion: "Vill du att jag lägger om resten av veckan?",
      href: "/flowscore",
      hrefLabel: "Lägg om pusslet",
    });
  }

  const flowPrompt = lowCapacity
    ? "Mitt Dagens balans är lågt idag. Hjälp mig prioritera vad som faktiskt behöver göras och vad som kan flyttas."
    : manyAreas
      ? "Jag har flera saker på gång i olika delar av livet. Hjälp mig se vad som hör ihop och vad jag börjar med."
      : "Hjälp mig hitta en bra nästa sak att göra utifrån hur jag mår idag.";

  return {
    headline,
    intro,
    busiest,
    totalOpen,
    connections,
    flowPrompt,
    offerRelief: lowCapacity && totalOpen > input.suggestedTasks,
  };
}

/**
 * Kontexttext som skickas med till Flow så att svaren utgår från
 * hela livspusslet – inte bara det användaren råkar skriva.
 */
export function lifeContextPrompt(input: LifePuzzleInput): string {
  const lines: string[] = [
    input.capacityLabel
      ? `Kapacitetsläge (användarens eget val): ${input.capacityLabel}.`
      : `Kapacitet just nu: ${input.score}% (kapacitet, inte prestation). Belastning: ${input.load}.`,
    `Rimligt idag: ca ${input.capacityMinutes} min fokus och ${input.suggestedTasks} sak(er).`,
  ];
  if (input.energy != null) lines.push(`Senast loggad energi (bara historik, styr inte planen): ${input.energy}/5.`);
  if (input.mood != null) lines.push(`Mående: ${input.mood}/5.`);
  lines.push(`Tid kvar av dagen: ${input.minutesLeft} min.`);
  if (input.openThoughts) lines.push(`Osorterade tankar i Quickflow: ${input.openThoughts}.`);

  const busy = input.areas.filter((a) => a.today + a.overdue + a.soon > 0);
  if (busy.length) {
    lines.push("Livsområden med något på gång:");
    for (const a of busy) {
      const bits = [
        a.today ? `${a.today} idag` : null,
        a.overdue ? `${a.overdue} försenade` : null,
        a.soon ? `${a.soon} inom en vecka` : null,
        typeof a.nextInDays === "number"
          ? `närmast: ${a.nextTitle ?? "okänt"} om ${a.nextInDays} dag(ar)`
          : null,
      ].filter(Boolean);
      lines.push(`- ${AREA_META[a.area].label}: ${bits.join(", ")}`);
    }
  }
  if (input.todaysEvents.length) {
    lines.push(`Fasta hållpunkter idag: ${input.todaysEvents.slice(0, 5).join(", ")}.`);
  }

  if (input.situationContext) lines.push(input.situationContext);
  if (input.workDemand) lines.push(`Arbetsdagen idag: ${input.workDemand}.`);
  if (input.workContext) lines.push(input.workContext);
  if (input.studyDemand) lines.push(`Studieveckan: ${input.studyDemand}.`);
  if (input.studyContext) lines.push(input.studyContext);

  lines.push(
    "Använd detta för att koppla ihop delarna. Om kapaciteten är låg: föreslå färre saker, mindre steg och att flytta resten – aldrig skuld. Om arbetsdagen eller studieveckan är krävande: föreslå inte många krävande aktiviteter samma kväll.",
  );
  return lines.join("\n");
}
