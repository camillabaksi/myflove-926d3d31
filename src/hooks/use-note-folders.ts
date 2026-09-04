import { useCallback } from "react";
import { useCloudSyncedStorage } from "@/lib/cloud-storage";
import { newFolderId, type NoteFolder } from "@/lib/note-folders";

const STORAGE_KEY = "myflove-note-folders";

export function useNoteFolders() {
  const [folders, setFolders] = useCloudSyncedStorage<NoteFolder[]>(STORAGE_KEY, []);

  const addFolder = useCallback(
    (name: string, emoji = "📁"): NoteFolder => {
      const folder: NoteFolder = {
        id: newFolderId(),
        name: name.trim(),
        emoji,
        createdAt: Date.now(),
      };
      setFolders((prev) => [...prev, folder]);
      return folder;
    },
    [setFolders],
  );

  const renameFolder = useCallback(
    (id: string, patch: Partial<Pick<NoteFolder, "name" | "emoji">>) =>
      setFolders((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f))),
    [setFolders],
  );

  const removeFolder = useCallback(
    (id: string) => setFolders((prev) => prev.filter((f) => f.id !== id)),
    [setFolders],
  );

  return { folders, addFolder, renameFolder, removeFolder };
}
