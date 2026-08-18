import { useCallback } from "react";
import { useCloudSyncedStorage } from "@/lib/cloud-storage";
import { newRuleId, type QuickflowRule } from "@/lib/quickflow-rules";

const STORAGE_KEY = "myflove-quickflow-rules";

export function useQuickflowRules() {
  const [rules, setRules] = useCloudSyncedStorage<QuickflowRule[]>(STORAGE_KEY, []);

  const addRule = useCallback(
    (input: Omit<QuickflowRule, "id" | "createdAt" | "enabled"> & { enabled?: boolean }) => {
      const rule: QuickflowRule = {
        ...input,
        enabled: input.enabled ?? true,
        id: newRuleId(),
        createdAt: Date.now(),
      };
      setRules((prev) => [...prev, rule]);
      return rule;
    },
    [setRules],
  );

  const updateRule = useCallback(
    (id: string, patch: Partial<QuickflowRule>) => {
      setRules((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
    },
    [setRules],
  );

  const removeRule = useCallback(
    (id: string) => setRules((prev) => prev.filter((r) => r.id !== id)),
    [setRules],
  );

  /** Flyttar en regel upp/ner – första matchande regeln vinner. */
  const moveRule = useCallback(
    (id: string, dir: -1 | 1) => {
      setRules((prev) => {
        const i = prev.findIndex((r) => r.id === id);
        const j = i + dir;
        if (i < 0 || j < 0 || j >= prev.length) return prev;
        const next = [...prev];
        const [item] = next.splice(i, 1);
        next.splice(j, 0, item!);
        return next;
      });
    },
    [setRules],
  );

  return { rules, addRule, updateRule, removeRule, moveRule };
}
