import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCloudSyncedStorage } from "@/lib/cloud-storage";
import {
  balanceFor,
  DEFAULT_ENERGY_FLOW_SETTINGS,
  energyInsight,
  normalizeSettings,
  type EnergyBalance,
  type EnergyCategory,
  type EnergyDirection,
  type EnergyFactorEntry,
  type EnergyKind,
  type EnergyFlowSettings,
  type EnergyInsight,
  type EnergyPreset,
} from "@/lib/energy-flow";

interface Row {
  id: string;
  title: string;
  direction: string;
  strength: number;
  category: string;
  kind?: string | null;
  friction?: number | null;
  note: string | null;
  counts_toward_score: boolean;
  occurred_at: string;
}

const toDirection = (v: string): EnergyDirection =>
  v === "gives" ? "gives" : v === "neutral" ? "neutral" : "drains";

const toEntry = (r: Row): EnergyFactorEntry => ({
  id: r.id,
  title: r.title,
  direction: toDirection(r.direction),
  strength: r.strength,
  category: r.category as EnergyCategory,
  kind: (r.kind ?? "vardag") as EnergyKind,
  friction: r.friction ?? null,
  note: r.note,
  countsTowardScore: r.counts_toward_score,
  occurredAt: r.occurred_at,
});

export interface NewEnergyFactor {
  title: string;
  direction: EnergyDirection;
  strength: number;
  category: EnergyCategory;
  kind?: EnergyKind;
  friction?: number | null;
  note?: string;
  occurredAt?: string;
}


/**
 * Energiflöde™ – det som ger och tar energi. Poster blir aldrig
 * kalenderhändelser eller uppgifter; de beskriver din kapacitet.
 */
export function useEnergyFlow(): {
  entries: EnergyFactorEntry[];
  presets: EnergyPreset[];
  balance: EnergyBalance;
  insight: EnergyInsight | null;
  settings: EnergyFlowSettings;
  setSettings: (s: EnergyFlowSettings) => void;
  loading: boolean;
  signedIn: boolean;
  addFactor: (input: NewEnergyFactor) => Promise<void>;
  removeFactor: (id: string) => Promise<void>;
  updateFactor: (
    id: string,
    patch: Partial<Pick<EnergyFactorEntry, "direction" | "strength" | "friction" | "kind" | "title">>,
  ) => Promise<void>;
  toggleCounts: (id: string, counts: boolean) => Promise<void>;
  addPreset: (input: Omit<EnergyPreset, "id">) => Promise<void>;
  removePreset: (id: string) => Promise<void>;
} {
  const [entries, setEntries] = useState<EnergyFactorEntry[]>([]);
  const [presets, setPresets] = useState<EnergyPreset[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [rawSettings, setSettings] = useCloudSyncedStorage<EnergyFlowSettings>(
    "myflove-energy-flow-settings",
    DEFAULT_ENERGY_FLOW_SETTINGS,
  );
  const settings = useMemo(() => normalizeSettings(rawSettings), [rawSettings]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (cancelled) return;
        setUserId(user?.id ?? null);
        if (!user) return;
        const since = new Date(Date.now() - 60 * 86400000).toISOString();
        const [{ data: rows }, { data: presetRows }] = await Promise.all([
          supabase
            .from("energy_factors")
            .select(
              "id, title, direction, strength, category, kind, friction, note, counts_toward_score, occurred_at",
            )
            .gte("occurred_at", since)
            .order("occurred_at", { ascending: false })
            .limit(500),
          supabase
            .from("energy_factor_presets")
            .select("id, title, direction, strength, category, kind, friction")
            .order("created_at", { ascending: true }),
        ]);
        if (cancelled) return;
        setEntries(((rows ?? []) as Row[]).map(toEntry));
        setPresets(
          (presetRows ?? []).map((p) => ({
            id: p.id as string,
            title: p.title as string,
            direction: toDirection(p.direction as string),
            strength: p.strength as number,
            category: p.category as EnergyCategory,
            kind: ((p as { kind?: string }).kind ?? "vardag") as EnergyKind,
            friction: (p as { friction?: number | null }).friction ?? null,
          })),
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const addFactor = useCallback(
    async (input: NewEnergyFactor) => {
      if (!userId) return;
      const { data, error } = await supabase
        .from("energy_factors")
        .insert({
          user_id: userId,
          title: input.title,
          direction: input.direction,
          strength: input.strength,
          category: input.category,
          kind: input.kind ?? "vardag",
          friction: input.friction ?? null,
          note: input.note || null,
          occurred_at: input.occurredAt ?? new Date().toISOString(),
        })
        .select("id, title, direction, strength, category, kind, friction, note, counts_toward_score, occurred_at")
        .single();
      if (error) throw error;
      setEntries((prev) => [toEntry(data as Row), ...prev]);
    },
    [userId],
  );

  const removeFactor = useCallback(async (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
    await supabase.from("energy_factors").delete().eq("id", id);
  }, []);

  const updateFactor = useCallback(
    async (
      id: string,
      patch: Partial<
        Pick<EnergyFactorEntry, "direction" | "strength" | "friction" | "kind" | "title">
      >,
    ) => {
      setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
      await supabase
        .from("energy_factors")
        .update({
          ...(patch.direction ? { direction: patch.direction } : {}),
          ...(patch.strength != null ? { strength: patch.strength } : {}),
          ...(patch.friction !== undefined ? { friction: patch.friction } : {}),
          ...(patch.kind ? { kind: patch.kind } : {}),
          ...(patch.title ? { title: patch.title } : {}),
        })
        .eq("id", id);
    },
    [],
  );

  const toggleCounts = useCallback(async (id: string, counts: boolean) => {
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, countsTowardScore: counts } : e)));
    await supabase.from("energy_factors").update({ counts_toward_score: counts }).eq("id", id);
  }, []);

  const addPreset = useCallback(
    async (input: Omit<EnergyPreset, "id">) => {
      if (!userId) return;
      const { data, error } = await supabase
        .from("energy_factor_presets")
        .upsert(
          {
            user_id: userId,
            title: input.title,
            direction: input.direction,
            strength: input.strength,
            category: input.category,
            kind: input.kind ?? "vardag",
            friction: input.friction ?? null,
          },
          { onConflict: "user_id,title,direction" },
        )
        .select("id, title, direction, strength, category, kind, friction")
        .single();
      if (error) throw error;
      const preset: EnergyPreset = {
        id: data.id as string,
        title: data.title as string,
        direction: toDirection(data.direction as string),
        strength: data.strength as number,
        category: data.category as EnergyCategory,
        kind: ((data as { kind?: string }).kind ?? "vardag") as EnergyKind,
        friction: (data as { friction?: number | null }).friction ?? null,
      };
      setPresets((prev) => [...prev.filter((p) => p.id !== preset.id), preset]);
    },
    [userId],
  );

  const removePreset = useCallback(async (id: string) => {
    setPresets((prev) => prev.filter((p) => p.id !== id));
    await supabase.from("energy_factor_presets").delete().eq("id", id);
  }, []);

  const balance = useMemo(() => balanceFor(entries, new Date(), settings), [entries, settings]);
  const insight = useMemo(() => energyInsight(entries, balance), [entries, balance]);

  return {
    entries,
    presets,
    balance,
    insight,
    settings,
    setSettings,
    loading,
    signedIn: !!userId,
    addFactor,
    removeFactor,
    updateFactor,
    toggleCounts,
    addPreset,
    removePreset,
  };
}
