import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { CLOUD_USER_DATA_KEYS } from "@/lib/cloud-storage";

/**
 * Skyddsnät mot glidning: varje nyckel som faktiskt synkas till molnet måste
 * finnas i den statiska manifestlistan. Annars kan utloggningen radera lokal
 * data vars hook inte hunnit monteras i sessionen.
 */
function sourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      out.push(...sourceFiles(full));
      continue;
    }
    if (!/\.(ts|tsx)$/.test(entry)) continue;
    if (/\.test\.(ts|tsx)$/.test(entry)) continue;
    out.push(full);
  }
  return out;
}

describe("molnsynkade nycklar", () => {
  it("täcker alla literala nycklar som skickas till useCloudSyncedStorage/List", () => {
    const pattern = /useCloudSynced(?:Storage|List)\s*(?:<[^;]*?>)?\s*\(\s*["']([^"']+)["']/g;
    const missing = new Set<string>();

    for (const file of sourceFiles("src")) {
      const source = readFileSync(file, "utf8");
      for (const match of source.matchAll(pattern)) {
        const key = match[1] as string;
        if (!CLOUD_USER_DATA_KEYS.has(key)) missing.add(`${key} (${file})`);
      }
    }

    expect([...missing]).toEqual([]);
  });
});
