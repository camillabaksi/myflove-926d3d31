// MyFlove Insight – DEMO/PROTOTYP
// Kärnidé: information om behov → behovsområden → strategiförslag →
// användaren väljer → strategin kopplas till MyFlow (uppgifter, påminnelser, kalender).
//
// VIKTIGT: Den här versionen använder ENDAST fiktiva testprofiler och syntetiska
// underlag. Ingen riktig dokumenthantering, ingen lagring av känsliga uppgifter.
// Insight diagnostiserar inte, gör inga medicinska bedömningar och rekommenderar
// aldrig behandling eller medicinering. Språket är alltid möjlighetsformulerat.
//
// ---------------------------------------------------------------------------
// TODO (framtida version – innan riktiga underlag får hanteras):
// TODO: GDPR/privacy-by-design – dataminimering, ändamålsbegränsning, gallringsregler.
// TODO: Säker dokumentlagring – separat bucket, privat åtkomst, RLS per användare.
// TODO: Kryptering – i vila och i transit, samt nyckelhantering.
// TODO: Autentisering & auktorisation – vem får se ett barns underlag?
// TODO: Rättigheter/radering – export, rättelse, radering (art. 15–20).
// TODO: Samtyckeshantering – uttryckligt samtycke, vårdnadshavare, återkallelse.
// TODO: AI-leverantör – val av modell/leverantör, ingen träning på användardata.
// TODO: Personuppgiftsbiträdesavtal (DPA) med alla underbiträden.
// TODO: DPIA – konsekvensbedömning för särskilda kategorier av personuppgifter.
// TODO: Regulatorisk bedömning – MDR/medicinteknisk gränsdragning, tydlig icke-vård-status.
// TODO: Säker hantering av barns personuppgifter – åldersgränser, vårdnadshavarflöde.
// ---------------------------------------------------------------------------

export type InsightAreaId =
  | "exekutiva"
  | "tid"
  | "overgangar"
  | "energi"
  | "sensorisk"
  | "kommunikation";

export interface InsightArea {
  id: InsightAreaId;
  emoji: string;
  label: string;
  /** Möjlighetsformulerad beskrivning – aldrig en bedömning. */
  intro: string;
}

export const INSIGHT_AREAS: InsightArea[] = [
  {
    id: "exekutiva",
    emoji: "🧠",
    label: "Exekutiva funktioner",
    intro:
      "Utifrån informationen kan igångsättning, planering och att hålla ordning på flera steg vara områden att ta hänsyn till.",
  },
  {
    id: "tid",
    emoji: "⏰",
    label: "Tidsuppfattning",
    intro:
      "Det kan vara värt att göra tiden synlig, så att den inte behöver hållas i huvudet.",
  },
  {
    id: "overgangar",
    emoji: "🔄",
    label: "Övergångar",
    intro:
      "Skiften mellan aktiviteter kan bli lättare med förvarning och tydliga signaler.",
  },
  {
    id: "energi",
    emoji: "⚡",
    label: "Energi & återhämtning",
    intro:
      "Det kan vara ett område där planerad återhämtning gör mer skillnad än fler uppgifter.",
  },
  {
    id: "sensorisk",
    emoji: "🔊",
    label: "Sensorisk belastning",
    intro:
      "Ljud, ljus och intryck kan påverka hur mycket som får plats en dag.",
  },
  {
    id: "kommunikation",
    emoji: "💬",
    label: "Kommunikation",
    intro:
      "Korta, konkreta instruktioner – en i taget – kan göra det lättare att hänga med.",
  },
];

export const AREA_BY_ID: Record<InsightAreaId, InsightArea> = Object.fromEntries(
  INSIGHT_AREAS.map((a) => [a.id, a]),
) as Record<InsightAreaId, InsightArea>;

export type InsightContext = "hemma" | "skola" | "arbete" | "vardag" | "alla";

export const CONTEXTS: { id: InsightContext; emoji: string; label: string }[] = [
  { id: "hemma", emoji: "🏠", label: "Hemma" },
  { id: "skola", emoji: "🏫", label: "Skola" },
  { id: "arbete", emoji: "💼", label: "Arbete" },
  { id: "vardag", emoji: "🌿", label: "Vardag" },
  { id: "alla", emoji: "✨", label: "Alla" },
];

