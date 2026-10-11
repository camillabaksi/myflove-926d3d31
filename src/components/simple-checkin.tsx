import { useEffect, useState } from "react";
import {
  Pencil,
  Sparkles,
  ChevronDown,
  BatteryMedium,
  BatteryFull,
  BatteryLow,
  Heart,
  Frown,
  Annoyed,
  Meh,
  Smile,
  Laugh,
  Moon,
  Wind,
  Volume2,
  Utensils,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useQuickCheckin } from "@/hooks/use-quick-checkin";
import { useEnergyFlow } from "@/hooks/use-energy-flow";
import type { EnergyCategory } from "@/lib/energy-flow";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import WhyHint from "@/components/why-hint";
import { useFlowExplainer } from "@/hooks/use-flow-explainer";
import { MyFloveBlock } from "@/components/myflove/block";
import { paceFormSurface } from "@/components/paceable/design-system";
import { useLang } from "@/hooks/use-language";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import { ORK_LEVELS, MOOD_FACES, orkFromValue10 } from "@/lib/ork";

const MOODS = MOOD_FACES;

/* Systemoberoende ikoner i stället för emoji, som saknas i vissa Android-/WebView-typsnitt. */
const MOOD_ICONS: Record<number, LucideIcon> = {
  2: Frown,
  4: Annoyed,
  6: Meh,
  8: Smile,
  10: Laugh,
};
const ORK_ICONS: Record<string, LucideIcon> = {
  fullt: BatteryFull,
  mellan: BatteryMedium,
  lagt: BatteryLow,
};
const FACTOR_ICONS: Record<string, LucideIcon> = {
  somn: Moon,
  stress: Wind,
  ljud: Volume2,
  mat: Utensils,
  socialt: Users,
  kroppen: Heart,
  annat: Sparkles,
};

const FACTORS: { id: string; labelSv: string; emoji: string; category: EnergyCategory }[] = [
  { id: "somn", labelSv: "Sömn", emoji: "😴", category: "somn" },
  { id: "stress", labelSv: "Stress", emoji: "🌪️", category: "stress" },
  { id: "ljud", labelSv: "Ljud / intryck", emoji: "🔊", category: "miljo" },
  { id: "mat", labelSv: "Mat", emoji: "🍽️", category: "annat" },
  { id: "socialt", labelSv: "Socialt", emoji: "🫂", category: "socialt" },
  { id: "kroppen", labelSv: "Kroppen", emoji: "💗", category: "rorelse" },
  { id: "annat", labelSv: "Annat", emoji: "✨", category: "annat" },
];

