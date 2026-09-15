import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Sun, Volume2, VolumeX, X } from "lucide-react";
import beachPoster from "@/assets/light-boost-beach-warm.jpg";
import beachVideoMp4 from "@/assets/light-boost-beach-seamless.mp4.asset.json";
import beachVideoWebm from "@/assets/light-boost-beach-seamless.webm.asset.json";
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
        className={`light-boost-scene fixed inset-0 z-[110] overflow-hidden ${reduced ? "lb-still" : ""}`}
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
        poster={beachPoster}
        muted
        loop
        playsInline
        preload="metadata"
        aria-hidden="true"
        className="lb-beach-video absolute inset-0 h-full w-full object-cover"
      >
        <source src={beachVideoWebm.url} type="video/webm" />
        <source src={beachVideoMp4.url} type="video/mp4" />
      </video>

      <div aria-hidden className="lb-scene-shade absolute inset-0" />
      {phase === "running" && (
        <>
          <div aria-hidden className="lb-breath-warmth absolute inset-0" />
          <div
            aria-hidden
            className="lb-sun-glow absolute left-1/2 top-[41%] size-[58vmin] min-h-52 min-w-52 -translate-x-1/2 -translate-y-1/2 rounded-full"
          />
          <div
            aria-hidden
            className="lb-sun-disc absolute left-1/2 top-[41%] size-[13vmin] min-h-14 min-w-14 -translate-x-1/2 -translate-y-1/2 rounded-full"
          />
          <div aria-hidden className="lb-sun-reflection absolute left-1/2 top-[45%] h-[46%] w-[42vw] min-w-36 -translate-x-1/2" />
          <span
            aria-hidden
            className="lb-water-light absolute left-[49%] top-[57%] block size-1.5 rounded-full"
          />
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
              className="lb-control rounded-full text-cream backdrop-blur-sm hover:text-cream"
            >
              {soundOn ? <Volume2 aria-hidden /> : <VolumeX aria-hidden />}
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={close}
              aria-label="Avsluta Ljusboost"
              className="lb-control rounded-full text-cream backdrop-blur-sm hover:text-cream"
            >
              <X aria-hidden />
            </Button>
          </div>
        </div>

        {phase === "intro" && (
          <div className="lb-panel mx-auto w-full max-w-sm rounded-3xl p-5 text-cream shadow-lifted backdrop-blur-md">
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
                  variant="ghost"
                  onClick={() => setSeconds(item.seconds)}
                  aria-pressed={seconds === item.seconds}
                  className={`rounded-full border ${
                    seconds === item.seconds
                      ? "border-secondary bg-secondary text-secondary-foreground hover:bg-secondary/90 hover:text-secondary-foreground"
                      : "border-cream/25 text-cream hover:bg-cream/15 hover:text-cream"
                  }`}
                >
                  {item.label}
                </Button>
              ))}
            </div>
            <Button
              type="button"
              onClick={start}
              variant="secondary"
              className="mt-5 min-h-12 w-full rounded-2xl text-base font-semibold"
            >
              <Sun aria-hidden /> Starta upplevelsen
            </Button>
            <p className="mt-3 text-xs text-cream/70">
              En sensorisk paus – ingen ljusterapi eller behandling.
            </p>
          </div>
        )}

        {phase === "running" && (
          <div
            className={`lb-guidance relative mb-[16vh] h-10 w-full max-w-xs transition-opacity duration-1000 ${elapsed < 45 ? "opacity-100" : "opacity-0"}`}
          >
            <p aria-live="polite" className="sr-only">
              {line}
            </p>
            <span aria-hidden className="lb-follow-light absolute inset-0 flex items-center justify-center text-base font-medium text-cream sm:text-lg">
              Följ ljuset
            </span>
            <span aria-hidden className="lb-breath-in absolute inset-0 flex items-center justify-center text-base font-medium text-cream sm:text-lg">
              Andas in …
            </span>
            <span aria-hidden className="lb-breath-out absolute inset-0 flex items-center justify-center text-base font-medium text-cream sm:text-lg">
              Andas ut …
            </span>
          </div>
        )}

        {phase === "checkin" && (
          <div className="lb-panel mx-auto w-full max-w-sm rounded-3xl p-5 text-cream shadow-lifted backdrop-blur-md">
            <p className="font-display text-xl font-bold">Lite mer landad?</p>
            <div className="mt-4 space-y-2">
              <Button
                type="button"
                variant="secondary"
                onClick={close}
                className="min-h-12 w-full rounded-2xl text-base font-semibold"
              >
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
              <Button
                type="button"
                variant="ghost"
                onClick={close}
                className="min-h-11 w-full rounded-2xl text-sm text-cream/80 hover:bg-cream/10 hover:text-cream"
              >
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
