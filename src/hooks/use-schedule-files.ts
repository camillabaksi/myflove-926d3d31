import { useCallback, useEffect, useState } from "react";

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

function read(): ScheduleFile[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as ScheduleFile[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function useScheduleFiles() {
  const [files, setFiles] = useState<ScheduleFile[]>([]);

  useEffect(() => {
    setFiles(read());
  }, []);

  const persist = useCallback((next: ScheduleFile[]) => {
    setFiles(next);
    try {
      window.localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* full lagring – filen visas ändå i denna session */
    }
  }, []);

  const addFile = useCallback(
    (input: Omit<ScheduleFile, "id" | "addedAt">) => {
      const file: ScheduleFile = {
        ...input,
        id: Math.random().toString(36).slice(2, 11),
        addedAt: new Date().toISOString(),
      };
      persist([file, ...read()].slice(0, MAX_FILES));
      return file;
    },
    [persist],
  );

  const removeFile = useCallback(
    (id: string) => persist(read().filter((f) => f.id !== id)),
    [persist],
  );

  return { files, addFile, removeFile };
}
