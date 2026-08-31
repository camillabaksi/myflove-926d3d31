import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowDown,
  ArrowUp,
  CalendarPlus,
  Check,
  ListChecks,
  Loader2,
  Play,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";
import { MyFloveBlock } from "@/components/myflove/block";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import WhyHint from "@/components/why-hint";
import ActivityEnergyPrompt from "@/components/activity-energy-prompt";
import { usePriorityList } from "@/hooks/use-priority-list";
import { useEnergyBattery } from "@/hooks/use-energy-battery";
import { useTasks } from "@/hooks/use-data";
import { useToast } from "@/hooks/use-toast";
import { guessArea, guessEmoji } from "@/lib/quickflow";
import {
  BUCKETS,
  BUCKET_META,
  energyHint,
  heuristicPriority,
  splitTasks,
  type PriorityBucket,
  type PriorityTask,
} from "@/lib/quickflow-priority";
import { prioritizeQuickflow } from "@/lib/quickflow-priority.functions";
import type { FlowItem } from "@/lib/flow-items";
import { cn } from "@/lib/utils";
import { track } from "@/lib/analytics";

/**
 * "Jag har mycket på en gång" – flera saker in i ett fält, Flow sorterar dem
 * i fyra nivåer. Inga tider, inga datum, ingen kalenderhändelse.
 */
