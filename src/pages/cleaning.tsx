import { useMemo, useState } from "react";
import Layout from "@/components/layout";
import { MyFloveBlock, MyFlovePageGrid, MyFloveWide } from "@/components/myflove/block";
import { MyFloveHeader } from "@/components/myflove";
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
import { Clock, RotateCcw, Sparkles, ShoppingBasket, Plus, X, ListChecks } from "lucide-react";
import { Input } from "@/components/ui/input";

const todayIso = () => new Date().toISOString().slice(0, 10);

type CustomStep = { id: string; label: string; minutes: number; needs: string[] };

export default function CleaningPage() {
  const [done, setDone] = useCloudSyncedStorage<Record<string, string>>(
    "myflove-cleaning-done",
    {},
  );
  // Egna steg och bortvalda steg – sparas per rum och läge.
  const [custom, setCustom] = useCloudSyncedStorage<Record<string, CustomStep[]>>(
    "myflove-cleaning-custom",
    {},
  );
  const [hidden, setHidden] = useCloudSyncedStorage<Record<string, string[]>>(
    "myflove-cleaning-hidden",
    {},
  );
  const [roomId, setRoomId] = useState(CLEAN_ROOMS[0]!.id);
  const [mode, setMode] = useState<CleanMode>("vardag");
  const [newLabel, setNewLabel] = useState("");
  const [newMinutes, setNewMinutes] = useState("10");
  const { toast } = useToast();

  const room = CLEAN_ROOMS.find((r) => r.id === roomId)!;
  const listKey = `${roomId}:${mode}`;
  const hiddenIds = useMemo(() => hidden[listKey] ?? [], [hidden, listKey]);
  const steps = useMemo(
    () => [
      ...room.steps[mode].filter((s) => !hiddenIds.includes(s.id)),
      ...(custom[listKey] ?? []),
    ],
    [room, mode, hiddenIds, custom, listKey],
  );
  const key = (stepId: string) => `${mode}:${stepId}`;
  const isDone = (stepId: string) => Boolean(done[key(stepId)]);

  const addStep = () => {
    const label = newLabel.trim();
    if (!label) return;
    const minutes = Math.max(1, Number(newMinutes) || 10);
    const step: CustomStep = { id: `egen-${Date.now()}`, label, minutes, needs: [] };
    setCustom((prev) => ({ ...prev, [listKey]: [...(prev[listKey] ?? []), step] }));
    setNewLabel("");
    toast({ description: "Tillagt i listan 🌱" });
  };

  const removeStep = (stepId: string) => {
    if (stepId.startsWith("egen-")) {
      setCustom((prev) => ({
        ...prev,
        [listKey]: (prev[listKey] ?? []).filter((s) => s.id !== stepId),
      }));
    } else {
      setHidden((prev) => ({
        ...prev,
        [listKey]: [...(prev[listKey] ?? []), stepId],
      }));
    }
    setDone((prev) => {
      const next = { ...prev };
      delete next[key(stepId)];
      return next;
    });
    toast({ description: "Borttaget från listan" });
  };

  const restoreSteps = () => {
    setHidden((prev) => ({ ...prev, [listKey]: [] }));
    toast({ description: "Standardstegen är tillbaka" });
  };

  const completed = steps.filter((s) => isDone(s.id));
  const remaining = steps.filter((s) => !isDone(s.id));
  const supplies = useMemo(
    () => suppliesFor(remaining.length ? remaining : steps),
    [remaining, steps],
  );

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
      <MyFlovePageGrid area="hem">
        <MyFloveWide>
          <MyFloveHeader
            area="hem"
            title="Städning"
            emoji="🧹"
            description="Välj rum och läge. Kryssa av i din takt – allt räknas."
          />
        </MyFloveWide>

        {/* Läge */}
        <MyFloveWide>
          <div className="grid grid-cols-2 gap-3">
            {(["vardag", "stor"] as CleanMode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                aria-pressed={mode === m}
                className={`min-w-0 rounded-2xl border-2 p-4 text-left transition ${
                  mode === m
                    ? "border-primary bg-primary/10"
                    : "border-border bg-card hover:bg-accent/40"
                }`}
              >
                <div className="font-semibold text-foreground">{CLEAN_MODE_LABEL[m]}</div>
                <div className="mt-1 text-xs text-muted-foreground">{CLEAN_MODE_BLURB[m]}</div>
              </button>
            ))}
          </div>
        </MyFloveWide>

        {/* Rum */}
        <MyFloveWide>
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
                      ? {
                          color: `hsl(${r.hue})`,
                          backgroundColor: `hsl(${r.hue} / 0.14)`,
                          borderColor: `hsl(${r.hue} / 0.4)`,
                        }
                      : { borderColor: `hsl(${r.hue} / 0.3)` }
                  }
                >
                  <span className="mr-1.5">{r.emoji}</span>
                  {r.label}
                </button>
              );
            })}
          </div>
        </MyFloveWide>

        {/* Översikt */}
        <MyFloveWide>
          <MyFloveBlock
            title={`${room.emoji} ${room.label} – ${CLEAN_MODE_LABEL[mode].toLowerCase()}`}
            subtitle={
              minutesLeft > 0
                ? `Ca ${minutesLeft} min kvar · ${completed.length}/${steps.length} klart`
                : "Allt avklarat 🌟"
            }
            icon={Clock}
            tone="mint"
            action={
              <Button variant="ghost" size="sm" onClick={resetRoom} className="shrink-0">
                <RotateCcw className="mr-1.5 h-4 w-4" />
                Nollställ
              </Button>
            }
          >
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${pct}%`, backgroundColor: `hsl(${room.hue})` }}
              />
            </div>
          </MyFloveBlock>
        </MyFloveWide>

        {/* Vad du behöver */}
        <MyFloveWide>
          <MyFloveBlock
            title="Det här behöver du"
            subtitle="Grejer för dagens städning"
            icon={ShoppingBasket}
            tone="sky"
          >
            {supplies.length === 0 ? (
              <p className="text-sm text-muted-foreground">Inget särskilt – bara du 💛</p>
            ) : (
              <ul className="flex flex-wrap gap-2">
                {supplies.map((item) => (
                  <li
                    key={item}
                    className="rounded-full border border-border bg-background px-3 py-1.5 text-sm text-foreground"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            )}
          </MyFloveBlock>
        </MyFloveWide>

        {/* Steg */}
        <MyFloveWide>
          <MyFloveBlock
            title="Steg att kryssa av"
            subtitle="Bocka i din takt – allt räknas"
            icon={ListChecks}
            tone="lavender"
          >
            <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {steps.map((s) => {
                const checked = isDone(s.id);
                return (
                  <li
                    key={s.id}
                    className={`flex items-start gap-3 rounded-2xl border border-border bg-background p-4 ${checked ? "opacity-60" : ""}`}
                  >
                    <Checkbox
                      checked={checked}
                      onClick={(e) => toggle(s.id, e)}
                      aria-label={s.label}
                      className="mt-0.5"
                    />
                    <div className="min-w-0 flex-1">
                      <div
                        className={`font-medium text-foreground ${checked ? "line-through" : ""}`}
                      >
                        {s.label}
                      </div>
                      <div className="mt-0.5 text-xs text-muted-foreground">
                        {s.minutes} min
                        {s.needs.length > 0 && ` · ${s.needs.join(", ")}`}
                      </div>
                      {checked && done[key(s.id)] && (
                        <div className="mt-1 text-[11px] text-muted-foreground">
                          Klart {done[key(s.id)]}
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeStep(s.id)}
                      aria-label={`Ta bort ${s.label}`}
                      className="shrink-0 rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </li>
                );
              })}
            </ul>
          </MyFloveBlock>
        </MyFloveWide>

        {/* Lägg till eget steg */}
        <MyFloveWide>
          <MyFloveBlock
            title="Lägg till eget steg"
            subtitle="Dina egna steg sparas per rum och läge"
            icon={Plus}
            tone="blush"
          >
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Input
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") addStep();
                  }}
                  placeholder="T.ex. Vattna blommorna"
                  aria-label="Vad vill du lägga till?"
                  className="min-w-[10rem] flex-1"
                />
                <Input
                  value={newMinutes}
                  onChange={(e) => setNewMinutes(e.target.value)}
                  inputMode="numeric"
                  aria-label="Minuter"
                  className="w-20"
                />
                <Button onClick={addStep} disabled={!newLabel.trim()} className="gap-1.5">
                  <Plus className="h-4 w-4" />
                  Lägg till
                </Button>
              </div>
              {hiddenIds.length > 0 && (
                <button
                  type="button"
                  onClick={restoreSteps}
                  className="text-xs text-primary hover:underline"
                >
                  Visa borttagna standardsteg igen ({hiddenIds.length})
                </button>
              )}
            </div>
          </MyFloveBlock>
        </MyFloveWide>

        <MyFloveWide>
          <p className="flex items-center justify-center gap-2 pb-4 text-center text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4" />
            Du behöver inte göra allt. Ett steg räcker idag.
          </p>
        </MyFloveWide>
      </MyFlovePageGrid>
    </Layout>
  );
}