/** Ett konkret steg som kan bli en påminnelse i MyFlow. */
export interface StrategyNudge {
  /** HH:MM eller relativ etikett, t.ex. "kvällen innan". */
  when: string;
  text: string;
}

export interface InsightStrategy {
  id: string;
  areaId: InsightAreaId;
  title: string;
  /** Alltid möjlighetsformulerat. */
  why: string;
  /** Uppskattad friktion 1–10 (används av FlowScore). */
  friction: number;
  /** Uppskattad tidsåtgång i minuter. */
  minutes: number;
  /** Konkret exempel som användaren kan acceptera, ändra eller avvisa. */
  makeNudges?: (anchor: string) => StrategyNudge[];
}

function minusMinutes(hhmm: string, mins: number): string {
  const [h, m] = hhmm.split(":").map((n) => parseInt(n, 10));
  if (Number.isNaN(h) || Number.isNaN(m)) return hhmm;
  const total = (h! * 60 + m! - mins + 24 * 60) % (24 * 60);
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

const transitionNudges = (anchor: string): StrategyNudge[] => [
  { when: minusMinutes(anchor, 15), text: "15 minuter kvar tills vi behöver börja göra oss klara." },
  { when: minusMinutes(anchor, 5), text: "5 minuter kvar." },
  { when: anchor, text: "Nu är det dags att gå vidare." },
];

export const INSIGHT_STRATEGIES: InsightStrategy[] = [
  // Övergångar
  { id: "prep-10", areaId: "overgangar", title: "Förvarna 10 minuter innan förändringen", why: "En möjlig strategi kan vara att göra skiftet förväntat i stället för plötsligt.", friction: 2, minutes: 5, makeNudges: transitionNudges },
  { id: "prep-5", areaId: "overgangar", title: "Förvarna igen 5 minuter innan", why: "Det kan vara värt att prova en andra påminnelse närmare bytet.", friction: 2, minutes: 3, makeNudges: transitionNudges },
  { id: "visual-countdown", areaId: "overgangar", title: "Använd visuell nedräkning", why: "Du kan testa en timer som syns, så att tiden inte behöver hållas i huvudet.", friction: 3, minutes: 10 },
  { id: "end-signal", areaId: "overgangar", title: "Ge en tydlig avslutningssignal", why: "En tydlig signal kan göra slutet på en aktivitet mindre abrupt.", friction: 2, minutes: 5 },
  { id: "one-instruction", areaId: "overgangar", title: "Ge en instruktion i taget", why: "Det kan vara lättare att följa ett steg än flera samtidigt.", friction: 2, minutes: 5 },
  { id: "recovery-after", areaId: "overgangar", title: "Planera återhämtning efter en krävande aktivitet", why: "Utifrån informationen kan planerad paus vara ett område att ta hänsyn till.", friction: 3, minutes: 20 },

  // Exekutiva funktioner
  { id: "first-step", areaId: "exekutiva", title: "Bestäm ett första minsteg", why: "Det kan vara lättare att börja när första steget är löjligt litet.", friction: 2, minutes: 5 },
  { id: "break-down", areaId: "exekutiva", title: "Dela upp uppgiften i 3 steg", why: "En möjlig strategi kan vara att göra uppgiften synligt kortare.", friction: 3, minutes: 10 },
  { id: "bag-checklist", areaId: "exekutiva", title: "Checklista för väskan kvällen innan", why: "Du kan testa att flytta beslutet till kvällen, när det är lugnare.", friction: 4, minutes: 10, makeNudges: (a) => [{ when: a, text: "Förbered skolväskan – checklistan tar 10 minuter." }] },
  { id: "one-priority", areaId: "exekutiva", title: "Välj en sak som räknas idag", why: "Det kan vara värt att prova att låta resten vara bonus.", friction: 2, minutes: 5 },

  // Tid
  { id: "time-visible", areaId: "tid", title: "Gör tiden synlig med timer", why: "En möjlig strategi kan vara att låta tiden synas i rummet.", friction: 2, minutes: 5 },
  { id: "time-guess", areaId: "tid", title: "Gissa tiden – jämför efteråt", why: "Du kan testa att träna tidsuppfattning utan press.", friction: 3, minutes: 10 },
  { id: "buffer", areaId: "tid", title: "Lägg in 10 minuters marginal", why: "Det kan vara värt att prova en buffert innan viktiga tider.", friction: 2, minutes: 10 },

  // Energi
  { id: "energy-check", areaId: "energi", title: "Kort energikoll innan planering", why: "Utifrån informationen kan dagens energi vara värd att väga in.", friction: 1, minutes: 3 },
  { id: "recovery-slot", areaId: "energi", title: "Boka in återhämtning efter skoldagen", why: "Det kan vara värt att prova tyst tid direkt efter dagen.", friction: 2, minutes: 30, makeNudges: (a) => [{ when: a, text: "Återhämtning nu – inga krav i 30 minuter." }] },
  { id: "work-home", areaId: "energi", title: "Avslutningsritual mellan arbete och fritid", why: "En möjlig strategi kan vara en tydlig markör för att dagen är slut.", friction: 3, minutes: 10 },

  // Sensorisk
  { id: "sensory-break", areaId: "sensorisk", title: "Planera in en lågstimuli-paus", why: "Du kan testa en kort paus med färre intryck mitt på dagen.", friction: 2, minutes: 15 },
  { id: "sensory-kit", areaId: "sensorisk", title: "Ha hörselkåpor eller solglasögon tillgängligt", why: "Det kan vara värt att prova att göra verktygen lätta att nå.", friction: 2, minutes: 5 },
  { id: "predictable-day", areaId: "sensorisk", title: "Gå igenom dagens ordning på morgonen", why: "Förutsägbarhet kan vara ett område att ta hänsyn till.", friction: 2, minutes: 5, makeNudges: (a) => [{ when: a, text: "Gå igenom dagens ordning tillsammans – kort och lugnt." }] },

  // Kommunikation
  { id: "short-instructions", areaId: "kommunikation", title: "Korta instruktioner – en i taget", why: "En möjlig strategi kan vara att säga en sak och vänta.", friction: 1, minutes: 3 },
  { id: "repeat-back", areaId: "kommunikation", title: "Be om en kort återberättelse", why: "Det kan vara värt att prova att stämma av vad som uppfattades.", friction: 2, minutes: 5 },
  { id: "written-backup", areaId: "kommunikation", title: "Skriv ner det viktigaste", why: "Du kan testa att låta texten bära det som annars ska minnas.", friction: 2, minutes: 5 },
];

export function strategiesForArea(areaId: InsightAreaId): InsightStrategy[] {
  return INSIGHT_STRATEGIES.filter((s) => s.areaId === areaId);
}

export function strategyById(id: string): InsightStrategy | undefined {
  return INSIGHT_STRATEGIES.find((s) => s.id === id);
}

export interface DemoProfile {
  id: string;
  name: string;
  age: string;
  emoji: string;
  needs: string[];
  areas: InsightAreaId[];
  strengths: string[];
  /** Syntetiskt underlag – helt fiktivt, inte en riktig utredning. */
  report: string;
}

export const DEMO_PROFILES: DemoProfile[] = [
  {
    id: "alex",
    name: "Alex",
    age: "10 år",
    emoji: "🧒",
    needs: [
      "svårt med övergångar",
      "svårt med flera instruktioner samtidigt",
      "tidsuppfattning",
      "behöver tydlighet och förberedelse",
      "blir lätt överbelastad",
    ],
    areas: ["overgangar", "kommunikation", "tid", "energi"],
    strengths: ["nyfiken", "stark rättvisekänsla", "bra på detaljer"],
    report:
      "FIKTIVT UNDERLAG (demo). Alex beskrivs som nyfiken och detaljfokuserad. I situationer där aktiviteter byts snabbt behövs ofta extra förberedelse. Flera instruktioner samtidigt kan bli svåra att hålla. Tiden upplevs ibland gå fortare eller långsammare än den gör. Belastningen ökar tydligt sent på eftermiddagen.",
  },
  {
    id: "sam",
    name: "Sam",
    age: "15 år",
    emoji: "🧑",
    needs: [
      "igångsättning",
      "tidsuppfattning",
      "energihantering",
      "svårt att prioritera",
      "behöver hjälp att dela upp större uppgifter",
    ],
    areas: ["exekutiva", "tid", "energi"],
    strengths: ["kreativ", "engagerad i det som intresserar", "snabb när hen kommit igång"],
    report:
      "FIKTIVT UNDERLAG (demo). Sam kommer lätt igång med sådant som engagerar, medan större skoluppgifter ofta stannar vid första steget. Uppskattning av hur lång tid något tar varierar. Energin är ojämn över dagen och prioritering mellan flera uppgifter beskrivs som svårt.",
  },
  {
    id: "robin",
    name: "Robin",
    age: "vuxen",
    emoji: "🧑‍💻",
    needs: [
      "många samtidiga uppgifter",
      "svårt att prioritera",
      "hög friktion inför vissa uppgifter",
      "svårt att komma ihåg saker",
      "svårt med övergång mellan arbete och fritid",
    ],
    areas: ["exekutiva", "tid", "energi", "overgangar"],
    strengths: ["lösningsorienterad", "hög kapacitet i fokusläge", "omtänksam kollega"],
    report:
      "FIKTIVT UNDERLAG (demo). Robin hanterar många parallella spår och beskriver att det svåraste är att välja vad som ska göras först. Vissa uppgifter känns oproportionerligt tunga att påbörja. Arbetsdagen tenderar att fortsätta i tankarna även efter arbetstid.",
  },
  {
    id: "charlie",
    name: "Charlie",
    age: "12 år",
    emoji: "🧒",
    needs: [
      "sensorisk belastning",
      "social återhämtning",
      "förändringar",
      "behov av förutsägbarhet",
      "återhämtning efter skoldag",
    ],
    areas: ["sensorisk", "energi", "overgangar"],
    strengths: ["uthållig", "lojal vän", "stark egen struktur när den får finnas"],
    report:
      "FIKTIVT UNDERLAG (demo). Charlie beskrivs som uthållig i miljöer som är förutsägbara. Ljudnivå och många intryck påverkar orken tydligt. Efter skoldagen behövs ofta en period utan sociala krav. Oförberedda förändringar kan ta lång tid att landa i.",
  },
];

export function profileById(id: string): DemoProfile | undefined {
  return DEMO_PROFILES.find((p) => p.id === id);
}

/** Enkel demo-matchning: fritext om behov → möjliga områden. */
export function matchAreasFromNeeds(needs: string[]): InsightAreaId[] {
  const text = needs.join(" ").toLowerCase();
  const hits = new Set<InsightAreaId>();
  if (/(övergång|byte|skifte|avsluta)/.test(text)) hits.add("overgangar");
  if (/(tid|sen|klocka|hinner)/.test(text)) hits.add("tid");
  if (/(igångsätt|planer|prioriter|glömm|minne|steg|struktur)/.test(text)) hits.add("exekutiva");
  if (/(energi|trött|återhämt|ork|överbelast)/.test(text)) hits.add("energi");
  if (/(ljud|ljus|sensor|intryck|stim)/.test(text)) hits.add("sensorisk");
  if (/(instruktion|kommunik|förstå|prata|samtal)/.test(text)) hits.add("kommunikation");
  if (hits.size === 0) hits.add("exekutiva");
  return [...hits];
}

/** Quickflow-integration: känns tanken som en förberedelse-situation? */
export function detectPreparationIntent(text: string): { anchorLabel: string } | null {
  const lower = text.toLowerCase();
  if (!/(förbered|inför|tandläkar|läkar|besök|utflykt|resa|prov|byta|flytt|första dagen)/.test(lower)) {
    return null;
  }
  const m = lower.match(/inför\s+([a-zåäö\s]{3,30})/);
  return { anchorLabel: (m?.[1] ?? "det som kommer").trim() };
}

/** Konkret förberedelseplan som användaren kan ändra eller neka. */
export function buildPreparationPlan(label: string): { offsetDays: number; when: string; text: string }[] {
  return [
    { offsetDays: -2, when: "17:00", text: `Prata kort om ${label}.` },
    { offsetDays: -1, when: "19:00", text: `Förbered kläder och information inför ${label}.` },
    { offsetDays: 0, when: "08:00", text: `Påminn om vad som kommer att hända: ${label}.` },
  ];
}
