import { useEffect, useRef, useState } from "react";
import { useUser } from "@clerk/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useLang } from "@/hooks/use-language";
import { isActiveOwner } from "@/lib/account-scope";
import { getMyWeeklyPulseFn, updateMyWeeklyPulseFn } from "@/lib/weekly-pulse.functions";
import {
  PULSE_QUESTIONS,
  pulseWeekStart,
  type PulseAnswers,
  type PulseEntry,
} from "@/lib/weekly-pulse";

export default function WeeklyPulse() {
  const { user } = useUser();
  // A new account gets a fresh component and never inherits another person's draft.
  return user ? <AccountWeeklyPulse key={user.id} ownerId={user.id} /> : null;
}

function AccountWeeklyPulse({ ownerId }: { ownerId: string }) {
  const { t } = useLang();
  const [week, setWeek] = useState(pulseWeekStart);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const trigger = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const checkWeek = () => setWeek(pulseWeekStart());
    const timer = window.setInterval(checkWeek, 30_000);
    window.addEventListener("focus", checkWeek);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", checkWeek);
    };
  }, []);
  useEffect(() => {
    setOpen(false);
    setError("");
  }, [week]);
  const query = useQuery({
    queryKey: ["weekly-pulse", ownerId, week],
    queryFn: () => getMyWeeklyPulseFn({ data: { expectedUserId: ownerId } }),
    enabled: isActiveOwner(ownerId),
    retry: false,
  });
  const entry = query.data?.entry;
  async function act(action: "open" | "dismiss") {
    if (busy || !isActiveOwner(ownerId) || week !== pulseWeekStart()) return;
    setBusy(true);
    setError("");
    try {
      await updateMyWeeklyPulseFn({ data: { expectedUserId: ownerId, weekStart: week, action } });
      if (!isActiveOwner(ownerId) || week !== pulseWeekStart()) return;
      const latest = await query.refetch({ throwOnError: true });
      if (isActiveOwner(ownerId) && latest.data?.weekStart === week && action === "open")
        setOpen(true);
    } catch {
      if (isActiveOwner(ownerId))
        setError(t("Veckopulsen kunde inte öppnas eller uppdateras. Försök igen."));
    } finally {
      setBusy(false);
    }
  }
  if (!isActiveOwner(ownerId) || query.isPending) return null;
  if (query.isError && !query.data)
    return (
      <div className="text-sm text-muted-foreground">
        <p>{t("Veckopulsen är inte tillgänglig just nu.")}</p>
        <Button
          variant="ghost"
          className="min-h-11"
          onClick={() => {
            void query.refetch();
          }}
        >
          {t("Försök igen")}
        </Button>
      </div>
    );
  const quiet = !!entry?.submitted_at || !!entry?.dismissed_at;
  return (
    <>
      {quiet ? (
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
          <p>{t(entry?.submitted_at ? "Tack för veckans svar." : "Veckopulsen kan vänta.")}</p>
          <Button
            ref={trigger}
            variant="ghost"
            className="min-h-11 whitespace-normal"
            disabled={busy}
            onClick={() => {
              void act("open");
            }}
          >
            {t(entry?.submitted_at ? "Ändra veckans svar" : "Öppna veckopulsen")}
          </Button>
        </div>
      ) : (
        <section
          aria-label={t("Frivillig veckopuls")}
          className="min-w-0 rounded-2xl border border-border/60 bg-lavender/20 p-4"
        >
          <h2 className="text-lg font-semibold">{t("Hur har veckan med Paceable känts?")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t(
              "Tre frivilliga frågor. Du hjälper oss att förstå vad som hjälper och vad som känns jobbigt.",
            )}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              ref={trigger}
              className="min-h-11 rounded-full"
              disabled={busy}
              onClick={() => {
                void act("open");
              }}
            >
              {t("Svara")}
            </Button>
            <Button
              variant="ghost"
              className="min-h-11 rounded-full"
              disabled={busy}
              onClick={() => {
                void act("dismiss");
              }}
            >
              {t("Inte nu")}
            </Button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {t(
              "När du väljer Svara sparas att veckopulsen har startats. Dina val sparas först när du skickar svaren. Inte nu pausar frågan resten av veckan.",
            )}
          </p>
        </section>
      )}
      {error && (
        <p role="alert" className="mt-2 text-sm text-destructive">
          {error}
        </p>
      )}
      {open && entry && query.data?.weekStart === week && (
        <WeeklyPulseDialog
          key={`${ownerId}:${week}`}
          ownerId={ownerId}
          weekStart={week}
          entry={entry}
          onClose={() => setOpen(false)}
          restoreFocus={() => trigger.current?.focus()}
        />
      )}
    </>
  );
}

