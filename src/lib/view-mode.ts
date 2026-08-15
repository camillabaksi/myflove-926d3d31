import { useCallback, useEffect, useState } from "react";
import type { LifeArea } from "@/lib/life-areas";

export type ViewMode = "vanlig" | "forenklad";

const KEY = "myflove-view-mode";
const listeners = new Set<() => void>();

type Store = Record<string, ViewMode>;

function readStore(): Store {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Store) : {};
  } catch {
    return {};
  }
}

function writeStore(store: Store) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(store));
  } catch {
    /* ignen lagring – valet gäller bara denna session */
  }
  listeners.forEach((l) => l());
}

/**
 * Vanlig eller förenklad vy – valet sparas per rum (kategori)
 * och ligger kvar tills du väljer något annat.
 */
export function useViewMode(area: LifeArea | string) {
  const [mode, setModeState] = useState<ViewMode>("vanlig");

  useEffect(() => {
    const sync = () => setModeState(readStore()[area] ?? "vanlig");
    sync();
    listeners.add(sync);
    return () => {
      listeners.delete(sync);
    };
  }, [area]);

  const setMode = useCallback(
    (next: ViewMode) => {
      writeStore({ ...readStore(), [area]: next });
    },
    [area],
  );

  return { mode, setMode, isSimple: mode === "forenklad" };
}
