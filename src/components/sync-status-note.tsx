import { useEffect, useState } from "react";
import { Cloud, CloudOff, RefreshCw, ShieldAlert } from "lucide-react";
import { flushCloudSync, useCloudSyncStatus, type CloudSyncStatus } from "@/lib/cloud-storage";
import { SECURE_STATUS_EVENT, getSecureStatus, type SecureStatus } from "@/lib/secure-local";

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
        <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          {shown === "saved" && (
            <>
              <Cloud className="h-3.5 w-3.5" aria-hidden /> Sparat
            </>
          )}
          {shown === "pending" && (
            <>
              <CloudOff className="h-3.5 w-3.5" aria-hidden /> Sparat på enheten – väntar på synk
            </>
          )}
          {shown === "error" && (
            <>
              <RefreshCw className="h-3.5 w-3.5" aria-hidden /> Kunde inte spara i molnet.
              <button
                type="button"
                onClick={() => void flushCloudSync()}
                className="font-semibold text-primary underline-offset-2 hover:underline"
              >
                Försök igen
              </button>
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
