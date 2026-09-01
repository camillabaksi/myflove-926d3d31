import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import WhyHint from "@/components/why-hint";
import { todayISO, nowTime } from "@/lib/task-agenda";
import { cn } from "@/lib/utils";

export interface PlanChoice {
  dueDate: string;
  time?: string;
  /** Valfri signal före uppgiftens klockslag. */
  reminderMinutesBefore?: number;
}

const addDays = (iso: string, days: number) => {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + days);
  return todayISO(d);
};

type DayChoice = "idag" | "imorgon" | "valj";

const REMINDER_OPTIONS = [
  { value: "none", label: "Ingen påminnelse" },
  { value: "0", label: "Vid start" },
  { value: "10", label: "10 min innan" },
  { value: "30", label: "30 min innan" },
  { value: "60", label: "1 timme innan" },
  { value: "1440", label: "1 dag innan" },
] as const;

/**
 * "Planera den" – användaren väljer själv dag, tid och eventuell påminnelse.
 * Flow föreslår aldrig en tid eller påminnelse åt dig och skapar aldrig en deadline.
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
  const [reminder, setReminder] = useState<string>("none");

  useEffect(() => {
    if (!open) return;
    setDay("idag");
    setDate(todayISO());
    setWithTime(false);
    setTime(nowTime());
    setReminder("none");
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
          <p className="max-h-32 overflow-y-auto text-sm text-muted-foreground">{title}</p>

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
              onClick={() => {
                setWithTime(false);
                setReminder("none");
              }}
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

          {withTime && (
            <label className="block space-y-1.5 text-sm">
              <span className="font-medium text-foreground">Egen påminnelse</span>
              <Select value={reminder} onValueChange={setReminder}>
                <SelectTrigger aria-label="Påminnelse" className="h-11 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REMINDER_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="block text-xs text-muted-foreground">
                Signalen gäller bara den här QuickFlow-uppgiften.
              </span>
            </label>
          )}

          <WhyHint label="varför väljer du själv?">
            Flow sätter aldrig tider, deadlines eller påminnelser åt dig. Du bestämmer om saken bara
            ska ligga på en dag, ha en tid eller även ge en egen signal.
          </WhyHint>

          <div className="flex flex-wrap gap-2">
            <Button
              className="h-11 flex-1 rounded-xl"
              onClick={() =>
                onConfirm({
                  dueDate: day === "valj" ? date || todayISO() : date,
                  time: withTime ? time : undefined,
                  reminderMinutesBefore:
                    withTime && reminder !== "none" ? Number(reminder) : undefined,
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
