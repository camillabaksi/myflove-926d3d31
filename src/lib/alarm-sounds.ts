/**
 * Alarmsignaler – mjuka, korta ljud som byggs i webbläsaren (WAV-blob).
 *
 * Vi genererar ljuden i kod i stället för att ladda ljudfiler: det håller
 * appen liten, fungerar offline och låter oss spela upp via ett vanligt
 * <audio>-element (mest pålitligt på mobil och i bakgrundsflikar).
 */

import type { AlarmSoundId } from "@/lib/personalization";

interface Tone {
  /** Sekund då tonen börjar. */
  start: number;
  freq: number;
  dur: number;
  gain?: number;
  /** Lätt brus i stället för ren ton (naturljud). */
  noise?: boolean;
  /** Glid till den här frekvensen under tonen. */
  slideTo?: number;
  /** Intoningstid i sekunder – längre = mjukare start utan skarp kant. */
  attack?: number;
}


interface SoundSpec {
  seconds: number;
  tones: Tone[];
}

const SPECS: Record<AlarmSoundId, SoundSpec> = {
  myflove: {
    seconds: 1.1,
    tones: [
      { start: 0, freq: 880, dur: 0.28 },
      { start: 0.35, freq: 1046, dur: 0.28 },
      { start: 0.7, freq: 880, dur: 0.32 },
    ],
  },
  "mjuk-klocka": {
    seconds: 2.2,
    tones: [
      { start: 0, freq: 659.25, dur: 1.6, gain: 0.3 },
      { start: 0, freq: 1318.5, dur: 1.2, gain: 0.12 },
      { start: 0.5, freq: 987.77, dur: 1.4, gain: 0.2 },
    ],
  },
  "litet-pling": {
    seconds: 0.6,
    tones: [
      { start: 0, freq: 1174.66, dur: 0.22, gain: 0.3 },
      { start: 0.14, freq: 1567.98, dur: 0.35, gain: 0.18 },
    ],
  },
  "mjuk-ton": {
    seconds: 1.6,
    tones: [
      { start: 0, freq: 523.25, dur: 1.4, gain: 0.32 },
      { start: 0, freq: 784, dur: 1.2, gain: 0.1 },
    ],
  },
  bubblig: {
    seconds: 1.2,
    tones: [
      { start: 0, freq: 600, dur: 0.16, gain: 0.26, slideTo: 900 },
      { start: 0.22, freq: 750, dur: 0.16, gain: 0.24, slideTo: 1100 },
      { start: 0.46, freq: 900, dur: 0.16, gain: 0.22, slideTo: 1350 },
      { start: 0.7, freq: 1100, dur: 0.2, gain: 0.2, slideTo: 1500 },
    ],
  },
  natur: {
    seconds: 2,
    tones: [
      { start: 0, freq: 0, dur: 2, gain: 0.06, noise: true },
      { start: 0.3, freq: 1800, dur: 0.12, gain: 0.16, slideTo: 2400 },
      { start: 0.55, freq: 2200, dur: 0.1, gain: 0.13, slideTo: 1700 },
      { start: 1.2, freq: 1900, dur: 0.14, gain: 0.15, slideTo: 2500 },
    ],
  },
  "lugn-melodi": {
    seconds: 2.4,
    tones: [
      { start: 0, freq: 523.25, dur: 0.5, gain: 0.26 },
      { start: 0.45, freq: 659.25, dur: 0.5, gain: 0.26 },
      { start: 0.9, freq: 783.99, dur: 0.5, gain: 0.26 },
      { start: 1.35, freq: 1046.5, dur: 0.9, gain: 0.24 },
    ],
  },
  // Sensoriskt mjuka signaler: långsam intoning, inga skarpa kanter.
  klangskal: {
    seconds: 3.2,
    tones: [
      { start: 0, freq: 174.61, dur: 3, gain: 0.3, attack: 0.5 },
      { start: 0, freq: 349.23, dur: 2.8, gain: 0.16, attack: 0.6 },
      { start: 0.2, freq: 523.25, dur: 2.4, gain: 0.07, attack: 0.8 },
    ],
  },
  regndroppe: {
    seconds: 2.6,
    tones: [
      { start: 0, freq: 0, dur: 2.6, gain: 0.04, noise: true, attack: 0.6 },
      { start: 0.4, freq: 660, dur: 0.5, gain: 0.14, attack: 0.12, slideTo: 520 },
      { start: 1.2, freq: 590, dur: 0.5, gain: 0.12, attack: 0.12, slideTo: 470 },
      { start: 1.9, freq: 700, dur: 0.6, gain: 0.11, attack: 0.15, slideTo: 540 },
    ],
  },
  harpa: {
    seconds: 3,
    tones: [
      { start: 0, freq: 392, dur: 1.6, gain: 0.2, attack: 0.25 },
      { start: 0.35, freq: 523.25, dur: 1.6, gain: 0.18, attack: 0.25 },
      { start: 0.7, freq: 659.25, dur: 1.7, gain: 0.16, attack: 0.3 },
      { start: 1.05, freq: 784, dur: 1.9, gain: 0.14, attack: 0.35 },
    ],
  },
};


function encodeWav(samples: Float32Array, sampleRate: number): Blob {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  const writeStr = (o: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(o + i, s.charCodeAt(i));
  };
  writeStr(0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, "data");
  view.setUint32(40, samples.length * 2, true);
  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i] ?? 0));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    offset += 2;
  }
  return new Blob([buffer], { type: "audio/wav" });
}

/** Bygger en WAV-blob för vald signal. */
export function buildAlarmWav(id: AlarmSoundId): Blob {
  const sampleRate = 44100;
  const spec = SPECS[id] ?? SPECS.myflove;
  const total = Math.floor(sampleRate * spec.seconds);
  const samples = new Float32Array(total);

  for (const tone of spec.tones) {
    const startSample = Math.floor(tone.start * sampleRate);
    const durSamples = Math.floor(tone.dur * sampleRate);
    const attack = Math.max(1, Math.floor((tone.attack ?? 0.02) * sampleRate));
    const release = Math.max(1, Math.floor(Math.min(0.3, tone.dur * 0.6) * sampleRate));
    const gain = tone.gain ?? 0.35;
    let phase = 0;
    for (let i = 0; i < durSamples; i++) {
      const idx = startSample + i;
      if (idx >= total) break;
      let env = 1;
      if (i < attack) env = i / attack;
      else if (i > durSamples - release) env = Math.max(0, (durSamples - i) / release);
      let sample: number;
      if (tone.noise) {
        sample = (Math.random() * 2 - 1) * 0.6;
      } else {
        const progress = i / durSamples;
        const freq = tone.slideTo ? tone.freq + (tone.slideTo - tone.freq) * progress : tone.freq;
        phase += (2 * Math.PI * freq) / sampleRate;
        sample = Math.sin(phase);
      }
      samples[idx] = (samples[idx] ?? 0) + sample * env * gain;
    }
  }

  return encodeWav(samples, sampleRate);
}
