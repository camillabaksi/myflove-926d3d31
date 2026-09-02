import { useCallback } from "react";
import { useCloudSyncedStorage } from "@/lib/cloud-storage";




/**
 * Uppladdade schemafiler (bild/PDF) sparas lokalt så att man kan
 * trycka på dem och titta på originalet igen.
 */
export type ScheduleFile = {
  id: string;
  name: string;
  mime: string;
  dataUrl: string;
  addedAt: string;
};

const KEY = "myflove-schedule-files";
const MAX_FILES = 6;

export function useScheduleFiles() {
  const [files, setFiles] = useCloudSyncedStorage<ScheduleFile[]>(KEY, []);

  const addFile = useCallback(
    (input: Omit<ScheduleFile, "id" | "addedAt">) => {
      const file: ScheduleFile = {
        ...input,
        id: Math.random().toString(36).slice(2, 11),
        addedAt: new Date().toISOString(),
      };
      setFiles((current) => [file, ...current].slice(0, MAX_FILES));
      return file;
    },
    [setFiles],
  );

  const removeFile = useCallback(
    (id: string) => setFiles((current) => current.filter((file) => file.id !== id)),
    [setFiles],
  );

  return { files, addFile, removeFile };
}
