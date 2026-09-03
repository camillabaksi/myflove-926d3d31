import { useCallback, useEffect, useMemo, useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCloudSyncedStorage, getSyncUser } from "@/lib/cloud-storage";
import { subscribeToAccountTable } from "@/lib/account-realtime";
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
 * Delad store så att alla vyer (Hem, Min dag, FlowScore, Dagens energiflöde)
 * ser samma poster direkt när något sparas – utan omladdning.
 */
interface EnergyStore {
  entries: EnergyFactorEntry[];
  presets: EnergyPreset[];
  loading: boolean;
  userId: string | null;
}

let store: EnergyStore = { entries: [], presets: [], loading: true, userId: null };
const listeners = new Set<() => void>();
const getSnapshot = () => store;
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
const setStore = (patch: Partial<EnergyStore>) => {
  store = { ...store, ...patch };
  listeners.forEach((l) => l());
};

let loadPromise: Promise<void> | null = null;
const load = () =>
  (loadPromise ??= (async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setStore({ userId: null, loading: false });
        return;
      }
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
      setStore({
        userId: user.id,
        entries: ((rows ?? []) as Row[]).map(toEntry),
        presets: (presetRows ?? []).map((p) => ({
          id: p.id as string,
          title: p.title as string,
          direction: toDirection(p.direction as string),
          strength: p.strength as number,
          category: p.category as EnergyCategory,
          kind: ((p as { kind?: string }).kind ?? "vardag") as EnergyKind,
          friction: (p as { friction?: number | null }).friction ?? null,
        })),
        loading: false,
      });
    } catch {
      setStore({ loading: false });
    }
  })());

/** Tvingar en ny inläsning – används när någon loggar in eller ut. */
const reload = () => {
  loadPromise = null;
  setStore({ loading: true });
  void load();
};

// Håll storen i takt med inloggningen: loggar man in i samma flik ska
// posterna dyka upp direkt, och loggar man ut ska de försvinna direkt.
if (typeof window !== "undefined") {
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === "SIGNED_OUT") {
      loadPromise = null;
      setStore({ entries: [], presets: [], userId: null, loading: false });
      return;
    }
    if (event === "SIGNED_IN" || event === "USER_UPDATED") {
      const uid = session?.user?.id ?? null;
      if (uid !== store.userId) reload();
    }
  });
}

