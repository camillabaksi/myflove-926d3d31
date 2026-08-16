import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Link } from "wouter";
import { ArrowRight, Brain, ChevronRight, Sparkles, Timer, Zap } from "lucide-react";
import { toast } from "sonner";
import FocusMode from "@/components/focus-mode";
import { useTasks } from "@/hooks/use-data";
import { useDailyCheckin, useFlowUsage } from "@/hooks/use-daily-flow";
import { useFlowScore } from "@/hooks/use-flowscore";
import { celebrate } from "@/lib/celebrate";
import {
  FRICTION_LABEL,
  PRIORITY_DOT,
  TIME_META,
  checkinSummary,
  recommendTasks,
  suggestedTaskCount,
  todayISO,
  type ScoredTask,
  type TimeAvailability,
} from "@/lib/daily-flow";

const SCALE = [1, 2, 3, 4, 5];

/**
 * Daily Flow – dagens incheckning, dagens fokus och "Vad ska jag göra nu?".
 * Allt bygger på befintliga uppgifter, kalender och FlowScore.
 */
export default function DailyFlowCard() {
  const { activeTasks, toggleTask, snoozeTask } = useTasks();
  const { checkin, save } = useDailyCheckin();
  const { log } = useFlowUsage();
  const { flow, minutesLeft } = useFlowScore();

  const [energy, setEnergy] = useState<number | null>(null);
  const [load, setLoad] = useState<number | null>(null);
  const [time, setTime] = useState<TimeAvailability | null>(null);

  const [nowOpen, setNowOpen] = useState(false);
  const [nowIndex, setNowIndex] = useState(0);
  const [focusItem, setFocusItem] = useState<ScoredTask | null>(null);
  const [focusOpen, setFocusOpen] = useState(false);

  const planTasks = useMemo(
    () =>
      activeTasks.filter(
        (t) => !t.syncKey?.includes(":exam:") && !t.syncKey?.includes(":revision:"),
      ),
    [activeTasks],
  );

  const ctx = useMemo(() => {
    const e = checkin?.energy ?? 3;
    const l = checkin?.load ?? 3;
    const available = checkin
      ? Math.min(TIME_META[checkin.time].minutes, Math.max(20, minutesLeft))
      : Math.max(20, Math.min(minutesLeft, 90));
    return {
      energy: e,
      load: l,
      availableMinutes: available,
      maxFriction: flow.maxFriction,
      today: todayISO(),
    };
  }, [checkin, minutesLeft, flow.maxFriction]);

  const limit = checkin
    ? suggestedTaskCount({ energy: checkin.energy, load: checkin.load, time: checkin.time })
    : 3;

  const ranked = useMemo(() => recommendTasks(planTasks, ctx, 8), [planTasks, ctx]);
  const top = ranked.slice(0, Math.max(1, limit));
  const nowPick = ranked[nowIndex] ?? null;

  const startFocus = (item: ScoredTask) => {
    setFocusItem(item);
    setFocusOpen(true);
    setNowOpen(false);
    log("fokus");
  };

  const handleDone = (item: ScoredTask) => {
    if (!item.task.completed) toggleTask(item.task.id);
  };

  const nextRecommended = () => {
    const rest = ranked.filter((r) => r.task.id !== focusItem?.task.id);
    if (rest[0]) startFocus(rest[0]);
  };

  return (
    <div className="space-y-4">
      {/* ── Incheckning ───────────────────────────────── */}
      {!checkin ? (
        <div className="surface-card p-5 space-y-5">
          <div className="space-y-1">
            <p className="text-lg font-semibold text-ink">Hur mycket har du på din tallrik idag?</p>
            <p className="text-sm text-muted-foreground">
              Tre snabba val. Sen anpassar jag dagens förslag efter dig.
            </p>
          </div>

          <Row label="⚡ Energi">
            {SCALE.map((n) => (
              <Chip key={n} active={energy === n} onClick={() => setEnergy(n)}>
                {n}
              </Chip>
            ))}
          </Row>

          <Row label="🧠 Mental belastning">
            {SCALE.map((n) => (
              <Chip key={n} active={load === n} onClick={() => setLoad(n)}>
                {n}
              </Chip>
            ))}
          </Row>

          <Row label="⏰ Tillgänglig tid">
            {(Object.keys(TIME_META) as TimeAvailability[]).map((t) => (
              <Chip key={t} active={time === t} onClick={() => setTime(t)} wide>
                {TIME_META[t].label}
              </Chip>
            ))}
          </Row>

          <button
            type="button"
            disabled={!energy || !load || !time}
            onClick={() => {
              if (!energy || !load || !time) return;
              save({ energy, load, time });
              log("planering");
              toast.success("Tack. Jag anpassar dagen efter det. 💙");
            }}
            className="w-full rounded-2xl bg-primary text-primary-foreground py-3.5 font-semibold disabled:opacity-40"
          >
            Visa min dag i Flow
          </button>
        </div>
      ) : (
        <div
          className="relative overflow-hidden rounded-3xl border border-border/60 p-5 shadow-soft pop-in"
          style={{
            background:
              "linear-gradient(135deg, hsl(var(--lavender)) 0%, hsl(var(--cream)) 60%, hsl(var(--blush) / 0.8) 100%)",
          }}
        >
          <div className="pointer-events-none absolute -right-2 bottom-0 text-6xl breathe select-none" aria-hidden>
            💜
          </div>
          <div className="relative space-y-3 pr-16">
            <div className="flex items-center justify-between gap-2">
              <p className="font-display text-base font-bold text-ink">Din kapacitet idag</p>
              <button
                type="button"
                onClick={() => {
                  setEnergy(null);
                  setLoad(null);
                  setTime(null);
                  save({ energy: checkin.energy, load: checkin.load, time: checkin.time });
                  toast("Ändra genom att välja nytt nedan.");
                }}
                className="text-xs font-medium text-primary underline underline-offset-2"
              >
                Redigera
              </button>
            </div>
            <Meter label="Energi" icon="⚡" value={checkin.energy} tone="bg-primary" />
            <Meter label="Belastning" icon="🧠" value={checkin.load} tone="bg-terracotta" />
            <p className="text-xs text-muted-foreground">
              ⏰ {TIME_META[checkin.time].label} tid · {checkinSummary(checkin)}
            </p>
          </div>
        </div>
      )}


      {/* ── Vad ska jag göra nu? ──────────────────────── */}
      <button
        type="button"
        onClick={() => {
          setNowIndex(0);
          setNowOpen(true);
        }}
        className="w-full rounded-3xl border-2 border-primary/40 bg-primary/5 px-5 py-4 text-left hover:border-primary hover:shadow-lifted transition-all active:scale-[0.99]"
      >
        <span className="flex items-center gap-3">
          <span className="w-11 h-11 rounded-full bg-primary/15 text-primary flex items-center justify-center shrink-0">
            <Brain size={22} />
          </span>
          <span className="flex-1">
            <span className="block text-lg font-semibold text-ink">Vad ska jag göra nu?</span>
            <span className="block text-sm text-muted-foreground">
              Jag väljer en sak åt dig – du bestämmer ändå själv.
            </span>
          </span>
        </span>
      </button>

      {/* ── Ditt fokus idag ───────────────────────────── */}
      <div className="rounded-3xl border border-border/60 bg-card p-4 shadow-soft space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-primary" />
          <h3 className="font-display font-bold text-ink">Ditt fokus idag</h3>
        </div>

        {top.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Du har inget planerat just nu. Vill du dumpa något i QuickFlow?
          </p>
        ) : (
          <>
            <div className="space-y-1">
              {top.map((item, i) => {
                const tone = FOCUS_TONES[i % FOCUS_TONES.length]!;
                return (
                  <button
                    key={item.task.id}
                    type="button"
                    onClick={() => startFocus(item)}
                    className="press flex w-full items-center gap-3 rounded-2xl p-2 text-left transition-colors hover:bg-secondary/50"
                  >
                    <span
                      className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-bold ${tone.bg} ${tone.text}`}
                    >
                      {i + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold text-ink">{item.task.title}</span>
                      <span className="block text-xs text-muted-foreground">
                        {item.minutes} min · {PRIORITY_DOT[item.priority]} {item.priority} prioritet ·{" "}
                        {FRICTION_LABEL(item.friction)}
                      </span>
                    </span>
                    <ChevronRight size={16} className="shrink-0 text-muted-foreground" />
                  </button>
                );
              })}
            </div>
            <Link
              href="/tasks"
              className="flex items-center justify-center gap-1 pt-1 text-sm font-semibold text-primary"
            >
              Se hela dagen <ArrowRight size={14} />
            </Link>
            <button
              type="button"
              onClick={() => top[0] && startFocus(top[0])}
              className="press flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 font-semibold text-primary-foreground"
            >
              <Zap size={18} /> Starta mitt Flow
            </button>
          </>
        )}

      </div>

      {/* ── Rekommendation ────────────────────────────── */}
      <Dialog open={nowOpen} onOpenChange={setNowOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle>Vad ska jag göra nu?</DialogTitle>
          </DialogHeader>

          {!nowPick ? (
            <p className="text-sm text-muted-foreground py-4">
              Det finns inget att välja mellan just nu. Perfekt. 🧠
            </p>
          ) : (
            <div className="space-y-5 py-1">
              <p className="text-sm text-muted-foreground">
                Du har ungefär {ctx.availableMinutes} minuter.
              </p>
              <div className="rounded-2xl border border-border bg-muted/30 p-4 space-y-2">
                <p className="text-sm text-muted-foreground">Jag rekommenderar att du börjar med:</p>
                <p className="text-lg font-semibold text-ink">{nowPick.task.title}</p>
                <ul className="text-sm text-muted-foreground space-y-0.5">
                  <li className="flex items-center gap-2">
                    <Timer size={14} /> Beräknad tid: {nowPick.minutes} minuter
                  </li>
                  <li>Friktion: {nowPick.friction}/10</li>
                  <li>Prioritet: {nowPick.priority}</li>
                </ul>
                <p className="text-sm text-ink/80">{nowPick.why}</p>
              </div>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => startFocus(nowPick)}
                  className="w-full rounded-2xl bg-primary text-primary-foreground py-3.5 font-semibold"
                >
                  Börja nu
                </button>
                <button
                  type="button"
                  onClick={() => setNowIndex((i) => (i + 1) % Math.max(1, ranked.length))}
                  className="w-full rounded-2xl border border-border py-3 font-medium"
                >
                  Välj något annat
                </button>
                <button
                  type="button"
                  onClick={() => {
                    snoozeTask(nowPick.task.id, 1);
                    toast("Okej – jag tar upp den en annan dag.");
                    setNowOpen(false);
                  }}
                  className="w-full rounded-2xl py-3 text-sm text-muted-foreground"
                >
                  Inte idag
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <FocusMode
        item={focusItem}
        open={focusOpen}
        onOpenChange={setFocusOpen}
        onDone={(item) => {
          handleDone(item);
          celebrate();
        }}
        onNext={nextRecommended}
      />
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-ink">{label}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
  wide,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`${wide ? "px-5" : "w-12"} h-12 rounded-2xl border text-base font-semibold transition-colors ${
        active
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-card border-border text-ink hover:border-primary/50"
      }`}
    >
      {children}
    </button>
  );
}
