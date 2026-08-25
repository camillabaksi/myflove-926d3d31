import { useEffect, useMemo, useState } from "react";
import { sceneForTask, type FlowScene } from "@/components/flow/flow-character";
import { useTasks, useReminders, useMedications } from "@/hooks/use-data";
import { useChildren } from "@/hooks/use-children";
import { useEnergyBattery } from "@/hooks/use-energy-battery";
import { useQuickCheckin } from "@/hooks/use-quick-checkin";
import { useWeather } from "@/hooks/use-weather";
import { isWetWeather } from "@/components/flow/flow-character";
import { todayISO } from "@/lib/day";
import { FLOW_DONE_EVENT } from "@/lib/flow-signal";

/**
 * Flow i den inloggade appen.
 *
 * Väljer EN kontext åt gången ur data som redan finns i MyFlove:
 * medicin, barn, väder, dagens aktivitet, batteri och incheckning.
 * Ingen ny datamodell – bara en prioritering av det som är mest relevant nu.
 */

export interface FlowMoment {
  scene: FlowScene;
  /** Kort mening i Flows röst. */
  message: string;
  /** Valfri knapp som använder befintlig logik. */
  action?: { label: string; run: () => void };
  /** Länk vidare till den vy som hör ihop med kontexten. */
  link?: { href: string; label: string };
  energy: number;
  kids: number;
  rain: boolean;
  /** Nyckel för variantval – stabil per kontext. */
  seed: number;
}

const toMinutes = (t?: string): number | null => {
  if (!t) return null;
  const [h, m] = t.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
};

const isKidTitle = (title: string) =>
  /barn|lämna|hämta|förskola|skolan|dagis|tjejer|killar/i.test(title);


export function useFlowMoment(): FlowMoment {
  const { activeTasks } = useTasks();
  const { activeReminders } = useReminders();
  const { medications, isTaken, toggleTaken } = useMedications();
  const { children } = useChildren();
  const { reading } = useEnergyBattery();
  const { energyValue } = useQuickCheckin();
  const weather = useWeather();

  const [celebrating, setCelebrating] = useState(false);

  useEffect(() => {
    const onDone = () => {
      setCelebrating(true);
      window.setTimeout(() => setCelebrating(false), 2600);
    };
    window.addEventListener(FLOW_DONE_EVENT, onDone);
    return () => window.removeEventListener(FLOW_DONE_EVENT, onDone);
  }, []);

  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const today = todayISO();
  const rain = isWetWeather(weather?.code);
  const sunny = weather != null && weather.code <= 1 && now.getHours() >= 7 && now.getHours() <= 19;
  const kids = children?.length ?? 0;
  const energy = Math.round(reading.now);

  return useMemo<FlowMoment>(() => {
    const base = { energy, kids, rain, seed: now.getDate() };

    if (celebrating) {
      return { ...base, scene: "done", message: "Snyggt! Det där är avklarat. ❤️" };
    }

    /* 1. Medicin – befintlig medicinlogik, inget nytt system. */
    for (const med of medications) {
      for (const time of med.times ?? []) {
        const mins = toMinutes(time);
        if (mins == null) continue;
        if (nowMin < mins - 10 || nowMin > mins + 120) continue;
        if (isTaken(med.id, time)) continue;
        return {
          ...base,
          scene: "medicine",
          message: `Det är dags för ${med.name.toLowerCase()}.`,
          action: { label: "Jag har tagit den", run: () => toggleTaken(med.id, time) },
          link: { href: "/daglig-rutin", label: "Rutiner & medicin" },
        };
      }
    }

    /* 2. Nästa aktivitet idag – uppgifter och påminnelser som redan finns. */
    const upcoming = [
      ...activeTasks
        .filter((t) => (!t.dueDate || t.dueDate === today) && t.time)
        .map((t) => ({ title: t.title, mins: toMinutes(t.time) })),
      ...activeReminders
        .filter((r) => r.date === today && r.time)
        .map((r) => ({ title: r.title, mins: toMinutes(r.time) })),
    ]
      .filter((e): e is { title: string; mins: number } => e.mins != null)
      .filter((e) => e.mins >= nowMin - 30)
      .sort((a, b) => a.mins - b.mins);

    const next = upcoming[0];
    if (next && next.mins - nowMin <= 120) {
      const time = `${String(Math.floor(next.mins / 60)).padStart(2, "0")}:${String(next.mins % 60).padStart(2, "0")}`;
      if (kids > 0 && isKidTitle(next.title)) {
        return {
          ...base,
          scene: "kids",
          message: rain
            ? `${next.title} kl ${time} – ta med paraply. ❤️`
            : `${next.title} kl ${time}. ❤️`,
          link: { href: "/idag", label: "Min dag" },
        };
      }
      return {
        ...base,
        scene: sceneForTask(next.title),
        message: `Härnäst: ${next.title} kl ${time}.`,
        link: { href: "/idag", label: "Min dag" },
      };
    }

    /* 3. Väder – bara när det påverkar något. */
    if (rain) {
      return {
        ...base,
        scene: "rain",
        message: "Det regnar ute – ta med paraply om du ska ut.",
      };
    }
    if (sunny) {
      return { ...base, scene: "sun", message: "Sol ute – passa på att få lite ljus." };
    }

    /* 4. Energi – batteriet du redan har. */
    if (energy <= 35) {
      return {
        ...base,
        scene: "energyLow",
        message: "Batteriet är lågt. En liten sak räcker gott just nu.",
        link: { href: "/flowscore", label: "Mitt batteri" },
      };
    }
    if (energy >= 70) {
      return {
        ...base,
        scene: "energyHigh",
        message: "Du har bra med energi nu – bra läge för något du skjutit på.",
        link: { href: "/flowscore", label: "Mitt batteri" },
      };
    }

    /* 5. Kväll – vila och sömn. */
    if (now.getHours() >= 21) {
      return { ...base, scene: "sleep", message: "Dagen får landa nu. Sov gott. 🌙" };
    }

    if (energyValue == null) {
      return {
        ...base,
        scene: "think",
        message: "Hur känns det just nu? Registrera så anpassar jag förslagen.",
      };
    }

    return { ...base, scene: "rest", message: "Lugnt läge just nu. Jag finns här." };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    celebrating,
    medications,
    activeTasks,
    activeReminders,
    kids,
    rain,
    sunny,
    energy,
    energyValue,
    nowMin,
    today,
  ]);
}
