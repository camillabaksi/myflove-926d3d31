import { useCallback } from "react";
import { useCloudSyncedStorage } from "@/lib/cloud-storage";
import type { QuickflowItem, QuickflowLevel } from "@/lib/quickflow";

const STORAGE_KEY = "myflove-quickflow";

const newId = () => Math.random().toString(36).slice(2, 11);

export function useQuickflow() {
  const [items, setItems] = useCloudSyncedStorage<QuickflowItem[]>(STORAGE_KEY, []);

  const add = useCallback(
    (input: {
      text: string;
      level: QuickflowLevel;
      remindAt?: number;
      placeId?: string;
      placeName?: string;
    }) => {
      const item: QuickflowItem = {
        id: newId(),
        text: input.text.trim(),
        level: input.level,
        createdAt: Date.now(),
        ...(input.remindAt ? { remindAt: input.remindAt } : {}),
        ...(input.placeId ? { placeId: input.placeId, placeName: input.placeName } : {}),
      };
      setItems((prev) => [item, ...prev]);
      return item;
    },
    [setItems],
  );

  const update = useCallback(
    (id: string, patch: Partial<QuickflowItem>) => {
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
    },
    [setItems],
  );

  const complete = useCallback(
    (id: string) => update(id, { done: true, doneAt: Date.now() }),
    [update],
  );

  const remove = useCallback(
    (id: string) => setItems((prev) => prev.filter((i) => i.id !== id)),
    [setItems],
  );

  const snooze = useCallback(
    (id: string, at: number) => {
      setItems((prev) =>
        prev.map((i) =>
          i.id === id
            ? {
                ...i,
                remindAt: at,
                notifiedAt: undefined,
                askedAt: Date.now(),
                snoozeCount: (i.snoozeCount ?? 0) + 1,
              }
            : i,
        ),
      );
    },
    [setItems],
  );

  const openItems = items.filter((i) => !i.done);

  return { items, openItems, add, update, complete, remove, snooze };
}
