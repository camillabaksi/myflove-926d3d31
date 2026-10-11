import { NativeReminderSettings } from "@/components/native-reminder-settings";
import { isNativeShell } from "@/lib/native-caps";
import { useCallback, useEffect, useState } from "react";
import { Bell, BellOff, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "@/hooks/use-toast";
import {
  pushSupported,
  subscribeUserToPush,
  unsubscribeCurrent,
  getCurrentSubscription,
  notifyPushSubscriptionChanged,
  PUSH_SUBSCRIPTION_EVENT,
} from "@/lib/push-client";
import { playAlarmPreview } from "@/lib/push-notifications";
import {
  subscribeToPush,
  unsubscribeFromPush,
  sendTestPush,
  getPushStatus,
} from "@/lib/push.functions";

function isPreviewOrIframe(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (window.top !== window.self) return true;
    const host = window.location.hostname;
    if (host.startsWith("id-preview--") || host.startsWith("preview--")) return true;
    if (host.endsWith(".lovableproject.com") || host.endsWith(".lovableproject-dev.com"))
      return true;
    if (host === "localhost" || host === "127.0.0.1") return true;
  } catch {
    return false;
  }
  return false;
}

function isIosLike(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  return /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && "ontouchend" in document);
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const nav = navigator as Navigator & { standalone?: boolean };
  return window.matchMedia?.("(display-mode: standalone)").matches || nav.standalone === true;
}

/**
 * Lugn statusruta för notiser: visar om just den här enheten kan ta emot
 * påminnelser (Morgonstart, rutiner, medicin) och låter användaren testa.
 */
export function PushStatusCard({ className = "" }: { className?: string }) {
  return isNativeShell() ? (
    <NativeReminderSettings className={className} />
  ) : (
    <WebPushStatusCard className={className} />
  );
}

