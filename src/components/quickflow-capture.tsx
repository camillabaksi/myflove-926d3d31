import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Check, Mic, Pencil, Plus, Sparkles, MapPin, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import WhyHint from "@/components/why-hint";
import { useVoiceInput } from "@/hooks/use-voice-input";
import { useSavedStores } from "@/hooks/use-data";
import { useQuickflow } from "@/hooks/use-quickflow";
import { usePriorityList } from "@/hooks/use-priority-list";
import { splitTasks } from "@/lib/quickflow-priority";
import { useNotes } from "@/hooks/use-notes";
import {
  LEVEL_META,
  WHEN_PRESETS,
  formatWhen,
  suggestWhen,
  type QuickflowLevel,
} from "@/lib/quickflow";

function toLocalInputValue(at: number): string {
  const d = new Date(at);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function QuickflowCapture({ variant = "card" }: { variant?: "card" | "compact" }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [level, setLevel] = useState<QuickflowLevel>("snabbt");
  const [customOpen, setCustomOpen] = useState(false);
  const [customValue, setCustomValue] = useState("");
  const [placeOpen, setPlaceOpen] = useState(false);
  /** Användarens egen version av uppdelningen – null = Flows förslag gäller. */
  const [edited, setEdited] = useState<string[] | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const { add } = useQuickflow();
  const { addNote } = useNotes();
  const { savedStores } = useSavedStores();
  const { add: addToPriority } = usePriorityList();
  const navigate = useNavigate();
  const voice = useVoiceInput((t) => setText((prev) => (prev ? `${prev} ${t}` : t)));

  const suggestion = useMemo(() => (text.trim() ? suggestWhen(level, text) : null), [text, level]);

  const detected = useMemo(() => splitTasks(text), [text]);
  const items = edited ?? detected;
  const isMulti = items.length > 1;

  // Ny text = nytt förslag från Flow.
  useEffect(() => {
    setEdited(null);
    setEditingIndex(null);
  }, [text]);

  const reset = () => {
    setText("");
    setLevel("snabbt");
    setCustomOpen(false);
    setCustomValue("");
    setPlaceOpen(false);
    setEdited(null);
    setEditingIndex(null);
  };

  const removeItem = (index: number) => {
    setEdited(items.filter((_, i) => i !== index));
    setEditingIndex(null);
  };

  const saveEdit = () => {
    if (editingIndex === null) return;
    const value = editingValue.trim();
    setEdited(items.map((t, i) => (i === editingIndex ? value || t : t)));
    setEditingIndex(null);
  };

  const save = (opts: { remindAt?: number; placeId?: string; placeName?: string }) => {
    const titles = items.length > 0 ? items : [text.trim()].filter(Boolean);
    if (titles.length === 0) return;
    let mergedAny = false;
    titles.forEach((title) => {
      const { merged } = add({ text: title, level, ...opts });
      if (merged) mergedAny = true;
    });
    setOpen(false);
    reset();
    toast.success(
      mergedAny ? "Några fanns redan – jag slog ihop dem. 💙" : "Lugn. Jag håller det åt dig. 💙",
      {
        description: opts.remindAt
          ? `Jag säger till ${formatWhen(opts.remindAt).toLowerCase()}.`
          : opts.placeName
            ? `Jag knuffar dig när du är nära ${opts.placeName}.`
            : titles.length > 1
              ? `${titles.length} saker ligger som öppna tankar – jag frågar dig senare.`
              : "Den ligger som en öppen tanke – jag frågar dig senare.",
      },
    );
  };

  /** Godkänn uppdelningen och låt Flow föreslå en ordning – inga tider skapas. */
  const approveAndPrioritize = () => {
    const titles = items.filter(Boolean);
    if (titles.length === 0) return;
    titles.forEach((title) => addToPriority(title));
    setOpen(false);
    reset();
    toast.success(`${titles.length} saker är ute ur huvudet. 💙`, {
      description: "De ligger i din lista – Flow hjälper dig prioritera.",
    });
    void navigate({ to: "/quickflow" });
  };

  /** Tanken får bara finnas – den landar direkt bland anteckningarna. */
  const saveAsNote = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    addNote(trimmed);
    setOpen(false);
    reset();
    toast.success("Sparad som anteckning. 📝", {
      description: "Du hittar den under Anteckningar i Quickflow – gör något av den när du vill.",
    });
  };


  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          variant === "compact"
            ? "inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover-scale"
            : "group w-full flex items-center gap-4 p-5 rounded-3xl border-2 border-dashed border-primary/40 bg-card hover:border-primary hover:shadow-lifted transition-all text-left active:scale-[0.99]"
        }
      >
        <span
          className={
            variant === "compact"
              ? "sr-only"
              : "w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0"
          }
        >
          <Plus size={24} />
        </span>
        {variant === "compact" ? (
          <>
            <Plus size={16} /> Kom ihåg
          </>
        ) : (
          <span className="flex-1">
            <span className="block text-lg font-semibold text-ink">Kom ihåg</span>
            <span className="block text-sm text-muted-foreground">
              Skriv eller prata in det direkt – du behöver inte sortera det nu.
            </span>
          </span>
        )}
      </button>

      <Dialog
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o) reset();
        }}
      >
        <DialogContent className="max-h-[85dvh] max-w-[720px] overflow-y-auto overflow-x-hidden">
          <DialogHeader>
            <DialogTitle>Vad vill du få ur huvudet?</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Få ut det ur huvudet. Jag håller koll – skriv flera saker om du vill.
            </p>
          </DialogHeader>

          <div className="min-w-0 space-y-4">

            <div className="relative">
              <textarea
                autoFocus
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={3}
                placeholder="T.ex. Köp gympakläder till Bella"
                className="w-full rounded-2xl border border-border bg-background p-3 pr-12 text-base outline-none focus:border-primary"
              />
              {voice.isSupported && (
                <button
                  type="button"
                  onClick={voice.toggleListening}
                  aria-label={voice.isListening ? "Sluta lyssna" : "Prata in"}
                  className={`absolute right-2 top-2 w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                    voice.isListening
                      ? "bg-destructive text-destructive-foreground animate-pulse"
                      : "bg-secondary text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Mic size={16} />
                </button>
              )}
            </div>

            {isMulti && (
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Så här har jag förstått det
                  </p>
                  <WhyHint label="uppdelningen">
                    Flow delar upp texten i separata saker så att inget klumpas ihop. Du kan ändra,
                    ta bort eller lägga till – du bestämmer.
                  </WhyHint>
                </div>

                <ul className="space-y-2">
                  {items.map((title, index) => (
                    <li
                      key={`${title}-${index}`}
                      className="flex min-w-0 items-center gap-2 rounded-2xl border-2 border-border bg-card p-2.5"
                    >
                      {editingIndex === index ? (
                        <>
                          <Input
                            autoFocus
                            value={editingValue}
                            onChange={(e) => setEditingValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                saveEdit();
                              }
                            }}
                            className="h-10 min-w-0 flex-1 rounded-xl"
                            aria-label="Redigera uppgiften"
                          />
                          <Button
                            type="button"
                            size="sm"
                            onClick={saveEdit}
                            className="h-10 shrink-0 rounded-xl"
                          >
                            Spara
                          </Button>
                        </>
                      ) : (
                        <>
                          <Check size={16} className="shrink-0 text-primary" aria-hidden="true" />
                          <span className="min-w-0 flex-1 break-words text-sm text-foreground">
                            {title}
                          </span>
                          <button
                            type="button"
                            aria-label={`Redigera ${title}`}
                            onClick={() => {
                              setEditingIndex(index);
                              setEditingValue(title);
                            }}
                            className="press flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-border text-muted-foreground hover:border-primary hover:text-primary"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            type="button"
                            aria-label={`Ta bort ${title}`}
                            onClick={() => removeItem(index)}
                            className="press flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-border text-muted-foreground hover:border-destructive hover:text-destructive"
                          >
                            <Trash2 size={15} />
                          </button>
                        </>
                      )}
                    </li>
                  ))}
                </ul>

                <div className="grid gap-2 pt-1">
                  <Button type="button" onClick={approveAndPrioritize} className="w-full rounded-xl">
                    <Sparkles size={16} className="mr-2" /> Godkänn och prioritera
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={saveAsNote}
                    className="w-full rounded-xl"
                  >
                    Spara bara texten
                  </Button>
                </div>
              </div>
            )}



            <div className="space-y-2">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Hur känns det?
              </p>
              <div className="grid gap-2">
                {(Object.keys(LEVEL_META) as QuickflowLevel[]).map((key) => {
                  const meta = LEVEL_META[key];
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setLevel(key)}
                      className={`flex items-start gap-3 rounded-2xl border p-3 text-left transition-colors ${
                        level === key
                          ? meta.className
                          : "border-border bg-card hover:border-primary/40"
                      }`}
                    >
                      <span className="text-lg leading-none">{meta.emoji}</span>
                      <span>
                        <span className="block text-sm font-medium">{meta.label}</span>
                        <span className="block text-xs text-muted-foreground">{meta.hint}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                ⏰ När ska jag påminna dig?
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {WHEN_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    disabled={!text.trim()}
                    onClick={() => save({ remindAt: preset.compute() ?? undefined })}
                    className="w-full rounded-full border border-border bg-card px-4 py-2 text-sm hover:border-primary disabled:opacity-40"
                  >
                    {preset.label}
                  </button>
                ))}
                <button
                  type="button"
                  disabled={!text.trim()}
                  onClick={() => {
                    setPlaceOpen(false);
                    setCustomOpen((v) => !v);
                    if (!customValue) setCustomValue(toLocalInputValue(Date.now() + 3_600_000));
                  }}
                  className="w-full rounded-full border border-border bg-card px-4 py-2 text-sm hover:border-primary disabled:opacity-40"
                >
                  På ett datum
                </button>
                <button
                  type="button"
                  disabled={!text.trim()}
                  onClick={() => {
                    setCustomOpen(false);
                    setPlaceOpen((v) => !v);
                  }}
                  className="w-full rounded-full border border-border bg-card px-4 py-2 text-sm hover:border-primary disabled:opacity-40"
                >
                  <MapPin size={13} className="inline mr-1 -mt-0.5" />
                  När jag kommer till en plats
                </button>
                <button
                  type="button"
                  disabled={!text.trim()}
                  onClick={() => save({})}
                  className="w-full rounded-full border border-sage bg-sage/30 px-4 py-2 text-sm hover:border-primary disabled:opacity-40"
                >
                  💭 Bara spara tanken
                </button>
                <button
                  type="button"
                  disabled={!text.trim()}
                  onClick={saveAsNote}
                  className="w-full rounded-full border border-border bg-card px-4 py-2 text-sm hover:border-primary disabled:opacity-40"
                >
                  📝 Spara som anteckning
                </button>
              </div>

              {customOpen && (
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <input
                    type="datetime-local"
                    value={customValue}
                    onChange={(e) => setCustomValue(e.target.value)}
                    className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const at = new Date(customValue).getTime();
                      if (Number.isFinite(at)) save({ remindAt: at });
                    }}
                    className="rounded-full bg-primary text-primary-foreground px-4 py-2 text-sm font-medium"
                  >
                    Spara
                  </button>
                </div>
              )}

              {placeOpen && (
                <div className="space-y-2 pt-1">
                  {savedStores.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      Du har inga sparade platser än. Lägg till en plats under Inköp, så kan jag
                      knuffa dig när du är i närheten.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {savedStores.map((store) => (
                        <button
                          key={store.id}
                          type="button"
                          onClick={() => save({ placeId: store.id, placeName: store.name })}
                          className="rounded-full border border-border bg-card px-4 py-2 text-sm hover:border-primary"
                        >
                          <MapPin size={13} className="inline mr-1 -mt-0.5" />
                          {store.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {suggestion && (
                <button
                  type="button"
                  onClick={() => save({ remindAt: suggestion.at })}
                  className="w-full flex items-start gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-3 text-left hover:border-primary"
                >
                  <Sparkles size={16} className="text-primary mt-0.5 shrink-0" />
                  <span>
                    <span className="block text-sm font-medium text-ink">
                      Jag vet inte – hjälp mig
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      Jag föreslår {formatWhen(suggestion.at).toLowerCase()}. {suggestion.why}
                    </span>
                  </span>
                </button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default QuickflowCapture;
