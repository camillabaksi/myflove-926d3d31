import { describe, expect, it } from "vitest";
import { mergeSyncValues, snapshotBase } from "@/lib/sync-merge";

type Item = { id: string; title: string };
const none = new Set<string>();

/** Två enheter utgår från samma bekräftade bas och ändrar var för sig. */
function merge(base: Item[], local: Item[], cloud: Item[], opts?: { removed?: string[]; localNewer?: boolean }) {
  return mergeSyncValues<Item[]>({
    base: snapshotBase(base),
    local,
    cloud,
    removed: opts?.removed ? new Set(opts.removed) : none,
    localUpdatedAt: opts?.localNewer === false ? 1 : 2,
    cloudUpdatedAt: opts?.localNewer === false ? 2 : 1,
  });
}

describe("trevägssammanslagning mellan två enheter", () => {
  const base = [
    { id: "a", title: "Handla" },
    { id: "b", title: "Tvätta" },
  ];

  it("behåller nya poster från båda enheterna", () => {
    const local = [...base, { id: "l", title: "Lokal" }];
    const cloud = [...base, { id: "c", title: "Annan enhet" }];
    const ids = merge(base, local, cloud).map((i) => i.id).sort();
    expect(ids).toEqual(["a", "b", "c", "l"]);
  });

  it("borttagen post på andra enheten kommer inte tillbaka", () => {
    const cloud = [base[1]];
    expect(merge(base, base, cloud).map((i) => i.id)).toEqual(["b"]);
  });

  it("borttagen post lokalt kommer inte tillbaka från molnet", () => {
    const local = [base[1]];
    expect(merge(base, local, base, { removed: ["a"] }).map((i) => i.id)).toEqual(["b"]);
  });

  it("borttagning vinner över samtidig ändring", () => {
    const local = [base[1]];
    const cloud = [{ id: "a", title: "Handla mjölk" }, base[1]];
    expect(merge(base, local, cloud, { removed: ["a"] }).map((i) => i.id)).toEqual(["b"]);
  });

  it("ändring på bara en enhet gäller", () => {
    const cloud = [{ id: "a", title: "Handla mjölk" }, base[1]];
    const local = [base[0], { id: "b", title: "Tvätta lakan" }];
    expect(merge(base, local, cloud)).toEqual([
      { id: "a", title: "Handla mjölk" },
      { id: "b", title: "Tvätta lakan" },
    ]);
  });

  it("samma post ändrad på båda: senaste ändringen vinner", () => {
    const local = [{ id: "a", title: "Lokal" }, base[1]];
    const cloud = [{ id: "a", title: "Moln" }, base[1]];
    expect(merge(base, local, cloud, { localNewer: true })[0].title).toBe("Lokal");
    expect(merge(base, local, cloud, { localNewer: false })[0].title).toBe("Moln");
  });

  it("inställningar: oförändrat lokalt → molnets värde", () => {
    const result = mergeSyncValues({
      base: snapshotBase({ theme: "a" }),
      local: { theme: "a" },
      cloud: { theme: "b" },
      removed: none,
      localUpdatedAt: 5,
      cloudUpdatedAt: 1,
    });
    expect(result).toEqual({ theme: "b" });
  });
});
