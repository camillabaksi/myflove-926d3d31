import { useRef, useState } from "react";
import { Loader2, Mic, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { startVoiceRecording, transcribeAudio, type VoiceRecorder } from "@/lib/flow-voice-input";
import { deviceAccessReady, UPDATE_APP_FOR_DEVICE_ACCESS } from "@/lib/native-caps";

type MicState = "idle" | "recording" | "transcribing";

export function FlowMicButton({
  onTranscript,
  onError,
  disabled,
  className,
}: {
  onTranscript: (text: string) => void;
  onError?: (message: string) => void;
  disabled?: boolean;
  className?: string;
}) {
  const [state, setState] = useState<MicState>("idle");
  const recorderRef = useRef<VoiceRecorder | null>(null);

  const fail = (error: unknown) => {
    setState("idle");
    recorderRef.current = null;
    const message = error instanceof Error ? error.message : "Något gick fel";
    if (message.includes("NotAllowedError") || message.includes("Permission")) {
      onError?.("Jag får inte använda mikrofonen – tillåt den i webbläsaren eller telefonens inställningar och prova igen");
    } else {
      onError?.(message);
    }
  };

  const handleClick = async () => {
    if (state === "idle") {
      // Äldre iPhone-app saknar mikrofonbehörighet – då skulle appen krascha.
      if (!(await deviceAccessReady())) {
        onError?.(UPDATE_APP_FOR_DEVICE_ACCESS);
        return;
      }
      try {
        recorderRef.current = await startVoiceRecording();
        setState("recording");
      } catch (error) {
        fail(error);
      }
      return;
    }
    if (state === "recording" && recorderRef.current) {
      setState("transcribing");
      try {
        const file = await recorderRef.current.stop();
        recorderRef.current = null;
        const text = await transcribeAudio(file);
        setState("idle");
        onTranscript(text);
      } catch (error) {
        fail(error);
      }
    }
  };

  return (
    <Button
      type="button"
      variant={state === "recording" ? "destructive" : "outline"}
      onClick={() => void handleClick()}
      disabled={disabled || state === "transcribing"}
      className={`rounded-xl h-10 px-4 ${className ?? ""}`}
      aria-label={
        state === "recording"
          ? "Stoppa inspelningen"
          : state === "transcribing"
            ? "Skriver ut det du sa…"
            : "Prata in till Flow"
      }
    >
      {state === "recording" ? (
        <>
          <Square className="w-4 h-4 mr-2" />
          Stoppa
        </>
      ) : state === "transcribing" ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Skriver ut…
        </>
      ) : (
        <>
          <Mic className="w-4 h-4 mr-2" />
          Prata
        </>
      )}
    </Button>
  );
}
