import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import Layout from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dumbbell,
  Loader2,
  Sparkles,
  Footprints,
  CheckCircle2,
  Circle,
  RefreshCw,
  Smartphone,
  AlertTriangle,
  CalendarRange,
  Target,
} from "lucide-react";
import { generateTrainingProgram } from "@/lib/training.functions";
import { useTraining, type TrainingGoal } from "@/hooks/use-training";
import { FEEDBACK_LABEL, weekStartKey, type WeekFeedback } from "@/lib/weekly-plan";
import { isHealthAppAvailable, openHealthSettings, readStepsForDays } from "@/lib/health-steps";
import {
  MOVEMENT_IDEAS,
  MOVEMENT_TAG_HUE,
  MOVEMENT_TAG_LABEL,
  movementById,
  movementOfTheDay,
} from "@/lib/everyday-movement";

import { useToast } from "@/hooks/use-toast";
import { celebrateFromEvent } from "@/lib/celebrate";


const FOCUS: { id: TrainingGoal["focus"]; label: string }[] = [
  { id: "styrka", label: "Styrka" },
  { id: "kondition", label: "Kondition" },
  { id: "blandat", label: "Blandat" },
];
const LEVELS: TrainingGoal["level"][] = ["nybörjare", "van", "erfaren"];
const LAST_SYNC_KEY = "myflove.steps.lastSync";

function formatSyncTime(stamp: number): string {
  const d = new Date(stamp);
  const diffMin = Math.round((Date.now() - stamp) / 60000);
  if (diffMin < 1) return "just nu";
  if (diffMin < 60) return `för ${diffMin} min sedan`;
  const sameDay = d.toDateString() === new Date().toDateString();
  const time = d.toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" });
  if (sameDay) return `idag ${time}`;
  return `${d.toLocaleDateString("sv-SE", { day: "numeric", month: "short" })} ${time}`;
}


const TYPE_TINT: Record<string, string> = {
  styrka: "205 45% 34%",
  kondition: "7 47% 49%",
  rörlighet: "265 32% 45%",
  vila: "152 30% 32%",
};

