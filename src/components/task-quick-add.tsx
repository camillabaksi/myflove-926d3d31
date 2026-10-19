import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { paceEveryday } from "@/components/paceable/design-system";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { looksLikeShopping, shoppingTitleFrom } from "@/lib/quickflow";
import { useSharedShoppingList } from "@/hooks/use-shared-shopping-list";
import { todayISO, type TaskFriction, type EnergyImpact } from "@/lib/task-agenda";

export interface QuickAddResult {
  title: string;
  dueDate: string;
  /** A continuous calendar period, never a task duplicated across days. */
  endDate?: string;
  time?: string;
  completed: boolean;
  completedAt?: number;
  /** Behålls i resultatet för bakåtkompatibilitet med befintliga anrop. */
  energyImpact?: EnergyImpact;
  friction?: TaskFriction;
}

/** Erbjuder att lägga varan i Inköpslistan när texten låter som ett inköp. */
function ShoppingHint({
  title,
  checked,
  onChange,
}: {
  title: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  if (!looksLikeShopping(title)) return null;
  const item = shoppingTitleFrom(title);
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-primary/30 bg-primary/5 px-3 py-2 text-left text-sm">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 h-4 w-4 accent-[hsl(var(--primary))]"
      />
      <span>
        <span className="block font-semibold text-ink">Lägg också i Inköpslistan</span>
        <span className="block text-xs text-muted-foreground">
          Det här låter som ett inköp – ”{item}” hamnar i listan.
        </span>
      </span>
    </label>
  );
}

type AddMode = "done" | "planned";

const choiceClass = (active: boolean) =>
  cn(
    "h-auto min-h-12 justify-start rounded-2xl border px-4 py-3 text-left",
    active
      ? "border-primary bg-primary/10 text-primary"
      : "border-border bg-background text-foreground hover:bg-secondary/60",
  );

/**
 * MyFloves enda enkla aktivitetsflöde: fånga det som redan hänt eller det som
 * ska hända. All annan information är frivillig och hör hemma senare.
 */
export function TaskQuickAdd({
  onAdd,
  className,
  defaultDate,
  label = "Lägg till",
  initialMode,
}: {
  onAdd: (result: QuickAddResult) => void;
  className?: string;
  /** Förvalt datum, t.ex. dagen man står på i kalendern. */
  defaultDate?: string;
  label?: string;
  initialMode?: AddMode;
}) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<AddMode | null>(initialMode ?? null);
  const [title, setTitle] = useState("");
  const baseDate =
    defaultDate && /^\d{4}-\d{2}-\d{2}$/.test(defaultDate) ? defaultDate : todayISO();
  const [date, setDate] = useState(baseDate);
  const [time, setTime] = useState("");
  const [endDate, setEndDate] = useState("");
  const [alsoShopping, setAlsoShopping] = useState(true);
  const { addItem: addShoppingItem } = useSharedShoppingList();

  const reset = () => {
    setMode(initialMode ?? null);
    setTitle("");
    setDate(baseDate);
    setTime("");
    setEndDate("");
    setAlsoShopping(true);
  };

  const chooseMode = (nextMode: AddMode) => {
    setMode(nextMode);
    setDate(baseDate);
    setTime("");
    setEndDate("");
  };

  const save = () => {
    const trimmed = title.trim();
    const safeDate = /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : baseDate;
    if (!trimmed || !mode || (endDate && endDate < safeDate)) return;
    if (alsoShopping && looksLikeShopping(trimmed)) {
      addShoppingItem(shoppingTitleFrom(trimmed));
      toast.success("Tillagd i Inköpslistan också. 💙");
    }
    onAdd({
      title: trimmed.slice(0, 240),
      dueDate: safeDate,
      endDate: mode === "planned" ? endDate || undefined : undefined,
      time: endDate ? undefined : time || undefined,
      completed: mode === "done",
      completedAt: mode === "done" ? Date.now() : undefined,
    });
    if (time && !endDate) {
      const dayLabel =
        safeDate === todayISO()
          ? "idag"
          : new Date(`${safeDate}T12:00:00`).toLocaleDateString("sv-SE", {
              weekday: "long",
              day: "numeric",
              month: "long",
            });
      toast.success(`Sparad ${dayLabel} kl ${time}. 💙`);
    }
    setOpen(false);
    reset();
  };

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
        <DialogContent className={paceEveryday.dialog}>
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

              <ShoppingHint title={title} checked={alsoShopping} onChange={setAlsoShopping} />

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
                    onChange={(event) => { setDate(event.target.value); if (endDate && endDate < event.target.value) setEndDate(event.target.value); }}
                    className="h-10 min-w-0 flex-1 rounded-xl bg-background text-sm"
                    aria-label="Datum"
                  />
                </div>
              </div>

              {mode === "planned" && <div className="space-y-2 rounded-2xl border border-border/60 bg-secondary/20 p-3">
                <p className="text-xs font-medium text-muted-foreground">Gäller det en dag eller en period?</p>
                <div className="grid grid-cols-2 gap-2" role="group" aria-label="Datumomfattning">
                  <Button type="button" variant="outline" aria-pressed={!endDate} className={cn("min-h-10 rounded-xl text-sm", !endDate && "border-primary bg-primary/10 text-primary")} onClick={() => setEndDate("")}>En dag</Button>
                  <Button type="button" variant="outline" aria-pressed={!!endDate} className={cn("min-h-10 rounded-xl text-sm", !!endDate && "border-primary bg-primary/10 text-primary")} onClick={() => { setEndDate(date); setTime(""); }}>Flera dagar</Button>
                </div>
                {!!endDate && <label className="block space-y-1 text-sm"><span className="text-muted-foreground">Slutdatum</span><Input type="date" min={date} value={endDate} onChange={event => setEndDate(event.target.value)} required className="h-10 rounded-xl bg-background" /><span className="block text-xs text-muted-foreground">Visas varje dag under perioden, utan att boka tid.</span></label>}
              </div>}

              {!endDate && <div className="space-y-2">
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
              </div>}

              <Button type="submit" disabled={!title.trim() || (!!endDate && endDate < date)} className="h-12 w-full rounded-2xl">
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
  const [alsoShopping, setAlsoShopping] = useState(true);
  const { addItem: addShoppingItem } = useSharedShoppingList();
  const baseDate = /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : todayISO();

  const save = () => {
    const trimmed = title.trim();
    if (!trimmed || !mode) return;
    if (alsoShopping && looksLikeShopping(trimmed)) {
      addShoppingItem(shoppingTitleFrom(trimmed));
      toast.success("Tillagd i Inköpslistan också. 💙");
    }
    onAdd({
      title: trimmed.slice(0, 240),
      dueDate: baseDate,
      time: time || undefined,
      completed: mode === "done",
      completedAt: mode === "done" ? Date.now() : undefined,
    });
    if (time) toast.success(`Sparad ${dayLabel.toLowerCase()} kl ${time}. 💙`);
    setMode(null);
    setTitle("");
    setTime("");
    setAlsoShopping(true);
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
      className={cn(paceEveryday.surface, "space-y-3 p-4", className)}
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

          <ShoppingHint title={title} checked={alsoShopping} onChange={setAlsoShopping} />

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