/** Den enda platsen där energi och mående loggas: Mitt batteri. */
export default function SimpleCheckin({
  className,
  source = "ma-bra",
  onSaved,
  presentation = "card",
  onCancel,
  presetFactors,
}: {
  className?: string;
  source?: string;
  onSaved?: () => void;
  presentation?: "card" | "dialog";
  onCancel?: () => void;
  /** Förvald påverkansfaktor, t.ex. sömn på morgonen. Går alltid att ändra. */
  presetFactors?: string[];
}) {
  const { t } = useLang();
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
  const [saving, setSaving] = useState(false);
  const [pendingSync, setPendingSync] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [started, setStarted] = useState(false);
  const [showMore, setShowMore] = useState(false);

  useEffect(() => {
    if (!started && energyValue != null) setBattery(energyValue);
  }, [energyValue, started]);
  useEffect(() => {
    if (!started && moodValue != null) setMood(moodValue);
  }, [moodValue, started]);
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

  const save = async () => {
    if (saving) return;
    setSaving(true);
    setSaved(false);
    setSaveError(null);
    try {
      const result = await logEnergy(battery);
      setPendingSync(result?.synced === false);
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
          title: t(f.labelSv),
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
    } catch {
      setSaveError(t("Det gick inte att spara. Dina val finns kvar – försök igen."));
    } finally {
      setSaving(false);
    }
  };

  const ork = orkFromValue10(battery);
  // Formuläret har redan en fokuskontur; undvik dubbel ring runt "Varför?".
  const whyClass = "focus-visible:ring-0 focus-visible:ring-offset-0";

  const fields = (
    <>
      <div className="space-y-2">
        <div className="pace-form-heading flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-ink">
            <BatteryMedium
              size={16}
              aria-hidden="true"
              className="mr-1 inline-block align-[-3px] text-primary"
            />
            {t("Hur mycket ryms idag?")}
          </p>
          <WhyHint appearance="inline" label={t("logga ork")} className={whyClass}>
            {t("Du väljer bara ett ord – Paceable ser mönstren åt dig över tid.")}
          </WhyHint>
        </div>
        {energyExplainer && <p className="text-xs text-muted-foreground">{energyExplainer}</p>}
        <div className="pace-form-ork grid grid-cols-3 gap-2">
          {ORK_LEVELS.map((l) => (
            <Button
              variant="outline"
              key={l.id}
              type="button"
              aria-pressed={ork?.id === l.id}
              aria-label={t(l.label)}
              onClick={() => {
                markStarted("battery");
                setBattery(l.value10);
              }}
              className="pace-form-choice flex-1 gap-2 rounded-xl px-3 py-2.5"
            >
              {(() => {
                const Icon = ORK_ICONS[l.id] ?? BatteryMedium;
                return <Icon size={18} aria-hidden="true" className="shrink-0" />;
              })()}
              {t(l.label)}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <div className="pace-form-heading flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-ink">
            <Heart
              size={16}
              aria-hidden="true"
              className="mr-1 inline-block align-[-3px] text-primary"
            />
            {t("Hur känns det just nu?")}{" "}
            <span className="font-normal text-muted-foreground">{t("(valfritt)")}</span>
          </p>
          <WhyHint appearance="inline" label={t("logga mående")} className={whyClass}>
            {t("Det hjälper Pace förstå om ditt mående och din ork brukar hänga ihop för dig.")}
          </WhyHint>
        </div>
        {moodExplainer && <p className="text-xs text-muted-foreground">{moodExplainer}</p>}
        <div className="pace-form-moods">
          {MOODS.map((m) => (
            <Button
              variant="outline"
              key={m.score10}
              type="button"
              aria-pressed={mood === m.score10}
              aria-label={t(m.label)}
              onClick={() => {
                markStarted("mood");
                setMood(m.score10);
              }}
              className="pace-form-choice flex-col gap-1 rounded-xl"
            >
              {(() => {
                const Icon = MOOD_ICONS[m.score10] ?? Meh;
                return <Icon size={24} aria-hidden="true" className="shrink-0" />;
              })()}
              <span className="text-xs text-muted-foreground">{t(m.label)}</span>
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="block space-y-1">
          <span className="text-xs text-muted-foreground">
            {t("Vill du skriva några ord? (valfritt)")}
          </span>
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onFocus={(e) => {
              // Håll anteckningen synlig ovanför den fasta sparytan när tangentbordet öppnas.
              const el = e.currentTarget;
              window.setTimeout(
                () => el.scrollIntoView({ block: "center", behavior: "smooth" }),
                300,
              );
            }}
            rows={2}
            placeholder={t("T.ex. ”Sovit bara 4 timmar och är dessutom sjuk.”")}
            className="w-full resize-none rounded-xl border-input bg-card p-3 text-sm text-foreground"
          />
        </label>

        {/* Progressiv komplexitet: det avancerade ligger bakom "Visa mer". */}
        <Button
          variant="ghost"
          type="button"
          onClick={() => setShowMore((v) => !v)}
          aria-expanded={showMore}
          className="gap-1.5 px-0 text-muted-foreground hover:bg-transparent hover:text-foreground hover:underline"
        >
          <ChevronDown
            size={15}
            aria-hidden
            className={cn("transition-transform", showMore && "rotate-180")}
          />
          {showMore ? t("Visa mindre") : t("Visa mer")}
        </Button>

        {showMore && (
          <div className="space-y-2">
            <p className="text-sm font-semibold text-ink">
              {t("Vad påverkar dig just nu?")}{" "}
              <span className="font-normal text-muted-foreground">{t("(valfritt)")}</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {FACTORS.map((f) => {
                const on = factors.includes(f.id);
                return (
                  <Button
                    variant="outline"
                    key={f.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() =>
                      setFactors((prev) =>
                        prev.includes(f.id) ? prev.filter((x) => x !== f.id) : [...prev, f.id],
                      )
                    }
                    className="pace-form-choice rounded-xl px-3 py-1.5"
                  >
                    {(() => {
                      const Icon = FACTOR_ICONS[f.id] ?? Sparkles;
                      return <Icon size={15} aria-hidden="true" className="mr-1 shrink-0" />;
                    })()}
                    {t(f.labelSv)}
                  </Button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </>
  );

  const saveButton = (
    <Button
      type="button"
      onClick={save}
      disabled={saving}
      aria-label={t("Logga energi & mående")}
      className="min-h-11 w-full gap-2 rounded-xl px-4 py-2.5 font-semibold"
    >
      <Sparkles size={16} aria-hidden="true" />
      {saving ? t("Sparar…") : saved ? t("Tack") : t("Spara")}
    </Button>
  );

  const status = (
    <p aria-live="polite" className="text-center text-xs leading-relaxed text-muted-foreground">
      {saveError ? (
        <span role="alert">{saveError}</span>
      ) : saved ? (
        pendingSync ? (
          t("Din observation är sparad här och väntar på synkning till kontot.")
        ) : (
          t("Tack – din observation är sparad.")
        )
      ) : (
        t("Logga så ofta du vill – varje sparning blir en egen observation i din dag.")
      )}
    </p>
  );

  if (presentation === "dialog") {
    return (
      <div
        data-testid="battery-log-form"
        className={cn(
          "pace-form",
          "grid min-h-0 max-h-full grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden bg-card",
          className,
        )}
      >
        <header
          data-testid="checkin-dialog-header"
          className="border-b border-border/70 px-4 pb-2 pt-[calc(0.5rem+env(safe-area-inset-top))] pr-14 sm:px-5 sm:pb-3 sm:pt-4 sm:pr-16"
        >
          {/* Kort synlig rubrik på trånga skärmar; det fullständiga namnet finns alltid för skärmläsare. */}
          <h2
            aria-label={t("Logga just nu")}
            className="font-display text-lg font-bold leading-tight text-ink sm:text-xl"
          >
            <span aria-hidden="true" className="sm:hidden">
              {t("Logga")}
            </span>
            <span aria-hidden="true" className="hidden sm:inline">
              {t("Logga just nu")}
            </span>
          </h2>
          <p className="sr-only">{t("Två snabba frågor. Paceable gör resten.")}</p>
        </header>

        <div
          data-testid="checkin-dialog-scroll"
          className="min-h-0 space-y-4 overflow-y-auto overscroll-contain scroll-pb-6 px-4 pb-6 pt-3 sm:px-5 sm:py-4"
        >
          {fields}
        </div>

        <footer
          data-testid="checkin-dialog-footer"
          className="space-y-1.5 border-t border-border/70 bg-card px-4 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2 sm:px-5 sm:pb-4 sm:pt-3"
        >
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,8rem),1fr))] gap-2">
            {saveButton}
            {onCancel && (
              <Button
                type="button"
                variant="ghost"
                onClick={onCancel}
                className="min-h-11 w-full px-3 text-muted-foreground"
              >
                {t("Avbryt")}
              </Button>
            )}
          </div>
          <p
            aria-live="polite"
            className={cn(
              "text-center text-xs leading-relaxed text-muted-foreground",
              !saved && "hidden",
            )}
          >
            {saved ? t("Tack – din observation är sparad.") : ""}
          </p>
        </footer>
      </div>
    );
  }

  return (
    <MyFloveBlock
      title={t("Logga just nu")}
      subtitle={t("Två snabba frågor. Paceable gör resten.")}
      eyebrow={t("Logga")}
      icon={Pencil}
      tone="lavender"
      surface="plain"
      collapsible
      collapseId="batteri::logga-just-nu"
      data-testid="battery-log-form"
      className={cn(paceFormSurface, "h-full", className)}
      footer={status}
    >
      {fields}

      {saveButton}
    </MyFloveBlock>
  );
}
