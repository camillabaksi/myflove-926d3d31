import { useMemo } from "react";
import {
  Sparkles,
  Umbrella,
  Snowflake,
  Thermometer,
  Clock,
  Wallet,
  Pill,
  CloudRain,
  Shirt,
  AlarmClock,
  GlassWater,
  Moon,
  Sunrise,
  HeartHandshake,
  PartyPopper,
  Coffee,
} from "lucide-react";
import { useWeather } from "@/hooks/use-weather";
import { useReminders, useFinances, useMedications, useTasks, useMoods } from "@/hooks/use-data";
import CollapsibleSection from "@/components/collapsible-section";
import { useSituation } from "@/hooks/use-situation";
import { situationSuggestions } from "@/lib/situation";
import { Compass } from "lucide-react";

// Öppna uppgifter som brukar "pågå i bakgrunden" – vi puffar när de blivit gamla
// så användaren inte glömmer tvätten i maskinen, disken i diskmaskinen osv.
const LOOP_KEYWORDS: { pattern: RegExp; label: string; nudge: string; minutes: number }[] = [
  {
    pattern: /tvätt|tvättmaskin|tork/i,
    label: "Tvätten",
    nudge: "Kolla om tvätten är klar – häng gärna innan den blir liggande.",
    minutes: 50,
  },
  {
    pattern: /disk(maskin)?/i,
    label: "Disken",
    nudge: "Diskmaskinen är nog klar snart – öppna gärna på glänt.",
    minutes: 55,
  },
  {
    pattern: /ugn|gryta|kokar|spis|stek/i,
    label: "På spisen",
    nudge: "Kolla ugnen/spisen så inget står och bränner vid.",
    minutes: 25,
  },
  {
    pattern: /kaffe|te\b/i,
    label: "Kaffet",
    nudge: "Kaffet är nog klart – ta en klunk innan det blir kallt.",
    minutes: 8,
  },
  {
    pattern: /hämta|barn|dagis|förskola|skolan/i,
    label: "Hämtning",
    nudge: "Snart dags att gå – lägg in lite marginal.",
    minutes: 30,
  },
];

type Suggestion = {
  id: string;
  icon: typeof Sparkles;
  title: string;
  body: string;
  tone: "weather" | "time" | "money" | "med" | "care";
};

const RAIN_CODES = new Set([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82]);
const SNOW_CODES = new Set([71, 73, 75, 77, 85, 86]);
const STORM_CODES = new Set([95, 96, 99]);

function parseReminderDate(date: string, time?: string): number | null {
  if (!date) return null;
  const iso = time ? `${date}T${time}` : `${date}T09:00`;
  const t = new Date(iso).getTime();
  return Number.isNaN(t) ? null : t;
}

