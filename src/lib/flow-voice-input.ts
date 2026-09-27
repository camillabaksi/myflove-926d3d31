import { createParser } from "eventsource-parser";
import { supabase } from "@/integrations/supabase/client";

export function encodeWav(chunks: readonly Float32Array[], sampleRate: number): Blob {
  const length = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const bytes = new ArrayBuffer(44 + length * 2);
  const view = new DataView(bytes);
  const tag = (offset: number, value: string) => {
    for (let i = 0; i < value.length; i++) view.setUint8(offset + i, value.charCodeAt(i));
  };
  tag(0, "RIFF");
  view.setUint32(4, 36 + length * 2, true);
  tag(8, "WAVE");
  tag(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  tag(36, "data");
  view.setUint32(40, length * 2, true);
  let offset = 44;
  for (const chunk of chunks)
    for (const value of chunk) {
      const sample = Math.max(-1, Math.min(1, value));
      view.setInt16(offset, sample * (sample < 0 ? 32768 : 32767), true);
      offset += 2;
    }
  return new Blob([bytes], { type: "audio/wav" });
}

export type VoiceRecorder = { stop: () => Promise<File> };

export async function startVoiceRecording(): Promise<VoiceRecorder> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  let context: AudioContext | undefined;
  try {
    context = new AudioContext();
    await context.resume();
    const audioContext = context;
    const source = audioContext.createMediaStreamSource(stream);
    const node = audioContext.createScriptProcessor(4096, 1, 1);
    const chunks: Float32Array[] = [];
    node.onaudioprocess = (event) => chunks.push(new Float32Array(event.inputBuffer.getChannelData(0)));
    source.connect(node);
    node.connect(audioContext.destination);
    let stopped = false;
    return {
      async stop() {
        if (stopped) throw new Error("Inspelningen är redan stoppad");
        stopped = true;
        stream.getTracks().forEach((track) => track.stop());
        node.disconnect();
        source.disconnect();
        node.onaudioprocess = null;
        const blob = encodeWav(chunks, audioContext.sampleRate);
        await audioContext.close();
        if (blob.size < 2048) throw new Error("Inspelningen blev tom – prova igen");
        return new File([blob], "recording.wav", { type: "audio/wav" });
      },
    };
  } catch (error) {
    stream.getTracks().forEach((track) => track.stop());
    await context?.close();
    throw error;
  }
}

export async function transcribeAudio(file: File, signal?: AbortSignal): Promise<string> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) throw new Error("Du behöver vara inloggad");

  const form = new FormData();
  form.append("file", file, file.name);

  const response = await fetch("/api/flow-transcribe", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
    ...(signal ? { signal } : {}),
  });

  if (!response.ok || !response.body) {
    const errorBody = await response.text();
    throw new Error(errorBody || `Transkriberingen misslyckades (${response.status})`);
  }

  let transcript = "";
  let done = false;
  const parser = createParser({
    onEvent: (event) => {
      try {
        const data = JSON.parse(event.data) as {
          type?: string;
          delta?: string;
          text?: string;
        };
        if (data.type === "transcript.text.delta" && data.delta) {
          transcript += data.delta;
        } else if (data.type === "transcript.text.done") {
          done = true;
          if (data.text) transcript = data.text;
        }
      } catch {
        // ignorera ofullständiga rader
      }
    },
  });

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  for (;;) {
    const { done: streamDone, value } = await reader.read();
    if (streamDone) break;
    parser.feed(decoder.decode(value, { stream: true }));
  }

  const text = transcript.trim();
  if (!done && !text) throw new Error("Transkriberingen avbröts – prova igen");
  if (!text) throw new Error("Jag hörde inget – prova att prata lite högre");
  return text;
}
