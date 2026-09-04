import { useEffect, useState } from "react";
import { Pencil, Sparkles, ChevronDown } from "lucide-react";
import { useQuickCheckin } from "@/hooks/use-quick-checkin";
import { useEnergyFlow } from "@/hooks/use-energy-flow";
import type { EnergyCategory } from "@/lib/energy-flow";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import WhyHint from "@/components/why-hint";
import { useFlowExplainer } from "@/hooks/use-flow-explainer";
import { MyFloveBlock } from "@/components/myflove/block";

import { ORK_LEVELS, MOOD_FACES, orkFromValue10 } from "@/lib/ork";

const MOODS = MOOD_FACES;

const FACTORS: { id: string; label: string; emoji: string; category: EnergyCategory }[] = [
  { id: "somn", label: "Sömn", emoji: "😴", category: "somn" },
  { id: "stress", label: "Stress", emoji: "🌪️", category: "stress" },
  { id: "ljud", label: "Ljud / intryck", emoji: "🔊", category: "miljo" },
  { id: "mat", label: "Mat", emoji: "🍽️", category: "annat" },
  { id: "socialt", label: "Socialt", emoji: "🫂", category: "socialt" },
  { id: "kroppen", label: "Kroppen", emoji: "💗", category: "rorelse" },
  { id: "annat", label: "Annat", emoji: "✨", category: "annat" },
];

/** Den enda platsen där energi och mående loggas: Mitt batteri. */
export default function SimpleCheckin({
  className,
  source = "ma-bra",
  onSaved,
  presetFactors,
}: {
  className?: string;
  source?: string;
  onSaved?: () => void;
  /** Förvald påverkansfaktor, t.ex. sömn på morgonen. Går alltid att ändra. */
  presetFactors?: string[];
}) {
  const { moodValue, energyValue, logMood, logEnergy } = useQuickCheckin();
  const { addFactor } = useEnergyFlow();
  const { explain } = useFlowExplainer();
  const energyExplainer = explain("energi");
  const moodExplainer = explain("maende");
  const [battery, setBattery] = useState(energyValue ?? 6);
  const [mood, setMood] = useState<number | null>(moodValue);
  const [factors, setFactors] = useState<string[]>(presetFactors ?? []);
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState(false);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (energyValue != null) setBattery(energyValue);
  }, [energyValue]);
  useEffect(() => {
    if (moodValue != null) setMood(moodValue);
  }, [moodValue]);
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
    if (mood != null || text) {
      logMood(mood ?? Math.max(1, Math.min(10, battery)), text || undefined);
      track("mood_checkin_completed", { source, method: "emoji", result: "completed" });
      track("mood_logged", { source, method: "emoji" });
    }
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
    onSaved?.();
    window.setTimeout(() => setSaved(false), 2500);
  };

  const ork = orkFromValue10(battery);

  return (
    <MyFloveBlock
      title="Logga just nu"
      subtitle="Två snabba frågor. MyFlove gör resten."
      eyebrow="Logga"
      icon={Pencil}
      tone="lavender"
      surface="lavender"
      data-testid="battery-log-form"
      className={cn("h-full", className)}
      footer={
        <p aria-live="polite" className="text-center text-xs text-muted-foreground">
          {saved
            ? "Tack – din observation är sparad."
            : "Logga så ofta du vill – varje sparning blir en egen observation i din dag."}
        </p>
      }
    >
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-ink">
            <span aria-hidden>🔋</span> Hur mycket ork har du idag?
          </p>
          <WhyHint label="logga ork">
            Du väljer bara ett ord – MyFlove ser mönstren åt dig över tid.
          </WhyHint>
        </div>
        {energyExplainer && <p className="text-xs text-muted-foreground">{energyExplainer}</p>}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {ORK_LEVELS.map((l) => (
            <button
              key={l.id}
              type="button"
              aria-pressed={ork?.id === l.id}
              aria-label={l.label}
              onClick={() => {
                markStarted("battery");
                setBattery(l.value10);
              }}
              className={cn(
                "flex min-h-11 flex-1 items-center justify-center gap-2 rounded-2xl border px-3 py-2.5 text-sm font-medium transition-all",
                ork?.id === l.id
                  ? "border-primary bg-primary/10 text-ink scale-[1.02]"
                  : "border-transparent bg-card/80 text-muted-foreground hover:opacity-100",
              )}
            >
              <span aria-hidden className="text-base">
                {l.dot}
              </span>
              {l.label}
            </button>
          ))}
        </div>
      </div>


      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-ink">
            <span aria-hidden>💜</span> Hur känns det just nu?{" "}
            <span className="font-normal text-muted-foreground">(valfritt)</span>
          </p>
          <WhyHint label="logga mående">
            Det hjälper Flow förstå om ditt mående och din ork brukar hänga ihop för dig.
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
                  ? "bg-card shadow-soft scale-105"
                  : "opacity-70 hover:bg-card hover:opacity-100",
              )}
            >
              <span className="text-2xl">{m.emoji}</span>
              <span className="text-[11px] text-muted-foreground">{m.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="block space-y-1">
          <span className="text-xs text-muted-foreground">
            Vill du skriva några ord? (valfritt)
          </span>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder="T.ex. ”Sovit bara 4 timmar och är dessutom sjuk.”"
            className="w-full resize-none rounded-2xl border border-border/60 bg-card/70 p-3 text-sm text-ink outline-none transition-colors focus:border-primary"
          />
        </label>

        {/* Progressiv komplexitet: det avancerade ligger bakom "Visa mer". */}
        <button
          type="button"
          onClick={() => setShowMore((v) => !v)}
          aria-expanded={showMore}
          className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          <ChevronDown
            size={15}
            aria-hidden
            className={cn("transition-transform", showMore && "rotate-180")}
          />
          {showMore ? "Visa mindre" : "Visa mer"}
        </button>

        {showMore && (
          <div className="space-y-2">
            <p className="text-sm font-semibold text-ink">
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
                        : "border-border/60 bg-card/70 text-muted-foreground hover:text-foreground",
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
          </div>
        )}
      </div>


      <button
        type="button"
        onClick={save}
        className="flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-soft transition-opacity hover:opacity-90"
      >
        <Sparkles size={16} aria-hidden="true" />
        {saved ? "Tack" : "Logga energi & mående"}
      </button>
    </MyFloveBlock>
  );
}
