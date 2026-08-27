/**
 * Gemensamma filformat för uppladdning i hela MyFlove.
 * Ett ställe att uppdatera när fler format ska stödjas.
 */

export const MAX_FILE_MB = 10;

/** Bilder – inkl. mobilformat (HEIC från iPhone). */
export const IMAGE_EXTENSIONS = [
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".webp",
  ".heic",
  ".heif",
  ".bmp",
  ".tif",
  ".tiff",
  ".avif",
] as const;

/** Textbaserade format som kan läsas direkt i webbläsaren. */
export const TEXT_EXTENSIONS = [
  ".txt",
  ".md",
  ".markdown",
  ".rtf",
  ".csv",
  ".tsv",
  ".json",
  ".html",
  ".htm",
  ".xml",
  ".log",
  ".ics",
  ".vcs",
] as const;

/** Dokument som skickas vidare som fil (t.ex. till Flow). */
export const DOC_EXTENSIONS = [
  ".pdf",
  ".doc",
  ".docx",
  ".odt",
  ".rtf",
  ".ppt",
  ".pptx",
  ".key",
  ".xls",
  ".xlsx",
  ".ods",
  ".pages",
  ".epub",
] as const;

const join = (...groups: readonly (readonly string[])[]) =>
  Array.from(new Set(groups.flat())).join(",");

/** accept för bilder. */
export const ACCEPT_IMAGES = join(["image/*"], IMAGE_EXTENSIONS);

/** accept för studiematerial och allmänna dokument. */
export const ACCEPT_DOCUMENTS = join(
  ["image/*", "application/pdf", "text/plain"],
  IMAGE_EXTENSIONS,
  DOC_EXTENSIONS,
  TEXT_EXTENSIONS,
);

/** accept för scheman och kalenderfiler. */
export const ACCEPT_SCHEDULE = join(
  ["text/calendar", "text/plain", "text/csv", "application/pdf", "image/*"],
  TEXT_EXTENSIONS,
  IMAGE_EXTENSIONS,
  [".pdf"],
);

/** accept för rena kalenderimporter. */
export const ACCEPT_CALENDAR = join(
  ["text/calendar", "text/plain", "text/csv"],
  [".ics", ".ifb", ".vcs", ".txt", ".csv"],
);

export function fileExtension(name: string): string {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i).toLowerCase() : "";
}

const has = (list: readonly string[], ext: string) => list.includes(ext);

export function isImageFile(file: File): boolean {
  return file.type.startsWith("image/") || has(IMAGE_EXTENSIONS, fileExtension(file.name));
}

export function isPdfFile(file: File): boolean {
  return file.type === "application/pdf" || fileExtension(file.name) === ".pdf";
}

/** Format vi kan läsa som ren text i webbläsaren. */
export function isTextFile(file: File): boolean {
  return (
    file.type.startsWith("text/") ||
    file.type === "application/json" ||
    has(TEXT_EXTENSIONS, fileExtension(file.name))
  );
}

/** Läs en textfil som sträng (trunkerad så payloaden hålls liten). */
export async function readFileAsText(file: File, maxChars = 30000): Promise<string> {
  const raw = await file.text();
  return raw.length > maxChars ? `${raw.slice(0, maxChars)}\n…` : raw;
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Kunde inte läsa filen."));
    reader.readAsDataURL(file);
  });
}

export type PreparedUpload =
  | { kind: "text"; text: string }
  | { kind: "file"; file: { name: string; mime: string; dataUrl: string } };

/**
 * Gör en uppladdad fil klar för Flow: textfiler blir text,
 * bilder och PDF skickas som fil. Övriga format ger ett vänligt fel.
 */
export async function prepareUpload(file: File): Promise<PreparedUpload> {
  if (file.size > MAX_FILE_MB * 1024 * 1024) {
    throw new Error(`Filen är större än ${MAX_FILE_MB} MB. Prova en mindre fil.`);
  }
  if (isTextFile(file)) {
    return { kind: "text", text: await readFileAsText(file) };
  }
  if (isImageFile(file) || isPdfFile(file)) {
    return {
      kind: "file",
      file: {
        name: file.name,
        mime: file.type || (isPdfFile(file) ? "application/pdf" : "image/jpeg"),
        dataUrl: await readFileAsDataUrl(file),
      },
    };
  }
  throw new Error(
    `Flow kan inte läsa ${fileExtension(file.name) || "det formatet"} ännu. Spara som PDF, bild eller text så fungerar det.`,
  );
}

/** Kort hjälptext att visa under uppladdningsknappar. */
export const UPLOAD_HINT = `PDF, bilder (även HEIC) och textfiler (txt, md, csv, rtf, html) – max ${MAX_FILE_MB} MB.`;
