import { useEffect, useRef } from "react";
import { useServerFn } from "@tanstack/react-start";
import { subscribeToPush } from "@/lib/push.functions";
import { refreshPushSubscription, notifyPushSubscriptionChanged } from "@/lib/push-client";

const LAST_KEY = "myflove-push-last-endpoint";

/**
 * Håller push-prenumerationen färsk.
 *
 * Webbläsare kan byta ut prenumerationens nycklar utan att säga till. Då
 * accepterar pushtjänsten fortfarande utskicket, men telefonen kan inte
 * avkryptera det – och notisen syns aldrig när appen är stängd.
 * Därför synkar vi endpoint + nycklar mot servern varje gång appen öppnas.
 */
export function usePushSubscriptionSync(): void {
  const save = useServerFn(subscribeToPush);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const sync = async () => {
      try {
        if (typeof window === "undefined") return;
        if (!("Notification" in window) || Notification.permission !== "granted") return;
        const sub = await refreshPushSubscription();
        if (!sub) return;
        await save({
          data: {
            ...sub,
            userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
          },
        });
        notifyPushSubscriptionChanged();
        window.localStorage.setItem(LAST_KEY, sub.endpoint);
      } catch (err) {
        console.error("[push] sync failed", err);
      }
    };

    void sync();
    const onVisible = () => {
      if (document.visibilityState === "visible") void sync();
    };
    document.addEventListener("visibilitychange", onVisible);
    const onWorkerMessage = (event: MessageEvent<unknown>) => {
      const value = event.data;
      if (
        typeof value === "object" &&
        value !== null &&
        "type" in value &&
        value.type === "myflove-push-renewal-needed"
      )
        void sync();
    };
    navigator.serviceWorker?.addEventListener("message", onWorkerMessage);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      navigator.serviceWorker?.removeEventListener("message", onWorkerMessage);
    };
  }, [save]);
}
