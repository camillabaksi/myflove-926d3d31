import { useEffect, useRef, useState } from "react";
import { Volume2, Square, Loader2 } from "lucide-react";
import { streamFlowSpeech } from "@/lib/flow-speech";
import { cn } from "@/lib/utils";

/**
 * Liten högtalarknapp vid Flows svar. Tryck → Flow läser upp svaret med en
 * mjuk, tydlig röst. Tryck igen för att stoppa. Inget spelas automatiskt.
 */
export function FlowSpeakButton({ text, className }: { text: string; className?: string }) {
  const [state, setState] = useState<"idle" | "loading" | "playing" | "error">("idle");
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  const stop = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setState("idle");
  };

  const play = async () => {
    const controller = new AbortController();
    abortRef.current = controller;
    setState("loading");
    try {
      // Vänta ett varv så "loading" hinner synas innan ljudet drar igång.
      await new Promise((r) => setTimeout(r, 30));
      setState("playing");
      await streamFlowSpeech(text, controller.signal);
      if (!controller.signal.aborted) setState("idle");
    } catch {
      if (!controller.signal.aborted) setState("error");
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
    }
  };

  const active = state === "loading" || state === "playing";
  return (
    <button
      type="button"
      aria-label={active ? "Stoppa uppläsningen" : "Lyssna på Paces svar"}
      title={state === "error" ? "Uppläsningen misslyckades – försök igen" : undefined}
      onClick={() => (active ? stop() : void play())}
      className={cn(
        "inline-flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-background/70 hover:text-ink",
        state === "playing" && "text-primary",
        state === "error" && "text-destructive",
        className,
      )}
    >
      {state === "loading" ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : active ? (
        <Square className="h-3.5 w-3.5" />
      ) : (
        <Volume2 className="h-3.5 w-3.5" />
      )}
    </button>
  );
}
