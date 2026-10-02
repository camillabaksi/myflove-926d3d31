/**
 * Konfliktregler för molnsynk (user_kv).
 *
 * Varje nyckel har en "bas": hur värdet såg ut senast molnet bekräftade det.
 * Med bas, lokalt värde och molnets värde görs en trevägssammanslagning:
 *
 * Listor med `id` (uppgifter, påminnelser, loggar …), per post:
 * - Ny post på en enhet (finns inte i basen) behålls alltid.
 * - Borttagning vinner: en post som tagits bort på någon enhet kommer inte
 *   tillbaka, även om den ändrats på en annan enhet under tiden.
 * - Ändrad på bara en sida → den ändringen gäller.
 * - Ändrad på båda sidor → den senaste ändringen av nyckeln vinner (lokal
 *   ändringstid jämförs med molnets updated_at). Enhetsklockor kan skilja
 *   sig något; regeln gäller hela posten, inte enskilda fält.
 *
 * Övriga värden (inställningar, objekt, listor utan id): senaste ändringen
 * vinner för hela värdet, med samma tidsjämförelse.
 */

export type SyncBase = { kind: "list"; items: Record<string, string> } | { kind: "value"; hash: string };

type WithId = { id: string };

function hasId(v: unknown): v is WithId {
  return !!v && typeof v === "object" && typeof (v as { id?: unknown }).id === "string";
}

export function isIdList(v: unknown): v is WithId[] {
  return Array.isArray(v) && v.every(hasId);
}

/** Kort, stabil hash av ett JSON-värde (djb2). Räcker för att se ändringar. */
export function hashValue(v: unknown): string {
  const s = JSON.stringify(v) ?? "undefined";
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return `${s.length}:${(h >>> 0).toString(36)}`;
}

export function snapshotBase(value: unknown): SyncBase {
  if (isIdList(value)) {
    const items: Record<string, string> = {};
    for (const item of value) items[item.id] = hashValue(item);
    return { kind: "list", items };
  }
  return { kind: "value", hash: hashValue(value) };
}

export interface MergeInput<T> {
  base: SyncBase | null;
  local: T;
  cloud: T;
  /** Id:n som tagits bort på den här enheten. */
  removed: ReadonlySet<string>;
  localUpdatedAt: number;
  cloudUpdatedAt: number;
}

export function mergeSyncValues<T>(input: MergeInput<T>): T {
  const { base, local, cloud, removed, localUpdatedAt, cloudUpdatedAt } = input;
  const localWinsTie = localUpdatedAt >= cloudUpdatedAt;

  if (!isIdList(local) || !isIdList(cloud)) {
    // Helt värde: oförändrat lokalt sedan basen → molnet; annars senaste vinner.
    if (base && base.kind === "value" && base.hash === hashValue(local)) return cloud;
    if (base && base.kind === "value" && base.hash === hashValue(cloud)) return local;
    return localWinsTie ? local : cloud;
  }

  const baseItems = base && base.kind === "list" ? base.items : null;
  const cloudById = new Map(cloud.map((c) => [c.id, c] as const));
  const localById = new Map(local.map((l) => [l.id, l] as const));

  const pick = (id: string): WithId | null => {
    const l = localById.get(id);
    const c = cloudById.get(id);
    const inBase = !!baseItems && id in baseItems;
    if (removed.has(id)) return null;
    if (l && !c) return inBase ? null : l; // borttagen i molnet, eller ny lokalt
    if (c && !l) return inBase ? null : c; // borttagen lokalt, eller ny i molnet
    if (!l || !c) return null;
    if (!baseItems || !inBase) return localWinsTie ? l : c;
    const baseHash = baseItems[id];
    const localChanged = hashValue(l) !== baseHash;
    const cloudChanged = hashValue(c) !== baseHash;
    if (localChanged && !cloudChanged) return l;
    if (cloudChanged && !localChanged) return c;
    if (!localChanged && !cloudChanged) return l;
    return localWinsTie ? l : c;
  };

  // Lokal ordning först; poster som bara finns i molnet läggs främst (som tidigare).
  const out: WithId[] = [];
  const seen = new Set<string>();
  for (const c of cloud) {
    if (localById.has(c.id)) continue;
    const v = pick(c.id);
    if (v) out.push(v);
    seen.add(c.id);
  }
  for (const l of local) {
    if (seen.has(l.id)) continue;
    seen.add(l.id);
    const v = pick(l.id);
    if (v) out.push(v);
  }
  return out as unknown as T;
}
