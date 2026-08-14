// Personliga puffar som skickas som push även när appen är stängd.
// Ren funktion – går att importera både på server och klient.

export type PushNote = { title: string; body: string };

function pick<T>(arr: T[], seed: number): T {
  return arr[Math.abs(seed) % arr.length] as T;
}

export function getMorningPush(name: string | null | undefined, seed: number): PushNote {
  const you = name || "du";
  return {
    title: "God morgon 🌿",
    body: pick(
      [
        `Ny dag, ${you}. Välj en enda sak att börja med – resten väntar snällt.`,
        `Hej ${you}! Ta morgonen lugnt. Kaffet först, listan sen.`,
        `Dagen behöver inte bli perfekt, ${you}. Bara påbörjad.`,
        `Morgonen är din, ${you}. Ett litet steg räcker.`,
      ],
      seed,
    ),
  };
}

export function getEveningPush(name: string | null | undefined, seed: number): PushNote {
  const you = name || "du";
  return {
    title: "Dags att runda av 🌙",
    body: pick(
      [
        `Det som är kvar finns imorgon, ${you}. Dagen räcker som den är.`,
        `Snyggt att du tog dig igenom dagen, ${you}. Vila nu.`,
        `Lägg ifrån dig listan, ${you}. Kvällen är för återhämtning.`,
        `En sak i taget blev till en hel dag. Bra jobbat, ${you}.`,
      ],
      seed + 7,
    ),
  };
}
