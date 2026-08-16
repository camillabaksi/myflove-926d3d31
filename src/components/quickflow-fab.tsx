import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Mic, Zap } from "lucide-react";
import { toast } from "sonner";
import { useQuickflow } from "@/hooks/use-quickflow";
import { useTasks, useReminders } from "@/hooks/use-data";
import { useFlowUsage } from "@/hooks/use-daily-flow";
import { useVoiceInput } from "@/hooks/use-voice-input";
import { formatWhen, suggestWhen } from "@/lib/quickflow";

/**
 * QuickFlow – alltid en tumme bort. Skriv först, bestäm sen.
 * Användaren behöver aldrig välja kategori för att få ut något ur huvudet.
 */
export default function QuickflowFab() {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [saved, setSaved] = useState(false);
  const { add } = useQuickflow();
  const { addTask } = useTasks();
  const { addReminder } = useReminders();
  const { log } = useFlowUsage();
  const voice = useVoiceInput((t) => setText((prev) => (prev ? `${prev} ${t}` : t)));

  const trimmed = text.trim();
  const suggestion = trimmed ? suggestWhen("snabbt", trimmed) : null;

  const close = () => {
    setOpen(false);
    setText("");
    setSaved(false);
  };

  const keep = () => {
    add({ text: trimmed, level: "tanke" });
    log("quickflow");
    toast.success("Jag håller koll på det. 💙");
    close();
  };

  const remind = () => {
    if (!suggestion) return;
    const d = new Date(suggestion.at);
    addReminder(
      trimmed,
      d.toISOString().slice(0, 10),
      `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`,
    );
    log("quickflow");
    toast.success(`Jag säger till ${formatWhen(suggestion.at).toLowerCase()}.`, {
      description: suggestion.why,
    });
    close();
  };

  const asTask = (withDate?: string) => {
    addTask(trimmed, withDate);
    log("quickflow");
    toast.success(withDate ? "Inlagd i kalendern." : "Den ligger bland dina uppgifter.");
    close();
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="QuickFlow – få ut det ur huvudet"
        className="fixed right-4 bottom-24 md:bottom-8 z-40 inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-5 py-3.5 font-semibold shadow-lifted active:scale-95 transition-transform"
      >
        <Zap size={18} /> QuickFlow
      </button>

      <Dialog open={open} onOpenChange={(v) => (v ? setOpen(true) : close())}>
        <DialogContent className="sm:max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle>Vad vill du få ur huvudet?</DialogTitle>
          </DialogHeader>

          <p className="text-sm text-muted-foreground -mt-2">
            Få ut det ur huvudet. Jag håller koll.
          </p>

          <div className="flex items-start gap-2">
            <textarea
              autoFocus
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={3}
              placeholder="Jag måste ringa skolan..."
              className="flex-1 rounded-2xl border border-border bg-card p-3 text-base outline-none focus:border-primary"
            />
            {voice.isSupported && (
              <button
                type="button"
                onClick={voice.isListening ? voice.stopListening : voice.startListening}
                aria-label="Prata in"
                className={`rounded-2xl border p-3 ${
                  voice.isListening ? "bg-primary text-primary-foreground border-primary" : "border-border"
                }`}
              >
                <Mic size={18} />
              </button>
            )}
          </div>

          {trimmed && !saved && (
            <button
              type="button"
              onClick={() => setSaved(true)}
              className="w-full rounded-2xl bg-primary text-primary-foreground py-3.5 font-semibold"
            >
              Spara
            </button>
          )}

          {trimmed && saved && (
            <div className="space-y-2">
              <p className="text-sm text-ink">Jag håller koll på det. Vad vill du göra?</p>
              <Btn onClick={remind}>
                ⏰ Påminn mig{suggestion ? ` – ${formatWhen(suggestion.at).toLowerCase()}` : ""}
              </Btn>
              <Btn onClick={() => asTask()}>📌 Gör till uppgift</Btn>
              <Btn onClick={() => asTask(new Date().toISOString().slice(0, 10))}>📅 Lägg i kalender</Btn>
              <Btn onClick={keep}>🧠 Behåll i QuickFlow</Btn>
              <button
                type="button"
                onClick={keep}
                className="w-full rounded-2xl py-3 text-sm text-muted-foreground"
              >
                Inte nu
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function Btn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-left font-medium hover:border-primary/50 transition-colors"
    >
      {children}
    </button>
  );
}
