import { useCallback, useEffect, useState } from "react";
import { registerAppServiceWorker } from "@/lib/push-client";

/**
 * PWA-installation: riktig prompt där webbläsaren stödjer den (Chrome/Android),
 * annars en vänlig instruktion (iOS/Safari). Vi visar aldrig knappen som lyckad
 * när appen redan körs installerad.
 */

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export type PwaInstallState = {
  /** Appen körs redan i standalone-läge (installerad). */
  installed: boolean;
  /** Webbläsaren har gett oss en riktig installationsprompt. */
  canPrompt: boolean;
  /** iOS/Safari – kräver Dela → Lägg till på hemskärmen. */
  needsIosInstructions: boolean;
  /** Användaren har öppnat iOS-instruktionen. */
  showIosHelp: boolean;
  setShowIosHelp: (v: boolean) => void;
  /** Kör installationsflödet. */
  install: () => Promise<void>;
  /** true när användaren nyss accepterade prompten. */
  justInstalled: boolean;
};

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const navStandalone = (window.navigator as Navigator & { standalone?: boolean }).standalone;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches === true ||
    window.matchMedia?.("(display-mode: fullscreen)").matches === true ||
    navStandalone === true
  );
}

function isIosSafari(): boolean {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent;
  const iOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (ua.includes("Macintosh") && "ontouchend" in document); // iPadOS
  if (!iOS) return false;
  // Chrome/Firefox på iOS kan inte heller installera – samma instruktion gäller.
  return true;
}

export function usePwaInstall(): PwaInstallState {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [ios, setIos] = useState(false);
  const [showIosHelp, setShowIosHelp] = useState(false);
  const [justInstalled, setJustInstalled] = useState(false);

  useEffect(() => {
    setInstalled(isStandalone());
    setIos(isIosSafari());
    void registerAppServiceWorker();

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setDeferred(null);
      setInstalled(true);
      setJustInstalled(true);
    };
    const mql = window.matchMedia?.("(display-mode: standalone)");
    const onDisplayChange = () => setInstalled(isStandalone());

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    mql?.addEventListener?.("change", onDisplayChange);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
      mql?.removeEventListener?.("change", onDisplayChange);
    };
  }, []);

  const install = useCallback(async () => {
    if (deferred) {
      try {
        await deferred.prompt();
        const choice = await deferred.userChoice;
        if (choice.outcome === "accepted") setJustInstalled(true);
      } catch {
        // ignoreras med flit – användaren kan försöka igen
      }
      setDeferred(null);
      return;
    }
    setShowIosHelp(true);
  }, [deferred]);

  return {
    installed,
    canPrompt: !!deferred,
    needsIosInstructions: ios && !deferred,
    showIosHelp,
    setShowIosHelp,
    install,
    justInstalled,
  };
}