export default function ProactiveSuggestions() {
  const weather = useWeather();
  const { activeReminders } = useReminders();
  const { transactions } = useFinances();
  const { medications, isTaken } = useMedications();
  const { tasks } = useTasks();
  const { moods } = useMoods();
  const { situation } = useSituation();

  const suggestions = useMemo<Suggestion[]>(() => {
    const out: Suggestion[] = [];
    const now = Date.now();
    const nextReminder = activeReminders[0];
    const nextReminderTs = nextReminder
      ? parseReminderDate(nextReminder.date, nextReminder.time)
      : null;
    const withinHours = (h: number) =>
      nextReminderTs !== null && nextReminderTs - now > 0 && nextReminderTs - now <= h * 3600_000;

    if (weather) {
      const isRain = RAIN_CODES.has(weather.code);
      const isSnow = SNOW_CODES.has(weather.code);
      const isStorm = STORM_CODES.has(weather.code);
      const cold = weather.apparent <= 2;
      const hot = weather.temperature >= 25;

      if (isRain) {
        out.push({
          id: "wx-rain",
          icon: Umbrella,
          tone: "weather",
          title: "Ta med paraply",
          body:
            withinHours(6) && nextReminder
              ? `Det regnar i ${weather.city}. Innan ”${nextReminder.title}” – lägg paraplyet i väskan.`
              : `Det regnar i ${weather.city} idag. Ett paraply räddar dagen.`,
        });
      }
      if (isSnow) {
        out.push({
          id: "wx-snow",
          icon: Snowflake,
          tone: "weather",
          title: "Lägg på extra restid",
          body:
            withinHours(4) && nextReminder
              ? `Snö i ${weather.city}. Räkna med 10–15 min extra till ”${nextReminder.title}”.`
              : `Snö i luften – planera in lite extra restid idag.`,
        });
      }
      if (isStorm) {
        out.push({
          id: "wx-storm",
          icon: CloudRain,
          tone: "weather",
          title: "Åska ute",
          body: "Bra dag att göra det som går att göra inomhus.",
        });
      }
      if (cold && !isSnow) {
        out.push({
          id: "wx-cold",
          icon: Thermometer,
          tone: "weather",
          title: "Klä varmt",
          body: `Det känns som ${weather.apparent}° ute. Ta en extra lager.`,
        });
      }
      if (hot) {
        out.push({
          id: "wx-hot",
          icon: Thermometer,
          tone: "weather",
          title: "Ta med vatten",
          body: `${weather.temperature}° ute – en flaska vatten är en bra idé.`,
        });
      }
    }

    // Restid + förberedelse inför nästa aktivitet
    if (nextReminder && nextReminderTs !== null) {
      const diffMin = Math.round((nextReminderTs - now) / 60000);
      if (diffMin > 0 && diffMin <= 90) {
        out.push({
          id: "next-soon",
          icon: Clock,
          tone: "time",
          title: `”${nextReminder.title}” om ${diffMin} min`,
          body:
            weather && (RAIN_CODES.has(weather.code) || SNOW_CODES.has(weather.code))
              ? "Gå några minuter tidigare – vägen tar längre tid i det här vädret."
              : "Bra läge att börja runda av det du håller på med.",
        });
      }
    }

    // Kommande räkning (nästa 3 dagar)
    const upcomingBill = transactions
      .filter((t) => t.type === "expense" && t.date > now && t.date - now <= 3 * 24 * 3600_000)
      .sort((a, b) => a.date - b.date)[0];
    if (upcomingBill) {
      const days = Math.max(1, Math.ceil((upcomingBill.date - now) / (24 * 3600_000)));
      out.push({
        id: `bill-${upcomingBill.id}`,
        icon: Wallet,
        tone: "money",
        title: `${upcomingBill.category} – ${upcomingBill.amount} kr`,
        body: `Förfaller om ${days} ${days === 1 ? "dag" : "dagar"}. Bra att lägga in i kalendern.`,
      });
    }

    // Medicin som är sen (mer än 30 min efter planerad tid)
    const nowDate = new Date();
    const hhmmNow = `${String(nowDate.getHours()).padStart(2, "0")}:${String(nowDate.getMinutes()).padStart(2, "0")}`;
    for (const med of medications) {
      const late = med.times.find((t) => t < hhmmNow && !isTaken(med.id, t));
      if (late) {
        out.push({
          id: `med-${med.id}-${late}`,
          icon: Pill,
          tone: "med",
          title: `${med.name} kl ${late}`,
          body: "Om du inte redan tagit den – gör det när du kan. Ingen stress.",
        });
        break;
      }
    }

    // Pågående öppna uppgifter som lätt glöms bort (tvätt, disk, ugn...)
    const todayStr = new Date().toISOString().split("T")[0] as string;
    for (const t of tasks) {
      if (t.completed) continue;
      if (t.dueDate && t.dueDate !== todayStr) continue;
      const ageMin = Math.round((now - t.createdAt) / 60000);
      if (ageMin < 5) continue;
      const match = LOOP_KEYWORDS.find((k) => k.pattern.test(t.title));
      if (match && ageMin >= match.minutes) {
        out.push({
          id: `loop-${t.id}`,
          icon: Shirt,
          tone: "time",
          title: `${match.label}: "${t.title}"`,
          body: match.nudge,
        });
      }
    }

    // Uppgifter med tid som passerat (mer än 10 min sen) och inte är gjorda
    const nowMin = nowDate.getHours() * 60 + nowDate.getMinutes();
    for (const t of tasks) {
      if (t.completed || !t.time || t.dueDate !== todayStr) continue;
      const [h, m] = t.time.split(":").map(Number);
      if (Number.isNaN(h) || Number.isNaN(m)) continue;
      const diff = nowMin - (h * 60 + m);
      if (diff >= 10 && diff <= 180) {
        out.push({
          id: `late-${t.id}`,
          icon: AlarmClock,
          tone: "time",
          title: `"${t.title}" var kl ${t.time}`,
          body: "Bocka av när det är gjort – eller flytta till senare, båda är okej.",
        });
        break;
      }
    }

    // Små omsorgspuffar över dagen – korta, utan pekpinnar.
    const hour = nowDate.getHours();
    const isWeekend = nowDate.getDay() === 0 || nowDate.getDay() === 6;
    const todaysTasks = tasks.filter((t) => !t.dueDate || t.dueDate === todayStr);
    const openToday = todaysTasks.filter((t) => !t.completed).length;
    const doneToday = todaysTasks.filter((t) => t.completed).length;

    if (hour >= 6 && hour < 10 && !isWeekend) {
      out.push({
        id: "care-morning",
        icon: Sunrise,
        tone: "care",
        title: openToday > 0 ? "Välj en sak att börja med" : "Fin start på dagen",
        body:
          openToday > 0
            ? "Du behöver inte planera hela dagen – bara nästa steg."
            : "Inget måste ännu. Ta morgonen i din takt.",
      });
    }

    if (hour >= 11 && hour < 14) {
      out.push({
        id: "care-lunch",
        icon: Coffee,
        tone: "care",
        title: "Har du ätit något?",
        body: "En paus och lite mat gör resten av dagen lättare.",
      });
    }

    if (hour >= 14 && hour < 17) {
      out.push({
        id: "care-water",
        icon: GlassWater,
        tone: "care",
        title: "Ett glas vatten",
        body: "Eftermiddagsdippen blir mindre med lite vätska och luft.",
      });
    }

    if (hour >= 20) {
      out.push({
        id: "care-evening",
        icon: Moon,
        tone: "care",
        title: "Dags att runda av",
        body:
          openToday > 0
            ? `${openToday} saker kvar – de finns kvar imorgon, helt okej.`
            : "Dagen är klar. Skönt så.",
      });
    }

    // Mående inte loggat idag
    const loggedToday = moods.some(
      (m) => new Date(m.date).toISOString().split("T")[0] === todayStr,
    );
    if (!loggedToday && hour >= 12) {
      out.push({
        id: "care-mood",
        icon: HeartHandshake,
        tone: "care",
        title: "Hur känns dagen?",
        body: "Ta tio sekunder och logga ditt mående – det hjälper Flow att peppa rätt.",
      });
    }

    // Beröm när allt för idag är avklarat
    if (doneToday > 0 && openToday === 0) {
      out.push({
        id: "care-done",
        icon: PartyPopper,
        tone: "care",
        title: `${doneToday} sak${doneToday === 1 ? "" : "er"} avklarade idag`,
        body: "Snyggt jobbat. Resten av dagen får vara ledig.",
      });
    }

    // Situationen ligger överst – den ändras direkt när du aktiverar eller pausar något.
    const fromSituation: Suggestion[] = situationSuggestions(situation).map((s) => ({
      id: s.id,
      icon: Compass,
      tone: "care" as const,
      title: s.title,
      body: s.body,
    }));

    return [...fromSituation, ...out].slice(0, 5);
  }, [weather, activeReminders, transactions, medications, isTaken, tasks, moods, situation]);

  if (suggestions.length === 0) return null;

  return (
    <div className="space-y-3">
      <CollapsibleSection
        title={
          <span className="inline-flex items-center gap-2">
            <Sparkles size={16} className="text-primary" /> Förslag just nu
          </span>
        }
        help="Tips utifrån väder, dina uppgifter och hur du mått. Tryck bort dem du inte vill ha."
        headingClassName="text-sm font-semibold uppercase tracking-wide text-muted-foreground"
      >
        <div className="space-y-2">
          {suggestions.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.id}
                className="flex items-start gap-3 p-4 rounded-2xl bg-card border border-border shadow-sm"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Icon size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium leading-tight">{s.title}</p>
                  <p className="text-sm text-muted-foreground leading-snug mt-0.5">{s.body}</p>
                </div>
              </div>
            );
          })}
        </div>
      </CollapsibleSection>
    </div>
  );
}
