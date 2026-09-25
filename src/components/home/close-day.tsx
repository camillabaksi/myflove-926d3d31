import { useMemo, useState } from "react";
import { Moon, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFlowItems } from "@/hooks/use-flow-items";
import { useTasks } from "@/hooks/use-data";
import { useCloudSyncedStorage } from "@/lib/cloud-storage";
import { useLang } from "@/hooks/use-language";
import { addDaysISO, todayISO } from "@/lib/day";

/** Kvällsläge: från 18 till natten. */
export function isEveningHour(hour: number): boolean {
  return hour >= 18 || hour < 4;
}

/**
 * "Stäng dagen" – en varm avslutning utan skuld.
 *
 * Ogjorda saker flyttas bara om användaren själv trycker, och går att ångra.
 * Ingen räknar fel, ingen röd siffra – dagen får helt enkelt ta slut.
 */
export default function CloseDay() {
  const { t } = useLang();
  const { todayOpen, todayDone } = useFlowItems();
  const { updateTask } = useTasks();
  const today = todayISO();
  const [closedOn, setClosedOn] = useCloudSyncedStorage<string>("myflove-day-closed", "");
  const [moved, setMoved] = useState<Array<{ id: string; prev?: string }>>([]);

  const movable = useMemo(
    () => todayOpen.filter((i) => i.id.startsWith("task-")),
    [todayOpen],
  );
  const doneCount = todayDone.length;
  const openCount = todayOpen.length;

  if (!isEveningHour(new Date().getHours())) return null;

  const closed = closedOn === today;

  const close = () => {
    const tomorrow = addDaysISO(today, 1);
    const list = movable.map((i) => ({ id: i.id.slice(5), prev: i.dueDate }));
    list.forEach((m) => updateTask(m.id, { dueDate: tomorrow }));
    setMoved(list);
    setClosedOn(today);
  };

  const undo = () => {
    moved.forEach((m) => updateTask(m.id, { dueDate: m.prev ?? today }));
    setMoved([]);
    setClosedOn("");
  };

  if (closed) {
    return (
      <section
        data-testid="home-close-day"
        aria-label={t("Stäng dagen")}
        className="rounded-3xl border border-border/60 bg-card p-5 text-center shadow-soft"
      >
        <Moon className="mx-auto h-7 w-7 text-primary" aria-hidden />
        <p className="mt-2 font-display text-lg font-bold text-ink">{t("Dagen är stängd.")}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("Bra jobbat idag – nu får huvudet vila.")}
        </p>
        {moved.length > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={undo}
            className="mt-3 min-h-11 rounded-full text-muted-foreground"
          >
            <Undo2 className="h-4 w-4" aria-hidden /> {t("Ångra")}
          </Button>
        )}
      </section>
    );
  }

  return (
    <section
      data-testid="home-close-day"
      aria-label={t("Stäng dagen")}
      className="rounded-3xl border border-border/60 bg-card p-5 shadow-soft"
    >
      <p className="flex items-center gap-2 text-xs font-semibold uppercase text-primary">
        <Moon className="h-4 w-4" aria-hidden /> {t("Stäng dagen")}
      </p>
      <p className="mt-2 font-display text-lg font-bold leading-snug text-ink">
        {doneCount > 0
          ? `${t("Du gjorde")} ${doneCount} ${t("saker idag – det räcker gott och väl.")}`
          : t("Idag blev som det blev. Det är också okej.")}
      </p>
      {openCount > 0 && (
        <p className="mt-1 text-sm text-muted-foreground">
          {`${openCount} ${t("saker ligger kvar. Vill du att vi flyttar dem till imorgon så du kan släppa allt för ikväll?")}`}
        </p>
      )}
      <Button
        type="button"
        onClick={close}
        className="mt-4 min-h-12 w-full rounded-full text-base font-semibold sm:w-auto sm:px-8"
      >
        {t("Stäng dagen & vila")}
      </Button>
    </section>
  );
}
