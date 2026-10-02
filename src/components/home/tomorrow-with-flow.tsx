import { useMemo, useState } from "react";
import { Bell, Briefcase, Check, Footprints, Link2, MapPin, Moon, Plus, Sprout, Sun, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useReminders, useTasks } from "@/hooks/use-data";
import { useQuickflow } from "@/hooks/use-quickflow";
import { useCalendarConnection, useExternalEvents } from "@/hooks/use-calendar-sync";
import { useCloudSyncedStorage } from "@/lib/cloud-storage";
import { useLang } from "@/hooks/use-language";
import { addDaysISO, todayISO } from "@/lib/day";
import { track } from "@/lib/analytics";
import {
  EVENING_PREP_CHIPS,
  eventPlace,
  hasMeetingLink,
  isOnlineMeeting,
  mentionsTomorrow,
  quickflowReminderText,
  sortEvents,
  suggestFromEvents,
  travelHint,
  type TomorrowEvent,
} from "@/lib/tomorrow-prep";

/** Visas från 18 och framåt. */
export function isTomorrowPrepHour(hour: number): boolean {
  return hour >= 18;
}

type Step = "kalender" | "forbered" | "klart";

/**
 * Imorgon med Flow – kvällens förberedelse. Frågar aldrig om morgondagens
 * energi; den känns efter på morgonen via kapacitetsvalet.
 */
