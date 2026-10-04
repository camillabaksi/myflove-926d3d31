import { isNativeShell } from "@/lib/native-caps";
import { useEffect, useState } from "react";
import { Bell, BellOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "@/hooks/use-toast";
import {
  pushSupported,
  subscribeUserToPush,
  unsubscribeCurrent,
  getCurrentSubscription,
} from "@/lib/push-client";
import { subscribeToPush, unsubscribeFromPush, sendTestPush } from "@/lib/push.functions";

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

export function EnablePushButton() {
  const subscribeFn = useServerFn(subscribeToPush);
  const unsubscribeFn = useServerFn(unsubscribeFromPush);
  const testFn = useServerFn(sendTestPush);

  const [supported, setSupported] = useState<boolean | null>(null);
  const [enabled, setEnabled] = useState<boolean>(false);
  const [busy, setBusy] = useState(false);
  const [inPreview, setInPreview] = useState(false);

  useEffect(() => {
    let alive = true;
    setInPreview(isPreviewOrIframe());
    (async () => {
      const ok = pushSupported();
      if (!alive) return;
      setSupported(ok);
      if (!ok) return;
      const sub = await getCurrentSubscription();
      if (!alive) return;
      setEnabled(!!sub && Notification.permission === "granted");
    })();
    return () => {
      alive = false;
    };
  }, []);

  if (supported === false) {
    return (
      <div className="rounded-2xl bg-card p-4 text-sm text-muted-foreground">
        {isNativeShell()
          ? "I MyFlove-appen kan telefonen inte visa notiser ännu. Påminnelser du själv lagt in hörs bara medan appen är öppen."
          : "Din webbläsare stödjer inte push-notiser. Installera MyFlove på hemskärmen (iPhone: Dela → Lägg till på hemskärmen) och öppna sedan igen."}
      </div>
    );
  }

  if (inPreview) {
    return (
      <div className="rounded-2xl bg-card p-4 text-sm text-muted-foreground space-y-2">
        <p className="font-medium text-foreground">Notiser funkar inte i förhandsvisningen</p>
        <p>
          Öppna den publicerade appen på{" "}
          <a
            href="https://myflove.lovable.app"
            className="underline"
            target="_blank"
            rel="noreferrer"
          >
            myflove.lovable.app
          </a>{" "}
          och aktivera notiser därifrån. På iPhone: Safari → Dela → <em>Lägg till på hemskärmen</em>
          , öppna appen från ikonen, och tryck sedan Aktivera notiser.
        </p>
      </div>
    );
  }

  const enable = async () => {
    setBusy(true);
    try {
      const sub = await subscribeUserToPush();
      if (!sub) {
        toast({
          title: "Kunde inte aktivera",
          description:
            "Vi fick inte lov att skicka notiser. Kolla webbläsarens inställningar och att appen är installerad på hemskärmen (iPhone).",
        });
        return;
      }
      await subscribeFn({
        data: {
          ...sub,
          userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
        },
      });
      const res = await testFn();
      setEnabled(true);
      toast({
        title: "Notiser är på 🌿",
        description:
          res.sent > 0 ? "Vi skickade en testnotis." : "Sparat. Testnotisen kommer strax.",
      });
    } catch (err) {
      console.error(err);
      toast({ title: "Något gick fel", description: String((err as Error).message ?? err) });
    } finally {
      setBusy(false);
    }
  };

  const disable = async () => {
    setBusy(true);
    try {
      const endpoint = await unsubscribeCurrent();
      if (endpoint) await unsubscribeFn({ data: { endpoint } });
      setEnabled(false);
      toast({ title: "Notiser avstängda" });
    } catch (err) {
      console.error(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button
      variant={enabled ? "outline" : "default"}
      onClick={enabled ? disable : enable}
      disabled={busy || supported === null}
      className="gap-2"
    >
      {busy ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : enabled ? (
        <BellOff className="h-4 w-4" />
      ) : (
        <Bell className="h-4 w-4" />
      )}
      {enabled ? "Stäng av notiser" : "Aktivera notiser"}
    </Button>
  );
}
