/** Stable client id for confirmed energy observations and retries. */
export const newEnergyFactorId = () =>
  globalThis.crypto?.randomUUID?.() ??
  "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (ch) => {
    const n = Math.floor(Math.random() * 16);
    return (ch === "x" ? n : (n & 3) | 8).toString(16);
  });
