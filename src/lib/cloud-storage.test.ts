import { describe, expect, it } from "vitest";
import { applyCloudStorageUpdate } from "@/lib/cloud-storage";

describe("molnsynkens funktionsuppdateringar", () => {
  it("bygger nästa ändring på den senaste gemensamma listan", () => {
    const first = applyCloudStorageUpdate(["ett"], (items) => [...items, "två"]);
    const second = applyCloudStorageUpdate(first, (items) => [...items, "tre"]);

    expect(second).toEqual(["ett", "två", "tre"]);
  });

  it("kan fortfarande ersätta ett värde uttryckligen", () => {
    expect(applyCloudStorageUpdate(["gammal"], ["ny"])).toEqual(["ny"]);
  });
});