import { useCallback, useEffect, useMemo, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getSyncUser } from "@/lib/cloud-storage";
import { useMoods, type MoodEntry } from "@/hooks/use-data";
import { useLocalStorage } from "@/lib/storage";
import { useCloudSyncedStorage } from "@/lib/cloud-storage";
import { subscribeToAccountTable } from "@/lib/account-realtime";
import { getDataOwner, isActiveOwner } from "@/lib/account-scope";
import { energyPercent, percentNote, percentToLevel } from "@/lib/energy-percent";
import { todayISO } from "@/lib/day";

import { PENDING_ENERGY_KEY, ensurePendingUuids, migratePendingEnergy } from "@/lib/energy-pending";

/**
 * Snabb självregistrering av mående och energi.
 * Mående återanvänder befintliga moods (myflow-moods) och energi
 * återanvänder befintliga energy_logs – inga nya system.
 *
 * Flera observationer per dag: varje loggning blir en egen tidsstämplad
 * observation – tidigare värden skrivs aldrig över. Energi och mående
 * kan därmed förändras över dagen (morgon → eftermiddag → kväll).
 */

export interface EnergyLogEntry {
  id: string;
  level: number;
  logged_at: string;
  note?: string | null;
}

function isToday(ts: number | string): boolean {
  const d = new Date(ts);
  const now = new Date();
  return d.toDateString() === now.toDateString();
}

/** Dagens exakta 1–10-värden (visning). Kanoniska 1–5 sparas i befintliga system. */
interface Checkin10 {
  day: string;
  mood?: number;
  energy?: number;
}

/** 1–10 → 1–5 (kanonisk skala i moods/energy_logs). */
export const toScale5 = (v10: number) => Math.min(5, Math.max(1, Math.round(v10 / 2)));
/** 1–5 → 1–10 (fallback när exakt värde saknas). */
export const toScale10 = (v5: number) => Math.min(10, Math.max(1, Math.round(v5 * 2)));

const todayKey = todayISO;

function mergeEnergy(...lists: EnergyLogEntry[][]): EnergyLogEntry[] {
  const entries = new Map<string, EnergyLogEntry>();
  for (const list of lists) for (const entry of list) entries.set(entry.id, entry);
  return [...entries.values()].sort((a, b) => a.logged_at.localeCompare(b.logged_at));
}

/** Energiloggar gjorda utan inloggning – flyttas till energy_logs vid login. */
export { PENDING_ENERGY_KEY };

/** Hur ofta vi försöker igen så länge det finns poster som inte kommit upp. */
const RETRY_INTERVAL_MS = 60_000;