export default function TomorrowWithFlow() {
  const { t } = useLang();
  const today = todayISO();
  const tomorrow = addDaysISO(today, 1);
  const [doneOn, setDoneOn] = useCloudSyncedStorage<string>("myflove-tomorrow-prepared", "");
  const [dismissedOn, setDismissedOn] = useState("");
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("kalender");
  const [handled, setHandled] = useState<Set<string>>(new Set());
  const [added, setAdded] = useState<string[]>([]);
  const [custom, setCustom] = useState("");
  const [remindAt, setRemindAt] = useState("20:30");

  const { reminders, addReminder } = useReminders();
  const { tasks } = useTasks();
  const { openItems } = useQuickflow();
  const { anyConnected } = useCalendarConnection();
  const external = useExternalEvents(tomorrow, tomorrow, open && anyConnected);

  const events = useMemo<TomorrowEvent[]>(() => {
    const list: TomorrowEvent[] = [];
    for (const r of reminders) {
      if (r.completed || r.canceled) continue;
      const inRange = r.date === tomorrow || (r.endDate && r.date <= tomorrow && r.endDate >= tomorrow);
      if (inRange && r.repeat === "none") list.push({ id: `r-${r.id}`, title: r.title, time: r.time, endTime: r.endTime, note: r.note });
    }
    for (const task of tasks) {
      if (!task.completed && task.dueDate === tomorrow && task.time) {
        list.push({ id: `t-${task.id}`, title: task.title, time: task.time, endTime: task.endTime, note: task.note });
      }
    }
    for (const e of external.data?.events ?? []) {
      if (e.date === tomorrow) list.push({ id: `e-${e.id}`, title: e.title, time: e.time, endTime: e.endTime, allDay: e.allDay });
    }
    return sortEvents(list);
  }, [reminders, tasks, external.data, tomorrow]);

  const suggestions = useMemo(() => {
    const fromCal = suggestFromEvents(events);
    const fromQf = openItems
      .filter((i) => mentionsTomorrow(i.text))
      .map((i) => ({ id: `qf-${i.id}`, text: quickflowReminderText(i.text), source: "QuickFlow" }));
    return [...fromQf, ...fromCal];
  }, [events, openItems]);
  const travel = useMemo(() => events.map(travelHint).filter((x) => x !== null), [events]);

  if (!isTomorrowPrepHour(new Date().getHours()) || dismissedOn === today) return null;

  const addPrep = (text: string) => {
    const title = text.trim();
    if (!title || added.includes(title)) return;
    addReminder(title, today, remindAt, "none", undefined, 0, t("Inför imorgon"), "vardag");
    setAdded((a) => [...a, title]);
  };
  const handle = (id: string, text?: string) => {
    if (text) addPrep(text);
    setHandled((s) => new Set(s).add(id));
  };
  const finish = () => {
    setDoneOn(today);
    setStep("klart");
    track("home_widget_opened", { source: "imorgon-med-flow-klar" });
  };
  const start = () => {
    setStep("kalender");
    setOpen(true);
    track("home_widget_opened", { source: "imorgon-med-flow" });
  };

  const prepared = doneOn === today;

  return (
    <section data-testid="tomorrow-with-flow" aria-label={t("Imorgon med Flow")} className="rounded-3xl border border-border/60 bg-card p-5 shadow-soft">
      <p className="flex items-center gap-2 text-xs font-semibold uppercase text-primary">
        <Moon className="h-4 w-4" aria-hidden /> {t("Imorgon med Flow")}
      </p>
      {prepared ? (
        <>
          <p className="mt-2 font-display text-lg font-bold text-ink">{t("Morgondagen är förberedd.")}</p>
          <Button type="button" variant="ghost" size="sm" onClick={start} className="mt-2 min-h-11 rounded-full">
            {t("Titta igen")}
          </Button>
        </>
      ) : (
        <>
          <p className="mt-2 font-display text-lg font-bold leading-snug text-ink">{t("Ska vi göra morgondagen lite enklare?")}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t("Du behöver inte planera allt. Vi förbereder bara det vi redan vet.")}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button type="button" onClick={start} className="min-h-12 flex-1 rounded-full text-base font-semibold sm:flex-none sm:px-8">
              {t("Ja, förbered imorgon")}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setDismissedOn(today)} className="min-h-12 rounded-full text-muted-foreground">
              {t("Inte nu")}
            </Button>
          </div>
        </>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto rounded-3xl">
          {step === "kalender" && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2"><Sun className="h-5 w-5 text-primary" aria-hidden /> {t("Imorgon")}</DialogTitle>
                <DialogDescription>{t("Det här vet vi redan om morgondagen.")}</DialogDescription>
              </DialogHeader>
              {events.length === 0 ? (
                <p className="rounded-2xl bg-secondary/50 p-4 text-sm text-ink">{t("Inget inbokat imorgon. Det får vara en lugn dag.")}</p>
              ) : (
                <ul className="space-y-2">
                  {events.slice(0, 6).map((e) => {
                    const place = eventPlace(e);
                    return (
                      <li key={e.id} className="rounded-2xl bg-secondary/40 p-3">
                        <p className="text-xs font-semibold text-primary">
                          {e.allDay || !e.time ? t("Hela dagen") : e.endTime ? `${e.time}–${e.endTime}` : e.time}
                        </p>
                        <p className="font-semibold text-ink">{e.title}</p>
                        {place && <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3 w-3" aria-hidden />{place}</p>}
                        {hasMeetingLink(e) ? (
                          <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground"><Link2 className="h-3 w-3" aria-hidden />{t("Möteslänk finns sparad")}</p>
                        ) : isOnlineMeeting(e) ? (
                          <p className="mt-0.5 text-xs text-muted-foreground">{t("Digitalt möte")}</p>
                        ) : null}
                      </li>
                    );
                  })}
                  {events.length > 6 && <li className="text-center text-xs text-muted-foreground">{`+${events.length - 6} ${t("till i kalendern")}`}</li>}
                </ul>
              )}
              {travel.map((h) => (
                <p key={h.eventId} className="flex gap-2 rounded-2xl border border-border/60 p-3 text-sm text-ink">
                  <Footprints className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                  <span>{`${t("För att hinna till")} ${h.title} ${t("behöver du ungefär börja åka")} ${h.leaveAt}.`}</span>
                </p>
              ))}
              <Button type="button" onClick={() => setStep("forbered")} className="min-h-12 w-full rounded-full text-base font-semibold">
                {t("Vidare")}
              </Button>
            </>
          )}

          {step === "forbered" && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2"><Briefcase className="h-5 w-5 text-primary" aria-hidden /> {t("Inför imorgon")}</DialogTitle>
                <DialogDescription>{t("Bara förslag. Hoppa över allt som inte passar.")}</DialogDescription>
              </DialogHeader>

              {suggestions.filter((s) => !handled.has(s.id)).slice(0, 4).map((s) => (
                <div key={s.id} className="flex items-center gap-2 rounded-2xl bg-secondary/40 p-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-ink">{s.text}</p>
                    <p className="truncate text-xs text-muted-foreground">{`${t("Från")} ${s.source}`}</p>
                  </div>
                  <Button type="button" size="icon" aria-label={t("Lägg till")} onClick={() => handle(s.id, s.text)} className="h-11 w-11 shrink-0 rounded-full"><Check className="h-4 w-4" /></Button>
                  <Button type="button" size="icon" variant="ghost" aria-label={t("Hoppa över")} onClick={() => handle(s.id)} className="h-11 w-11 shrink-0 rounded-full"><X className="h-4 w-4" /></Button>
                </div>
              ))}

              <div className="flex flex-wrap gap-2">
                {EVENING_PREP_CHIPS.map((c) => (
                  <button key={c} type="button" onClick={() => addPrep(t(c))} aria-pressed={added.includes(t(c))}
                    className="min-h-11 rounded-full border border-border bg-background px-4 text-sm text-ink aria-pressed:border-primary aria-pressed:bg-primary/10">
                    {added.includes(t(c)) && <Check className="mr-1 inline h-3.5 w-3.5 text-primary" aria-hidden />}{t(c)}
                  </button>
                ))}
              </div>
              <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); addPrep(custom); setCustom(""); }}>
                <input value={custom} onChange={(e) => setCustom(e.target.value)} placeholder={t("Något annat…")}
                  className="min-h-11 min-w-0 flex-1 rounded-2xl border border-border bg-background px-3 text-sm text-ink" />
                <Button type="submit" size="icon" aria-label={t("Lägg till")} className="h-11 w-11 shrink-0 rounded-full"><Plus className="h-4 w-4" /></Button>
              </form>
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <Bell className="h-4 w-4 text-primary" aria-hidden /> {t("Påminn mig ikväll kl")}
                <input type="time" value={remindAt} onChange={(e) => setRemindAt(e.target.value)} className="rounded-xl border border-border bg-background px-2 py-1 text-ink" />
              </label>
              {added.length > 0 && <p className="text-xs text-muted-foreground">{`${added.length} ${t("sparade som kvällspåminnelse")}`}</p>}

              <div className="flex gap-2 rounded-2xl bg-secondary/50 p-3 text-sm text-ink">
                <Sprout className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                <p>{t("Vi vet inte hur du kommer känna dig imorgon – och det behöver vi inte heller veta. Vi förbereder det vi kan och känner efter när dagen börjar.")}</p>
              </div>
              <Button type="button" onClick={finish} className="min-h-12 w-full rounded-full text-base font-semibold">{t("Klart")}</Button>
            </>
          )}

          {step === "klart" && (
            <div className="py-6 text-center">
              <div className="tomorrow-lamp mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                <Moon className="h-9 w-9 text-primary" aria-hidden />
              </div>
              <DialogTitle className="mt-4 font-display text-xl">{t("Klart.")}</DialogTitle>
              <DialogDescription className="mt-2 text-base text-ink">{t("Morgondagen är förberedd.")}</DialogDescription>
              <p className="mt-2 text-sm text-muted-foreground">{t("Du behöver inte hålla allt i huvudet inatt. Flow har koll.")}</p>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="mt-4 min-h-11 rounded-full">{t("God natt")}</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
