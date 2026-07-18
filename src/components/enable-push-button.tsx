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

export function EnablePushButton() {
  const subscribeFn = useServerFn(subscribeToPush);
  const unsubscribeFn = useServerFn(unsubscribeFromPush);
  const testFn = useServerFn(sendTestPush);

  const [supported, setSupported] = useState<boolean | null>(null);
  const [enabled, setEnabled] = useState<boolean>(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
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
        Din webbläsare stödjer inte push-notiser. Installera MyFlove på hemskärmen (iPhone: Dela → Lägg till på hemskärmen) och öppna sedan igen.
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
        data: { ...sub, userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined },
      });
      const res = await testFn();
      setEnabled(true);
      toast({
        title: "Notiser är på 🌿",
        description: res.sent > 0 ? "Vi skickade en testnotis." : "Sparat. Testnotisen kommer strax.",
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