function WebPushStatusCard({ className = "" }: { className?: string }) {
  const subscribeFn = useServerFn(subscribeToPush);
  const unsubscribeFn = useServerFn(unsubscribeFromPush);
  const testFn = useServerFn(sendTestPush);
  const statusFn = useServerFn(getPushStatus);

  const [supported, setSupported] = useState<boolean | null>(null);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");
  const [registered, setRegistered] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [inPreview, setInPreview] = useState(false);

  const refresh = useCallback(async () => {
    const ok = pushSupported();
    setSupported(ok);
    setPermission(typeof Notification === "undefined" ? "unsupported" : Notification.permission);
    if (!ok) {
      setRegistered(false);
      return;
    }
    try {
      const sub = await getCurrentSubscription();
      if (!sub) {
        setRegistered(false);
        return;
      }
      const status = (await statusFn()) as { endpoints: string[] };
      setRegistered(status.endpoints.includes(sub.endpoint));
    } catch {
      setRegistered(false);
    }
  }, [statusFn]);

  useEffect(() => {
    setInPreview(isPreviewOrIframe());
    void refresh();
    const onVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    window.addEventListener(PUSH_SUBSCRIPTION_EVENT, refresh);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener(PUSH_SUBSCRIPTION_EVENT, refresh);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refresh]);

  const enable = async () => {
    setBusy(true);
    try {
      const sub = await subscribeUserToPush();
      setPermission(typeof Notification === "undefined" ? "unsupported" : Notification.permission);
      if (!sub) {
        toast({
          title: "Notiser är inte påslagna",
          description:
            "För att få påminnelser från Paceable behöver notiser vara aktiverade i telefonens inställningar för Paceable.",
        });
        return;
      }
      await subscribeFn({
        data: {
          ...sub,
          userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
        },
      });
      notifyPushSubscriptionChanged();
      await refresh();
      toast({ title: "Notiser är på 🌿", description: "Den här enheten kan nu ta emot notiser." });
    } catch (err) {
      console.error(err);
      toast({
        title: "Det gick inte just nu",
        description: "Försök igen om en liten stund.",
      });
    } finally {
      setBusy(false);
    }
  };

  const disable = async () => {
    setBusy(true);
    try {
      const endpoint = await unsubscribeCurrent();
      if (endpoint) await unsubscribeFn({ data: { endpoint } });
      await refresh();
      toast({ title: "Notiser avstängda" });
    } catch (err) {
      console.error(err);
    } finally {
      setBusy(false);
    }
  };

  const test = async () => {
    setBusy(true);
    try {
      const res = (await testFn()) as { sent: number };
      toast({
        title: res.sent > 0 ? "Testnotis skickad" : "Ingen enhet att skicka till",
        description:
          res.sent > 0
            ? "Den bör dyka upp inom några sekunder. Kommer den inte fram är notiser troligen avstängda för Paceable i telefonens inställningar."
            : "Slå på notiser här först, så kan vi testa.",
      });
    } catch {
      toast({ title: "Kunde inte skicka testnotisen", description: "Försök igen om en stund." });
    } finally {
      setBusy(false);
    }
  };

  const wrap = `space-y-3 rounded-2xl bg-card p-4 ${className}`;

  if (supported === false) {
    return (
      <div className={wrap}>
        <p className="font-medium text-foreground">Notiser</p>
        <p className="text-sm text-muted-foreground">
          {isNativeShell() ? (
            "I Paceable-appen kan telefonen inte visa notiser ännu. Påminnelser du själv lagt in hörs bara medan appen är öppen."
          ) : (
            <>
              Den här webbläsaren kan inte visa notiser. På iPhone: öppna Paceable i Safari, välj
              Dela → <em>Lägg till på hemskärmen</em>, och öppna appen från ikonen.
            </>
          )}
        </p>
      </div>
    );
  }

  if (inPreview) {
    return (
      <div className={wrap}>
        <p className="font-medium text-foreground">Notiser testas i den riktiga appen</p>
        <p className="text-sm text-muted-foreground">
          Här i förhandsvisningen kan telefonen inte ta emot notiser. Öppna{" "}
          <a
            href="https://myflove.lovable.app"
            className="underline"
            target="_blank"
            rel="noreferrer"
          >
            myflove.lovable.app
          </a>{" "}
          och slå på notiser där.
        </p>
      </div>
    );
  }

  const iosNeedsInstall = isIosLike() && !isStandalone();

  return (
    <div className={wrap}>
      <div>
        <p className="font-medium text-foreground">Notiser på den här enheten</p>
        <p className="text-sm text-muted-foreground">
          {registered === null
            ? "Kollar…"
            : registered && permission === "granted"
              ? "Klart – du får påminnelser även när appen är stängd."
              : permission === "denied"
                ? "För att få påminnelser från Paceable behöver notiser vara aktiverade. Slå på dem för Paceable i telefonens inställningar och kom tillbaka hit."
                : "För att få påminnelser från Paceable behöver notiser vara aktiverade på den här enheten."}
        </p>
      </div>

      {iosNeedsInstall && (
        <p className="text-sm text-muted-foreground">
          På iPhone behöver Paceable ligga på hemskärmen för att notiser ska fungera: Dela →{" "}
          <em>Lägg till på hemskärmen</em>, öppna sedan appen från ikonen.
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant={registered ? "outline" : "default"}
          onClick={registered ? disable : enable}
          disabled={busy || supported === null}
          className="gap-2"
        >
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : registered ? (
            <BellOff className="h-4 w-4" />
          ) : (
            <Bell className="h-4 w-4" />
          )}
          {registered ? "Stäng av notiser" : "Aktivera notiser"}
        </Button>
        <Button variant="outline" onClick={test} disabled={busy || !registered} className="gap-2">
          <Send className="h-4 w-4" />
          Testa notis
        </Button>
        <Button variant="outline" onClick={() => playAlarmPreview()} className="gap-2">
          Testa appens ljud
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Appens alarmljud spelas när appen är öppen. Bakgrundsnotisens ljud styrs av telefonen eller
        datorn. Tillåt notisljud där och kontrollera tyst läge och Stör ej. Strömsparläge kan
        fördröja notiser.
      </p>
    </div>
  );
}

export default PushStatusCard;
