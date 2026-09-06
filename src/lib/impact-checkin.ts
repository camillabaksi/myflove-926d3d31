/**
 * Påverkan – vad som påverkar den aktuella kapaciteten just nu.
 * Kropp/hälsa, känslor/tankar eller omgivning. Sparas tillsammans
 * med dagens batteri/mående och ges till Flow som kontext.
 * Påverkan ändrar ALDRIG batteriprocenten automatiskt.
 *
 * MyFlove diagnostiserar inte och behandlar inte – informationen är
 * användarens egen registrering och används enbart för att göra dagen
 * mer realistisk.
 */

export type ImpactKind =
  // Kropp & hälsa
  | "sjuk"
  | "halsa"
  | "trott"
  | "smarta"
  | "somn"
  | "atervhamtning"
  | "annat-kropp"
  // Känslor & tankar
  | "kanslomassigt"
  | "overbelastat"
  | "oro"
  | "annat-kanslor"
  // Omgivning
  | "familj"
  | "annans-maende"
  | "jobb"
  | "annat-omgivning"
  // Övrigt
  | "annat" // äldre poster
  | "inget";

export type ImpactDegree = "lite" | "mattligt" | "mycket";

export interface ImpactEntry {
  day: string; // YYYY-MM-DD
  /** Ett eller flera val. "inget" kan inte kombineras med andra. */
  kinds: ImpactKind[];
  degree: ImpactDegree;
  ts: number;
}

/** Bakåtkompatibilitet: tidigare poster hade ett enda `kind`. */
export function normalizeImpactEntry(raw: ImpactEntry | null): ImpactEntry | null {
  if (!raw) return null;
  const legacy = raw as ImpactEntry & { kind?: ImpactKind };
  if (!Array.isArray(raw.kinds)) {
    return legacy.kind ? { ...raw, kinds: [legacy.kind] } : null;
  }
  return raw.kinds.length ? raw : null;
}

export interface ImpactOption {
  id: ImpactKind;
  labelSv: string;
  emoji: string;
}

export interface ImpactGroup {
  id: "kropp" | "kanslor" | "omgivning";
  titleSv: string;
  options: ImpactOption[];
}

export const IMPACT_GROUPS: ImpactGroup[] = [
  {
    id: "kropp",
    titleSv: "Kropp & hälsa",
    options: [
      { id: "sjuk", labelSv: "Jag är sjuk idag", emoji: "🤒" },
      { id: "halsa", labelSv: "Min sjukdom eller fysiska hälsa påverkar mig", emoji: "🩺" },
      { id: "trott", labelSv: "Jag är ovanligt trött/utmattad", emoji: "🪫" },
      { id: "smarta", labelSv: "Jag har ont eller obehag", emoji: "🩹" },
      { id: "somn", labelSv: "Jag har sovit dåligt", emoji: "🌙" },
      { id: "atervhamtning", labelSv: "Jag behöver mer återhämtning", emoji: "🛋️" },
      { id: "annat-kropp", labelSv: "Annat i kroppen", emoji: "✨" },
    ],
  },
  {
    id: "kanslor",
    titleSv: "Känslor & tankar",
    options: [
      { id: "kanslomassigt", labelSv: "Jag är känslomässigt påverkad", emoji: "💜" },
      { id: "overbelastat", labelSv: "Mitt huvud är överbelastat", emoji: "🧠" },
      { id: "oro", labelSv: "Oro eller något har hänt", emoji: "🌧️" },
      { id: "annat-kanslor", labelSv: "Annat i känslor och tankar", emoji: "✨" },
    ],
  },
  {
    id: "omgivning",
    titleSv: "Omgivning",
    options: [
      { id: "familj", labelSv: "Familj/barn tar mycket energi", emoji: "👨‍👧" },
      { id: "annans-maende", labelSv: "Någon annans mående påverkar mig", emoji: "🫂" },
      { id: "jobb", labelSv: "Jobb/ekonomi påverkar mig", emoji: "💼" },
      { id: "annat-omgivning", labelSv: "Annat i omgivningen", emoji: "✨" },
    ],
  },
];

export const IMPACT_NOTHING: ImpactOption = {
  id: "inget",
  labelSv: "Inget särskilt – jag har bara låg kapacitet idag",
  emoji: "☀️",
};

/** Alla valbara alternativ i en platt lista (etiketter, ikoner). */
export const IMPACT_OPTIONS: ImpactOption[] = [
  ...IMPACT_GROUPS.flatMap((g) => g.options),
  { id: "annat", labelSv: "Annat", emoji: "✨" },
  IMPACT_NOTHING,
];

export function impactOption(id: ImpactKind): ImpactOption | undefined {
  return IMPACT_OPTIONS.find((o) => o.id === id);
}

export const IMPACT_DEGREES: { id: ImpactDegree; labelSv: string }[] = [
  { id: "lite", labelSv: "Lite" },
  { id: "mattligt", labelSv: "Måttligt" },
  { id: "mycket", labelSv: "Mycket" },
];

const KIND_AI_LABEL: Record<ImpactKind, string> = {
  sjuk: "sjuk idag",
  halsa: "påverkad av sin sjukdom eller fysiska hälsa",
  trott: "ovanligt trött/utmattad",
  smarta: "påverkad av smärta eller obehag",
  somn: "påverkad av dålig sömn",
  atervhamtning: "i behov av mer återhämtning",
  "annat-kropp": "påverkad av något annat i kroppen",
  kanslomassigt: "känslomässigt påverkad",
  overbelastat: "mentalt överbelastad",
  oro: "påverkad av oro eller något som hänt",
  "annat-kanslor": "påverkad av något annat i känslor eller tankar",
  familj: "påverkad av att familj/barn tar mycket energi",
  "annans-maende": "påverkad av någon annans mående",
  jobb: "påverkad av jobb/ekonomi",
  "annat-omgivning": "påverkad av något annat i omgivningen",
  annat: "påverkad av något annat",
  inget: "inte påverkad av något särskilt",
};

const DEGREE_AI_LABEL: Record<ImpactDegree, string> = {
  lite: "lite",
  mattligt: "måttligt",
  mycket: "mycket",
};

/**
 * Rad till Flow/AI:s personliga kontext. Svensk text (Flow-kontexten är svensk).
 * Tydliggör att påverkan är kontext – inte ett skäl att sänka kraven utan att fråga.
 */
export function impactContext(entry: ImpactEntry | null, now: Date = new Date()): string | null {
  if (!entry) return null;
  const today = now.toISOString().slice(0, 10);
  if (entry.day !== today) return null;
  const labels = entry.kinds.map((k) => KIND_AI_LABEL[k] ?? "påverkad av något");
  const beskrivning =
    labels.length === 1
      ? `Användaren är ${labels[0]} – i graden ${DEGREE_AI_LABEL[entry.degree]}.`
      : `Användaren är ${labels.slice(0, -1).join(", ")} och ${labels[labels.length - 1]} – i graden ${DEGREE_AI_LABEL[entry.degree]}.`;
  return [
    `Dagens påverkan (användarens egen registrering): ${beskrivning}`,
    "Använd detta som bakgrund när du föreslår dagens prioriteringar: anpassa ton och kravnivå varsamt, men ändra inte användarens batterinivå, ställ inga diagnoser och ge inga medicinska råd.",
  ].join("\n");
}
