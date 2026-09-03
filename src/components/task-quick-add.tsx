import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { todayISO, type TaskFriction, type EnergyImpact } from "@/lib/task-agenda";

export interface QuickAddResult {
  title: string;
  dueDate: string;
  time?: string;
  completed: boolean;
  completedAt?: number;
  /** Behålls i resultatet för bakåtkompatibilitet med befintliga anrop. */
  energyImpact?: EnergyImpact;
  friction?: TaskFriction;
}

type AddMode = "done" | "planned";

/**
 * MyFloves enda enkla aktivitetsflöde: fånga det som redan hänt eller det som
 * ska hända. All annan information är frivillig och hör hemma senare.
 */
export function TaskQuickAdd({
  onAdd,
  className,
  defaultDate,
  label = "Lägg till",
}: {
  onAdd: (result: QuickAddResult) => void;
  className?: string;
  /** Förvalt datum, t.ex. dagen man står på i kalendern. */
  defaultDate?: string;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<AddMode | null>(null);
  const [title, setTitle] = useState("");
  const baseDate =
    defaultDate && /^\d{4}-\d{2}-\d{2}$/.test(defaultDate) ? defaultDate : todayISO();
  const [date, setDate] = useState(baseDate);
  const [time, setTime] = useState("");

  const reset = () => {
    setMode(null);
    setTitle("");
    setDate(baseDate);
    setTime("");
  };

  const chooseMode = (nextMode: AddMode) => {
    setMode(nextMode);
    setDate(baseDate);
    setTime("");
  };

  const save = () => {
    const trimmed = title.trim();
    const safeDate = /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : baseDate;
    if (!trimmed || !mode) return;
    onAdd({
      title: trimmed.slice(0, 240),
      dueDate: safeDate,
      time: time || undefined,
      completed: mode === "done",
      completedAt: mode === "done" ? Date.now() : undefined,
    });
    setOpen(false);
    reset();
  };

  const choiceClass = (active: boolean) =>
    cn(
      "h-auto min-h-12 justify-start rounded-2xl border px-4 py-3 text-left",
      active
        ? "border-primary bg-primary/10 text-primary"
        : "border-border bg-background text-foreground hover:bg-secondary/60",
    );

  return (
    <>
      <Button
        type="button"
        onClick={() => {
          setDate(baseDate);
          setOpen(true);
        }}
        className={cn("h-12 w-full rounded-2xl text-base shadow-soft", className)}
      >
        <span aria-hidden className="text-xl leading-none">
          +
        </span>
        {label}
      </Button>

      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen);
          if (!nextOpen) reset();
        }}
      >
        <DialogContent className="max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle>
              {mode ? "Vad vill du lägga till?" : "Vad vill du lägga till?"}
            </DialogTitle>
          </DialogHeader>

          {!mode ? (
            <div className="grid gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                className={choiceClass(false)}
                onClick={() => chooseMode("done")}
              >
                <span aria-hidden className="text-lg">
                  ✓
                </span>
                <span>
                  <span className="block font-semibold">Jag gjorde detta</span>
                  <span className="block text-xs font-normal text-muted-foreground">
                    Syns bland det du gjort på valt datum.
                  </span>
                </span>
              </Button>
              <Button
                type="button"
                variant="outline"
                className={choiceClass(false)}
                onClick={() => chooseMode("planned")}
              >
                <span aria-hidden className="text-lg">
                  ○
                </span>
                <span>
                  <span className="block font-semibold">Jag ska göra detta</span>
                  <span className="block text-xs font-normal text-muted-foreground">
                    Läggs som planerad aktivitet på valt datum.
                  </span>
                </span>
              </Button>
            </div>
          ) : (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                save();
              }}
              className="space-y-4 pt-2"
            >
              <div className="flex items-center justify-between gap-2 rounded-2xl bg-secondary/50 px-3 py-2 text-sm">
                <span className="font-medium text-foreground">
                  {mode === "done" ? "✓ Jag gjorde detta" : "○ Jag ska göra detta"}
                </span>
                <Button type="button" variant="ghost" size="sm" onClick={() => setMode(null)}>
                  Byt
                </Button>
              </div>

              <Input
                autoFocus
                required
                maxLength={240}
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder={mode === "done" ? "T.ex. Tvättade barnens kläder" : "T.ex. Möte"}
                className="h-12 rounded-2xl bg-secondary/50 text-base"
                aria-label="Vad"
              />

              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  När?
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setDate(baseDate)}
                    className={cn(
                      "rounded-full",
                      date === baseDate && "border-primary text-primary",
                    )}
                  >
                    {baseDate === todayISO() ? "Idag" : "Vald dag"}
                  </Button>

                  <Input
                    type="date"
                    value={date}
                    onChange={(event) => setDate(event.target.value)}
                    className="h-10 min-w-0 flex-1 rounded-xl bg-background text-sm"
                    aria-label="Datum"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Tid? <span className="font-normal normal-case tracking-normal">(valfritt)</span>
                </p>
                <div className="flex items-center gap-2">
                  <Input
                    type="time"
                    value={time}
                    onChange={(event) => setTime(event.target.value)}
                    className="h-10 min-w-0 flex-1 rounded-xl bg-background text-sm"
                    aria-label="Tid"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setTime("")}
                    className={cn("rounded-full", !time && "border-primary text-primary")}
                  >
                    Ingen tid
                  </Button>
                </div>
              </div>

              <Button type="submit" disabled={!title.trim()} className="h-12 w-full rounded-2xl">
                Spara
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

