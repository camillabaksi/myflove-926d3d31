/**
 * Påverkan – vad som belastar den aktuella kapaciteten just nu.
 * Känslomässigt, mentalt eller omgivningsrelaterat. Sparas tillsammans
 * med dagens batteri/mående och ges till Flow som kontext.
 * Påverkan ändrar ALDRIG batteriprocenten automatiskt.
 */

export type ImpactKind =
  | "kanslomassigt"
  | "overbelastat"
  | "familj"
  | "jobb"
  | "annans-maende"
  | "oro"
  | "annat"
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

export const IMPACT_OPTIONS: { id: ImpactKind; labelSv: string; emoji: string }[] = [
  { id: "kanslomassigt", labelSv: "Jag är känslomässigt påverkad", emoji: "💜" },
  { id: "overbelastat", labelSv: "Mitt huvud är överbelastat", emoji: "🧠" },
  { id: "familj", labelSv: "Familj/barn tar mycket energi", emoji: "👨‍👧" },
  { id: "jobb", labelSv: "Jobb/ekonomi påverkar mig", emoji: "💼" },
  { id: "annans-maende", labelSv: "Någon annans mående påverkar mig", emoji: "🫂" },
  { id: "oro", labelSv: "Oro eller något som hänt", emoji: "🌧️" },
  { id: "annat", labelSv: "Annat", emoji: "✨" },
  { id: "inget", labelSv: "Inget särskilt", emoji: "☀️" },
];

export const IMPACT_DEGREES: { id: ImpactDegree; labelSv: string }[] = [
  { id: "lite", labelSv: "Lite" },
  { id: "mattligt", labelSv: "Måttligt" },
  { id: "mycket", labelSv: "Mycket" },
];

const KIND_AI_LABEL: Record<ImpactKind, string> = {
  kanslomassigt: "känslomässigt påverkad",
  overbelastat: "mentalt överbelastad",
  familj: "påverkad av att familj/barn tar mycket energi",
  jobb: "påverkad av jobb/ekonomi",
  "annans-maende": "påverkad av någon annans mående",
  oro: "påverkad av oro eller något som hänt",
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
  const labels = entry.kinds.map((k) => KIND_AI_LABEL[k]);
  const beskrivning =
    labels.length === 1
      ? `Användaren är ${labels[0]} – i graden ${DEGREE_AI_LABEL[entry.degree]}.`
      : `Användaren är ${labels.slice(0, -1).join(", ")} och ${labels[labels.length - 1]} – i graden ${DEGREE_AI_LABEL[entry.degree]}.`;
  return [
    `Dagens påverkan (användarens egen registrering): ${beskrivning}`,
    "Använd detta som bakgrund när du föreslår dagens prioriteringar: anpassa ton och kravnivå varsamt, men ändra inte användarens batterinivå och ställ inga diagnoser.",
  ].join("\n");
}