export function QuickflowPriority() {
  const { openItems, doneItems, add, update, remove, move, replace, clear } = usePriorityList();
  const { reading } = useEnergyBattery();
  const { addTask } = useTasks();
  const { toast } = useToast();
  const navigate = useNavigate();
  const run = useServerFn(prioritizeQuickflow);

  const [raw, setRaw] = useState("");
  const [busy, setBusy] = useState(false);
  const [intro, setIntro] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [reorder, setReorder] = useState(false);
  const [askEnergyFor, setAskEnergyFor] = useState<FlowItem | null>(null);

  const energyPercent = reading?.now;
  const hint = useMemo(() => energyHint(energyPercent), [energyPercent]);

  const prioritize = async () => {
    const titles = splitTasks(raw);
    if (titles.length === 0) return;
    setBusy(true);
    track("quickflow_created", { source: "quickflow", method: "prioritera" });
    const now = Date.now();
    try {
      const result = await run({ data: { titles, energyPercent } });
      replace(
        result.items.map((it, i) => ({
          id: `${now}-${i}`,
          title: it.title,
          bucket: it.bucket,
          why: it.why,
          order: i,
          createdAt: now,
        })),
      );
      setIntro(result.intro);
    } catch {
      replace(heuristicPriority(titles, energyPercent));
      setIntro("Jag sorterade dem så gott jag kunde. Du får gärna ändra ordningen.");
    } finally {
      setBusy(false);
      setRaw("");
    }
  };

  const markDone = (item: PriorityTask) => {
    update(item.id, { done: true, doneAt: Date.now() });
    setAskEnergyFor({
      id: `quickflow-${item.id}`,
      title: item.title,
      source: "tanke",
      area: guessArea(item.title),
      emoji: guessEmoji(item.title, "snabbt"),
      priority: "idag",
      completable: true,
    });
  };

  const planIt = (item: PriorityTask) => {
    addTask(item.title);
    remove(item.id);
    toast({ description: "Skickad till Planera – du väljer själv när den ska ligga." });
    navigate({ to: "/idag" });
  };

  return (
    <>
      <MyFloveBlock
        title="Jag har mycket på en gång"
        subtitle="Berätta vad du behöver få gjort, så hjälper Flow dig att prioritera."
        eyebrow="Prioritera"
        icon={ListChecks}
        tone="lavender"
        surface="lavender"
        collapsible
        collapseId="quickflow::prioritera"
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">{hint}</p>

          <textarea
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            placeholder="T.ex. Tvätta, handla, svara läraren, hämta paket, betala räkningen – en per rad går också bra."
            className="h-28 w-full resize-none rounded-2xl border-2 border-border/60 bg-card p-4 text-base outline-none focus:ring-2 focus:ring-primary/20"
          />

          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={prioritize} disabled={busy || !raw.trim()} className="rounded-xl">
              {busy ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              Hjälp mig prioritera
            </Button>
            <WhyHint label="varför frågar vi?">
              Du behöver inte planera allt just nu. Flow sorterar det viktigaste först – inga tider,
              inga kalenderhändelser skapas.
            </WhyHint>
          </div>
        </div>
      </MyFloveBlock>

      {(openItems.length > 0 || doneItems.length > 0) && (
        <MyFloveBlock
          title="Min lista just nu"
          subtitle="Ingen tid, ingen deadline. Bara ordning."
          eyebrow="🌿 Flow hjälper dig prioritera"
          icon={Sparkles}
          tone="mint"
          action={
            <button
              type="button"
              onClick={() => setReorder((r) => !r)}
              className="press rounded-full border-2 border-border px-3 py-1.5 text-xs font-medium"
            >
              ↕ {reorder ? "Klar" : "Ändra ordning"}
            </button>
          }
          collapsible
          collapseId="quickflow::min-lista"
        >
          <div className="space-y-4">
            {intro && <p className="text-sm text-muted-foreground">{intro}</p>}

            {BUCKETS.map((bucket) => {
              const rows = openItems.filter((i) => i.bucket === bucket);
              if (rows.length === 0) return null;
              const meta = BUCKET_META[bucket];
              return (
                <div key={bucket} className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {meta.emoji} {meta.label}
                  </p>
                  {rows.map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-wrap items-center gap-2 rounded-2xl border-2 border-border bg-card p-3"
                    >
                      <span className="min-w-[8rem] flex-1">
                        <span className="block font-medium text-foreground">{item.title}</span>
                        {item.why && (
                          <span className="block text-xs text-muted-foreground">{item.why}</span>
                        )}
                      </span>

                      {reorder ? (
                        <span className="flex flex-wrap items-center gap-1">
                          {BUCKETS.map((b) => (
                            <button
                              key={b}
                              type="button"
                              onClick={() => update(item.id, { bucket: b })}
                              className={cn(
                                "press rounded-full border-2 px-2 py-1 text-xs",
                                item.bucket === b
                                  ? "border-primary text-primary"
                                  : "border-border text-muted-foreground",
                              )}
                              aria-label={BUCKET_META[b].label}
                            >
                              {BUCKET_META[b].emoji}
                            </button>
                          ))}
                          <IconBtn label="Flytta upp" onClick={() => move(item.id, -1)}>
                            <ArrowUp size={16} />
                          </IconBtn>
                          <IconBtn label="Flytta ner" onClick={() => move(item.id, 1)}>
                            <ArrowDown size={16} />
                          </IconBtn>
                        </span>
                      ) : (
                        <span className="flex flex-wrap items-center gap-1">
                          <IconBtn label="Börja med denna" onClick={() => navigate({ to: "/fokus" })}>
                            <Play size={16} />
                          </IconBtn>
                          <IconBtn label="Klar" onClick={() => markDone(item)}>
                            <Check size={16} />
                          </IconBtn>
                          <IconBtn label="Planera den" onClick={() => planIt(item)}>
                            <CalendarPlus size={16} />
                          </IconBtn>
                          <IconBtn label="Ta bort" onClick={() => remove(item.id)}>
                            <Trash2 size={16} />
                          </IconBtn>
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              );
            })}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                add(newTitle);
                setNewTitle("");
              }}
              className="flex flex-wrap items-center gap-2"
            >
              <Input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Lägg till något"
                className="h-11 min-w-[10rem] flex-1 rounded-xl"
              />
              <Button type="submit" variant="outline" className="h-11 rounded-xl">
                <Plus size={16} className="mr-1" /> Lägg till
              </Button>
            </form>

            {doneItems.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {doneItems.length} klar{doneItems.length === 1 ? "" : "a"} idag.{" "}
                <button type="button" onClick={clear} className="underline underline-offset-4">
                  Rensa listan
                </button>
              </p>
            )}
          </div>
        </MyFloveBlock>
      )}

      <ActivityEnergyPrompt item={askEnergyFor} onClose={() => setAskEnergyFor(null)} />
    </>
  );
}

function IconBtn({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="press flex h-9 w-9 items-center justify-center rounded-full border-2 border-border text-muted-foreground hover:border-primary hover:text-primary"
    >
      {children}
    </button>
  );
}

export default QuickflowPriority;
