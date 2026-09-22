/**
 * Ljud och röst för automatiskt pass.
 *
 * Kort pling + valfri röst på svenska ("Byt sida", "Vila klar"). Allt är
 * frivilligt och kan stängas av – inställningen sparas lokalt och delas av
 * hela appen via en liten prenumeration.
 */

const KEY = "myflove-workout-sound";
const listeners = new Set<(enabled: boolean) => void>();

export function isWorkoutSoundEnabled(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return window.localStorage.getItem(KEY) !== "off";
  } catch {
    return true;
  }
}

export function setWorkoutSoundEnabled(enabled: boolean): void {
  try {
    window.localStorage.setItem(KEY, enabled ? "on" : "off");
  } catch {
    // Appen fungerar även utan lokal lagring.
  }
  listeners.forEach((fn) => fn(enabled));
}

export function subscribeWorkoutSound(fn: (enabled: boolean) => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

type Tone = "start" | "byt" | "vila" | "klar";

const TONES: Record<Tone, number[]> = {
  start: [660, 880],
  byt: [740, 740],
  vila: [520],
  klar: [523.25, 659.25, 783.99],
};

/** Ett mjukt pling – aldrig skarpt, aldrig högt. */
export function playWorkoutCue(tone: Tone): void {
  if (typeof window === "undefined" || !isWorkoutSoundEnabled()) return;
  const AudioCtx =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return;
  let ctx: AudioContext;
  try {
    ctx = new AudioCtx();
  } catch {
    return;
  }
  void ctx.resume();
  const now = ctx.currentTime;
  TONES[tone].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const start = now + i * 0.18;
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.14, start + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.45);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + 0.5);
  });
  window.setTimeout(() => void ctx.close().catch(() => {}), 1500);
}

/** Säger en kort mening på svenska, om webbläsaren kan och ljudet är på. */
export function speakWorkout(text: string): void {
  if (typeof window === "undefined" || !isWorkoutSoundEnabled()) return;
  const synth = window.speechSynthesis;
  if (!synth) return;
  try {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "sv-SE";
    utterance.rate = 0.95;
    utterance.volume = 0.9;
    synth.cancel();
    synth.speak(utterance);
  } catch {
    // Röst är en bonus – passet fungerar utan.
  }
}

/** Pling + röst i ett, för ett nytt moment. */
export function announceWorkout(text: string, tone: Tone): void {
  playWorkoutCue(tone);
  speakWorkout(text);
}
