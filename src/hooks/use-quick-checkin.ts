import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useMoods, type MoodEntry } from "@/hooks/use-data";
import { useLocalStorage } from "@/lib/storage";
import { useCloudSyncedStorage } from "@/lib/cloud-storage";

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

const todayKey = () => new Date().toISOString().slice(0, 10);

/** Energiloggar gjorda utan inloggning – flyttas till energy_logs vid login. */
export { PENDING_ENERGY_KEY };

/** Hur ofta vi försöker igen så länge det finns poster som inte kommit upp. */
const RETRY_INTERVAL_MS = 60_000;

export function useQuickCheckin() {
  const { moods, setMoods } = useMoods();
  // Kontobunden källa är energy_logs. Den lokala listan är enbart en cache
  // som andra vyer (insikter, mönster) läser – aldrig source of truth.
  const [localEnergy, setLocalEnergy] = useCloudSyncedStorage<EnergyLogEntry[]>("myflove-energy-log", []);
  // Loggningar gjorda utan inloggning väntar här tills de kan flyttas upp.
  const [pendingEnergy, setPendingEnergy] = useLocalStorage<EnergyLogEntry[]>(
    PENDING_ENERGY_KEY,
    [],
  );
  const [checkin10, setCheckin10] = useCloudSyncedStorage<Checkin10>("myflove-checkin-10", {
    day: todayKey(),
  });
  const [cloudEnergy, setCloudEnergy] = useState<EnergyLogEntry[] | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
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
      setUserId(uid);
      userIdRef.current = uid;
      if (!uid) {
        setCloudEnergy(null);
        return;
      }
      const since = new Date();
      since.setDate(since.getDate() - 60);
      since.setHours(0, 0, 0, 0);
      const { data, error } = await supabase
        .from("energy_logs")
        .select("id, level, logged_at")
        .eq("user_id", uid)
        .gte("logged_at", since.toISOString())
        .order("logged_at", { ascending: true });
      if (!mounted) return;

      // Kunde vi inte läsa molnet rör vi inte de väntande posterna – de
      // ligger kvar och försöks igen vid nästa tillfälle.
      if (error || !data) return;

      let rows = data;
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
          if (!mounted) return;
          // Behåll exakt det som inte bekräftats – aldrig en blank rensning.
          setPendingEnergy(result.remaining);
          if (result.inserted.length > 0) {
            rows = [...rows, ...result.inserted].sort(
              (a, b) => new Date(a.logged_at).getTime() - new Date(b.logged_at).getTime(),
            );
          }
        } finally {
          migratingRef.current = false;
        }
      }

      if (!mounted) return;
      setCloudEnergy(rows);
      setLocalEnergy(rows);
    };

    const retry = () => {
      if ((pendingRef.current ?? []).length === 0) return;
      if (!userIdRef.current) return;
      void load(userIdRef.current);
    };

    void supabase.auth.getUser().then(({ data }) => load(data.user?.id ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      void load(session?.user?.id ?? null);
    });
    window.addEventListener("online", retry);
    const timer = window.setInterval(retry, RETRY_INTERVAL_MS);
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
      window.removeEventListener("online", retry);
      window.clearInterval(timer);
    };
  }, [setLocalEnergy, setPendingEnergy]);

  const energyEntries = cloudEnergy ?? localEnergy;

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
    () => energyEntries.filter((e) => isToday(e.logged_at)),
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
      setCheckin10((prev) => ({ day: todayKey(), energy: prev?.energy, mood: score10 }));
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
    (level10: number) => {
      const level = toScale5(level10);
      setCheckin10((prev) => ({ day: todayKey(), mood: prev?.mood, energy: level10 }));
      const run = async () => {
        const now = new Date().toISOString();
        // Stabilt id (UUID när webbläsaren stöder det) så att en post som
        // ligger i kön kan skrivas upp idempotent, utan dubbletter vid retry.
        const id =
          typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
            ? crypto.randomUUID()
            : Math.random().toString(36).slice(2, 11);
        const local = { id, level, logged_at: now };
        if (!userId) {
          setPendingEnergy((prev) => [...(prev ?? []), local]);
          setLocalEnergy((prev) => [...(prev ?? []), local]);
          return;
        }
        const { data, error } = await supabase
          .from("energy_logs")
          .insert({ user_id: userId, level, logged_at: now })
          .select("id, level, logged_at")
          .single();
        if (error || !data) {
          // Offline eller serverfel – lägg den i kön i stället för att
          // tappa loggningen. Migreringen är idempotent och kör om.
          setPendingEnergy((prev) => [...(prev ?? []), local]);
          setLocalEnergy((prev) => [...(prev ?? []), local]);
          return;
        }
        setCloudEnergy((prev) => [...(prev ?? []), data]);
        setLocalEnergy((prev) => [...(prev ?? []), data]);
      };

      const next = queueRef.current.then(run, run);
      queueRef.current = next.catch(() => undefined);
      return next;
    },
    [userId, setLocalEnergy, setPendingEnergy, setCheckin10],
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
    moodValue,
    energyValue,
    logMood,
    logEnergy,
  };
}