/** Samma sak sparad två gånger inom en minut är nästan alltid ett dubbeltryck. */
const DUPLICATE_WINDOW_MS = 60_000;

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
  addFactor: (input: NewEnergyFactor) => Promise<EnergyFactorEntry | null>;
  removeFactor: (id: string) => Promise<void>;
  updateFactor: (
    id: string,
    patch: Partial<
      Pick<EnergyFactorEntry, "direction" | "strength" | "friction" | "kind" | "title">
    >,
  ) => Promise<void>;
  toggleCounts: (id: string, counts: boolean) => Promise<void>;
  addPreset: (input: Omit<EnergyPreset, "id">) => Promise<void>;
  removePreset: (id: string) => Promise<void>;
} {
  const snap = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const { entries, presets, loading, userId } = snap;
  const [rawSettings, setSettings] = useCloudSyncedStorage<EnergyFlowSettings>(
    "myflove-energy-flow-settings",
    DEFAULT_ENERGY_FLOW_SETTINGS,
  );
  const settings = useMemo(() => normalizeSettings(rawSettings), [rawSettings]);

  useEffect(() => {
    void load();
  }, []);

  // Håll energiflödet uppdaterat när en annan inloggad enhet ändrar poster.
  useEffect(() => {
    if (!userId) return;
    const stopFactors = subscribeToAccountTable("energy_factors", userId, () => {
      reload();
    });
    const stopPresets = subscribeToAccountTable("energy_factor_presets", userId, () => {
      reload();
    });
    return () => {
      stopFactors();
      stopPresets();
    };
  }, [userId]);

  const addFactor = useCallback(
    async (input: NewEnergyFactor): Promise<EnergyFactorEntry | null> => {
      const uid = store.userId;
      if (!uid) return null;
      const occurredAt = input.occurredAt ?? new Date().toISOString();
      // Dubblettspärr: samma aktivitet och riktning inom en minut räknas som
      // ett dubbeltryck och sparas inte igen.
      const dup = store.entries.find(
        (e) =>
          e.title.trim().toLowerCase() === input.title.trim().toLowerCase() &&
          e.direction === input.direction &&
          Math.abs(new Date(e.occurredAt).getTime() - new Date(occurredAt).getTime()) <
            DUPLICATE_WINDOW_MS,
      );
      if (dup) return dup;
      const { data, error } = await supabase
        .from("energy_factors")
        .insert({
          user_id: uid,
          title: input.title,
          direction: input.direction,
          strength: input.strength,
          category: input.category,
          kind: input.kind ?? "vardag",
          friction: input.friction ?? null,
          note: input.note || null,
          occurred_at: occurredAt,
        })
        .select(
          "id, title, direction, strength, category, kind, friction, note, counts_toward_score, occurred_at",
        )
        .single();
      if (error) {
        // 23505 = serverns dubblettspärr (samma aktivitet, riktning och minut).
        // Då finns posten redan – hämta den och behandla sparningen som lyckad.
        if ((error as { code?: string }).code === "23505") {
          const { data: existing } = await supabase
            .from("energy_factors")
            .select(
              "id, title, direction, strength, category, kind, friction, note, counts_toward_score, occurred_at",
            )
            .eq("user_id", uid)
            .eq("direction", input.direction)
            .ilike("title", input.title.trim())
            .order("occurred_at", { ascending: false })
            .limit(1)
            .maybeSingle();
          if (existing) {
            const dupEntry = toEntry(existing as Row);
            if (!store.entries.some((e) => e.id === dupEntry.id)) {
              setStore({ entries: [dupEntry, ...store.entries] });
            }
            return dupEntry;
          }
        }
        throw error;
      }
      const entry = toEntry(data as Row);
      setStore({ entries: [entry, ...store.entries] });
      return entry;
    },
    [],
  );

  const removeFactor = useCallback(async (id: string) => {
    const prev = store.entries;
    setStore({ entries: prev.filter((e) => e.id !== id) });
    const { error } = await supabase.from("energy_factors").delete().eq("id", id);
    // Gick det inte att ta bort på riktigt ska posten tillbaka i vyn.
    if (error) setStore({ entries: prev });
  }, []);

  const updateFactor = useCallback(
    async (
      id: string,
      patch: Partial<
        Pick<EnergyFactorEntry, "direction" | "strength" | "friction" | "kind" | "title">
      >,
    ) => {
      const prev = store.entries;
      setStore({ entries: prev.map((e) => (e.id === id ? { ...e, ...patch } : e)) });
      const { error } = await supabase
        .from("energy_factors")
        .update({
          ...(patch.direction ? { direction: patch.direction } : {}),
          ...(patch.strength != null ? { strength: patch.strength } : {}),
          ...(patch.friction !== undefined ? { friction: patch.friction } : {}),
          ...(patch.kind ? { kind: patch.kind } : {}),
          ...(patch.title ? { title: patch.title } : {}),
        })
        .eq("id", id);
      if (error) setStore({ entries: prev });
    },
    [],
  );

  const toggleCounts = useCallback(async (id: string, counts: boolean) => {
    const prev = store.entries;
    setStore({
      entries: prev.map((e) => (e.id === id ? { ...e, countsTowardScore: counts } : e)),
    });
    const { error } = await supabase
      .from("energy_factors")
      .update({ counts_toward_score: counts })
      .eq("id", id);
    if (error) setStore({ entries: prev });
  }, []);

  const addPreset = useCallback(async (input: Omit<EnergyPreset, "id">) => {
    const uid = store.userId;
    if (!uid) return;
    const { data, error } = await supabase
      .from("energy_factor_presets")
      .upsert(
        {
          user_id: uid,
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
    setStore({ presets: [...store.presets.filter((p) => p.id !== preset.id), preset] });
  }, []);

  const removePreset = useCallback(async (id: string) => {
    setStore({ presets: store.presets.filter((p) => p.id !== id) });
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