export function useQuickCheckin() {
  const { moods, setMoods } = useMoods();
  // Kontobunden källa är energy_logs. Den lokala listan är enbart en cache
  // som andra vyer (insikter, mönster) läser – aldrig source of truth.
  const [localEnergy, setLocalEnergy] = useCloudSyncedStorage<EnergyLogEntry[]>(
    "myflove-energy-log",
    [],
  );
  // Loggningar gjorda utan inloggning väntar här tills de kan flyttas upp.
  const [pendingEnergy, setPendingEnergy] = useLocalStorage<EnergyLogEntry[]>(
    PENDING_ENERGY_KEY,
    [],
  );
  const [checkin10, setCheckin10] = useCloudSyncedStorage<Checkin10>("myflove-checkin-10", {
    day: todayKey(),
  });
  const localEnergyRef = useRef(localEnergy);
  localEnergyRef.current = localEnergy;
  const pendingRef = useRef(pendingEnergy);
  pendingRef.current = pendingEnergy;
  const userIdRef = useRef<string | null>(null);
  const migratingRef = useRef(false);

  useEffect(() => {
    let mounted = true;

    /**
     * Läser molnets loggar och flyttar upp det som väntar lokalt.
     * Migreringen är idempotent (jämför mot befintliga poster) och tar bara
     * bort en lokal post när molnet bekräftat just den posten.
     */
    const load = async (uid: string | null) => {
      if (!mounted) return;
      userIdRef.current = uid;
      if (!uid || !isActiveOwner(uid)) return;
      const knownIds = new Set(localEnergyRef.current.map((entry) => entry.id));
      const since = new Date();
      // Ett års historik behövs för den långsiktiga belastningskartan i Insikter.
      since.setDate(since.getDate() - 365);
      since.setHours(0, 0, 0, 0);
      const { data, error } = await supabase
        .from("energy_logs")
        .select("id, level, note, logged_at")
        .eq("user_id", uid)
        .gte("logged_at", since.toISOString())
        .order("logged_at", { ascending: true });
      if (!mounted || userIdRef.current !== uid || !isActiveOwner(uid)) return;

      // Kunde vi inte läsa molnet rör vi inte de väntande posterna – de
      // ligger kvar och försöks igen vid nästa tillfälle.
      if (error || !data) return;

      let rows: EnergyLogEntry[] = data;
      const pending = pendingRef.current ?? [];
      if (pending.length > 0 && !migratingRef.current) {
        migratingRef.current = true;
        try {
          // Äldre poster utan UUID får ett eget stabilt id som sparas lokalt
          // INNAN något skickas upp – så blir en avbruten migrering säker.
          const { entries, changed } = ensurePendingUuids(pending);
          if (changed) {
            pendingRef.current = entries;
            setPendingEnergy(entries);
          }
          const result = await migratePendingEnergy(uid, entries, data);
          if (!mounted || userIdRef.current !== uid || !isActiveOwner(uid)) return;
          // Behåll exakt det som inte bekräftats – aldrig en blank rensning.
          const migratedIds = new Set(result.migrated.map((entry) => entry.id));
          pendingRef.current = pendingRef.current.filter((entry) => !migratedIds.has(entry.id));
          setPendingEnergy((prev) => prev.filter((entry) => !migratedIds.has(entry.id)));
          if (result.inserted.length > 0) {
            rows = [...rows, ...result.inserted].sort(
              (a, b) => new Date(a.logged_at).getTime() - new Date(b.logged_at).getTime(),
            );
          }
        } finally {
          migratingRef.current = false;
        }
      }

      if (!mounted || userIdRef.current !== uid || !isActiveOwner(uid)) return;
      // Samma cache används av alla vyer. En långsam läsning får inte
      // ta bort väntande eller nya observationer som lagts till under tiden.
      setLocalEnergy((prev) =>
        mergeEnergy(
          rows,
          prev.filter((entry) => !knownIds.has(entry.id)),
          pendingRef.current,
        ),
      );
    };

    const retry = () => {
      if ((pendingRef.current ?? []).length === 0) return;
      if (!userIdRef.current) return;
      void load(userIdRef.current).catch(() => undefined);
    };

    void supabase.auth
      .getUser()
      .then(({ data }) => load(data.user?.id ?? null))
      .catch(() => undefined);
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      void load(session?.user?.id ?? null).catch(() => undefined);
    });
    let stopRealtime: (() => void) | undefined;
    void getSyncUser().then((user) => {
      const uid = user?.id;
      if (!uid || !mounted) return;
      stopRealtime = subscribeToAccountTable("energy_logs", uid, () => {
        if (userIdRef.current === uid) void load(uid).catch(() => undefined);
      });
    });
    window.addEventListener("online", retry);
    const timer = window.setInterval(retry, RETRY_INTERVAL_MS);
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
      stopRealtime?.();
      window.removeEventListener("online", retry);
      window.clearInterval(timer);
    };
  }, [setLocalEnergy, setPendingEnergy]);

  const energyEntries = localEnergy;

  /** Alla dagens måendeobservationer, äldst → nyast. */
  const todayMoods = useMemo<MoodEntry[]>(
    () =>
      moods
        .filter((m) => isToday(m.date))
        .map((m, idx) => ({ m, idx }))
        .sort((a, b) => a.m.date - b.m.date || b.idx - a.idx)
        .map(({ m }) => m),
    [moods],
  );

  /** Alla dagens energiobservationer, äldst → nyast. */
  const todayEnergyEntries = useMemo<EnergyLogEntry[]>(
    () =>
      energyEntries
        .filter((e) => isToday(e.logged_at))
        .sort((a, b) => Date.parse(a.logged_at) - Date.parse(b.logged_at)),
    [energyEntries],
  );

  const todayMood = todayMoods.length > 0 ? todayMoods[todayMoods.length - 1] : null;

  const todayEnergy =
    todayEnergyEntries.length > 0 ? todayEnergyEntries[todayEnergyEntries.length - 1] : null;

  /**
   * Loggar en ny måendeobservation. `note` är användarens egna ord om vad som
   * påverkar – frivilligt och sparas på observationen (befintlig datamodell).
   * Varje anrop skapar en egen tidsstämplad post; inget skrivs över.
   */
  const logMood = useCallback(
    (score10: number, note?: string) => {
      const score = toScale5(score10);
      const text = note?.trim() ? note.trim() : undefined;
      setCheckin10((prev) => ({
        day: todayKey(),
        energy: prev?.day === todayKey() ? prev.energy : undefined,
        mood: score10,
      }));
      setMoods((prev) => [
        {
          id: Math.random().toString(36).slice(2, 11),
          score,
          date: Date.now(),
          ...(text ? { note: text } : {}),
        },
        ...prev,
      ]);
    },
    [setMoods, setCheckin10],
  );

  // Serialiserar sparningar så att snabba upprepade loggningar alltid
  // blir separata, tidsstämplade observationer – aldrig överskrivning.
  const queueRef = useRef<Promise<void>>(Promise.resolve());

  const logEnergy = useCallback(
    (level10: number, note?: string, exactPercent?: number) => {
      const level = exactPercent == null ? toScale5(level10) : percentToLevel(exactPercent);
      const storedNote = exactPercent == null ? note?.trim() : percentNote(exactPercent, note);
      const uid = userIdRef.current;
      const ownerAtStart = getDataOwner();
      const run = async () => {
        const now = new Date().toISOString();
        // Stabilt id (UUID när webbläsaren stöder det) så att en post som
        // ligger i kön kan skrivas upp idempotent, utan dubbletter vid retry.
        const {
          entries: [local],
        } = ensurePendingUuids([
          { id: "", level, logged_at: now, ...(storedNote ? { note: storedNote } : {}) },
        ]);
        if (
          ownerAtStart !== getDataOwner() ||
          uid !== userIdRef.current ||
          (uid && !isActiveOwner(uid))
        ) {
          throw new Error("Kontot ändrades. Öppna incheckningen igen.");
        }
        setCheckin10((prev) => ({
          day: todayKey(),
          mood: prev?.day === todayKey() ? prev.mood : undefined,
          energy: level10,
        }));
        setLocalEnergy((prev) => mergeEnergy(prev ?? [], [local]));
        const queuePending = () => {
          // Offline eller serverfel – lägg den i kön i stället för att
          // tappa loggningen. Migreringen är idempotent och kör om.
          pendingRef.current = mergeEnergy(pendingRef.current ?? [], [local]);
          setPendingEnergy((prev) => mergeEnergy(prev ?? [], [local]));
          return { synced: false };
        };
        const queued = queuePending();
        if (!uid) return queued;
        try {
          const { data, error } = await supabase
            .from("energy_logs")
            .upsert({ ...local, user_id: uid }, { onConflict: "id" })
            .select("id, level, note, logged_at")
            .single();
          if (uid !== userIdRef.current || !isActiveOwner(uid)) {
            throw new Error("Kontot ändrades. Öppna incheckningen igen.");
          }
          if (error || !data) return queuePending();
          setLocalEnergy((prev) => mergeEnergy(prev ?? [], [data]));
          pendingRef.current = pendingRef.current.filter((entry) => entry.id !== local.id);
          setPendingEnergy((prev) => prev.filter((entry) => entry.id !== local.id));
          return { synced: true };
        } catch (error) {
          if (uid !== userIdRef.current || !isActiveOwner(uid)) throw error;
          return queuePending();
        }
      };

      const next = queueRef.current.then(run, run);
      queueRef.current = next.then(
        () => undefined,
        () => undefined,
      );
      return next;
    },
    [setLocalEnergy, setPendingEnergy, setCheckin10],
  );

  const logEnergyPercent = useCallback(
    (percent: number, note?: string) => logEnergy(1 + percent * 0.09, note, percent),
    [logEnergy],
  );

  const sameDay = checkin10?.day === todayKey();
  /** Dagens visade värden på 1–10-skalan (null = inget loggat idag). */
  const moodValue =
    (sameDay ? checkin10?.mood : undefined) ??
    (todayMood ? toScale10(todayMood.score) : null) ??
    null;
  const energyValue =
    (sameDay ? checkin10?.energy : undefined) ??
    (todayEnergy ? toScale10(todayEnergy.level) : null) ??
    null;

  return {
    todayMood,
    todayEnergy,
    todayMoods,
    todayEnergyEntries,
    energyEntries,
    moodValue,
    energyValue,
    logMood,
    logEnergy,
    logEnergyPercent,
    energyPercentValue: todayEnergy ? energyPercent(todayEnergy) : null,
  };
}
