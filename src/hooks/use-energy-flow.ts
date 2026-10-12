import { useCallback, useEffect, useMemo, useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ACCOUNT_BOUND_EVENT, useCloudSyncedStorage, getSyncUser } from "@/lib/cloud-storage";
import { subscribeToAccountTable } from "@/lib/account-realtime";
import { getDataOwner, isActiveOwner } from "@/lib/account-scope";
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
  v === "gives" ? "gives" : v === "both" ? "both" : v === "neutral" ? "neutral" : "drains";

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
  /** En aktivitetsförekomst återanvänder sitt id vid ändring och retry. */
  id?: string;
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
let generation = 0;
const load = () =>
  (loadPromise ??= (async () => {
    const currentGeneration = generation;
    try {
      const user = await getSyncUser();
      if (currentGeneration !== generation) return;
      if (!user) {
        setStore({ userId: null, entries: [], presets: [], loading: false });
        return;
      }
      setStore({ userId: user.id });
      const before = new Map(store.entries.map((entry) => [entry.id, entry]));
      const since = new Date(Date.now() - 60 * 86400000).toISOString();
      const [{ data: rows }, { data: presetRows }] = await Promise.all([
        supabase
          .from("energy_factors")
          .select(
            "id, title, direction, strength, category, kind, friction, note, counts_toward_score, occurred_at",
          )
          .eq("user_id", user.id)
          .gte("occurred_at", since)
          .order("occurred_at", { ascending: false })
          .limit(500),
        supabase
          .from("energy_factor_presets")
          .select("id, title, direction, strength, category, kind, friction")
          .eq("user_id", user.id)
          .order("created_at", { ascending: true }),
      ]);
      if (currentGeneration !== generation || !isActiveOwner(user.id)) return;
      // Läsningen kan ha startat före en ny sparning. Behåll nya/ändrade
      // poster i samma store i stället för att ersätta dem med ett äldre svar.
      const entries = new Map(((rows ?? []) as Row[]).map((row) => [row.id, toEntry(row)]));
      for (const entry of store.entries) {
        if (before.get(entry.id) !== entry) entries.set(entry.id, entry);
      }
      setStore({
        userId: user.id,
        entries: [...entries.values()].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt)),
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
      if (currentGeneration === generation) setStore({ loading: false });
    }
  })());

/** Tvingar en ny inläsning – används när någon loggar in eller ut. */
const reload = () => {
  generation++;
  loadPromise = null;
  setStore({ loading: true });
  void load();
};

// Håll storen i takt med inloggningen: loggar man in i samma flik ska
// posterna dyka upp direkt, och loggar man ut ska de försvinna direkt.
if (typeof window !== "undefined") {
  window.addEventListener(ACCOUNT_BOUND_EVENT, reload);
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === "SIGNED_OUT") {
      generation++;
      loadPromise = null;
      setStore({ entries: [], presets: [], userId: null, loading: false });
      return;
    }
    if (event === "SIGNED_IN" || event === "USER_UPDATED") {
      const uid = session?.user?.id ?? null;
      if (uid !== store.userId) {
        setStore({ entries: [], presets: [], userId: null });
        reload();
      }
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
      const requestedOwner = getDataOwner();
      // Ett tidigt tryck får inte försvinna medan kontots data fortfarande laddas.
      await load();
      const uid = store.userId;
      if (!uid || uid !== requestedOwner || !isActiveOwner(uid)) return null;
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
      if (!input.id && dup) return dup;
      const payload = {
        ...(input.id ? { id: input.id } : {}),
        user_id: uid,
        title: input.title,
        direction: input.direction,
        strength: input.strength,
        category: input.category,
        kind: input.kind ?? "vardag",
        friction: input.friction ?? null,
        note: input.note || null,
        occurred_at: occurredAt,
      };
      const table = supabase.from("energy_factors");
      const { data, error } = await (
        input.id ? table.upsert(payload, { onConflict: "id" }) : table.insert(payload)
      )
        .select(
          "id, title, direction, strength, category, kind, friction, note, counts_toward_score, occurred_at",
        )
        .single();
      if (store.userId !== uid || !isActiveOwner(uid)) throw new Error("Kontot ändrades.");
      if (error) {
        // 23505 = serverns dubblettspärr (samma aktivitet, riktning och minut).
        // Då finns posten redan – hämta den och behandla sparningen som lyckad.
        if (!input.id && (error as { code?: string }).code === "23505") {
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
            if (store.userId !== uid || !isActiveOwner(uid)) throw new Error("Kontot ändrades.");
            const dupEntry = toEntry(existing as Row);
            if (!store.entries.some((e) => e.id === dupEntry.id)) {
              setStore({ entries: [dupEntry, ...store.entries] });
            }
            return dupEntry;
          }
        }
        throw error;
      }
      if (!data) throw new Error("Energiposten kunde inte bekräftas.");
      const entry = toEntry(data as Row);
      setStore({
        entries: [entry, ...store.entries.filter((previous) => previous.id !== entry.id)],
      });
      return entry;
    },
    [],
  );

  const removeFactor = useCallback(async (id: string) => {
    const uid = store.userId;
    if (!uid || !isActiveOwner(uid)) throw new Error("Kontot ändrades.");
    const removed = store.entries.find((entry) => entry.id === id);
    setStore({ entries: store.entries.filter((e) => e.id !== id) });
    const { error } = await supabase
      .from("energy_factors")
      .delete()
      .eq("id", id)
      .eq("user_id", uid);
    if (store.userId !== uid || !isActiveOwner(uid)) throw new Error("Kontot ändrades.");
    if (error) {
      if (removed && !store.entries.some((entry) => entry.id === id))
        setStore({ entries: [removed, ...store.entries] });
      throw error;
    }
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
