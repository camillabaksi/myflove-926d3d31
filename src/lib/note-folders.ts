// Egna mappar för anteckningar – helt användarstyrda.
// Ingen mapp krävs någonsin vid Quickflow-inmatning: fånga först, sortera senare.

export interface NoteFolder {
  id: string;
  name: string;
  emoji: string;
  createdAt: number;
}

export const newFolderId = () => Math.random().toString(36).slice(2, 11);

/** Förslag användaren kan lägga till med ett klick – inget skapas automatiskt. */
export const FOLDER_SUGGESTIONS: { name: string; emoji: string }[] = [
  { name: "Hem", emoji: "🏠" },
  { name: "Familj", emoji: "👨‍👩‍👧" },
  { name: "Jobb", emoji: "💼" },
  { name: "Studier", emoji: "🎓" },
  { name: "Idéer", emoji: "💡" },
  { name: "Viktigt", emoji: "📌" },
];

export const FOLDER_EMOJIS = ["📁", "🏠", "👨‍👩‍👧", "💼", "🎓", "💡", "📌", "💜", "🛒", "🧠"];

export function folderLabel(folder: NoteFolder): string {
  return `${folder.emoji} ${folder.name}`;
}
