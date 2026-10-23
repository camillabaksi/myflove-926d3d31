import { useEffect, useState } from "react";
import { Cloud, CloudOff, RefreshCw, ShieldAlert } from "lucide-react";
import { flushCloudSync, useCloudSyncStatus, type CloudSyncStatus } from "@/lib/cloud-storage";
import { SECURE_STATUS_EVENT, getSecureStatus, type SecureStatus } from "@/lib/secure-local";
import { Button } from "@/components/ui/button";

/** Väntar synken längre än så här visas det – kortare blinkningar döljs. */
const PENDING_DELAY_MS = 3000;
const SAVED_VISIBLE_MS = 2000;

/**
 * Diskret rad om synkläget: "Sparat", "Väntar på synk" eller "Behöver
 * försökas igen", plus ett besked om känsliga uppgifter inte kan sparas
 * säkert på enheten. Syns bara när det finns något att säga.
 */
export function SyncStatusNote() {
  const status = useCloudSyncStatus();
  const [shown, setShown] = useState<CloudSyncStatus | "idle">("idle");
  const [secure, setSecure] = useState<SecureStatus>(() => getSecureStatus());

  useEffect(() => {
    const onStatus = () => setSecure(getSecureStatus());
    window.addEventListener(SECURE_STATUS_EVENT, onStatus);
    return () => window.removeEventListener(SECURE_STATUS_EVENT, onStatus);
  }, []);

  useEffect(() => {
    if (status === "error") {
      setShown("error");
      return;
    }
    if (status === "pending") {
      // A retry is no longer a failed attempt; do not keep a stale error visible.
      setShown("idle");
      const t = setTimeout(() => setShown("pending"), PENDING_DELAY_MS);
      return () => clearTimeout(t);
    }
    // saved
    setShown((prev) => (prev === "pending" || prev === "error" ? "saved" : prev));
    const t = setTimeout(() => setShown("idle"), SAVED_VISIBLE_MS);
    return () => clearTimeout(t);
  }, [status]);

  const insecure = secure === "unavailable" || secure === "error";
  if (shown === "idle" && !insecure) return null;

  return (
    <div className="flex flex-col gap-1 px-4 pt-2" aria-live="polite" data-testid="sync-status-note">
      {shown !== "idle" && (
        <p role={shown === "error" ? "alert" : "status"} className="flex min-w-0 flex-wrap items-center justify-center gap-x-1.5 gap-y-0 text-xs text-muted-foreground">
          {shown === "saved" && (
            <>
              <Cloud className="h-3.5 w-3.5" aria-hidden /> Sparat
            </>
          )}
          {shown === "pending" && (
            <>
              <CloudOff className="h-3.5 w-3.5 shrink-0" aria-hidden /> {insecure ? "Väntar på molnsynk – behåll appen öppen" : "Sparat på enheten – väntar på synk"}
            </>
          )}
          {shown === "error" && (
            <>
              <span className="inline-flex min-w-0 items-start gap-1.5"><RefreshCw className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden /><span>Molnsynken misslyckades.</span></span>
              <Button
                type="button"
                variant="link"
                size="sm"
                onClick={() => void flushCloudSync()}
                className="min-h-11 shrink-0 px-2 font-semibold"
              >
                Försök igen
              </Button>
            </>
          )}
        </p>
      )}
      {insecure && (
        <p className="flex items-start gap-1.5 rounded-2xl border border-border/60 bg-card/80 px-3 py-2 text-xs text-muted-foreground">
          <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
          <span>
            Den här enheten kan just nu inte spara energi, mående, medicin och ekonomi säkert.
            Det du skriver finns kvar medan appen är öppen och sparas i ditt konto när du är
            uppkopplad.
          </span>
        </p>
      )}
    </div>
  );
}
