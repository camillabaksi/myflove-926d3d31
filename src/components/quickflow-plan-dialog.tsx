import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import WhyHint from "@/components/why-hint";
import { todayISO, nowTime } from "@/lib/task-agenda";
import { cn } from "@/lib/utils";

export interface PlanChoice {
  dueDate: string;
  time?: string;
}

const addDays = (iso: string, days: number) => {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + days);
  return todayISO(d);
};

type DayChoice = "idag" | "imorgon" | "valj";

/**
 * "Planera den" – användaren väljer själv dag och (frivilligt) tid.
 * Flow föreslår aldrig en tid åt dig och skapar aldrig en deadline.
 */
export function QuickflowPlanDialog({
  open,
  title,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  onCancel: () => void;
  onConfirm: (choice: PlanChoice) => void;
}) {
  const [day, setDay] = useState<DayChoice>("idag");
  const [date, setDate] = useState(todayISO());
  const [withTime, setWithTime] = useState(false);
  const [time, setTime] = useState(nowTime());

  useEffect(() => {
    if (!open) return;
    setDay("idag");
    setDate(todayISO());
    setWithTime(false);
    setTime(nowTime());
  }, [open]);

  const pickDay = (choice: DayChoice) => {
    setDay(choice);
    if (choice === "idag") setDate(todayISO());
    if (choice === "imorgon") setDate(addDays(todayISO(), 1));
  };

  const chip = (active: boolean) =>
    cn(
      "press rounded-pill border-2 px-3 py-2 text-sm font-medium transition-colors",
      active
        ? "border-primary bg-primary/10 text-primary"
        : "border-border bg-background text-muted-foreground hover:text-foreground",
    );

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="max-h-[85dvh] max-w-md overflow-y-auto">
        <DialogHeader>
          <DialogTitle>När vill du göra den?</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="max-h-32 overflow-y-auto break-words text-sm text-muted-foreground">
            {title}
          </p>

          <div className="flex flex-wrap gap-2">
            <button type="button" className={chip(day === "idag")} onClick={() => pickDay("idag")}>
              Idag
            </button>
            <button
              type="button"
              className={chip(day === "imorgon")}
              onClick={() => pickDay("imorgon")}
            >
              Imorgon
            </button>
            <button type="button" className={chip(day === "valj")} onClick={() => pickDay("valj")}>
              Välj datum
            </button>
          </div>

          {day === "valj" && (
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-11 rounded-xl"
              aria-label="Datum"
            />
          )}

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className={chip(!withTime)}
              onClick={() => setWithTime(false)}
              aria-pressed={!withTime}
            >
              Ingen tid
            </button>
            <button
              type="button"
              className={chip(withTime)}
              onClick={() => setWithTime(true)}
              aria-pressed={withTime}
            >
              Med tid
            </button>
            {withTime && (
              <Input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="h-11 w-32 rounded-xl"
                aria-label="Tid"
              />
            )}
          </div>

          <WhyHint label="varför väljer du själv?">
            Flow sätter aldrig tider eller deadlines åt dig. Du bestämmer om saken bara ska ligga på
            en dag eller ha en tid.
          </WhyHint>

          <div className="flex flex-wrap gap-2">
            <Button
              className="h-11 flex-1 rounded-xl"
              onClick={() =>
                onConfirm({
                  dueDate: day === "valj" ? date || todayISO() : date,
                  time: withTime ? time : undefined,
                })
              }
            >
              Lägg i kalendern
            </Button>
            <Button variant="outline" className="h-11 rounded-xl" onClick={onCancel}>
              Avbryt
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default QuickflowPlanDialog;