export default function TrainingPage() {
  const {
    state,
    saveProgram,
    clearProgram,
    toggleSessionDone,
    setSteps,
    setStepGoal,
    lastDays,
    doneToday,
    stepsToday,
    toggleMovement,
    setMovementGoal,
    movementDays,
    movementToday,
    movementGoal,
    weeklyPlan,
    weekFeedback,
    setWeekFeedback,
    regenerateWeeklyPlan,
  } = useTraining();

  const { toast } = useToast();
  const run = useServerFn(generateTrainingProgram);


  const [goal, setGoal] = useState(state.goal?.goal ?? "");
  const [focus, setFocus] = useState<TrainingGoal["focus"]>(state.goal?.focus ?? "blandat");
  const [daysPerWeek, setDaysPerWeek] = useState(state.goal?.daysPerWeek ?? 3);
  const [minutes, setMinutes] = useState(state.goal?.minutesPerSession ?? 45);
  const [level, setLevel] = useState<TrainingGoal["level"]>(state.goal?.level ?? "nybörjare");
  const [equipment, setEquipment] = useState(state.goal?.equipment ?? "");
  const [limitations, setLimitations] = useState(state.goal?.limitations ?? "");
  const [loading, setLoading] = useState(false);

  const [healthAvailable, setHealthAvailable] = useState(false);
  const [healthChecked, setHealthChecked] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [manualSteps, setManualSteps] = useState("");
  const [lastSyncAt, setLastSyncAt] = useState<number | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [syncedDays, setSyncedDays] = useState(0);

  useEffect(() => {
    const saved = Number(localStorage.getItem(LAST_SYNC_KEY));
    if (Number.isFinite(saved) && saved > 0) setLastSyncAt(saved);
  }, []);

  useEffect(() => {
    let active = true;
    isHealthAppAvailable().then((ok) => {
      if (!active) return;
      setHealthAvailable(ok);
      setHealthChecked(true);
      if (ok) syncSteps(true);
    });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const syncSteps = async (silent = false) => {
    setSyncing(true);
    setSyncError(null);
    const rows = await readStepsForDays(7);
    setSyncing(false);
    if (!rows || rows.length === 0) {
      setSyncError(
        rows
          ? "Hälsoappen svarade men innehöll inga steg för den senaste veckan."
          : "Kunde inte läsa steg. Godkänn åtkomst till steg i hälsoappen – eller fyll i stegen manuellt.",
      );
      if (!silent) {
        toast({
          title: "Hittade ingen hälsodata",
          description: "Godkänn åtkomst till steg i hälsoappen – eller fyll i steg manuellt.",
        });
        await openHealthSettings();
      }
      return;
    }
    for (const row of rows) setSteps(row.steps, row.date);
    const stamp = Date.now();
    setLastSyncAt(stamp);
    setSyncedDays(rows.length);
    localStorage.setItem(LAST_SYNC_KEY, String(stamp));
    const today = new Date().toISOString().slice(0, 10);
    const count = rows.find((r) => r.date === today)?.steps ?? rows.at(-1)?.steps ?? 0;
    if (!silent) toast({ title: "Steg hämtade", description: `${count.toLocaleString("sv-SE")} steg idag.` });
  };



  const handleGenerate = async () => {
    if (!goal.trim()) {
      toast({ title: "Berätta vad du vill", description: "Skriv ditt mål med träningen först." });
      return;
    }
    const payload: TrainingGoal = {
      goal: goal.trim(),
      focus,
      daysPerWeek,
      minutesPerSession: minutes,
      level,
      ...(equipment.trim() ? { equipment: equipment.trim() } : {}),
      ...(limitations.trim() ? { limitations: limitations.trim() } : {}),
    };
    setLoading(true);
    try {
      const program = await run({ data: payload });
      saveProgram(payload, program);
      toast({ title: "Programmet är klart", description: program.intro });
    } catch (err) {
      toast({
        title: "Det gick inte just nu",
        description: err instanceof Error ? err.message : "Försök igen om en stund.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const week = lastDays(7);
  const maxSteps = Math.max(state.stepGoal, ...week.map((d) => d.steps), 1);
  const stepPct = Math.min(100, Math.round((stepsToday / state.stepGoal) * 100));

  const todayIso = new Date().toISOString().slice(0, 10);
  const tipOfDay = movementOfTheDay(todayIso);
  const movementMinutes = movementToday.reduce((sum, id) => sum + (movementById(id)?.minutes ?? 0), 0);
  const movementPct = Math.min(100, Math.round((movementMinutes / movementGoal) * 100));
  const movementWeek = movementDays(7);
  const movementStreak = (() => {
    let n = 0;
    for (let i = movementWeek.length - 1; i >= 0; i--) {
      if ((movementWeek[i]?.ids.length ?? 0) > 0) n++;
      else break;
    }
    return n;
  })();

  const sessionsThisWeek = (() => {
    const start = weekStartKey();
    return Object.entries(state.done).reduce(
      (sum, [date, list]) => (date >= start ? sum + list.length : sum),
      0,
    );
  })();


  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        <header className="space-y-1">
          <h1 className="text-3xl font-bold text-ink flex items-center gap-2">
            <Dumbbell className="text-primary" /> Träning
          </h1>
          <p className="text-muted-foreground">
            Berätta vad du vill med träningen – Flow bygger ett program som passar din vecka.
          </p>
        </header>

        {/* Steg & hälsoapp */}
        <section className="surface-card p-5 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-ink flex items-center gap-2">
              <Footprints size={18} className="text-primary" /> Steg idag
            </h2>
            <Button variant="outline" size="sm" className="rounded-xl gap-2" onClick={() => syncSteps()} disabled={syncing}>
              {syncing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
              Hämta från hälsoappen
            </Button>
          </div>

          <div>
            <div className="flex items-end justify-between mb-2">
              <span className="text-3xl font-bold text-ink">{stepsToday.toLocaleString("sv-SE")}</span>
              <span className="text-sm text-muted-foreground">mål {state.stepGoal.toLocaleString("sv-SE")}</span>
            </div>
            <div className="h-3 rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${stepPct}%` }} />
            </div>
          </div>

          <div className="flex items-end gap-2 h-24">
            {week.map((d) => (
              <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full rounded-t-lg bg-primary/30"
                  style={{ height: `${Math.max(4, (d.steps / maxSteps) * 72)}px` }}
                  title={`${d.steps} steg`}
                />
                <span className="text-[10px] text-muted-foreground">
                  {new Date(d.date + "T00:00:00").toLocaleDateString("sv-SE", { weekday: "short" }).slice(0, 2)}
                </span>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            <Input
              type="number"
              inputMode="numeric"
              placeholder="Steg manuellt"
              value={manualSteps}
              onChange={(e) => setManualSteps(e.target.value)}
              className="w-40 rounded-xl"
            />
            <Button
              variant="secondary"
              className="rounded-xl"
              onClick={() => {
                const n = Number(manualSteps);
                if (!Number.isFinite(n) || n <= 0) return;
                setSteps(n);
                setManualSteps("");
              }}
            >
              Spara
            </Button>
            <Input
              type="number"
              inputMode="numeric"
              value={state.stepGoal}
              onChange={(e) => setStepGoal(Number(e.target.value) || 7000)}
              className="w-32 rounded-xl"
              aria-label="Stegmål"
            />
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Target size={14} /> stegmål
            </span>
          </div>

          {/* Statuspanel för stegsynk */}
          <div className="rounded-2xl border border-border/70 bg-muted/40 p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2">
                <span
                  aria-hidden
                  className={`mt-1.5 h-2.5 w-2.5 rounded-full shrink-0 ${
                    syncing
                      ? "bg-amber-500 animate-pulse"
                      : syncError
                        ? "bg-destructive"
                        : lastSyncAt
                          ? "bg-primary"
                          : "bg-muted-foreground/50"
                  }`}
                />
                <div className="space-y-0.5">
                  <p className="text-sm font-medium text-ink">
                    {syncing
                      ? "Synkar steg…"
                      : !healthChecked
                        ? "Kontrollerar hälsoapp…"
                        : healthAvailable
                          ? syncError
                            ? "Synk misslyckades"
                            : "Kopplad till hälsoappen"
                          : "Manuellt läge"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {lastSyncAt
                      ? `Senast uppdaterad ${formatSyncTime(lastSyncAt)}${syncedDays ? ` · ${syncedDays} dagar hämtade` : ""}`
                      : healthAvailable
                        ? "Ingen synk gjord ännu."
                        : "Stegen sparas från det du fyller i nedan."}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl gap-2 shrink-0"
                onClick={() => syncSteps()}
                disabled={syncing}
              >
                {syncing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                Hämta om
              </Button>
            </div>

            {syncError && (
              <div className="flex items-start gap-2 rounded-xl bg-destructive/10 p-3 text-xs text-destructive">
                <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                <div className="space-y-2">
                  <p>{syncError}</p>
                  {healthAvailable && (
                    <button
                      type="button"
                      onClick={() => void openHealthSettings()}
                      className="underline underline-offset-2 font-medium"
                    >
                      Öppna hälsoinställningar
                    </button>
                  )}
                </div>
              </div>
            )}

            {healthChecked && !healthAvailable && (
              <p className="text-xs text-muted-foreground flex items-start gap-2">
                <Smartphone size={14} className="mt-0.5 shrink-0" />
                Automatisk stegräkning läses från Apple Hälsa eller Health Connect när du använder MyFlove som app i
                mobilen. I webbläsaren fyller du i stegen själv.
              </p>
            )}
          </div>

        </section>

        {/* Veckoplan */}
        <section className="surface-card p-5 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-ink flex items-center gap-2">
                <CalendarRange size={18} className="text-primary" /> Din veckoplan
              </h2>
              <p className="text-sm text-muted-foreground">
                Målen anpassas efter vad du faktiskt gjorde – och hur veckan kändes.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl gap-2 shrink-0"
              onClick={() => {
                regenerateWeeklyPlan();
                toast({ title: "Veckoplanen är uppdaterad", description: "Målen är justerade efter din senaste vecka." });
              }}
            >
              <Sparkles size={16} /> Uppdatera
            </Button>
          </div>

          {weeklyPlan ? (
            <>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-border/70 bg-muted/40 p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Steg per dag</p>
                  <p className="text-2xl font-bold text-ink">{weeklyPlan.stepTarget.toLocaleString("sv-SE")}</p>
                  <p className="text-xs text-muted-foreground">
                    snitt förra veckan {weeklyPlan.basis.avgSteps.toLocaleString("sv-SE")}
                  </p>
                </div>
                <div className="rounded-2xl border border-border/70 bg-muted/40 p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Vardagsmotion</p>
                  <p className="text-2xl font-bold text-ink">{weeklyPlan.movementTarget} min</p>
                  <p className="text-xs text-muted-foreground">snitt förra veckan {weeklyPlan.basis.avgMovement} min</p>
                </div>
                <div className="rounded-2xl border border-border/70 bg-muted/40 p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Pass denna vecka</p>
                  <p className="text-2xl font-bold text-ink">
                    {sessionsThisWeek}/{weeklyPlan.sessionTarget}
                  </p>
                  <p className="text-xs text-muted-foreground">{weeklyPlan.basis.doneSessions} pass förra perioden</p>
                </div>
              </div>

              <div className="rounded-2xl border border-primary/25 bg-primary/5 p-4 text-sm text-ink">
                {weeklyPlan.note}
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Ingen plan ännu. Tryck på <strong>Uppdatera</strong> så bygger vi en utifrån dina senaste dagar.
            </p>
          )}

          <div className="space-y-2">
            <p className="text-sm font-medium text-ink">Hur känns nivån just nu?</p>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(FEEDBACK_LABEL) as WeekFeedback[]).map((f) => {
                const active = weekFeedback === f;
                return (
                  <Button
                    key={f}
                    type="button"
                    variant={active ? "default" : "outline"}
                    size="sm"
                    className="rounded-xl"
                    onClick={() => {
                      setWeekFeedback(f);
                      toast({
                        title: "Tack – jag justerar",
                        description: "Tryck på Uppdatera för att räkna om veckans mål.",
                      });
                    }}
                    aria-pressed={active}
                  >
                    {FEEDBACK_LABEL[f]}
                  </Button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Vardagsmotion */}

        <section className="surface-card p-5 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-ink flex items-center gap-2">
                <Footprints size={18} className="text-primary" /> Vardagsmotion
              </h2>
              <p className="text-sm text-muted-foreground">
                Allt räknas. Små rörelser flera gånger om dagen gör mer för måendet än ett perfekt pass du aldrig blir av
                med.
              </p>
            </div>
            {movementStreak > 1 && (
              <span className="shrink-0 rounded-xl bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                {movementStreak} dagar i rad
              </span>
            )}
          </div>

          <div>
            <div className="flex items-end justify-between mb-2">
              <span className="text-2xl font-bold text-ink">{movementMinutes} min idag</span>
              <span className="text-sm text-muted-foreground">mål {movementGoal} min</span>
            </div>
            <div className="h-3 rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${movementPct}%` }} />
            </div>
          </div>

          <div className="rounded-2xl border border-primary/25 bg-primary/5 p-4">
            <p className="text-xs uppercase tracking-wide text-primary">Dagens minsta möjliga steg</p>
            <p className="font-semibold text-ink">
              {tipOfDay.label} · {tipOfDay.minutes} min
            </p>
            <p className="text-sm text-muted-foreground">{tipOfDay.hint}</p>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            {MOVEMENT_IDEAS.map((m) => {
              const done = movementToday.includes(m.id);
              const hue = MOVEMENT_TAG_HUE[m.tag];
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={(e) => {
                    if (!done) celebrateFromEvent(e);
                    toggleMovement(m.id);
                  }}
                  className="rounded-2xl border p-3 text-left transition hover:opacity-90"
                  style={{
                    backgroundColor: done ? `hsl(${hue} / 0.14)` : "transparent",
                    borderColor: `hsl(${hue} / ${done ? 0.5 : 0.25})`,
                  }}
                  aria-pressed={done}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-[11px] uppercase tracking-wide" style={{ color: `hsl(${hue})` }}>
                        {MOVEMENT_TAG_LABEL[m.tag]} · {m.minutes} min
                      </div>
                      <div className="font-medium text-ink">{m.label}</div>
                      <div className="text-xs text-muted-foreground">{m.hint}</div>
                    </div>
                    {done ? (
                      <CheckCircle2 size={20} className="shrink-0 text-primary" />
                    ) : (
                      <Circle size={20} className="shrink-0 text-muted-foreground" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Input
              type="number"
              inputMode="numeric"
              value={movementGoal}
              onChange={(e) => setMovementGoal(Number(e.target.value) || 20)}
              className="w-28 rounded-xl"
              aria-label="Mål för vardagsmotion i minuter"
            />
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Target size={14} /> minuter vardagsmotion per dag
            </span>
          </div>

          <div className="flex items-end gap-2">
            {movementWeek.map((d) => {
              const mins = d.ids.reduce((s, id) => s + (movementById(id)?.minutes ?? 0), 0);
              return (
                <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full rounded-t-lg bg-primary/30"
                    style={{ height: `${Math.max(4, Math.min(1, mins / Math.max(movementGoal, 1)) * 48)}px` }}
                    title={`${mins} min`}
                  />
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(d.date + "T00:00:00").toLocaleDateString("sv-SE", { weekday: "short" }).slice(0, 2)}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Mål & generering */}

        <section className="surface-card p-5 space-y-4">
          <h2 className="text-lg font-semibold text-ink">Ditt mål</h2>
          <Input
            placeholder="T.ex. bli starkare i ryggen och orka springa 5 km"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            className="rounded-xl"
          />

          <div className="flex flex-wrap gap-2">
            {FOCUS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFocus(f.id)}
                className={`rounded-xl border px-3 py-1.5 text-sm transition ${
                  focus === f.id ? "bg-primary text-primary-foreground border-primary" : "border-border text-ink"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm text-muted-foreground">
              Dagar/vecka
              <Input
                type="number"
                min={1}
                max={7}
                value={daysPerWeek}
                onChange={(e) => setDaysPerWeek(Math.min(7, Math.max(1, Number(e.target.value) || 3)))}
                className="rounded-xl mt-1"
              />
            </label>
            <label className="text-sm text-muted-foreground">
              Minuter/pass
              <Input
                type="number"
                min={10}
                max={180}
                value={minutes}
                onChange={(e) => setMinutes(Math.min(180, Math.max(10, Number(e.target.value) || 45)))}
                className="rounded-xl mt-1"
              />
            </label>
          </div>

          <div className="flex flex-wrap gap-2">
            {LEVELS.map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLevel(l)}
                className={`rounded-xl border px-3 py-1.5 text-sm capitalize transition ${
                  level === l ? "bg-primary text-primary-foreground border-primary" : "border-border text-ink"
                }`}
              >
                {l}
              </button>
            ))}
          </div>

          <Input
            placeholder="Utrustning (gym, hantlar, inget alls…)"
            value={equipment}
            onChange={(e) => setEquipment(e.target.value)}
            className="rounded-xl"
          />
          <Input
            placeholder="Något att ta hänsyn till? (t.ex. ont i knät, låg energi)"
            value={limitations}
            onChange={(e) => setLimitations(e.target.value)}
            className="rounded-xl"
          />

          <Button onClick={handleGenerate} disabled={loading} className="rounded-xl gap-2 w-full">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            {state.program ? "Gör ett nytt program" : "Skapa mitt program"}
          </Button>
        </section>

        {/* Programmet */}
        {state.program && (
          <section className="surface-card p-5 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-ink">Din vecka</h2>
                <p className="text-sm text-muted-foreground">{state.program.intro}</p>
              </div>
              <Button variant="ghost" size="sm" className="rounded-xl" onClick={clearProgram}>
                Rensa
              </Button>
            </div>

            <ul className="space-y-3">
              {state.program.sessions.map((s, i) => {
                const done = doneToday.includes(i);
                const hue = TYPE_TINT[s.type] ?? "205 45% 34%";
                return (
                  <li
                    key={`${s.day}-${i}`}
                    className="rounded-2xl border p-4"
                    style={{ backgroundColor: `hsl(${hue} / 0.08)`, borderColor: `hsl(${hue} / 0.3)` }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-xs uppercase tracking-wide" style={{ color: `hsl(${hue})` }}>
                          {s.day} · {s.type}
                          {s.minutes ? ` · ${s.minutes} min` : ""}
                        </div>
                        <div className="font-semibold text-ink">{s.title}</div>
                      </div>
                      <button
                        type="button"
                        aria-label={done ? "Markera som ej klar" : "Markera som klar"}
                        onClick={(e) => {
                          if (!done) celebrateFromEvent(e);
                          toggleSessionDone(i);
                        }}
                        className="shrink-0 text-primary"
                      >
                        {done ? <CheckCircle2 size={22} /> : <Circle size={22} className="text-muted-foreground" />}
                      </button>
                    </div>
                    {s.exercises.length > 0 && (
                      <ul className="mt-2 space-y-1 text-sm text-ink/80">
                        {s.exercises.map((ex, j) => (
                          <li key={j}>• {ex}</li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>

            <p className="text-sm text-muted-foreground">{state.program.note}</p>
          </section>
        )}
          </>
        )}

        {view === "vikt" && (
          <section className="surface-card p-5 space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-ink flex items-center gap-2">
                <Scale size={18} className="text-primary" /> Vikt & viktnedgång
              </h2>
              <p className="text-sm text-muted-foreground">
                Väg dig när det känns bra – inte varje dag. Kurvan över tid säger mer än en enskild morgon.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-border/70 bg-muted/40 p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Senaste vikt</p>
                <p className="text-2xl font-bold text-ink">{latestWeight ? `${latestWeight.kg} kg` : "–"}</p>
                <p className="text-xs text-muted-foreground">
                  {latestWeight
                    ? new Date(latestWeight.date + "T00:00:00").toLocaleDateString("sv-SE", {
                        day: "numeric",
                        month: "short",
                      })
                    : "Ingen vikt inlagd ännu"}
                </p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-muted/40 p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Målvikt</p>
                <p className="text-2xl font-bold text-ink">{weightGoal ? `${weightGoal} kg` : "–"}</p>
                <p className="text-xs text-muted-foreground">
                  {weightGoal && latestWeight
                    ? `${Math.abs(Math.round((latestWeight.kg - weightGoal) * 10) / 10)} kg kvar`
                    : "Sätt ett mål om du vill"}
                </p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-muted/40 p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Förändring</p>
                <p className="text-2xl font-bold text-ink">
                  {weightChange === null ? "–" : `${weightChange > 0 ? "+" : ""}${weightChange} kg`}
                </p>
                <p className="text-xs text-muted-foreground">sedan första mätningen</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Input
                type="number"
                step="0.1"
                inputMode="decimal"
                placeholder="Vikt idag (kg)"
                value={weightInput}
                onChange={(e) => setWeightInput(e.target.value)}
                className="w-40 rounded-xl"
              />
              <Button
                variant="secondary"
                className="rounded-xl"
                onClick={() => {
                  const n = Number(weightInput.replace(",", "."));
                  if (!Number.isFinite(n) || n <= 0) return;
                  setWeight(n);
                  setWeightInput("");
                  toast({ title: "Sparat", description: "Vikten är loggad för idag." });
                }}
              >
                Spara vikt
              </Button>
              <Input
                type="number"
                step="0.1"
                inputMode="decimal"
                placeholder="Målvikt"
                value={weightGoalInput}
                onChange={(e) => {
                  setWeightGoalInput(e.target.value);
                  const n = Number(e.target.value.replace(",", "."));
                  setWeightGoal(Number.isFinite(n) && n > 0 ? n : null);
                }}
                className="w-32 rounded-xl"
                aria-label="Målvikt i kg"
              />
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Target size={14} /> målvikt
              </span>
            </div>

            {weights.length > 1 && (
              <div className="flex items-end gap-1 h-28">
                {weights.slice(-14).map((w) => {
                  const min = Math.min(...weights.slice(-14).map((x) => x.kg));
                  const max = Math.max(...weights.slice(-14).map((x) => x.kg));
                  const span = Math.max(1, max - min);
                  return (
                    <div key={w.date} className="flex-1 flex flex-col items-center gap-1">
                      <div
                        className="w-full rounded-t-lg bg-primary/30"
                        style={{ height: `${16 + ((w.kg - min) / span) * 60}px` }}
                        title={`${w.kg} kg`}
                      />
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(w.date + "T00:00:00").toLocaleDateString("sv-SE", { day: "numeric", month: "numeric" })}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              MyFlove ger inga kost- eller kaloriråd. Prata med vården om du behöver stöd med kost eller hälsa.
            </p>
          </section>
        )}
      </div>

    </Layout>
  );
}
