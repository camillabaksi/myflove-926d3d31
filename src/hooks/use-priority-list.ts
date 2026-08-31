import { useCallback } from "react";
import { useCloudSyncedStorage } from "@/lib/cloud-storage";
import { sortPriority, type PriorityBucket, type PriorityTask } from "@/lib/quickflow-priority";

const STORAGE_KEY = "myflove-quickflow-priority";

const newId = () => Math.random().toString(36).slice(2, 11);

/**
 * "Min lista just nu" – en tillfällig QuickFlow-lista utan tider.
 * Att lägga till något här är INTE att ha gjort det, och skapar aldrig
 * kalenderhändelse, påminnelse eller energipost.
 */
export function usePriorityList() {
  const [items, setItems] = useCloudSyncedStorage<PriorityTask[]>(STORAGE_KEY, []);

  const replace = useCallback((next: PriorityTask[]) => setItems(sortPriority(next)), [setItems]);

  const add = useCallback(
    (title: string, bucket: PriorityBucket = "kan-vanta") => {
      const t = title.trim();
      if (!t) return;
      setItems((prev) => [
        ...(prev ?? []),
        {
          id: newId(),
          title: t,
          bucket,
          order: (prev?.length ?? 0) + 1,
          createdAt: Date.now(),
        },
      ]);
    },
    [setItems],
  );

  const update = useCallback(
    (id: string, patch: Partial<PriorityTask>) =>
      setItems((prev) => (prev ?? []).map((i) => (i.id === id ? { ...i, ...patch } : i))),
    [setItems],
  );

  const remove = useCallback(
    (id: string) => setItems((prev) => (prev ?? []).filter((i) => i.id !== id)),
    [setItems],
  );

  const clear = useCallback(() => setItems([]), [setItems]);

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

  return { items: items ?? [], openItems, doneItems, add, update, remove, move, replace, clear };
}
