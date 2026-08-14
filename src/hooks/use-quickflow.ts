import { useCallback } from "react";
import { useCloudSyncedStorage } from "@/lib/cloud-storage";
import {
  findDuplicate,
  strongerLevel,
  normalizeQuickflowText,
  type QuickflowItem,
  type QuickflowLevel,
} from "@/lib/quickflow";

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
    }): { item: QuickflowItem; merged: boolean } => {
      const text = input.text.trim();
      const existing = findDuplicate(items, text);

      if (existing) {
        // Samma sak finns redan (t.ex. inlagd både i Dump och Quickflow) –
        // slå ihop istället för att visa den två gånger.
        const merged: QuickflowItem = {
          ...existing,
          level: strongerLevel(existing.level, input.level),
          remindAt:
            input.remindAt && existing.remindAt
              ? Math.min(input.remindAt, existing.remindAt)
              : (input.remindAt ?? existing.remindAt),
          ...(input.placeId
            ? { placeId: input.placeId, placeName: input.placeName }
            : {}),
          notifiedAt: undefined,
          mergedCount: (existing.mergedCount ?? 0) + 1,
          mergedAt: Date.now(),
        };
        setItems((prev) => prev.map((i) => (i.id === existing.id ? merged : i)));
        return { item: merged, merged: true };
      }

      const item: QuickflowItem = {
        id: newId(),
        text,
        level: input.level,
        createdAt: Date.now(),
        ...(input.remindAt ? { remindAt: input.remindAt } : {}),
        ...(input.placeId ? { placeId: input.placeId, placeName: input.placeName } : {}),
      };
      setItems((prev) => [item, ...prev]);
      return { item, merged: false };
    },
    [items, setItems],
  );

  /**
   * Samma sak har landat någon annanstans (uppgift, inköpslista, påminnelse) –
   * ta bort den öppna Quickflow-tanken så den inte visas dubbelt.
   */
  const absorb = useCallback(
    (text: string): boolean => {
      const key = normalizeQuickflowText(text);
      if (!key) return false;
      const hit = items.some((i) => !i.done && normalizeQuickflowText(i.text) === key);
      if (hit) {
        setItems((prev) =>
          prev.filter((i) => i.done || normalizeQuickflowText(i.text) !== key),
        );
      }
      return hit;
    },
    [items, setItems],
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

  return { items, openItems, add, absorb, update, complete, remove, snooze };
}
