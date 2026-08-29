import { useEffect, useState } from "react";
import { useQuickCheckin } from "@/hooks/use-quick-checkin";
import { useEnergyFlow } from "@/hooks/use-energy-flow";
import type { EnergyCategory } from "@/lib/energy-flow";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import WhyHint from "@/components/why-hint";
import { useFlowExplainer } from "@/hooks/use-flow-explainer";

const MOODS = [
  { score10: 2, emoji: "😢", label: "Tungt" },
  { score10: 4, emoji: "😕", label: "Låg" },
  { score10: 6, emoji: "😐", label: "Okej" },
  { score10: 8, emoji: "🙂", label: "Bra" },
  { score10: 10, emoji: "😄", label: "Toppen" },
];

const LEVELS = [
  { step: 1, emoji: "🪫", label: "Nästan slut" },
  { step: 2, emoji: "🔋", label: "Lågt" },
  { step: 3, emoji: "🔋", label: "Halvfullt" },
  { step: 4, emoji: "🔋", label: "Bra" },
  { step: 5, emoji: "🔋", label: "Fullt" },
];

/** Valfria snabbval: "Vad påverkar dig just nu?" – sparas som energifaktorer. */
const FACTORS: { id: string; label: string; emoji: string; category: EnergyCategory }[] = [
  { id: "somn", label: "Sömn", emoji: "😴", category: "somn" },
  { id: "stress", label: "Stress", emoji: "🌪️", category: "stress" },
  { id: "ljud", label: "Ljud / intryck", emoji: "🔊", category: "miljo" },
  { id: "mat", label: "Mat", emoji: "🍽️", category: "annat" },
  { id: "socialt", label: "Socialt", emoji: "🫂", category: "socialt" },
  { id: "kroppen", label: "Kroppen", emoji: "💗", category: "rorelse" },
  { id: "annat", label: "Annat", emoji: "✨", category: "annat" },
];

/**
 * Snabb incheckning: "Hur är ditt batteri just nu?" + valfritt mående och
 * vad som påverkar. Ingenting är obligatoriskt utom batteriet.
 * Sparas i befintlig data (energy_logs, moods, energy_factors) – ingen ny modell.
 */
