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

/** Office-/OpenDocument-format som är zip-filer med XML – text läses ut i webbläsaren. */
const OFFICE_ZIP_EXTENSIONS = [".docx", ".pptx", ".xlsx", ".odt", ".odp", ".ods", ".epub"];

async function inflateRaw(data: Uint8Array): Promise<Uint8Array> {
  const stream = new Blob([data]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

/** Minimal zip-läsare: returnerar filer vars namn matchar filtret. */
async function readZipEntries(
  buf: ArrayBuffer,
  match: (name: string) => boolean,
): Promise<Array<{ name: string; text: string }>> {
  const view = new DataView(buf);
  const bytes = new Uint8Array(buf);
  let eocd = -1;
  for (let i = buf.byteLength - 22; i >= Math.max(0, buf.byteLength - 66000); i--) {
    if (view.getUint32(i, true) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error("Filen verkar skadad.");
  const count = view.getUint16(eocd + 10, true);
  let p = view.getUint32(eocd + 16, true);
  const dec = new TextDecoder();
  const out: Array<{ name: string; text: string }> = [];
  for (let n = 0; n < count && view.getUint32(p, true) === 0x02014b50; n++) {
    const method = view.getUint16(p + 10, true);
    const compSize = view.getUint32(p + 20, true);
    const nameLen = view.getUint16(p + 28, true);
    const extraLen = view.getUint16(p + 30, true);
    const commentLen = view.getUint16(p + 32, true);
    const localOff = view.getUint32(p + 42, true);
    const name = dec.decode(bytes.subarray(p + 46, p + 46 + nameLen));
    p += 46 + nameLen + extraLen + commentLen;
    if (!match(name)) continue;
    const lNameLen = view.getUint16(localOff + 26, true);
    const lExtraLen = view.getUint16(localOff + 28, true);
    const start = localOff + 30 + lNameLen + lExtraLen;
    const raw = bytes.subarray(start, start + compSize);
    const data = method === 0 ? raw : method === 8 ? await inflateRaw(raw) : null;
    if (data) out.push({ name, text: dec.decode(data) });
  }
  return out;
}

function xmlToText(xml: string): string {
  return xml
    .replace(/<\/(w:p|a:p|text:p|text:h|p|h\d|li|div)>/g, "\n")
    .replace(/<(w:tab|text:tab)\/>/g, "\t")
    .replace(/<[^>]+>/g, "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Läs ut text ur Word, PowerPoint, Excel, OpenDocument och EPUB. */
async function readOfficeText(file: File, maxChars = 30000): Promise<string> {
  const ext = fileExtension(file.name);
  const match = (name: string): boolean => {
    if (ext === ".docx") return /^word\/(document|footnotes|endnotes)\.xml$/.test(name);
    if (ext === ".pptx") return /^ppt\/slides\/slide\d+\.xml$/.test(name);
    if (ext === ".xlsx") return name === "xl/sharedStrings.xml";
    if (ext === ".epub") return /\.x?html?$/i.test(name);
    return name === "content.xml";
  };
  const entries = await readZipEntries(await file.arrayBuffer(), match);
  entries.sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { numeric: true }),
  );
  const text = entries.map((e) => xmlToText(e.text)).filter(Boolean).join("\n\n");
  if (!text) throw new Error("Hittade ingen text i dokumentet. Prova att spara som PDF.");
  return text.length > maxChars ? `${text.slice(0, maxChars)}\n…` : text;
}

/**
 * Gör en uppladdad fil klar för Flow: textfiler och Office-dokument blir text,
 * bilder och PDF skickas som fil. Övriga format ger ett vänligt fel.
 */
export async function prepareUpload(file: File): Promise<PreparedUpload> {
  if (file.size > MAX_FILE_MB * 1024 * 1024) {
    throw new Error(`Filen är större än ${MAX_FILE_MB} MB. Prova en mindre fil.`);
  }
  if (OFFICE_ZIP_EXTENSIONS.includes(fileExtension(file.name))) {
    return { kind: "text", text: await readOfficeText(file) };
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
    `Flow kan inte läsa ${fileExtension(file.name) || "det formatet"} ännu. Spara som PDF, Word eller bild så fungerar det.`,
  );
}

/** Kort hjälptext att visa under uppladdningsknappar. */
export const UPLOAD_HINT = `PDF, bilder (även HEIC) och textfiler (txt, md, csv, rtf, html) – max ${MAX_FILE_MB} MB.`;
