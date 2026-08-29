import type { FlowScene } from "@/components/flow/flow-character";

/** Väljer situation utifrån en uppgiftstitel – bara befintlig data. */
export function sceneForTask(title?: string | null): FlowScene {
  const t = (title ?? "").toLowerCase();
  const has = (...words: string[]) => words.some((w) => t.includes(w));
  if (has("medicin", "tablett", "piller", "dos")) return "medicine";
  if (has("vatten", "dricka", "vätska")) return "water";
  if (has("tvätt", "vika", "tvättmaskin")) return "laundry";
  if (has("plugg", "läs", "studie", "tenta", "prov", "quiz")) return "study";
  if (has("jobb", "möte", "mail", "mejl", "rapport")) return "work";
  if (has("städ", "damms", "disk")) return "clean";
  if (has("laga", "mat", "middag", "frukost", "lunch")) return "cook";
  if (has("handla", "inköp", "affär", "shop")) return "shopping";
  if (has("promenad", "gå ut", "träna", "löp", "gym")) return "walk";
  if (has("barn", "lämna", "hämta", "förskola", "skolan")) return "kids";
  if (has("res", "buss", "tåg", "bil", "kör")) return "travel";
  if (has("sov", "vila", "lägg dig")) return "sleep";
  if (has("paus", "fika", "kaffe")) return "break";
  return "think";
}

/** Regn/snö-koder från väderdatan som redan finns i appen. */
export function isWetWeather(code: number | undefined | null): boolean {
  if (code == null) return false;
  return (
    (code >= 51 && code <= 67) ||
    (code >= 71 && code <= 77) ||
    (code >= 80 && code <= 86) ||
    code >= 95
  );
}
