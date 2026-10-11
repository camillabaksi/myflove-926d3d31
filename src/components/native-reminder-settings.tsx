import { useCallback, useEffect, useState } from "react";
import { Bell, BellOff, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { playAlarmPreview } from "@/lib/push-notifications";
import {
  getNativeReminderStatus,
  enableNativeReminders,
  disableNativeReminders,
  requestNativeExactTimes,
  testNativeReminder,
  NATIVE_REMINDERS_EVENT,
  type NativeReminderStatus,
} from "@/lib/native-reminders";

export function NativeReminderSettings({
  className = "",
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  const [status, setStatus] = useState<NativeReminderStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const refresh = useCallback(async () => {
    try {
      setStatus(await getNativeReminderStatus());
      setError(false);
    } catch {
      setError(true);
    }
  }, []);
  useEffect(() => {
    void refresh();
    window.addEventListener(NATIVE_REMINDERS_EVENT, refresh);
    return () => window.removeEventListener(NATIVE_REMINDERS_EVENT, refresh);
  }, [refresh]);
  const act = async (operation: () => Promise<unknown>) => {
    setBusy(true);
    try {
      await operation();
      await refresh();
    } catch (err) {
      toast({
        title: "Det gick inte just nu",
        description: err instanceof Error ? err.message : "Försök igen om en stund.",
      });
    } finally {
      setBusy(false);
    }
  };
  const ready = status?.enabled && status.permission === "granted" && status.exact;
  if (status && !status.supported)
    return (
      <div className={`space-y-2 rounded-2xl bg-card p-4 ${className}`}>
        <p className="font-medium">Uppdatera Paceable</p>
        <p className="text-sm text-muted-foreground">
          Den här appversionen saknar stöd för påminnelser när appen är stängd. Installera den nya
          Android- eller TestFlight-versionen när den är tillgänglig.
        </p>
      </div>
    );
  return (
    <div className={`${compact ? "space-y-2" : "space-y-3 rounded-2xl bg-card p-4"} ${className}`}>
      {!compact && <p className="font-medium">Notiser på den här telefonen</p>}
      <p className="text-sm text-muted-foreground" role="status">
        {error
          ? "Kunde inte kontrollera telefonens notiser. Försök igen."
          : !status
            ? "Kollar…"
            : status.permission === "denied"
              ? "Tillåt notiser för Paceable i telefonens inställningar och öppna appen igen."
              : status.enabled && !status.exact
                ? "Tillåt exakta tider så att telefonen kan schemalägga dina påminnelser."
                : ready
                  ? "Notiser är på. Schemalagda påminnelser kan visas även när appen är stängd."
                  : "Slå på notiser för dina påminnelser, även när appen är stängd."}
      </p>
      <div className="flex flex-wrap gap-2">
        <Button
          className="min-h-11 gap-2"
          variant={status?.enabled ? "outline" : "default"}
          disabled={busy || !status}
          onClick={() => void act(status?.enabled ? disableNativeReminders : enableNativeReminders)}
        >
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : status?.enabled ? (
            <BellOff className="h-4 w-4" />
          ) : (
            <Bell className="h-4 w-4" />
          )}
          {status?.enabled ? "Stäng av notiser" : "Aktivera notiser"}
        </Button>
        {status?.enabled && !status.exact && (
          <Button
            variant="outline"
            className="min-h-11"
            disabled={busy}
            onClick={() => void act(requestNativeExactTimes)}
          >
            Tillåt exakta tider
          </Button>
        )}
        {!compact && (
          <>
            <Button
              variant="outline"
              className="min-h-11 gap-2"
              disabled={busy || !ready}
              onClick={() =>
                void act(async () => {
                  const scheduled = await testNativeReminder();
                  toast({
                    title: scheduled ? "Testnotis om 10 sekunder" : "Kunde inte schemalägga",
                    description: scheduled
                      ? "Lås skärmen för att testa telefonens notis och ditt valda ljud."
                      : "Kontrollera att notiser och exakta tider är på.",
                  });
                })
              }
            >
              <Send className="h-4 w-4" />
              Testa notis
            </Button>
            <Button variant="outline" className="min-h-11" onClick={() => playAlarmPreview()}>
              Testa appens ljud
            </Button>
          </>
        )}
        {error && (
          <Button variant="outline" className="min-h-11" onClick={() => void refresh()}>
            Försök igen
          </Button>
        )}
      </div>
      {!compact && (
        <p className="text-sm text-muted-foreground">
          Telefonen håller upp till 60 kommande påminnelser redo. Öppna mobilappen för att fylla på
          kön och efter ändringar på en annan enhet. Telefonens ljudläge och Fokus/Stör ej gäller
          även här.
        </p>
      )}
    </div>
  );
}
