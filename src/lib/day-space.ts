import { parseISODate, toISODate } from "@/lib/day";

export const DAY_SPACE_KEY = "myflove-day-space-revisions-v1";
export const SPACE_CATEGORIES = ["Oväntat", "Omsorg", "Praktiskt", "Annat"] as const;
export type SpaceCategory = (typeof SPACE_CATEGORIES)[number];
export interface SpaceRevision {
  id: string;
  date: string;
  parents: string[];
  text: string;
  categories: SpaceCategory[];
  createdAt: number;
}
export function validSpaceDate(date: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(date) && toISODate(parseISODate(date)) === date;
}
export function spaceHeads(rows: SpaceRevision[], date: string): SpaceRevision[] {
  const day = rows.filter(row => row.date === date);
  const superseded = new Set(day.flatMap(row => row.parents));
  return day.filter(row => !superseded.has(row.id)).sort((a, b) => b.createdAt - a.createdAt || b.id.localeCompare(a.id));
}
export function makeSpaceRevision(date: string, text: string, categories: SpaceCategory[], parents: string[]): SpaceRevision {
  if (!validSpaceDate(date)) throw new Error("Välj ett giltigt datum.");
  return { id: crypto.randomUUID(), date, text, categories: [...categories], parents: [...parents], createdAt: Date.now() };
}
export function appendSpaceRevision(rows: SpaceRevision[], revision: SpaceRevision): SpaceRevision[] {
  if (!revision.text.trim() && !rows.some(row => row.date === revision.date)) return rows;
  return rows.some(row => row.id === revision.id) ? rows : [...rows, revision];
}
/** Privacy stop: no verified content-free gateway logging contract exists. */
export const SPACE_AI_AVAILABLE = false;
export function maySendSpaceNote(consent: boolean, owner: string, activeOwner: string | null, date: string, currentDate: string): boolean {
  return SPACE_AI_AVAILABLE && consent && owner === activeOwner && date === currentDate;
}