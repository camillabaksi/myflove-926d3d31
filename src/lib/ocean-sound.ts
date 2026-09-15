import oceanAudioAsset from "@/assets/light-boost-ocean.ogg.asset.json";

/**
 * Ett verkligt, CC0-licensierat havsljud från Wikimedia Commons.
 * Källfil: "Ocean Waves on a Tropical Beach.ogg" (public domain/CC0).
 * Den lokala versionen är nedkortad, mjukt korsfadad och optimerad för mobil.
 */
export type OceanSoundHandle = {
  stop: () => void;
  setVolume: (value: number) => void;
};

const SILENT: OceanSoundHandle = { stop: () => {}, setVolume: () => {} };

/** Startar havsljudet. Måste anropas från en användargest (autoplay-regler). */
export function playOceanSound(options?: { volume?: number }): OceanSoundHandle {
  if (typeof window === "undefined") return SILENT;

  const audio = new Audio(oceanAudioAsset.url);
  const targetVolume = Math.min(1, Math.max(0, options?.volume ?? 0.2));
  let stopped = false;
  let fadeTimer: number | null = null;

  audio.loop = true;
  audio.preload = "auto";
  audio.volume = targetVolume;

  void audio.play().catch(() => {
    audio.pause();
  });

  return {
    setVolume: (value: number) => {
      if (stopped) return;
      audio.volume = Math.min(1, Math.max(0, value));
    },
    stop: () => {
      if (stopped) return;
      stopped = true;
      const startVolume = audio.volume;
      const startedAt = performance.now();

      fadeTimer = window.setInterval(() => {
        const progress = Math.min(1, (performance.now() - startedAt) / 700);
        audio.volume = startVolume * (1 - progress);
        if (progress < 1) return;
        if (fadeTimer !== null) window.clearInterval(fadeTimer);
        fadeTimer = null;
        audio.pause();
        audio.removeAttribute("src");
        audio.load();
      }, 50);
    },
  };
}