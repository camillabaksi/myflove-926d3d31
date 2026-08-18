// Relationer – ett flexibelt livsområde för de människor (och djur) som betyder
// något i ditt liv. Ingen måste ha partner, barn eller familj: du väljer själv
// vilka relationstyper som ska synas och vilka personer som finns i dem.
// MyFlove gissar aldrig vad en relation betyder – den används bara som kontext.

export type RelationTypeId =
  | "partner"
  | "barn"
  | "familj"
  | "vanner"
  | "anhoriga"
  | "husdjur"
  | "annan";

export interface RelationTypeMeta {
  id: RelationTypeId;
  label: string;
  emoji: string;
  blurb: string;
}

export const RELATION_TYPES: RelationTypeMeta[] = [
  { id: "partner", label: "Partner", emoji: "❤️", blurb: "Den du delar vardagen med" },
  { id: "barn", label: "Barn", emoji: "👧", blurb: "Barn i ditt liv" },
  { id: "familj", label: "Familj", emoji: "👨‍👩‍👧", blurb: "Hushåll och familj" },
  { id: "vanner", label: "Vänner", emoji: "🧑‍🤝‍🧑", blurb: "Vänner du vill hålla kontakt med" },
  { id: "anhoriga", label: "Anhöriga", emoji: "👵", blurb: "Släkt och personer du stöttar" },
  { id: "husdjur", label: "Husdjur", emoji: "🐾", blurb: "Djuren i ditt liv" },
  { id: "annan", label: "Annan viktig person", emoji: "➕", blurb: "Någon som inte passar i övriga" },
];

export function relationTypeMeta(id: string): RelationTypeMeta {
  return RELATION_TYPES.find((t) => t.id === id) ?? RELATION_TYPES[RELATION_TYPES.length - 1]!;
}

export interface RelationPerson {
  id: string;
  type: RelationTypeId;
  name: string;
  /** Fri information användaren själv vill kunna använda i appen. */
  note?: string;
  /** Valfritt datum, t.ex. födelsedag – används bara om användaren vill. */
  date?: string;
  createdAt: number;
}

export interface RelationsState {
  /** Vilka relationstyper användaren valt att visa. Tom lista = inga än. */
  enabledTypes: RelationTypeId[];
  people: RelationPerson[];
}

export const DEFAULT_RELATIONS: RelationsState = { enabledTypes: [], people: [] };

/** Rensar bort trasig data och håller ordningen som i RELATION_TYPES. */
export function normalizeRelations(raw: Partial<RelationsState> | null | undefined): RelationsState {
  const types = (raw?.enabledTypes ?? []).filter((t) =>
    RELATION_TYPES.some((m) => m.id === t),
  ) as RelationTypeId[];
  const people = (raw?.people ?? []).filter((p) => p && p.id && p.name);
  return {
    enabledTypes: RELATION_TYPES.map((m) => m.id).filter((id) => types.includes(id)),
    people,
  };
}

export function peopleOfType(state: RelationsState, type: RelationTypeId): RelationPerson[] {
  return state.people.filter((p) => p.type === type);
}

function escapeRe(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Hittar vilken person en text troligen handlar om.
 * Bara ett förslag – användaren kan alltid ändra eller ta bort kopplingen.
 */
export function guessRelation(text: string, people: RelationPerson[]): RelationPerson | null {
  const t = ` ${text.toLowerCase()} `;
  for (const p of people) {
    const name = p.name.trim().toLowerCase();
    if (name.length < 2) continue;
    if (new RegExp(`[^a-zåäö]${escapeRe(name)}(s|s?[^a-zåäö])`, "i").test(t)) return p;
  }
  return null;
}

/** Kort etikett som kan följa med som kontext till uppgift, kalender eller notis. */
export function relationTag(person: RelationPerson): string {
  const meta = relationTypeMeta(person.type);
  return `${meta.emoji} ${meta.label}: ${person.name}`;
}
