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
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [save]);
}