/**
 * Inline-varianten av lägg-till-flödet: ingen dialog, datumet är låst till
 * den dag användaren klickat på i kalendern eller Min dag.
 */
export function QuickAddInline({
  date,
  onAdd,
  onClose,
  className,
}: {
  /** Dagen flödet gäller – låst, väljs genom att klicka på dagen. */
  date: string;
  onAdd: (result: QuickAddResult) => void;
  onClose?: () => void;
  className?: string;
}) {
  const [mode, setMode] = useState<AddMode | null>(null);
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("");
  const baseDate = /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : todayISO();

  const save = () => {
    const trimmed = title.trim();
    if (!trimmed || !mode) return;
    onAdd({
      title: trimmed.slice(0, 240),
      dueDate: baseDate,
      time: time || undefined,
      completed: mode === "done",
      completedAt: mode === "done" ? Date.now() : undefined,
    });
    setMode(null);
    setTitle("");
    setTime("");
    onClose?.();
  };

  const dayLabel =
    baseDate === todayISO()
      ? "Idag"
      : new Date(`${baseDate}T12:00:00`).toLocaleDateString("sv-SE", {
          weekday: "long",
          day: "numeric",
          month: "long",
        });

  return (
    <div
      className={cn(
        "space-y-3 rounded-3xl border-2 border-primary/25 bg-primary/5 p-4",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-ink">
          Lägg till · <span className="capitalize">{dayLabel}</span>
        </p>
        {onClose && (
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Stäng
          </Button>
        )}
      </div>

      {!mode ? (
        <div className="grid gap-2 sm:grid-cols-2">
          <Button
            type="button"
            variant="outline"
            className={choiceClass(false)}
            onClick={() => setMode("done")}
          >
            <span aria-hidden className="text-lg">
              ✓
            </span>
            <span>
              <span className="block font-semibold">Jag gjorde detta</span>
              <span className="block text-xs font-normal text-muted-foreground">
                Syns bland det du gjort den dagen.
              </span>
            </span>
          </Button>
          <Button
            type="button"
            variant="outline"
            className={choiceClass(false)}
            onClick={() => setMode("planned")}
          >
            <span aria-hidden className="text-lg">
              ○
            </span>
            <span>
              <span className="block font-semibold">Jag ska göra detta</span>
              <span className="block text-xs font-normal text-muted-foreground">
                Läggs som planerad på dagen.
              </span>
            </span>
          </Button>
        </div>
      ) : (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            save();
          }}
          className="space-y-3"
        >
          <div className="flex items-center justify-between gap-2 rounded-2xl bg-secondary/50 px-3 py-2 text-sm">
            <span className="font-medium text-foreground">
              {mode === "done" ? "✓ Jag gjorde detta" : "○ Jag ska göra detta"}
            </span>
            <Button type="button" variant="ghost" size="sm" onClick={() => setMode(null)}>
              Byt
            </Button>
          </div>

          <Input
            autoFocus
            required
            maxLength={240}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder={mode === "done" ? "T.ex. Tvättade barnens kläder" : "T.ex. Möte"}
            className="h-12 rounded-2xl bg-card text-base"
            aria-label="Vad"
          />

          <div className="flex items-center gap-2">
            <Input
              type="time"
              value={time}
              onChange={(event) => setTime(event.target.value)}
              className="h-10 min-w-0 flex-1 rounded-xl bg-card text-sm"
              aria-label="Tid (valfritt)"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setTime("")}
              className={cn("rounded-full", !time && "border-primary text-primary")}
            >
              Ingen tid
            </Button>
          </div>

          <Button type="submit" disabled={!title.trim()} className="h-12 w-full rounded-2xl">
            Spara på {dayLabel.toLowerCase()}
          </Button>
        </form>
      )}
    </div>
  );
}

export default TaskQuickAdd;
