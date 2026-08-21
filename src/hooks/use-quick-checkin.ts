import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useMoods, type MoodEntry } from "@/hooks/use-data";
import { useLocalStorage } from "@/lib/storage";

/**
 * Snabb självregistrering av mående och energi.
 * Mående återanvänder befintliga moods (myflow-moods) och energi
 * återanvänder befintliga energy_logs – inga nya system.
 *
 * Dagens värde går alltid att ändra: senaste registreringen samma dag
 * uppdateras i stället för att en ny rad läggs till.
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

export function useQuickCheckin() {
  const { moods, setMoods } = useMoods();
  const [localEnergy, setLocalEnergy] = useLocalStorage<EnergyLogEntry[]>("myflove-energy-log", []);
  const [checkin10, setCheckin10] = useLocalStorage<Checkin10>("myflove-checkin-10", {
    day: todayKey(),
  });
  const [cloudEnergy, setCloudEnergy] = useState<EnergyLogEntry[] | null>(null);
  const [userId, setUserId] = useState<string | null>(null);


  useEffect(() => {
    let mounted = true;
    const load = async (uid: string | null) => {
      if (!mounted) return;
      setUserId(uid);
      if (!uid) {
        setCloudEnergy(null);
        return;
      }
      const since = new Date();
      since.setHours(0, 0, 0, 0);
      const { data } = await supabase
        .from("energy_logs")
        .select("id, level, logged_at")
        .eq("user_id", uid)
        .gte("logged_at", since.toISOString())
        .order("logged_at", { ascending: true });
      if (mounted) setCloudEnergy(data ?? []);
    };
    void supabase.auth.getUser().then(({ data }) => load(data.user?.id ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      void load(session?.user?.id ?? null);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const energyEntries = cloudEnergy ?? localEnergy;

  const todayMood = useMemo<MoodEntry | null>(
    () => moods.find((m) => isToday(m.date)) ?? null,
    [moods],
  );

  const todayEnergy = useMemo<EnergyLogEntry | null>(() => {
    const todays = energyEntries.filter((e) => isToday(e.logged_at));
    return todays.length > 0 ? (todays[todays.length - 1] as EnergyLogEntry) : null;
  }, [energyEntries]);

  const logMood = useCallback(
    (score10: number) => {
      const score = toScale5(score10);
      setCheckin10((prev) => ({ day: todayKey(), energy: prev?.energy, mood: score10 }));
      setMoods((prev) => {
        const existing = prev.find((m) => isToday(m.date));
        if (existing) {
          return prev.map((m) => (m.id === existing.id ? { ...m, score, date: Date.now() } : m));
        }
        return [{ id: Math.random().toString(36).slice(2, 11), score, date: Date.now() }, ...prev];
      });
    },
    [setMoods, setCheckin10],
  );

  const logEnergy = useCallback(
    async (level10: number) => {
      const level = toScale5(level10);
      setCheckin10((prev) => ({ day: todayKey(), mood: prev?.mood, energy: level10 }));
      const now = new Date().toISOString();
      if (!userId) {
        setLocalEnergy((prev) => {
          const list = prev ?? [];
          const existing = [...list].reverse().find((e) => isToday(e.logged_at));
          if (existing) {
            return list.map((e) => (e.id === existing.id ? { ...e, level, logged_at: now } : e));
          }
          return [...list, { id: Math.random().toString(36).slice(2, 11), level, logged_at: now }];
        });
        return;
      }
      const existing = todayEnergy;
      if (existing) {
        const { data } = await supabase
          .from("energy_logs")
          .update({ level, logged_at: now })
          .eq("id", existing.id)
          .select("id, level, logged_at")
          .single();
        setCloudEnergy((prev) =>
          (prev ?? []).map((e) => (e.id === existing.id ? (data ?? { ...e, level }) : e)),
        );
        return;
      }
      const { data } = await supabase
        .from("energy_logs")
        .insert({ user_id: userId, level })
        .select("id, level, logged_at")
        .single();
      if (data) setCloudEnergy((prev) => [...(prev ?? []), data]);
    },
    [userId, todayEnergy, setLocalEnergy, setCheckin10],
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

  return { todayMood, todayEnergy, moodValue, energyValue, logMood, logEnergy };
}

