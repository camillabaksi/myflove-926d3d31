import { useMemo, useState } from "react";
import Layout from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useCloudSyncedStorage } from "@/lib/cloud-storage";
import { useToast } from "@/hooks/use-toast";
import { celebrateFromEvent } from "@/lib/celebrate";
import {
  CLEAN_ROOMS,
  CLEAN_MODE_BLURB,
  CLEAN_MODE_LABEL,
  cleaningCheer,
  finishCheer,
  suppliesFor,
  totalMinutes,
  type CleanMode,
} from "@/lib/cleaning";
import { Clock, RotateCcw, Sparkles, ShoppingBasket } from "lucide-react";
import CollapsibleSection from "@/components/collapsible-section";

const todayIso = () => new Date().toISOString().slice(0, 10);

export default function CleaningPage() {
  const [done, setDone] = useCloudSyncedStorage<Record<string, string>>("myflove-cleaning-done", {});
  const [roomId, setRoomId] = useState(CLEAN_ROOMS[0]!.id);
  const [mode, setMode] = useState<CleanMode>("vardag");
  const { toast } = useToast();

  const room = CLEAN_ROOMS.find((r) => r.id === roomId)!;
  const steps = room.steps[mode];
  const key = (stepId: string) => `${mode}:${stepId}`;
  const isDone = (stepId: string) => Boolean(done[key(stepId)]);

  const completed = steps.filter((s) => isDone(s.id));
  const remaining = steps.filter((s) => !isDone(s.id));
  const supplies = useMemo(() => suppliesFor(remaining.length ? remaining : steps), [remaining, steps]);
  const minutesLeft = totalMinutes(remaining);
  const pct = steps.length ? Math.round((completed.length / steps.length) * 100) : 0;
  const tint = (a: number) => `hsl(${room.hue} / ${a})`;

  const toggle = (stepId: string, e: React.MouseEvent) => {
    const wasDone = isDone(stepId);
    setDone((prev) => {
      const next = { ...prev };
      if (wasDone) delete next[key(stepId)];
      else next[key(stepId)] = todayIso();
      return next;
    });
    if (!wasDone) {
      const allDone = steps.every((s) => s.id === stepId || isDone(s.id));
      celebrateFromEvent(e);
      toast({ description: allDone ? finishCheer(mode, room.label) : cleaningCheer() });
    }
  };

  const resetRoom = () => {
    setDone((prev) => {
      const next = { ...prev };
      for (const s of steps) delete next[key(s.id)];
      return next;
    });
    toast({ description: "Nollställt – börja om när du vill 🌱" });
  };

  return (
    <Layout>
      <div className="mx-auto max-w-3xl px-4 py-6 space-y-6">
        <header>
          <h1 className="font-display text-3xl font-bold text-foreground">Städning</h1>
          <p className="mt-1 text-muted-foreground text-sm">
            Välj rum och läge. Kryssa av i din takt – allt räknas.
          </p>
        </header>

        {/* Läge */}
        <div className="grid grid-cols-2 gap-3">
          {(["vardag", "stor"] as CleanMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              aria-pressed={mode === m}
              className={`rounded-2xl border p-4 text-left transition ${
                mode === m ? "border-primary bg-primary/10" : "border-border bg-card hover:bg-accent/40"
              }`}
            >
              <div className="font-semibold text-foreground">{CLEAN_MODE_LABEL[m]}</div>
              <div className="mt-1 text-xs text-muted-foreground">{CLEAN_MODE_BLURB[m]}</div>
            </button>
          ))}
        </div>

        {/* Rum */}
        <div className="flex flex-wrap gap-2">
          {CLEAN_ROOMS.map((r) => {
            const active = r.id === roomId;
            return (
              <button
                key={r.id}
                onClick={() => setRoomId(r.id)}
                aria-pressed={active}
                className="rounded-full border px-4 py-2 text-sm font-medium transition"
                style={
                  active
                    ? { color: `hsl(${r.hue})`, backgroundColor: `hsl(${r.hue} / 0.14)`, borderColor: `hsl(${r.hue} / 0.4)` }
                    : { borderColor: `hsl(${r.hue} / 0.3)` }
                }
              >
                <span className="mr-1.5">{r.emoji}</span>
                {r.label}
              </button>
            );
          })}
        </div>

        {/* Översikt */}
        <section
          className="rounded-3xl border p-5"
          style={{ borderColor: tint(0.3), backgroundColor: tint(0.07) }}
        >
          <CollapsibleSection
            title={`${room.emoji} ${room.label} – ${CLEAN_MODE_LABEL[mode].toLowerCase()}`}
            id="Översikt"
            headingClassName="font-display text-xl font-bold"
            actions={
              <Button variant="ghost" size="sm" onClick={resetRoom} className="shrink-0">
                <RotateCcw className="mr-1.5 h-4 w-4" />
                Nollställ
              </Button>
            }
          >
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground -mt-2">
              <Clock className="h-4 w-4" />
              {minutesLeft > 0 ? `Ca ${minutesLeft} min kvar` : "Allt avklarat"} · {completed.length}/{steps.length} klart
            </p>
            <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: `hsl(${room.hue})` }} />
            </div>
          </CollapsibleSection>
        </section>

        {/* Steg */}
        <ul className="space-y-2">
          {steps.map((s) => {
            const checked = isDone(s.id);
            return (
              <li
                key={s.id}
                className={`flex items-start gap-3 rounded-2xl border border-border bg-card p-4 ${checked ? "opacity-60" : ""}`}
              >
                <Checkbox
                  checked={checked}
                  onClick={(e) => toggle(s.id, e)}
                  aria-label={s.label}
                  className="mt-0.5"
                />
                <div className="min-w-0 flex-1">
                  <div className={`font-medium text-foreground ${checked ? "line-through" : ""}`}>{s.label}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {s.minutes} min
                    {s.needs.length > 0 && ` · ${s.needs.join(", ")}`}
                  </div>
                  {checked && done[key(s.id)] && (
                    <div className="mt-1 text-[11px] text-muted-foreground">Klart {done[key(s.id)]}</div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>

        {/* Vad du behöver */}
        <section className="rounded-3xl border border-border bg-card p-5">
          <CollapsibleSection
            title={<span className="flex items-center gap-2"><ShoppingBasket className="h-5 w-5 text-primary" />Det här behöver du</span>}
            id="Det här behöver du"
            headingClassName="font-display text-lg font-bold"
          >
            {supplies.length === 0 ? (
              <p className="text-sm text-muted-foreground">Inget särskilt – bara du 💛</p>
            ) : (
              <ul className="flex flex-wrap gap-2">
                {supplies.map((item) => (
                  <li key={item} className="rounded-full border border-border bg-background px-3 py-1.5 text-sm text-foreground">
                    {item}
                  </li>
                ))}
              </ul>
            )}
          </CollapsibleSection>
        </section>

        <p className="flex items-center justify-center gap-2 pb-4 text-center text-sm text-muted-foreground">
          <Sparkles className="h-4 w-4" />
          Du behöver inte göra allt. Ett steg räcker idag.
        </p>
      </div>
    </Layout>
  );
}