export default function SimpleCheckin({
  className,
  source = "ma-bra",
}: {
  className?: string;
  source?: string;
}) {
  const { moodValue, energyValue, logMood, logEnergy } = useQuickCheckin();
  const { addFactor } = useEnergyFlow();
  const { explain } = useFlowExplainer();
  const energyExplainer = explain("energi");
  const moodExplainer = explain("maende");
  const [battery, setBattery] = useState(energyValue ?? 6);
  const [mood, setMood] = useState<number | null>(moodValue);
  const [factors, setFactors] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState(false);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (energyValue != null) setBattery(energyValue);
  }, [energyValue]);
  useEffect(() => {
    if (moodValue != null) setMood(moodValue);
  }, [moodValue]);

  // Text som skickats hit från t.ex. QuickFlow (?note=…) fyller i fältet,
  // så att loggningen ändå sker på den enda kanoniska platsen.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const incoming = new URLSearchParams(window.location.search).get("note");
    if (incoming) setNote(incoming);
  }, []);

  const markStarted = (kind: "battery" | "mood") => {
    if (started) return;
    setStarted(true);
    track(kind === "battery" ? "battery_checkin_started" : "mood_checkin_started", { source });
  };

  const save = () => {
    void logEnergy(battery);
    track("battery_checkin_completed", { source, method: "knapp", result: "completed" });
    track("battery_logged", { source, method: "knapp" });
    const text = note.trim();
    // Fritexten hör ihop med måendet – sparas på befintlig måendepost.
    if (mood != null || text) {
      logMood(mood ?? Math.max(1, Math.min(10, battery)), text || undefined);
      track("mood_checkin_completed", { source, method: "emoji", result: "completed" });
      track("mood_logged", { source, method: "emoji" });
    }
    // Hälsoobservationer sparas bara som energidata – aldrig som aktivitet.
    if (factors.length > 0) {
      track("health_factor_logged", { source, method: "knapp", count: factors.length });
    }
    for (const id of factors) {
      const f = FACTORS.find((x) => x.id === id);
      if (!f) continue;
      void addFactor({
        title: f.label,
        direction: battery >= 6 ? "gives" : "drains",
        strength: 2,
        category: f.category,
        kind: "vardag",
      }).catch(() => undefined);
    }
    setSaved(true);
    setFactors([]);
    setNote("");
    window.setTimeout(() => setSaved(false), 2500);
  };

  const step = Math.max(1, Math.min(5, Math.round(battery / 2)));


  return (
    <section
      aria-label="Snabb incheckning"
      className={cn(
        "rounded-3xl border border-border/60 bg-card p-5 shadow-soft space-y-5",
        className,
      )}
    >
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium text-ink">Hur är ditt batteri just nu?</p>
          <WhyHint label="logga energi">
            Det hjälper Flow se vad som brukar ge eller ta energi för dig.
          </WhyHint>
        </div>
        {energyExplainer && <p className="text-xs text-muted-foreground">{energyExplainer}</p>}
        <div className="flex gap-1.5">
          {LEVELS.map((l) => (
            <button
              key={l.step}
              type="button"
              aria-pressed={step === l.step}
              aria-label={`${l.step} av 5 – ${l.label}`}
              onClick={() => {
                markStarted("battery");
                setBattery(l.step * 2);
              }}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 rounded-2xl border p-2 transition-all",
                step === l.step
                  ? "border-primary bg-primary/10 scale-[1.03]"
                  : "border-transparent bg-secondary/50 opacity-75 hover:opacity-100",
              )}
            >
              <span className="text-xl">{l.emoji}</span>
              <span className="text-[11px] font-medium text-muted-foreground">{l.step}/5</span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium text-ink">
            Hur mår du? <span className="font-normal text-muted-foreground">(valfritt)</span>
          </p>
          <WhyHint label="logga mående">
            Det hjälper Flow förstå om ditt mående och din energi brukar hänga ihop för dig.
          </WhyHint>
        </div>
        {moodExplainer && <p className="text-xs text-muted-foreground">{moodExplainer}</p>}
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

      <div className="space-y-2">
        <p className="text-sm font-medium text-ink">
          Vad påverkar dig just nu?{" "}
          <span className="font-normal text-muted-foreground">(valfritt)</span>
        </p>
        <div className="flex flex-wrap gap-2">
          {FACTORS.map((f) => {
            const on = factors.includes(f.id);
            return (
              <button
                key={f.id}
                type="button"
                aria-pressed={on}
                onClick={() =>
                  setFactors((prev) =>
                    prev.includes(f.id) ? prev.filter((x) => x !== f.id) : [...prev, f.id],
                  )
                }
                className={cn(
                  "rounded-pill border px-3 py-1.5 text-sm transition-all",
                  on
                    ? "border-primary bg-primary/10 text-ink"
                    : "border-border/60 bg-secondary/40 text-muted-foreground hover:text-foreground",
                )}
              >
                <span aria-hidden className="mr-1">
                  {f.emoji}
                </span>
                {f.label}
              </button>
            );
          })}
        </div>
        <label className="block space-y-1">
          <span className="text-xs text-muted-foreground">
            Vill du skriva med egna ord? (valfritt)
          </span>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="T.ex. ”Sovit bara 4 timmar och är dessutom sjuk.”"
            className="w-full resize-none rounded-2xl border border-border/60 bg-secondary/40 p-3 text-sm text-ink outline-none transition-colors focus:border-primary"
          />
        </label>
      </div>

      <button
        type="button"
        onClick={save}
        className="w-full rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-soft transition-opacity hover:opacity-90"
      >
        {saved ? "💜 Tack" : "Logga energi & mående"}
      </button>


      <p aria-live="polite" className="text-xs text-muted-foreground">
        {saved
          ? "💜 Tack. Det hjälper mig att förstå dig bättre."
          : "Inget är rätt eller fel. Du kan ändra dagens värde när du vill."}
      </p>
    </section>
  );
}
