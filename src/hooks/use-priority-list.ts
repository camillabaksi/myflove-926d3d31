import { useCallback, useEffect, useMemo } from "react";
import { normalizeBucket } from "@/lib/priority-engine";
import { useCloudSyncedStorage } from "@/lib/cloud-storage";
import { normalizeQuickflowText } from "@/lib/quickflow";
import {
  sortPriority,
  splitTasks,
  type PriorityBucket,
  type PriorityTask,
} from "@/lib/quickflow-priority";

const STORAGE_KEY = "myflove-quickflow-priority";
const INTRO_KEY = "myflove-quickflow-priority-intro";

const newId = () => Math.random().toString(36).slice(2, 11);

/**
 * "Min lista just nu" – en tillfällig QuickFlow-lista utan tider.
 * Att lägga till något här är INTE att ha gjort det, och skapar aldrig
 * kalenderhändelse, påminnelse eller energipost.
 */
export function usePriorityList() {
  const [rawItems, setItems] = useCloudSyncedStorage<PriorityTask[]>(STORAGE_KEY, []);
  // Gamla/okända bucket-värden översätts vid läsning (P1–P4) – inget skrivs om.
  const items = useMemo(
    () => (rawItems ?? []).map((i) => ({ ...i, bucket: normalizeBucket(i.bucket) })),
    [rawItems],
  );
  const [intro, setIntro] = useCloudSyncedStorage<string | null>(INTRO_KEY, null);

  const replace = useCallback((next: PriorityTask[]) => setItems(sortPriority(next)), [setItems]);

  /**
   * Slår ihop nya prioriterade saker med befintliga – bevarar öppna och
   * klara poster (inkl. doneAt) istället för att skriva över hela listan.
   * Dubbletter (samma titel, ej klar) ersätts av den nya versionen.
   */
  const merge = useCallback(
    (next: PriorityTask[]) =>
      setItems((prev) => {
        const base = prev ?? [];
        const newKeys = new Set(next.map((i) => normalizeQuickflowText(i.title)).filter(Boolean));
        const existingOpen = new Map(
          base
            .filter((item) => !item.done)
            .map((item) => [normalizeQuickflowText(item.title), item]),
        );
        const kept = base.filter((i) => i.done || !newKeys.has(normalizeQuickflowText(i.title)));
        const merged = next.map((item) => {
          const existing = existingOpen.get(normalizeQuickflowText(item.title));
          return existing ? { ...item, id: existing.id } : item;
        });
        return sortPriority([...kept, ...merged]);
      }),
    [setItems],
  );

  /** Lägger till en eller flera saker – fritext delas upp automatiskt. */
  const add = useCallback(
    (title: string, bucket: PriorityBucket = "kan-vanta") => {
      const titles = splitTasks(title);
      const parts = titles.length > 0 ? titles : [title.trim()].filter(Boolean);
      if (parts.length === 0) return;
      setItems((prev) => {
        const base = prev ?? [];
        const now = Date.now();
        return [
          ...base,
          ...parts.map((t, i) => ({
            id: newId(),
            title: t,
            bucket,
            order: base.length + i + 1,
            createdAt: now,
          })),
        ];
      });
    },
    [setItems],
  );

  /**
   * Delar upp en sak som innehåller flera händelser i enskilda saker.
   * Returnerar antalet nya saker (1 = gick inte att dela).
   */
  const splitItem = useCallback(
    (id: string) => {
      let count = 1;
      setItems((prev) => {
        const base = prev ?? [];
        const item = base.find((i) => i.id === id);
        if (!item) return base;
        const parts = splitTasks(item.title);
        if (parts.length < 2) return base;
        count = parts.length;
        const now = Date.now();
        return base.flatMap((i) =>
          i.id === id
            ? parts.map((t, k) => ({
                ...i,
                id: k === 0 ? i.id : newId(),
                title: t,
                order: i.order + k * 0.001,
                why: undefined,
                clarify: undefined,
                createdAt: now,
              }))
            : [i],
        );
      });
      return count;
    },
    [setItems],
  );

  useEffect(() => {
    const onTaskSync = (event: Event) => {
      const detail = (
        event as CustomEvent<{
          source?: string;
          id?: string;
          patch?: Partial<PriorityTask>;
        }>
      ).detail;
      if (detail?.source !== "task" || !detail.id || !detail.patch) return;
      setItems((prev) =>
        (prev ?? []).map((item) => (item.id === detail.id ? { ...item, ...detail.patch } : item)),
      );
    };
    const onTaskDelete = (event: Event) => {
      const detail = (event as CustomEvent<{ source?: string; id?: string }>).detail;
      if (detail?.source !== "task" || !detail.id) return;
      setItems((prev) => (prev ?? []).filter((item) => item.id !== detail.id));
    };
    window.addEventListener("myflove:quickflow-sync", onTaskSync);
    window.addEventListener("myflove:quickflow-delete", onTaskDelete);
    return () => {
      window.removeEventListener("myflove:quickflow-sync", onTaskSync);
      window.removeEventListener("myflove:quickflow-delete", onTaskDelete);
    };
  }, [setItems]);

  const update = useCallback(
    (id: string, patch: Partial<PriorityTask>) => {
      setItems((prev) => (prev ?? []).map((i) => (i.id === id ? { ...i, ...patch } : i)));
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("myflove:quickflow-sync", {
            detail: { source: "priority", id, patch },
          }),
        );
      }
    },
    [setItems],
  );

  const remove = useCallback(
    (id: string) => {
      setItems((prev) => (prev ?? []).filter((i) => i.id !== id));
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("myflove:quickflow-delete", {
            detail: { source: "priority", id },
          }),
        );
      }
    },
    [setItems],
  );

  const clear = useCallback(() => {
    const ids = (items ?? []).map((item) => item.id);
    setItems([]);
    if (typeof window !== "undefined") {
      ids.forEach((id) =>
        window.dispatchEvent(
          new CustomEvent("myflove:quickflow-delete", {
            detail: { source: "priority", id },
          }),
        ),
      );
    }
  }, [items, setItems]);

  /** Flytta en sak upp/ned i den sorterade listan – användaren bestämmer alltid. */
  const move = useCallback(
    (id: string, dir: -1 | 1) => {
      setItems((prev) => {
        const sorted = sortPriority(prev ?? []);
        const idx = sorted.findIndex((i) => i.id === id);
        const target = idx + dir;
        if (idx < 0 || target < 0 || target >= sorted.length) return prev ?? [];
        const a = sorted[idx] as PriorityTask;
        const b = sorted[target] as PriorityTask;
        sorted[idx] = { ...b, bucket: a.bucket, order: a.order };
        sorted[target] = { ...a, bucket: b.bucket, order: b.order };
        return sorted;
      });
    },
    [setItems],
  );

  const openItems = sortPriority((items ?? []).filter((i) => !i.done));
  const doneItems = (items ?? []).filter((i) => i.done);

  return {
    items: items ?? [],
    openItems,
    doneItems,
    intro,
    setIntro,
    add,
    update,
    remove,
    move,
    replace,
    merge,
    clear,
    splitItem,
  };
}
