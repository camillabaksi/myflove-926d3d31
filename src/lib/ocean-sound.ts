/**
 * Havsljud helt byggt i webbläsaren (Web Audio) – ingen ljudfil, inga
 * licensfrågor. Ett filtrerat brus som långsamt sväller upp och ebbar ut,
 * så att det låter som mjuka vågor mot en strand. Loopar sömlöst.
 */

export type OceanSoundHandle = {
  stop: () => void;
  setVolume: (value: number) => void;
};

const SILENT: OceanSoundHandle = { stop: () => {}, setVolume: () => {} };

function makeNoiseBuffer(ctx: AudioContext): AudioBuffer {
  const seconds = 4;
  const buffer = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  // Brunt brus: mjukare och djupare än vitt brus, närmare havsbrus.
  let last = 0;
  for (let i = 0; i < data.length; i += 1) {
    const white = Math.random() * 2 - 1;
    last = (last + 0.02 * white) / 1.02;
    data[i] = last * 3.2;
  }
  return buffer;
}

/** Startar havsljudet. Måste anropas från en användargest (autoplay-regler). */
export function playOceanSound(options?: { volume?: number }): OceanSoundHandle {
  if (typeof window === "undefined") return SILENT;
  const AudioCtx =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return SILENT;

  let ctx: AudioContext;
  try {
    ctx = new AudioCtx();
  } catch {
    return SILENT;
  }
  void ctx.resume();

  const now = ctx.currentTime;
  const target = options?.volume ?? 0.35;

  const master = ctx.createGain();
  master.gain.setValueAtTime(0.0001, now);
  master.gain.linearRampToValueAtTime(target, now + 3);
  master.connect(ctx.destination);

  const source = ctx.createBufferSource();
  source.buffer = makeNoiseBuffer(ctx);
  source.loop = true;

  const lowpass = ctx.createBiquadFilter();
  lowpass.type = "lowpass";
  lowpass.frequency.setValueAtTime(700, now);
  lowpass.Q.value = 0.3;

  const highpass = ctx.createBiquadFilter();
  highpass.type = "highpass";
  highpass.frequency.value = 90;

  // Vågsvallet: en mycket långsam LFO som öppnar filtret och höjer volymen
  // när vågen kommer in, och drar ner den när den drar sig tillbaka.
  const swell = ctx.createGain();
  swell.gain.setValueAtTime(0.55, now);

  const lfo = ctx.createOscillator();
  lfo.type = "sine";
  lfo.frequency.value = 1 / 11; // en våg var elfte sekund

  const lfoGain = ctx.createGain();
  lfoGain.gain.value = 0.35;
  lfo.connect(lfoGain);
  lfoGain.connect(swell.gain);

  const filterLfoGain = ctx.createGain();
  filterLfoGain.gain.value = 420;
  lfo.connect(filterLfoGain);
  filterLfoGain.connect(lowpass.frequency);

  source.connect(highpass);
  highpass.connect(lowpass);
  lowpass.connect(swell);
  swell.connect(master);

  try {
    source.start();
    lfo.start();
  } catch {
    return SILENT;
  }

  let closed = false;
  return {
    setVolume: (value: number) => {
      if (closed) return;
      try {
        const t = ctx.currentTime;
        master.gain.cancelScheduledValues(t);
        master.gain.setValueAtTime(master.gain.value, t);
        master.gain.linearRampToValueAtTime(Math.max(0.0001, value), t + 0.6);
      } catch {
        /* tyst */
      }
    },
    stop: () => {
      if (closed) return;
      closed = true;
      try {
        const t = ctx.currentTime;
        master.gain.cancelScheduledValues(t);
        master.gain.setValueAtTime(master.gain.value, t);
        master.gain.linearRampToValueAtTime(0.0001, t + 1.2);
        source.stop(t + 1.4);
        lfo.stop(t + 1.4);
      } catch {
        /* tyst */
      }
      window.setTimeout(() => void ctx.close().catch(() => {}), 1600);
    },
  };
}
