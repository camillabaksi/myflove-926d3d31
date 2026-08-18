import { Flame } from "lucide-react";
import { useVisitStreak } from "@/hooks/use-visit-streak";

const WEEKDAYS = ["M", "T", "O", "T", "F", "L", "S"];

function last7Labels(): { label: string; offset: number }[] {
  const out: { label: string; offset: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    // getDay: 0 = söndag
    const idx = (d.getDay() + 6) % 7;
    out.push({ label: WEEKDAYS[idx] as string, offset: i });
  }
  return out;
}

function dayKey(offset: number): string {
  const d = new Date();
  d.setDate(d.getDate() - offset);
  return d.toLocaleDateString("sv-SE");
}

export default function StreakCard() {
  const { streak, thisWeek } = useVisitStreak();
  const stored: string[] = (() => {
    if (typeof window === "undefined") return [];
    try {
      return JSON.parse(localStorage.getItem("myflove-visit-days") ?? "[]");
    } catch {
      return [];
    }
  })();
  const visited = new Set(stored);

  const headline =
    streak >= 7
      ? `${streak} dagar i rad – helt otroligt!`
      : streak >= 3
        ? `${streak} dagar i rad – du är i gång!`
        : streak === 1
          ? "Du är här idag – det räcker."
          : `${streak} dagar i rad`;

  return (
    <div className="rounded-3xl bg-card border border-border p-5 shadow-sm animate-fade-in">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-gold/25 flex items-center justify-center shrink-0">
            <Flame size={22} className="text-primary" />
          </div>
          <div>
            <p className="font-semibold text-ink leading-tight">{headline}</p>
            <p className="text-sm text-muted-foreground">
              {thisWeek} {thisWeek === 1 ? "dag" : "dagar"} den här veckan – inga krav, bara
              närvaro.
            </p>
          </div>
        </div>
      </div>

      <ul className="flex items-center justify-between gap-1.5" aria-label="Dina senaste sju dagar">
        {last7Labels().map(({ label, offset }) => {
          const active = visited.has(dayKey(offset));
          const isToday = offset === 0;
          return (
            <li key={offset} className="flex flex-col items-center gap-1 flex-1">
              <span
                className={`w-full h-9 rounded-xl transition-all duration-300 ${
                  active
                    ? "bg-primary/80 shadow-sm"
                    : "bg-secondary/60 border border-dashed border-border"
                } ${isToday ? "ring-2 ring-primary/40 ring-offset-2 ring-offset-card" : ""}`}
              />
              <span className="text-[11px] text-muted-foreground">{label}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
