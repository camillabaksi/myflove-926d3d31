import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Mic, Plus, Sparkles, MapPin } from "lucide-react";
import { toast } from "sonner";
import { useVoiceInput } from "@/hooks/use-voice-input";
import { useSavedStores } from "@/hooks/use-data";
import { useQuickflow } from "@/hooks/use-quickflow";
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
  const { add } = useQuickflow();
  const { savedStores } = useSavedStores();
  const voice = useVoiceInput((t) => setText((prev) => (prev ? `${prev} ${t}` : t)));

  const suggestion = useMemo(() => (text.trim() ? suggestWhen(level, text) : null), [text, level]);

  const reset = () => {
    setText("");
    setLevel("snabbt");
    setCustomOpen(false);
    setCustomValue("");
    setPlaceOpen(false);
  };

  const save = (opts: { remindAt?: number; placeId?: string; placeName?: string }) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    add({ text: trimmed, level, ...opts });
    setOpen(false);
    reset();
    toast.success("Lugn. Jag håller det åt dig. 💙", {
      description: opts.remindAt
        ? `Jag säger till ${formatWhen(opts.remindAt).toLowerCase()}.`
        : opts.placeName
          ? `Jag knuffar dig när du är nära ${opts.placeName}.`
          : "Den ligger som en öppen tanke – jag frågar dig senare.",
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Vad vill du att jag håller åt dig?</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
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

            <div className="space-y-2">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Hur känns det?</p>
              <div className="grid gap-2">
                {(Object.keys(LEVEL_META) as QuickflowLevel[]).map((key) => {
                  const meta = LEVEL_META[key];
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setLevel(key)}
                      className={`flex items-start gap-3 rounded-2xl border p-3 text-left transition-colors ${
                        level === key ? meta.className : "border-border bg-card hover:border-primary/40"
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
              <div className="flex flex-wrap gap-2">
                {WHEN_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    disabled={!text.trim()}
                    onClick={() => save({ remindAt: preset.compute() ?? undefined })}
                    className="rounded-full border border-border bg-card px-4 py-2 text-sm hover:border-primary disabled:opacity-40"
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
                  className="rounded-full border border-border bg-card px-4 py-2 text-sm hover:border-primary disabled:opacity-40"
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
                  className="rounded-full border border-border bg-card px-4 py-2 text-sm hover:border-primary disabled:opacity-40"
                >
                  <MapPin size={13} className="inline mr-1 -mt-0.5" />
                  När jag kommer till en plats
                </button>
                <button
                  type="button"
                  disabled={!text.trim()}
                  onClick={() => save({})}
                  className="rounded-full border border-sage bg-sage/30 px-4 py-2 text-sm hover:border-primary disabled:opacity-40"
                >
                  💭 Bara spara tanken
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
