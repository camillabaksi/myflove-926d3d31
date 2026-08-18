// Mjuk väckning – ett varmt, långsamt klingande ljud i stället för ett skarpt alarm.
// Byggt med WebAudio så vi slipper ljudfiler, och allt tonar in/ut utan skarpa kanter.

const NOTES = [523.25, 659.25, 783.99, 1046.5]; // C5 – E5 – G5 – C6, en lugn durklang

export type GentleWakeHandle = { stop: () => void };

/**
 * Spelar en mjuk, stigande klockklang. Volymen börjar nästan ohörbar och växer
 * långsamt – tanken är att man ska vakna av den, inte skrämmas av den.
 */
export function playGentleWake(options?: {
  durationSec?: number;
  peak?: number;
}): GentleWakeHandle {
  if (typeof window === "undefined") return { stop: () => {} };
  const AudioCtx =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return { stop: () => {} };

  const duration = options?.durationSec ?? 9;
  const peak = options?.peak ?? 0.16;

  let ctx: AudioContext;
  try {
    ctx = new AudioCtx();
  } catch {
    return { stop: () => {} };
  }
  void ctx.resume();

  const now = ctx.currentTime;
  const master = ctx.createGain();
  master.gain.setValueAtTime(0.0001, now);
  master.gain.exponentialRampToValueAtTime(peak, now + duration * 0.55);
  master.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  // Lite mjukhet: dämpa vassa övertoner.
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(1800, now);
  filter.Q.value = 0.4;
  filter.connect(master);
  master.connect(ctx.destination);

  const stops: OscillatorNode[] = [];
  NOTES.forEach((freq, i) => {
    const start = now + i * 1.4;
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = freq;

    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(0.9 - i * 0.15, start + 1.2);
    g.gain.exponentialRampToValueAtTime(0.0001, start + 4.5);

    osc.connect(g);
    g.connect(filter);
    osc.start(start);
    osc.stop(start + 5);
    stops.push(osc);
  });

  const cleanup = window.setTimeout(() => void ctx.close().catch(() => {}), (duration + 1) * 1000);

  return {
    stop: () => {
      window.clearTimeout(cleanup);
      try {
        const t = ctx.currentTime;
        master.gain.cancelScheduledValues(t);
        master.gain.setValueAtTime(master.gain.value, t);
        master.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
        stops.forEach((o) => o.stop(t + 0.7));
        window.setTimeout(() => void ctx.close().catch(() => {}), 900);
      } catch {
        // tyst
      }
    },
  };
}
