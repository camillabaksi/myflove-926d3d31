import { useMemo } from "react";
import { Sparkles, Umbrella, Snowflake, Thermometer, Clock, Wallet, Pill, CloudRain } from "lucide-react";
import { useWeather } from "@/hooks/use-weather";
import { useReminders, useFinances, useMedications } from "@/hooks/use-data";

type Suggestion = {
  id: string;
  icon: typeof Sparkles;
  title: string;
  body: string;
  tone: "weather" | "time" | "money" | "med";
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

  const suggestions = useMemo<Suggestion[]>(() => {
    const out: Suggestion[] = [];
    const now = Date.now();
    const nextReminder = activeReminders[0];
    const nextReminderTs = nextReminder ? parseReminderDate(nextReminder.date, nextReminder.time) : null;
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
          body: withinHours(6) && nextReminder
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
          body: withinHours(4) && nextReminder
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

    return out.slice(0, 4);
  }, [weather, activeReminders, transactions, medications, isTaken]);

  if (suggestions.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles size={16} className="text-primary" />
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Förslag just nu
        </h2>
      </div>
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
    </div>
  );
}
