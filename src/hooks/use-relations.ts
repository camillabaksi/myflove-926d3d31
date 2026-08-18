import { useCallback, useMemo } from "react";
import { useCloudSyncedStorage } from "@/lib/cloud-storage";
import {
  DEFAULT_RELATIONS,
  normalizeRelations,
  type RelationPerson,
  type RelationTypeId,
  type RelationsState,
} from "@/lib/relations";

const KEY = "myflove-relations";

function newId() {
  return `rel_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/** Relationer – helt användarstyrt. Inget läggs till automatiskt. */
export function useRelations() {
  const [raw, setRaw] = useCloudSyncedStorage<RelationsState>(KEY, DEFAULT_RELATIONS);
  const state = useMemo(() => normalizeRelations(raw), [raw]);

  const toggleType = useCallback(
    (type: RelationTypeId) => {
      setRaw((prev) => {
        const cur = normalizeRelations(prev);
        return cur.enabledTypes.includes(type)
          ? { ...cur, enabledTypes: cur.enabledTypes.filter((t) => t !== type) }
          : { ...cur, enabledTypes: [...cur.enabledTypes, type] };
      });
    },
    [setRaw],
  );

  const addPerson = useCallback(
    (type: RelationTypeId, name: string, extra?: { note?: string; date?: string }) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      setRaw((prev) => {
        const cur = normalizeRelations(prev);
        const person: RelationPerson = {
          id: newId(),
          type,
          name: trimmed,
          ...(extra?.note?.trim() ? { note: extra.note.trim() } : {}),
          ...(extra?.date ? { date: extra.date } : {}),
          createdAt: Date.now(),
        };
        return {
          enabledTypes: cur.enabledTypes.includes(type)
            ? cur.enabledTypes
            : [...cur.enabledTypes, type],
          people: [...cur.people, person],
        };
      });
    },
    [setRaw],
  );

  const updatePerson = useCallback(
    (id: string, patch: Partial<Omit<RelationPerson, "id" | "createdAt">>) => {
      setRaw((prev) => {
        const cur = normalizeRelations(prev);
        return {
          ...cur,
          people: cur.people.map((p) => (p.id === id ? { ...p, ...patch } : p)),
        };
      });
    },
    [setRaw],
  );

  const removePerson = useCallback(
    (id: string) => {
      setRaw((prev) => {
        const cur = normalizeRelations(prev);
        return { ...cur, people: cur.people.filter((p) => p.id !== id) };
      });
    },
    [setRaw],
  );

  return {
    enabledTypes: state.enabledTypes,
    people: state.people,
    toggleType,
    addPerson,
    updatePerson,
    removePerson,
  };
}
