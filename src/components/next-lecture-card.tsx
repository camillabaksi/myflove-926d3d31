import { useEffect, useMemo, useState } from "react";
import { MapPin, Clock, Compass, Bell } from "lucide-react";
import { useStudySchedule } from "@/hooks/use-study-schedule";
import { nextOccurrence } from "@/lib/schedule-parse";
import CollapsibleSection from "@/components/collapsible-section";
import { useWeather } from "@/hooks/use-weather";
import { weatherAdvice } from "@/lib/weather-advice";

const card = "rounded-3xl border-2 border-border bg-card p-5 shadow-sm";
const sectionTitle = "flex items-center gap-2 font-display text-lg text-ink";

function humanCountdown(minutes: number) {
  if (minutes <= 0) return "pågår just nu";
  if (minutes < 60) return `om ${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h < 24) return m ? `om ${h} h ${m} min` : `om ${h} h`;
  const d = Math.round(h / 24);
  return d === 1 ? "imorgon" : `om ${d} dagar`;
}

export function NextLectureCard() {
  const { lectures, settings, patchSettings } = useStudySchedule();
  const advice = weatherAdvice(useWeather());
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const next = useMemo(() => {
    if (!lectures.length) return null;
    return lectures
      .map((l) => ({ lecture: l, at: nextOccurrence(l, now) }))
      .sort((a, b) => a.at.getTime() - b.at.getTime())[0];
  }, [lectures, now]);

  if (!next) {
    return (
      <section className={card}>
        <CollapsibleSection
          title={
            <span className="inline-flex items-center gap-2">
              <Compass className="h-5 w-5 text-primary" /> Nästa lektion
            </span>
          }
          headingClassName={sectionTitle}
        >
          <p className="mt-1 text-sm text-muted-foreground">
            Ladda upp eller klistra in ditt schema nedan – sen håller Pace koll på vad som är nästa
            och var det är. 💙
          </p>
        </CollapsibleSection>
      </section>
    );
  }

  const { lecture, at } = next;
  const minutes = Math.round((at.getTime() - now.getTime()) / 60000);
  const when = at.toLocaleString("sv-SE", {
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <section className={card} aria-live="polite">
      <CollapsibleSection
        title={
          <span className="inline-flex items-center gap-2">
            <Compass className="h-5 w-5 text-primary" /> Nästa lektion
          </span>
        }
        headingClassName={sectionTitle}
      >
        <p className="mt-2 text-base text-ink">
          Nästa är <strong>{lecture.title}</strong>
          {lecture.location ? (
            <>
              {" "}
              i <strong>{lecture.location}</strong>
            </>
          ) : null}
          , {when} ({humanCountdown(minutes)}).
        </p>
        <div className="mt-3 flex flex-wrap gap-2 text-sm text-muted-foreground">
          <span className="flex items-center gap-1 rounded-full bg-sage/15 px-3 py-1">
            <Clock className="h-4 w-4" /> {lecture.start}–{lecture.end}
          </span>
          {lecture.location && (
            <a
              className="flex items-center gap-1 rounded-full bg-sage/15 px-3 py-1 underline"
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lecture.location)}`}
              target="_blank"
              rel="noreferrer"
            >
              <MapPin className="h-4 w-4" /> {lecture.location}
            </a>
          )}
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          {minutes <= 0
            ? "Du är mitt i den – bara att vara här. 💙"
            : minutes <= 30
              ? "Snart dags. Packa det du behöver och andas ut."
              : "Du har gott om tid. Ta en sak i taget."}
        </p>

        {advice?.travel && minutes > 0 && minutes <= 180 && (
          <p className="mt-2 rounded-2xl bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
            {advice.emoji} {advice.travel}
            {advice.extraTravelMinutes > 0
              ? ` Gå gärna kl ${new Date(at.getTime() - advice.extraTravelMinutes * 60000 - 15 * 60000).toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" })}.`
              : ""}
          </p>
        )}

        <label className="mt-3 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <Bell className="h-4 w-4" />
          <span>Påminn mig</span>
          <select
            value={settings.lectureReminderMinutes}
            onChange={(e) => patchSettings({ lectureReminderMinutes: Number(e.target.value) })}
            aria-label="Påminnelse före lektion"
            className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-ink"
          >
            <option value={0}>aldrig</option>
            {[10, 15, 30, 45, 60].map((m) => (
              <option key={m} value={m}>
                {m} min innan
              </option>
            ))}
          </select>
        </label>
      </CollapsibleSection>
    </section>
  );
}

export default NextLectureCard;
