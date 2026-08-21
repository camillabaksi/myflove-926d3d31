import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Mic, Zap } from "lucide-react";
import { useVoiceInput } from "@/hooks/use-voice-input";
import QuickflowConfirm from "@/components/quickflow-confirm";

/**
 * QuickFlow – alltid en tumme bort. Skriv (eller prata) först, bestäm sen.
 * Användaren behöver aldrig välja kategori för att få ut något ur huvudet;
 * MyFlove föreslår strukturen efteråt och allt går att ändra.
 */
export default function QuickflowFab() {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [saved, setSaved] = useState(false);
  const voice = useVoiceInput((t) => setText((prev) => (prev ? `${prev} ${t}` : t)));

  const trimmed = text.trim();

  // Bottennavigationens mitt-knapp öppnar samma dialog
  useEffect(() => {
    const open = () => setOpen(true);
    window.addEventListener("myflove:quickflow", open);
    return () => window.removeEventListener("myflove:quickflow", open);
  }, []);

  const close = () => {
    setOpen(false);
    setText("");
    setSaved(false);
  };


  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="QuickFlow – få ut det ur huvudet"
        className="hidden md:inline-flex fixed right-4 bottom-8 z-40 items-center gap-2 rounded-full bg-primary text-primary-foreground px-5 py-3.5 font-semibold shadow-lifted press"
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
                  voice.isListening
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border"
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
              Släpp det här hos mig
            </button>
          )}

          {trimmed && saved && (
            <QuickflowConfirm text={trimmed} onDone={close} onCancel={() => setSaved(false)} />
          )}

        </DialogContent>
      </Dialog>
    </>
  );
}

