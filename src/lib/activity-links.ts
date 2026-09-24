/**
 * Kopplingar mellan separata aktiviteter – lagras i det befintliga
 * metadata-kuvertet på barnaktiviteter. Ingen ny tabell och inga nya delningar.
 */
import { decodeVisualNotes, encodeVisualNotes } from "@/lib/child-visual-schedule";

export interface LinkPatch {
  linkGroup?: string | null;
  parentTaskId?: string | null;
}

/** Returnerar nya notes med ändrad koppling; övrig metadata och anteckning bevaras. */
export function withLinkMeta(notes: string | null | undefined, patch: LinkPatch): string {
  const { meta, note } = decodeVisualNotes(notes ?? null);
  const next = { ...meta };
  if (patch.linkGroup === null) delete next.linkGroup;
  else if (patch.linkGroup) next.linkGroup = patch.linkGroup;
  if (patch.parentTaskId === null) delete next.parentTaskId;
  else if (patch.parentTaskId) next.parentTaskId = patch.parentTaskId;
  return encodeVisualNotes(next, note);
}

export function newLinkGroup(): string {
  const rand =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().replace(/-/g, "").slice(0, 16)
      : Math.random().toString(36).slice(2, 18);
  return `lg_${rand}`;
}
