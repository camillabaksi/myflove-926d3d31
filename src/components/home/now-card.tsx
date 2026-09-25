import { useCallback, useMemo, useState } from "react";
import { CheckCircle2, Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ActivityPictogram } from "@/components/family/activity-pictogram";
import StartHelper from "@/components/home/start-helper";
import LandingPause from "@/components/home/landing-pause";
import { useFlowItems } from "@/hooks/use-flow-items";
import { useLang } from "@/hooks/use-language";
import { dailyActivityVisual } from "@/lib/daily-activity-visual";
import { areaColor } from "@/lib/life-areas";
import type { FlowItem } from "@/lib/flow-items";


function toMinutes(time?: string | null) {
  if (!time) return null;
  const [h, m] = time.split(":").map(Number);
  return Number.isFinite(h) ? h * 60 + (m || 0) : null;
}

/** Väljer EN sak att göra nu ur dagens befintliga lista. */
export function pickNow(items: FlowItem[], nowMinutes: number, skipped: string[]) {
  const open = items.filter((i) => !i.done && !skipped.includes(i.id));
  if (open.length === 0) return null;
  const timed = open
    .map((item) => ({ item, m: toMinutes(item.time) }))
    .filter((x): x is { item: FlowItem; m: number } => x.m != null)
    .sort((a, b) => Math.abs(a.m - nowMinutes) - Math.abs(b.m - nowMinutes));
  const upcomingOrCurrent = timed.find((x) => x.m >= nowMinutes - 60);
  return upcomingOrCurrent?.item ?? open.find((i) => !i.time) ?? timed[0]?.item ?? open[0];
}

/** "Just nu" – ÖPPNA → NU → GÖR → KLAR → NÄSTA. */
export default function NowCard({ onAdd }: { onAdd: () => void }) {
  const { t } = useLang();
  const { today, toggleItem } = useFlowItems();
  const [skipped, setSkipped] = useState<string[]>([]);
  const [justDone, setJustDone] = useState(false);
  const [helping, setHelping] = useState(false);
  // Mjuk övergång: "ask" = frågan visas, "run" = två minuter att landa.
  const [landing, setLanding] = useState<"none" | "ask" | "run">("none");
  const now = new Date();
  const current = useMemo(
    () => pickNow(today, now.getHours() * 60 + now.getMinutes(), skipped),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [today, skipped],
  );
  const endLanding = useCallback(() => setLanding("none"), []);

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
      <p className="text-xs font-semibold uppercase text-primary">
        {justDone ? t("Bra jobbat – nästa:") : t("Just nu")}
      </p>
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
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {current.completable && (
          <Button
            type="button"
            size="lg"
            onClick={() => {
              toggleItem(current);
              setJustDone(true);
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
          }}
          className="min-h-11 rounded-full text-muted-foreground"
        >
          {t("Inte nu")}
        </Button>
      </div>
    </section>
  );
}
