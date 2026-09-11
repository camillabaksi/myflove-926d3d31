import { useEffect, useRef, useState } from "react";
import Layout from "@/components/layout";
import { MyFlovePageGrid, MyFloveWide } from "@/components/myflove/block";
import { useReducedMotion } from "@/components/myflove/motion";
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw, Brain, Coffee, Minus, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

import { useCloudSyncedStorage } from "@/lib/cloud-storage";
import { sendPushNotification } from "@/lib/push-notifications";
import { track } from "@/lib/analytics";
import { todayISO } from "@/lib/day";

type Mode = "work" | "break";

interface PomodoroPrefs {
  workMinutes: number;
  breakMinutes: number;
}

function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function todayStr(): string {
  return todayISO();
}

export default function Pomodoro() {
  const { toast } = useToast();
  const [prefs, setPrefs] = useCloudSyncedStorage<PomodoroPrefs>("myflow-pomodoro-prefs", {
    workMinutes: 25,
    breakMinutes: 5,
  });
  const [sessionLog, setSessionLog] = useCloudSyncedStorage<{ date: string; count: number }>(
    "myflow-pomodoro-sessions",
    { date: todayStr(), count: 0 },
  );
  const [totalSessions, setTotalSessions] = useCloudSyncedStorage<number>(
    "myflow-pomodoro-total-sessions",
    0,
  );

  const [mode, setMode] = useState<Mode>("work");
  const [secondsLeft, setSecondsLeft] = useState(prefs.workMinutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const reduced = useReducedMotion();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const todaysSessions = sessionLog.date === todayStr() ? sessionLog.count : 0;

  useEffect(() => {
    if (!isRunning) return;
    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning]);

  useEffect(() => {
    if (secondsLeft !== 0 || !isRunning) return;

    if (mode === "work") {
      const date = todayStr();
      setSessionLog((prev) =>
        prev.date === date ? { date, count: prev.count + 1 } : { date, count: 1 },
      );
      setTotalSessions((prev) => prev + 1);
      track("focus_completed", { source: "pomodoro" });
      toast({ description: "Bra jobbat! Dags för en paus 🌿" });
      sendPushNotification("Fokuspasset är klart", { body: "Dags för en paus." });
      setMode("break");
      setSecondsLeft(prefs.breakMinutes * 60);
    } else {
      toast({ description: "Pausen är slut. Redo att fokusera igen? 💪" });
      sendPushNotification("Pausen är slut", { body: "Redo att fokusera igen?" });
      setMode("work");
      setSecondsLeft(prefs.workMinutes * 60);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft, isRunning]);

  const toggleRunning = () => setIsRunning((r) => !r);

  const reset = () => {
    setIsRunning(false);
    setMode("work");
    setSecondsLeft(prefs.workMinutes * 60);
  };

  const adjustDuration = (field: keyof PomodoroPrefs, delta: number) => {
    if (isRunning) return;
    setPrefs((prev) => {
      const next = Math.max(1, Math.min(90, prev[field] + delta));
      const updated = { ...prev, [field]: next };
      if (
        (field === "workMinutes" && mode === "work") ||
        (field === "breakMinutes" && mode === "break")
      ) {
        setSecondsLeft(next * 60);
      }
      return updated;
    });
  };

  const totalSeconds = (mode === "work" ? prefs.workMinutes : prefs.breakMinutes) * 60;
  const progress = totalSeconds > 0 ? 1 - secondsLeft / totalSeconds : 0;
  const circumference = 2 * Math.PI * 90;

  return (
    <Layout>
      <MyFlovePageGrid area="flow">
        <MyFloveWide>
          <div className="space-y-8">
            <div>
              <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl mb-2">Pomodoro-timer</h1>
              <p className="text-muted-foreground">
                Jobba i korta pass med tydliga pauser emellan.
              </p>
            </div>

            <div className="bg-card p-6 md:p-8 rounded-3xl shadow-sm border border-border flex flex-col items-center gap-6">
              <div className="flex items-center gap-2">
                <span
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${
                    mode === "work"
                      ? "bg-primary/10 text-primary"
                      : "bg-accent/60 text-accent-foreground"
                  }`}
                >
                  {mode === "work" ? <Brain size={16} /> : <Coffee size={16} />}
                  {mode === "work" ? "Fokuspass" : "Paus"}
                </span>
              </div>

              <div className="relative w-56 h-56 flex items-center justify-center">
                {isRunning && !reduced && (
                  <span
                    aria-hidden
                    data-motion="living"
                    className="absolute inset-8 rounded-full bg-primary/10 breathe"
                    style={{ animationDuration: mode === "work" ? "6s" : "8s" }}
                  />
                )}
                <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
                  <circle
                    cx="100"
                    cy="100"
                    r="90"
                    fill="none"
                    stroke="var(--secondary)"
                    strokeWidth="12"
                  />
                  <circle
                    cx="100"
                    cy="100"
                    r="90"
                    fill="none"
                    stroke="var(--primary)"
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference * (1 - progress)}
                    className="transition-all duration-1000 ease-linear"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-5xl font-bold tabular-nums">{formatTime(secondsLeft)}</span>
                  <span className="text-sm text-muted-foreground mt-1">
                    {todaysSessions > 0 ? `${todaysSessions} pass idag` : "Inga pass idag än"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={reset}
                  className="w-12 h-12 rounded-full bg-secondary text-muted-foreground flex items-center justify-center hover:bg-secondary/70 transition-colors"
                  aria-label="Nollställ"
                >
                  <RotateCcw size={20} />
                </button>
                <Button
                  onClick={toggleRunning}
                  className="w-20 h-20 rounded-full text-lg shadow-sm"
                >
                  {isRunning ? <Pause size={28} /> : <Play size={28} className="ml-1" />}
                </Button>
                <div className="w-12 h-12" />
              </div>

              {!isRunning && (
                <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,9rem),1fr))] gap-6 w-full pt-2 animate-in fade-in">
                  <div className="flex flex-col items-center gap-2">
                    <p className="text-sm text-muted-foreground">Fokus (min)</p>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => adjustDuration("workMinutes", -5)}
                        className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/70"
                      >
                        <Minus size={16} />
                      </button>
                      <span className="w-8 text-center font-medium">{prefs.workMinutes}</span>
                      <button
                        type="button"
                        onClick={() => adjustDuration("workMinutes", 5)}
                        className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/70"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <p className="text-sm text-muted-foreground">Paus (min)</p>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => adjustDuration("breakMinutes", -1)}
                        className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/70"
                      >
                        <Minus size={16} />
                      </button>
                      <span className="w-8 text-center font-medium">{prefs.breakMinutes}</span>
                      <button
                        type="button"
                        onClick={() => adjustDuration("breakMinutes", 1)}
                        className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/70"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </MyFloveWide>
      </MyFlovePageGrid>
    </Layout>
  );
}
