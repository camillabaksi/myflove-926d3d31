import { useEffect, useState } from "react";
import { useQuickCheckin } from "@/hooks/use-quick-checkin";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";

const MOODS = [
  { score10: 2, emoji: "😢", label: "Tungt" },
  { score10: 4, emoji: "😕", label: "Låg" },
  { score10: 6, emoji: "😐", label: "Okej" },
  { score10: 8, emoji: "🙂", label: "Bra" },
  { score10: 10, emoji: "😄", label: "Toppen" },
];

/**
 * Snabb incheckning: "Hur är ditt batteri idag?" + "Hur mår du?".
 * Två val, en knapp, några sekunder. Sparas i samma data som tidigare
 * (energy_logs och moods via useQuickCheckin) – inga dubbla modeller.
 * Medicin hör inte hit; den ligger kvar i Rutiner & medicin.
 */
export default function SimpleCheckin({
  className,
  source = "ma-bra",
}: {
  className?: string;
  source?: string;
}) {
  const { moodValue, energyValue, logMood, logEnergy } = useQuickCheckin();
  const [battery, setBattery] = useState(energyValue ?? 5);
  const [mood, setMood] = useState<number | null>(moodValue);
  const [saved, setSaved] = useState(false);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (energyValue != null) setBattery(energyValue);
  }, [energyValue]);
  useEffect(() => {
    if (moodValue != null) setMood(moodValue);
  }, [moodValue]);

  const markStarted = (kind: "battery" | "mood") => {
    if (started) return;
    setStarted(true);
    track(kind === "battery" ? "battery_checkin_started" : "mood_checkin_started", { source });
  };

  const save = () => {
    void logEnergy(battery);
    track("battery_checkin_completed", { source, method: "slider", result: "completed" });
    if (mood != null) {
      logMood(mood);
      track("mood_checkin_completed", { source, method: "emoji", result: "completed" });
    }
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2500);
  };

  const pct = ((battery - 1) / 9) * 100;

  return (
    <section
      aria-label="Snabb incheckning"
      className={cn(
        "rounded-3xl border border-border/60 bg-card p-5 shadow-soft space-y-5",
        className,
      )}
    >
      <div className="space-y-2">
        <p className="text-sm font-medium text-ink">Hur är ditt batteri idag?</p>
        <div className="flex items-center gap-3">
          <span aria-hidden className="text-lg select-none">
            🪫
          </span>
          <input
            type="range"
            min={1}
            max={10}
            step={1}
            value={battery}
            onChange={(e) => {
              markStarted("battery");
              setBattery(Number(e.target.value));
            }}
            aria-label="Batterinivå 1 till 10"
            aria-valuetext={`${battery} av 10`}
            className="myflove-range h-2 w-full flex-1 cursor-pointer appearance-none rounded-full"
            style={{
              background: `linear-gradient(to right, hsl(var(--primary)) 0%, hsl(var(--primary)) ${pct}%, hsl(var(--secondary)) ${pct}%, hsl(var(--secondary)) 100%)`,
            }}
          />
          <span aria-hidden className="text-lg select-none">
            🔋
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium text-ink">Hur mår du?</p>
        <div className="flex justify-between gap-1">
          {MOODS.map((m) => (
            <button
              key={m.score10}
              type="button"
              aria-pressed={mood === m.score10}
              aria-label={m.label}
              onClick={() => {
                markStarted("mood");
                setMood(m.score10);
              }}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 rounded-2xl p-2 transition-all",
                mood === m.score10
                  ? "bg-primary/10 scale-105"
                  : "opacity-70 hover:bg-secondary hover:opacity-100",
              )}
            >
              <span className="text-2xl">{m.emoji}</span>
              <span className="text-[11px] text-muted-foreground">{m.label}</span>
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={save}
        className="w-full rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-soft transition-opacity hover:opacity-90"
      >
        {saved ? "Sparat ✓" : "Spara incheckning"}
      </button>

      <p className="text-xs text-muted-foreground">
        Inget är rätt eller fel. Du kan ändra dagens värde när du vill.
      </p>
    </section>
  );
}
