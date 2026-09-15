import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Sun, Volume2, VolumeX, X } from "lucide-react";
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
const BREATH_OUT = 6;

/** Texten som visas just nu – en inbjudan, aldrig ett krav. */
function gentleLine(elapsed: number): string {
  if (elapsed < 8) return "Följ ljuset";
  if (elapsed >= 26 && elapsed < 38) return "Du behöver inte göra något just nu.";
  const inCycle = elapsed % (BREATH_IN + BREATH_OUT);
  return inCycle < BREATH_IN ? "Andas in …" : "Andas ut …";
}

/**
 * Ljusboost – en sensorisk paus, inte ljusterapi.
 * En nästan skärmfyllande strand vid solnedgång med långsamma vågor,
 * varmt ljus och ett mjukt havsljud man själv startar.
 */
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
  const wakeRef = useRef<WakeLockSentinel | null>(null);

  const stopSound = useCallback(() => {
    soundRef.current?.stop();
    soundRef.current = null;
  }, []);

  const releaseWakeLock = useCallback(() => {
    void wakeRef.current?.release().catch(() => {});
    wakeRef.current = null;
  }, []);

  // Städa alltid upp när upplevelsen stängs.
  useEffect(() => {
    if (open) return;
    setPhase("intro");
    setElapsed(0);
    stopSound();
    releaseWakeLock();
    resumeReminders();
  }, [open, releaseWakeLock, stopSound]);

  useEffect(() => () => {
    stopSound();
    releaseWakeLock();
  }, [releaseWakeLock, stopSound]);

  // Tidräkning under upplevelsen.
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
    if (phase === "checkin") {
      stopSound();
      releaseWakeLock();
    }
  }, [phase, releaseWakeLock, stopSound]);

  if (!open || typeof document === "undefined") return null;

  const start = () => {
    haptic("soft");
    setElapsed(0);
    setPhase("running");
    // Påminnelser får vila under pausen, precis som i Akut Lugn.
    pauseRemindersFor(Math.max(2, Math.ceil(seconds / 60)));
    if (soundOn) soundRef.current = playOceanSound();
    // Skärmen ska helst inte släckas – men bara om webbläsaren tillåter det.
    const nav = navigator as Navigator & {
      wakeLock?: { request: (type: "screen") => Promise<WakeLockSentinel> };
    };
    void nav.wakeLock
      ?.request("screen")
      .then((lock) => {
        wakeRef.current = lock;
      })
      .catch(() => {});
  };

  const toggleSound = () => {
    if (soundOn) {
      stopSound();
      setSoundOn(false);
      return;
    }
    setSoundOn(true);
    if (phase === "running") soundRef.current = playOceanSound();
  };

  const close = () => {
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
      className={`fixed inset-0 z-[110] overflow-hidden ${reduced ? "lb-still" : ""}`}
      style={{ background: "linear-gradient(180deg, #2b1b47 0%, #7b3f6b 34%, #e5744a 64%, #f7a85c 78%, #2f2450 100%)" }}
    >
      {/* Himmel och sol */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div
          className="lb-sun absolute left-1/2 top-[34%] size-[42vmin] -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            background: "radial-gradient(circle, #fff3c4 0%, #ffd27a 38%, #ff9f52 62%, rgba(255,150,80,0) 72%)",
            filter: "blur(0.5px)",
            boxShadow: "0 0 24vmin 8vmin rgba(255,170,90,0.35)",
          }}
        />
        {/* Hav */}
        <div
          className="absolute inset-x-0 bottom-0 h-[46%]"
          style={{ background: "linear-gradient(180deg, #e78a52 0%, #a4527a 28%, #4b2c60 66%, #241a3c 100%)" }}
        >
          {/* Solglitter på vattnet */}
          <div
            className="lb-glitter absolute left-1/2 top-0 h-full w-[34vmin] -translate-x-1/2"
            style={{
              background:
                "linear-gradient(180deg, rgba(255,226,160,0.85) 0%, rgba(255,196,120,0.4) 40%, rgba(255,180,110,0.06) 100%)",
              filter: "blur(6px)",
            }}
          />
          <div
            className="lb-wave absolute inset-x-[-20%] top-[26%] h-[14%] rounded-[50%]"
            style={{ background: "rgba(255,214,160,0.18)", filter: "blur(10px)" }}
          />
          <div
            className="lb-wave-slow absolute inset-x-[-20%] top-[52%] h-[16%] rounded-[50%]"
            style={{ background: "rgba(255,190,150,0.14)", filter: "blur(14px)" }}
          />
          <div
            className="lb-wave absolute inset-x-[-20%] bottom-[6%] h-[18%] rounded-[50%]"
            style={{ background: "rgba(255,240,215,0.1)", filter: "blur(16px)" }}
          />
        </div>
        {/* Den lilla detaljen som blicken fastnar på */}
        <svg
          className="lb-bird absolute left-0 top-[22%] h-[3.2vmin] w-[6vmin]"
          viewBox="0 0 40 16"
          fill="none"
          stroke="rgba(60,30,60,0.55)"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <path d="M2 10 C 8 2, 14 2, 20 9" />
          <path d="M20 9 C 26 2, 32 2, 38 10" />
        </svg>
      </div>

      {/* Innehåll */}
      <div className="relative flex h-full w-full flex-col items-center justify-between px-5 py-8 text-center">
        <div className="flex w-full items-start justify-between">
          <span className="text-xs font-semibold text-[#fff3dd]/70">
            {phase === "running" ? "Ljusboost" : ""}
          </span>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={toggleSound}
              aria-label={soundOn ? "Stäng av havsljudet" : "Slå på havsljudet"}
              className="rounded-full text-[#fff3dd] hover:bg-white/15 hover:text-[#fff3dd]"
            >
              {soundOn ? <Volume2 aria-hidden /> : <VolumeX aria-hidden />}
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={close}
              aria-label="Avsluta Ljusboost"
              className="rounded-full text-[#fff3dd] hover:bg-white/15 hover:text-[#fff3dd]"
            >
              <X aria-hidden />
            </Button>
          </div>
        </div>

        {phase === "intro" && (
          <div className="mx-auto w-full max-w-sm rounded-3xl bg-black/25 p-5 backdrop-blur-sm">
            <p className="font-display text-xl font-bold text-[#fff6e6]">Ljusboost</p>
            <p className="mt-2 text-sm leading-relaxed text-[#fff6e6]/85">
              En liten dörr ut till stranden. Varmt ljus, långsamma vågor och havsljud – bara om du
              vill.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {LENGTHS.map((item) => (
                <button
                  key={item.seconds}
                  type="button"
                  onClick={() => setSeconds(item.seconds)}
                  aria-pressed={seconds === item.seconds}
                  className={`min-h-10 rounded-full px-4 text-sm font-medium transition-colors ${
                    seconds === item.seconds
                      ? "bg-[#fff3dd] text-[#4b2c60]"
                      : "bg-white/15 text-[#fff6e6]"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <Button
              type="button"
              onClick={start}
              className="mt-5 min-h-12 w-full rounded-2xl bg-[#fff3dd] text-base font-semibold text-[#4b2c60] hover:bg-[#fff3dd]/90"
            >
              <Sun aria-hidden /> Starta upplevelsen
            </Button>
            <p className="mt-3 text-xs text-[#fff6e6]/70">
              En sensorisk paus – ingen ljusterapi eller behandling.
            </p>
          </div>
        )}

        {phase === "running" && (
          <p
            aria-live="polite"
            className="max-w-xs text-base font-medium text-[#fff6e6] drop-shadow-[0_2px_10px_rgba(60,20,60,0.5)] transition-opacity duration-1000 sm:text-lg"
          >
            {line}
          </p>
        )}

        {phase === "checkin" && (
          <div className="mx-auto w-full max-w-sm rounded-3xl bg-black/30 p-5 backdrop-blur-sm">
            <p className="font-display text-xl font-bold text-[#fff6e6]">Lite mer landad?</p>
            <div className="mt-4 space-y-2">
              <Button
                type="button"
                onClick={close}
                className="min-h-12 w-full rounded-2xl bg-[#fff3dd] text-base font-semibold text-[#4b2c60] hover:bg-[#fff3dd]/90"
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
                className="min-h-12 w-full rounded-2xl border border-white/30 text-[#fff6e6] hover:bg-white/15 hover:text-[#fff6e6]"
              >
                Nej, jag behöver mer paus
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={close}
                className="min-h-11 w-full rounded-2xl text-sm text-[#fff6e6]/80 hover:bg-white/10 hover:text-[#fff6e6]"
              >
                Tillbaka till min dag
              </Button>
            </div>
          </div>
        )}

        <span className="lb-spark block size-2 rounded-full bg-[#fff3dd]/80 shadow-[0_0_18px_6px_rgba(255,220,160,0.45)]" />
      </div>
    </div>,
    document.body,
  );
}
