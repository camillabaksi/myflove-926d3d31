import { useEffect, useState } from "react";
import { flushSync } from "react-dom";
import { toast } from "sonner";
import { Bell, Check, MapPin, Pencil } from "lucide-react";
import { useTasks, useReminders } from "@/hooks/use-data";
import { useSharedShoppingList } from "@/hooks/use-shared-shopping-list";
import { useQuickflow } from "@/hooks/use-quickflow";
import { useFlowUsage } from "@/hooks/use-daily-flow";
import { KIND_META, understand, type UnderstoodPart } from "@/lib/quickflow-understand";
import { AREA_META } from "@/lib/life-areas";
import { cn } from "@/lib/utils";

type Row = UnderstoodPart & { on: boolean; remind: boolean };

/**
 * "Så här förstod jag det" – översikten användaren får efter att ha släppt
 * en tanke. Allt går att godkänna, ändra eller strunta i. Originaltexten
 * finns alltid kvar som utväg.
 */
export function QuickflowConfirm({
  text,
  onDone,
  onCancel,
}: {
  text: string;
  onDone: () => void;
  onCancel?: () => void;
}) {
  const [rows, setRows] = useState<Row[]>([]);
  const [question, setQuestion] = useState<string | undefined>();
  const [editing, setEditing] = useState<string | null>(null);

  const { addTask } = useTasks();
  const { addReminder } = useReminders();
  const { addItem: addShoppingItem } = useSharedShoppingList();
  const { add: addQuickflow } = useQuickflow();
  const { log } = useFlowUsage();

  useEffect(() => {
    const u = understand(text);
    setRows(
      u.parts.map((p) => ({ ...p, on: true, remind: p.kind === "kalender" && Boolean(p.time) })),
    );
    setQuestion(u.question);
  }, [text]);

  const patch = (id: string, next: Partial<Row>) =>
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...next } : r)));

  /** Spara texten precis som den är – ingen struktur påtvingad. */
  const keepAsIs = () => {
    // flushSync: dialogen stängs direkt efteråt – utan detta hinner inte
    // state-uppdateringen (och därmed sparningen) köras innan unmount.
    flushSync(() => {
      addQuickflow({ text, level: "tanke" });
      log("quickflow");
    });
    toast.success("Jag håller det åt dig. 💙", {
      description: "Den ligger som en öppen tanke i QuickFlow.",
    });
    onDone();
  };

  const approve = () => {
    const active = rows.filter((r) => r.on);
    if (active.length === 0) return keepAsIs();

    flushSync(() => {
      for (const r of active) {
        if (r.kind === "inkop") {
          addShoppingItem(r.title);
          continue;
        }
        addTask(r.title, r.date, {
          area: r.area,
          ...(r.time ? { time: r.time } : {}),
          ...(r.place ? { note: `📍 ${r.place}` } : {}),
        });
        if (r.remind && r.date) {
          addReminder(r.title, r.date, r.time ?? "09:00");
        }
      }
      log("quickflow");
      log("planering");
    });
    toast.success("Klart – jag har lagt det på plats. 💙", {
      description: active.map((r) => `${KIND_META[r.kind].emoji} ${r.title}`).join(" · "),
    });
    onDone();
  };


  if (rows.length === 0) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-ink">
          Jag är inte säker på vad det här är – och då gissar jag hellre inte.
        </p>
        <button
          type="button"
          onClick={keepAsIs}
          className="w-full rounded-2xl bg-primary text-primary-foreground py-3.5 font-semibold press"
        >
          🧠 Spara som QuickFlow-tanke
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="w-full rounded-2xl py-2.5 text-sm text-muted-foreground"
          >
            Ändra texten
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-ink">Så här förstod jag det. Ändra fritt – inget är låst.</p>
      {question && (
        <p className="rounded-2xl border border-gold/40 bg-gold/10 px-3 py-2 text-xs text-ink">
          {question}
        </p>
      )}

      <div className="space-y-2">
        {rows.map((r) => {
          const meta = KIND_META[r.kind];
          return (
            <div
              key={r.id}
              className={cn(
                "rounded-2xl border p-3 transition-colors",
                r.on ? "border-primary/40 bg-primary/5" : "border-border bg-card opacity-60",
              )}
            >
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  onClick={() => patch(r.id, { on: !r.on })}
                  aria-pressed={r.on}
                  aria-label={r.on ? "Ta bort förslaget" : "Ta med förslaget"}
                  className={cn(
                    "mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border",
                    r.on
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border text-transparent",
                  )}
                >
                  <Check size={14} />
                </button>

                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground">
                    {meta.emoji} {meta.label} · {AREA_META[r.area].label}
                  </p>
                  {editing === r.id ? (
                    <input
                      autoFocus
                      value={r.title}
                      onChange={(e) => patch(r.id, { title: e.target.value })}
                      onBlur={() => setEditing(null)}
                      className="mt-1 w-full rounded-xl border border-border bg-background px-2 py-1 text-sm"
                    />
                  ) : (
                    <p className="truncate text-sm font-medium text-ink">{r.title}</p>
                  )}
                  <p className="mt-0.5 text-xs text-muted-foreground">{r.why}</p>

                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {r.kind !== "inkop" && (
                      <>
                        <input
                          type="date"
                          value={r.date ?? ""}
                          onChange={(e) => patch(r.id, { date: e.target.value || undefined })}
                          className="rounded-xl border border-border bg-background px-2 py-1 text-xs"
                        />
                        <input
                          type="time"
                          value={r.time ?? ""}
                          onChange={(e) => patch(r.id, { time: e.target.value || undefined })}
                          className="rounded-xl border border-border bg-background px-2 py-1 text-xs"
                        />
                      </>
                    )}
                    <button
                      type="button"
                      onClick={() => setEditing(editing === r.id ? null : r.id)}
                      className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
                    >
                      <Pencil size={12} /> Ändra text
                    </button>
                    {r.date && (
                      <button
                        type="button"
                        onClick={() => patch(r.id, { remind: !r.remind })}
                        aria-pressed={r.remind}
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs",
                          r.remind
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border text-muted-foreground",
                        )}
                      >
                        <Bell size={12} /> Påminn mig
                      </button>
                    )}
                    {r.place && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-secondary/50 px-2 py-1 text-xs text-muted-foreground">
                        <MapPin size={12} /> {r.place}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={approve}
        className="w-full rounded-2xl bg-primary py-3.5 font-semibold text-primary-foreground press"
      >
        Godkänn allt
      </button>
      <button
        type="button"
        onClick={keepAsIs}
        className="w-full rounded-2xl border border-border bg-card py-3 text-sm font-medium text-ink"
      >
        🧠 Spara bara texten som den är
      </button>
      {onCancel && (
        <button
          type="button"
          onClick={onCancel}
          className="w-full rounded-2xl py-2 text-sm text-muted-foreground"
        >
          Tillbaka
        </button>
      )}
    </div>
  );
}

export default QuickflowConfirm;