export function WeeklyPulseDialog({
  ownerId,
  weekStart,
  entry,
  onClose,
  restoreFocus,
}: {
  ownerId: string;
  weekStart: string;
  entry: PulseEntry;
  onClose: () => void;
  restoreFocus?: () => void;
}) {
  const { t } = useLang();
  const client = useQueryClient();
  // Freeze the version the draft was based on; a background read cannot authorize an overwrite.
  const [baseline] = useState(entry);
  const [answers, setAnswers] = useState<Partial<PulseAnswers>>(() => ({
    overview: entry.overview ?? undefined,
    relief: entry.relief ?? undefined,
    burden: entry.burden ?? undefined,
  }));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirmWithdrawal, setConfirmWithdrawal] = useState(false);
  const complete = PULSE_QUESTIONS.every(
    (question) =>
      Number.isInteger(answers[question.key]) &&
      answers[question.key]! >= 1 &&
      answers[question.key]! <= 5,
  );
  async function save(action: "submit" | "withdraw") {
    if (busy || (action === "submit" && !complete)) return;
    if (!isActiveOwner(ownerId) || weekStart !== pulseWeekStart()) {
      setError(t("Kontot eller veckan har ändrats. Öppna veckopulsen igen."));
      return;
    }
    setBusy(true);
    setError("");
    try {
      const base = { expectedUserId: ownerId, weekStart, revision: baseline.revision };
      await updateMyWeeklyPulseFn({
        data:
          action === "withdraw"
            ? { ...base, action }
            : {
                ...base,
                action,
                consent: true,
                overview: answers.overview!,
                relief: answers.relief!,
                burden: answers.burden!,
              },
      });
      if (!isActiveOwner(ownerId)) return;
      await client.invalidateQueries({ queryKey: ["weekly-pulse", ownerId] });
      await client.invalidateQueries({ queryKey: ["weekly-pulse-stats"] });
      toast.success(
        t(
          action === "submit"
            ? "Tack! Dina svar är sparade."
            : "Veckans svar är borttagna från sammanställningen.",
        ),
      );
      onClose();
    } catch (cause) {
      if (isActiveOwner(ownerId))
        setError(
          cause instanceof Error ? cause.message : t("Kunde inte spara. Dina val finns kvar här."),
        );
    } finally {
      setBusy(false);
    }
  }
  return (
    <Dialog
      open
      onOpenChange={(value) => {
        if (!value && !busy) onClose();
      }}
    >
      <DialogContent
        className="grid max-h-[85dvh] max-w-[calc(100vw-1rem)] grid-rows-[auto_minmax(0,1fr)_auto] gap-0 overflow-hidden rounded-3xl bg-card p-0 pb-0 sm:max-w-lg sm:p-0 sm:pb-0"
        onCloseAutoFocus={(event) => {
          if (restoreFocus) {
            event.preventDefault();
            restoreFocus();
          }
        }}
      >
        <DialogHeader className="border-b border-border px-4 pb-4 pr-12 pt-4 text-left">
          <DialogTitle>{t("Din veckopuls")}</DialogTitle>
          <DialogDescription>
            {t("Den här veckan · tre frivilliga frågor om Paceable.")}
          </DialogDescription>
        </DialogHeader>
        <div className="min-h-0 min-w-0 space-y-5 overflow-y-auto px-5 py-4">
          <p className="text-sm text-muted-foreground">
            {t("1 = Instämmer inte alls. 5 = Instämmer helt. Det finns inga rätt eller fel svar.")}
          </p>
          {PULSE_QUESTIONS.map((question) => (
            <fieldset key={question.key} disabled={busy} className="min-w-0">
              <legend className="mb-2 text-sm font-medium">{t(question.label)}</legend>
              <div className="flex flex-wrap gap-1">
                {[1, 2, 3, 4, 5].map((value) => (
                  <label
                    key={value}
                    className={`flex min-h-11 min-w-11 flex-1 cursor-pointer items-center justify-center gap-1 rounded-xl border px-1 text-sm ${answers[question.key] === value ? "border-primary bg-lavender/40" : "border-border bg-card"}`}
                  >
                    <input
                      type="radio"
                      name={`pulse-${question.key}`}
                      value={value}
                      checked={answers[question.key] === value}
                      onChange={() =>
                        setAnswers((previous) => ({ ...previous, [question.key]: value }))
                      }
                      className="h-4 w-4 shrink-0 accent-primary"
                    />
                    <span>{value}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          ))}
          <div className="space-y-2 rounded-2xl bg-secondary/50 p-3 text-xs text-muted-foreground">
            <p>
              {t(
                "Dina inskickade svar kopplas till ditt konto så att du kan ändra dem och bara räknas en gång per vecka. I grundarens adminvy visas enbart sammanställningar utan namn.",
              )}
            </p>
            <p>
              {t(
                "När du trycker Skicka mina svar väljer du att dela de tre svaren för att förbättra Paceable. Det är frivilligt och påverkar inte din tillgång till appen. Du kan ändra eller ta bort veckans svar här.",
              )}
            </p>
          </div>
          {baseline.submitted_at && (
            <div className="text-sm">
              {confirmWithdrawal ? (
                <div className="space-y-2">
                  <p>{t("Ta bort veckans tre svar från sammanställningen?")}</p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      disabled={busy}
                      className="min-h-11 whitespace-normal"
                      onClick={() => {
                        void save("withdraw");
                      }}
                    >
                      {t("Ja, ta bort veckans svar")}
                    </Button>
                    <Button
                      variant="ghost"
                      disabled={busy}
                      className="min-h-11"
                      onClick={() => setConfirmWithdrawal(false)}
                    >
                      {t("Behåll svaren")}
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  className="min-h-11 whitespace-normal"
                  disabled={busy}
                  onClick={() => setConfirmWithdrawal(true)}
                >
                  {t("Ta bort veckans svar")}
                </Button>
              )}
            </div>
          )}
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <Button
            variant="ghost"
            disabled={busy}
            className="min-h-11 w-full whitespace-normal rounded-full"
            onClick={onClose}
          >
            {t("Stäng utan att skicka")}
          </Button>
        </div>
        <div className="space-y-1 border-t border-border bg-card p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          <Button
            disabled={!complete || busy}
            className="min-h-11 w-full whitespace-normal rounded-full"
            onClick={() => {
              void save("submit");
            }}
          >
            {t(busy ? "Sparar…" : "Skicka mina svar")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
