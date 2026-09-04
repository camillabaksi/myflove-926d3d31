// Anteckningar – det som bara ska få finnas. Ingen deadline, inget krav.
// En anteckning kan senare bli något annat, men bara när du säger till.

import type { LifeArea } from "./life-areas";
import { guessDestination, type QuickflowDestination } from "./quickflow";

export interface FlowNote {
  id: string;
  text: string;
  area?: LifeArea;
  /** Användarens egen mapp – helt frivillig. */
  folderId?: string;
  createdAt: number;
  /** Sätts när anteckningen omvandlats till något annat. */
  convertedAt?: number;
  convertedTo?: QuickflowDestination | "energi";
}

export const newNoteId = () => Math.random().toString(36).slice(2, 11);

/** Vad anteckningen skulle kunna bli – ett förslag, aldrig ett beslut. */
export function suggestForNote(note: FlowNote): QuickflowDestination | null {
  const d = guessDestination({ text: note.text });
  return d === "behall" || d === "anteckning" ? null : d;
}
