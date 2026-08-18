import { useCallback } from "react";
import { useCloudSyncedStorage } from "@/lib/cloud-storage";
import { newNoteId, type FlowNote } from "@/lib/notes";
import type { LifeArea } from "@/lib/life-areas";

const STORAGE_KEY = "myflove-notes";

export function useNotes() {
  const [notes, setNotes] = useCloudSyncedStorage<FlowNote[]>(STORAGE_KEY, []);

  const addNote = useCallback(
    (text: string, area?: LifeArea): FlowNote => {
      const note: FlowNote = {
        id: newNoteId(),
        text: text.trim(),
        createdAt: Date.now(),
        ...(area ? { area } : {}),
      };
      setNotes((prev) => [note, ...prev]);
      return note;
    },
    [setNotes],
  );

  const updateNote = useCallback(
    (id: string, patch: Partial<FlowNote>) =>
      setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, ...patch } : n))),
    [setNotes],
  );

  const removeNote = useCallback(
    (id: string) => setNotes((prev) => prev.filter((n) => n.id !== id)),
    [setNotes],
  );

  const openNotes = notes.filter((n) => !n.convertedAt);

  return { notes, openNotes, addNote, updateNote, removeNote };
}
