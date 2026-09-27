import { useCallback, useEffect, useState } from "react";
import { Link } from "wouter";
import { CheckCircle2, Clock, Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ActivityPictogram } from "@/components/family/activity-pictogram";
import StartHelper from "@/components/home/start-helper";
import LandingPause from "@/components/home/landing-pause";
import { useFlowItems } from "@/hooks/use-flow-items";
import { useFlowPlan } from "@/hooks/use-flow-plan";
import { useLang } from "@/hooks/use-language";
import { dailyActivityVisual } from "@/lib/daily-activity-visual";
import { areaColor } from "@/lib/life-areas";
import { minutesUntil, PREP_WINDOW_MIN } from "@/lib/start-helper";

/** Minuter sedan midnatt, uppdaterat varje minut. */
function useNowMinutes(): number {
  const [min, setMin] = useState(() => {
    const d = new Date();
    return d.getHours() * 60 + d.getMinutes();
  });
  useEffect(() => {
    const id = window.setInterval(() => {
      const d = new Date();
      setMin(d.getHours() * 60 + d.getMinutes());
    }, 30000);
    return () => window.clearInterval(id);
  }, []);
  return min;
}


/** "Just nu" – ÖPPNA → NU → GÖR → KLAR → NÄSTA. */
export default function NowCard({ onAdd }: { onAdd: () => void }) {
  const { t } = useLang();
  const { toggleItem } = useFlowItems();
  const [skipped, setSkipped] = useState<string[]>([]);
  // FlowPlan är enda källan för "vad nu" – samma som Nästa steg och Flow.
  const plan = useFlowPlan(skipped);
  const [justDone, setJustDone] = useState(false);
  const [helping, setHelping] = useState(false);
  // Mjuk övergång: "ask" = frågan visas, "run" = två minuter att landa.
  const [landing, setLanding] = useState<"none" | "ask" | "run">("none");
  const current = plan.now && !skipped.includes(plan.now.item.id) ? plan.now.item.flowItem : null;
  const endLanding = useCallback(() => setLanding("none"), []);
  const nowMin = useNowMinutes();
  // Mjuk puff: kvartsvarning inför en fast tid, så man slipper vänteläget.
  const [prepDismissed, setPrepDismissed] = useState<string | null>(null);
  const minsLeft = current ? minutesUntil(current.time, nowMin) : null;
  const showPrep =
    !!current &&
    !helping &&
    minsLeft !== null &&
    minsLeft <= PREP_WINDOW_MIN &&
    prepDismissed !== current.id;


  if (landing !== "none") {
    return (
      <section
        className="rounded-3xl border border-border/60 bg-card p-5 shadow-soft"
        aria-label={t("Just nu")}
        aria-live="polite"
      >
        <p className="text-xs font-semibold uppercase text-primary">{t("Bra jobbat")}</p>
        <p className="mt-2 font-display text-lg font-bold text-ink">
          {t("Vill du landa 2 minuter innan nästa?")}
        </p>
        {landing === "ask" ? (
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              type="button"
              onClick={() => setLanding("run")}
              className="min-h-12 rounded-full px-6 text-base font-semibold"
            >
              {t("Landa 2 minuter")}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={endLanding}
              className="min-h-11 rounded-full text-muted-foreground"
            >
              {t("Redo direkt")}
            </Button>
          </div>
        ) : (
          <LandingPause onReady={endLanding} />
        )}
      </section>
    );
  }

  if (!current) {

    return (
      <section
        className="rounded-3xl border border-border/60 bg-card p-5 shadow-soft"
        aria-label={t("Just nu")}
      >
        <p className="text-xs font-semibold uppercase text-primary">{t("Just nu")}</p>
        <p className="mt-2 font-display text-lg font-bold text-ink">
          {justDone ? t("Allt för idag är klart. Bra jobbat!") : t("Inget planerat just nu")}
        </p>
        <Button
          type="button"
          variant="outline"
          onClick={onAdd}
          className="mt-4 min-h-11 rounded-full"
        >
          <Plus className="h-4 w-4" aria-hidden /> {t("Lägg till något")}
        </Button>
      </section>
    );
  }

  const visual = dailyActivityVisual(current);
  const color = visual.colorArea ? areaColor(visual.colorArea) : undefined;

  return (
    <section
      className="rounded-3xl border border-border/60 bg-card p-5 shadow-soft"
      style={color ? { borderLeft: `6px solid ${color}` } : undefined}
      aria-label={t("Just nu")}
      aria-live="polite"
    >
      <div className="flex items-center justify-between gap-2">
        <Link
          href="/min-dag"
          className="text-xs font-semibold uppercase text-primary underline-offset-4 hover:underline"
        >
          {justDone ? t("Bra jobbat – nästa:") : t("Just nu")}
        </Link>
        <button
          type="button"
          onClick={onAdd}
          aria-label={t("Lägg till aktivitet")}
          className="inline-flex min-h-9 items-center gap-1 rounded-full border border-border/60 bg-card/70 px-3 text-xs font-semibold text-ink shadow-soft"
        >
          <Plus className="h-3.5 w-3.5 text-primary" aria-hidden /> {t("Lägg till")}
        </button>
      </div>
      <div className="mt-3 flex min-w-0 items-center gap-3">
        <ActivityPictogram
          id={visual.pictogram}
          tone={visual.tone}
          className="h-14 w-14 shrink-0 rounded-2xl"
          iconClassName="h-8 w-8"
          style={color ? { color } : undefined}
        />
        <div className="min-w-0">
          <p className="break-words font-display text-xl font-bold leading-snug text-ink">
            {current.title}
          </p>
          <p className="text-sm text-muted-foreground">
            {current.time ? `${current.time} · ` : ""}
            {visual.label}
          </p>
        </div>
      </div>
      {showPrep && (
        <div className="mt-4 rounded-2xl bg-primary/10 p-4" aria-live="polite">
          <p className="flex items-start gap-2 text-sm font-medium text-ink">
            <Clock className="mt-0.5 h-4 w-4 shrink-0 animate-[pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite] text-primary" aria-hidden />
            <span>
              {minsLeft && minsLeft > 0
                ? t(`Om ${minsLeft} min: ${current.title}.`)
                : t(`Det är dags: ${current.title}.`)}{" "}
              {t("Vill du starta mjukt i 2 lugna minuter?")}
            </span>
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              onClick={() => setHelping(true)}
              className="min-h-11 rounded-full"
            >
              <Sparkles className="h-4 w-4" aria-hidden /> {t("Starta mjukt")}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setPrepDismissed(current.id)}
              className="min-h-11 rounded-full text-muted-foreground"
            >
              {t("Inte nu")}
            </Button>
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {current.completable && (
          <Button
            type="button"
            size="lg"
            onClick={() => {
              toggleItem(current);
              setJustDone(true);
              setHelping(false);
              setLanding("ask");
            }}
            className="min-h-12 flex-1 rounded-full text-base font-semibold sm:flex-none sm:px-8"
          >
            <CheckCircle2 className="h-5 w-5" aria-hidden /> {t("Klar")}
          </Button>
        )}
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            setSkipped((s) => [...s, current.id]);
            setJustDone(false);
            setHelping(false);
          }}
          className="min-h-11 rounded-full text-muted-foreground"
        >
          {t("Inte nu")}
        </Button>
      </div>
      {!helping && (
        <button
          type="button"
          onClick={() => setHelping(true)}
          className="mt-3 inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-primary underline underline-offset-4"
        >
          <Sparkles className="h-4 w-4" aria-hidden /> {t("Hjälp mig börja (2 min)")}
        </button>
      )}
      {helping && (
        <StartHelper
          title={current.title}
          onDone={() => {
            setHelping(false);
            if (current.completable) {
              toggleItem(current);
              setJustDone(true);
              setLanding("ask");
            }
          }}
          onClose={() => setHelping(false)}
        />
      )}
    </section>

  );
}
