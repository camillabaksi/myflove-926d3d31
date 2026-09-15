import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Sun, Volume2, VolumeX, X } from "lucide-react";
import beachPoster from "@/assets/light-boost-beach.jpg";
import beachVideoAsset from "@/assets/light-boost-beach-loop.mp4.asset.json";
import { Button } from "@/components/ui/button";
import { useReducedMotion } from "@/components/myflove/motion";
import { haptic } from "@/lib/haptics";
import { playOceanSound, type OceanSoundHandle } from "@/lib/ocean-sound";
import { pauseRemindersFor, resumeReminders } from "@/lib/quiet-mode";

type Phase = "intro" | "running" | "checkin";

const LENGTHS: { seconds: number; label: string }[] = [
  { seconds: 90, label: "90 sek" },
  { seconds: 300, label: "5 min" },
  { seconds: 600, label: "10 min" },
  { seconds: 900, label: "15 min" },
];

const BREATH_IN = 4;
const BREATH_PAUSE = 2;
const BREATH_OUT = 6;
const BREATH_CYCLE = BREATH_IN + BREATH_PAUSE + BREATH_OUT;

function gentleLine(elapsed: number): string {
  if (elapsed < 6) return "Följ ljuset";
  if (elapsed >= 30 && elapsed < 39) return "Du behöver inte göra något just nu.";
  if (elapsed >= 45) return "";

  const inCycle = (elapsed - 6) % BREATH_CYCLE;
  if (inCycle < BREATH_IN) return "Andas in …";
  if (inCycle < BREATH_IN + BREATH_PAUSE) return "";
  return "Andas ut …";
}

function formatRemaining(value: number): string {
  const minutes = Math.floor(value / 60);
  const seconds = value % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

/** Ljusboost är en sensorisk strandpaus, inte ljusterapi. */
export default function LightBoost({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const reduced = useReducedMotion();
  const [phase, setPhase] = useState<Phase>("intro");
  const [seconds, setSeconds] = useState(90);
  const [elapsed, setElapsed] = useState(0);
  const [soundOn, setSoundOn] = useState(true);
  const soundRef = useRef<OceanSoundHandle | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const wakeRef = useRef<WakeLockSentinel | null>(null);

  const stopSound = useCallback(() => {
    soundRef.current?.stop();
    soundRef.current = null;
  }, []);

  const releaseWakeLock = useCallback(() => {
    void wakeRef.current?.release().catch(() => {});
    wakeRef.current = null;
  }, []);

  const requestWakeLock = useCallback(() => {
    const nav = navigator as Navigator & {
      wakeLock?: { request: (type: "screen") => Promise<WakeLockSentinel> };
    };
    void nav.wakeLock
      ?.request("screen")
      .then((lock) => {
        wakeRef.current = lock;
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (open) return;
    setPhase("intro");
    setElapsed(0);
    videoRef.current?.pause();
    stopSound();
    releaseWakeLock();
    resumeReminders();
  }, [open, releaseWakeLock, stopSound]);

  useEffect(
    () => () => {
      stopSound();
      releaseWakeLock();
    },
    [releaseWakeLock, stopSound],
  );

  useEffect(() => {
    if (phase !== "running") return;
    const id = window.setInterval(() => {
      setElapsed((value) => {
        const next = value + 1;
        if (next >= seconds) {
          setPhase("checkin");
          return seconds;
        }
        return next;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [phase, seconds]);

  useEffect(() => {
    if (phase !== "checkin") return;
    videoRef.current?.pause();
    stopSound();
    releaseWakeLock();
  }, [phase, releaseWakeLock, stopSound]);

  useEffect(() => {
    if (phase !== "running") return;
    const resumeWakeLock = () => {
      if (document.visibilityState === "visible" && !wakeRef.current) requestWakeLock();
    };
    document.addEventListener("visibilitychange", resumeWakeLock);
    return () => document.removeEventListener("visibilitychange", resumeWakeLock);
  }, [phase, requestWakeLock]);

  if (!open || typeof document === "undefined") return null;

  const start = () => {
    haptic("soft");
    setElapsed(0);
    setPhase("running");
    pauseRemindersFor(Math.max(2, Math.ceil(seconds / 60)));
    if (soundOn) soundRef.current = playOceanSound({ volume: 0.2 });
    if (!reduced) void videoRef.current?.play().catch(() => {});
    requestWakeLock();
  };

  const toggleSound = () => {
    if (soundOn) {
      stopSound();
      setSoundOn(false);
      return;
    }
    setSoundOn(true);
    if (phase === "running") soundRef.current = playOceanSound({ volume: 0.2 });
  };

  const close = () => {
    videoRef.current?.pause();
    stopSound();
    releaseWakeLock();
    resumeReminders();
    onOpenChange(false);
  };

  const line = gentleLine(elapsed);

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Ljusboost"
      className={`light-boost-scene fixed inset-0 z-[110] overflow-hidden bg-foreground ${reduced ? "lb-still" : ""}`}
    >
      <img
        src={beachPoster}
        width={1080}
        height={1920}
        alt="En stilla strand och ett varmt hav i solnedgång"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <video
        ref={videoRef}
        src={beachVideoAsset.url}
        poster={beachPoster}
        muted
        loop
        playsInline
        preload="metadata"
        aria-hidden="true"
        className="lb-beach-video absolute inset-0 h-full w-full object-cover"
      />

      <div aria-hidden className="lb-scene-shade absolute inset-0" />
      {phase === "running" && (
        <>
          <div aria-hidden className="lb-breath-warmth absolute inset-0" />
          <div aria-hidden className="lb-sun-glow absolute left-1/2 top-[39%] size-[34vmin] -translate-x-1/2 -translate-y-1/2 rounded-full" />
          <span aria-hidden className="lb-water-light absolute left-[49%] top-[54%] block size-1.5 rounded-full" />
        </>
      )}

      <div className="relative flex h-full w-full flex-col items-center justify-between px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1.25rem,env(safe-area-inset-top))] text-center">
        <div className="flex w-full items-center justify-between">
          <span className="min-w-16 text-left text-xs font-semibold text-cream/80">
            {phase === "running" ? formatRemaining(seconds - elapsed) : ""}
          </span>
          <span className="text-xs font-semibold text-cream/85">Ljusboost</span>
          <div className="flex min-w-16 justify-end gap-1">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={toggleSound}
              aria-label={soundOn ? "Stäng av havsljudet" : "Slå på havsljudet"}
              className="rounded-full bg-foreground/20 text-cream backdrop-blur-sm hover:bg-foreground/35 hover:text-cream"
            >
              {soundOn ? <Volume2 aria-hidden /> : <VolumeX aria-hidden />}
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={close}
              aria-label="Avsluta Ljusboost"
              className="rounded-full bg-foreground/20 text-cream backdrop-blur-sm hover:bg-foreground/35 hover:text-cream"
            >
              <X aria-hidden />
            </Button>
          </div>
        </div>

        {phase === "intro" && (
          <div className="mx-auto w-full max-w-sm rounded-3xl bg-foreground/55 p-5 text-cream shadow-lifted backdrop-blur-md">
            <p className="font-display text-xl font-bold">Ljusboost</p>
            <p className="mt-2 text-sm leading-relaxed text-cream/85">
              Välj en stund vid havet. Ljudet börjar först när du startar.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {LENGTHS.map((item) => (
                <Button
                  key={item.seconds}
                  type="button"
                  size="sm"
                  variant={seconds === item.seconds ? "secondary" : "ghost"}
                  onClick={() => setSeconds(item.seconds)}
                  aria-pressed={seconds === item.seconds}
                  className="rounded-full border border-cream/25 text-cream hover:bg-cream/15 hover:text-cream data-[state=active]:text-foreground"
                >
                  {item.label}
                </Button>
              ))}
            </div>
            <Button type="button" onClick={start} variant="secondary" className="mt-5 min-h-12 w-full rounded-2xl text-base font-semibold">
              <Sun aria-hidden /> Starta upplevelsen
            </Button>
            <p className="mt-3 text-xs text-cream/70">En sensorisk paus – ingen ljusterapi eller behandling.</p>
          </div>
        )}

        {phase === "running" && (
          <p
            aria-live="polite"
            className={`mb-[16vh] max-w-xs rounded-full bg-foreground/18 px-5 py-2 text-base font-medium text-cream shadow-float backdrop-blur-sm transition-opacity duration-1000 sm:text-lg ${line ? "opacity-100" : "opacity-0"}`}
          >
            {line || "Lugn strandpaus"}
          </p>
        )}

        {phase === "checkin" && (
          <div className="mx-auto w-full max-w-sm rounded-3xl bg-foreground/60 p-5 text-cream shadow-lifted backdrop-blur-md">
            <p className="font-display text-xl font-bold">Lite mer landad?</p>
            <div className="mt-4 space-y-2">
              <Button type="button" variant="secondary" onClick={close} className="min-h-12 w-full rounded-2xl text-base font-semibold">
                Ja, lite bättre
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setElapsed(0);
                  setPhase("intro");
                }}
                className="min-h-12 w-full rounded-2xl border border-cream/30 text-cream hover:bg-cream/15 hover:text-cream"
              >
                Nej, jag behöver mer paus
              </Button>
              <Button type="button" variant="ghost" onClick={close} className="min-h-11 w-full rounded-2xl text-sm text-cream/80 hover:bg-cream/10 hover:text-cream">
                Tillbaka till min dag
              </Button>
            </div>
          </div>
        )}

        {phase !== "running" && <span aria-hidden className="h-2" />}
      </div>
    </div>,
    document.body,
  );
}