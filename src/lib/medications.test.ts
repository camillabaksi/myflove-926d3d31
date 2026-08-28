import { beforeEach, describe, expect, it } from "vitest";
import { installIndexedDbMock, resetIndexedDbMock } from "@/test/indexeddb-mock";
import { __resetSecureLocal, secureGetItem, unlockSecureLocal } from "@/lib/secure-local";
import {
  MEDICATIONS_KEY,
  MEDICATION_LOG_KEY,
  medicationIdFromReminderKey,
  medicationReminderKey,
  migrateMedicationStorage,
  normalizeMedications,
  staleMedicationReminderKeys,
  type Medication,
} from "@/lib/medications";

const med = (over: Partial<Medication> = {}): Medication => ({
  id: "m1",
  name: "Elvanse",
  times: ["10:00"],
  createdAt: 1,
  ...over,
});

describe("medicin – en källa för lista och påminnelser", () => {
  beforeEach(async () => {
    // Låt eventuella asynkrona krypteringsskrivningar från förra testet landa.
    await new Promise((r) => setTimeout(r, 20));
    installIndexedDbMock();
    resetIndexedDbMock();
    window.localStorage.clear();
    __resetSecureLocal();
    await unlockSecureLocal();
  });

  it("normaliserar gamla format (sträng, enkel tid, saknat id)", () => {
    const list = normalizeMedications([
      "Melatonin",
      { name: "Elvanse", time: "8:00", dosage: " 50 mg " },
      { id: "x", name: "Concerta", times: ["07:5", "22:00", "22:00"] },
    ]);
    expect(list).toHaveLength(3);
    expect(list[0].name).toBe("Melatonin");
    expect(list[1].times).toEqual(["08:00"]);
    expect(list[1].dosage).toBe("50 mg");
    expect(list[2].times).toEqual(["22:00"]);
    expect(list.every((m) => m.id)).toBe(true);
  });

  it("migrerar gammal nyckel till den kanoniska utan dubbletter", () => {
    window.localStorage.setItem(
      "myflow-medications",
      JSON.stringify([med(), med({ id: "m2", name: "Elvanse", times: ["10:00"] })]),
    );
    window.localStorage.setItem(
      "myflow-medication-log",
      JSON.stringify([{ medId: "m1", time: "10:00", date: "2026-08-28" }]),
    );

    const result = migrateMedicationStorage();

    expect(result.medications).toHaveLength(1);
    expect(result.medications[0].id).toBe("m1");
    expect(result.log).toHaveLength(1);
    expect(window.localStorage.getItem("myflow-medications")).toBeNull();
    expect(window.localStorage.getItem("myflow-medication-log")).toBeNull();
    expect(JSON.parse(secureGetItem(MEDICATIONS_KEY) ?? "[]")).toHaveLength(1);
    expect(JSON.parse(secureGetItem(MEDICATION_LOG_KEY) ?? "[]")).toHaveLength(1);
  });

  it("slår ihop gammal och ny nyckel utan att tappa eller dubblera", () => {
    window.localStorage.setItem(MEDICATIONS_KEY, JSON.stringify([med()]));
    window.localStorage.setItem(
      "myflow-medications",
      JSON.stringify([med(), med({ id: "m9", name: "Melatonin", times: ["21:00"] })]),
    );

    const first = migrateMedicationStorage();
    expect(first.medications.map((m) => m.name).sort()).toEqual(["Elvanse", "Melatonin"]);

    // Idempotent: en andra körning ändrar ingenting.
    const second = migrateMedicationStorage();
    expect(second.medications).toHaveLength(2);
  });

  it("rensar loggrader för mediciner som inte finns kvar", () => {
    window.localStorage.setItem(MEDICATIONS_KEY, JSON.stringify([med()]));
    window.localStorage.setItem(
      MEDICATION_LOG_KEY,
      JSON.stringify([
        { medId: "m1", time: "10:00", date: "2026-08-28" },
        { medId: "borta", time: "07:00", date: "2026-08-28" },
      ]),
    );
    const result = migrateMedicationStorage();
    expect(result.log).toEqual([{ medId: "m1", time: "10:00", date: "2026-08-28" }]);
  });

  it("tolkar påminnelsenycklar tillbaka till medicin-id", () => {
    const key = medicationReminderKey("40dwl7cm4", "2026-08-28", "10:00");
    expect(key).toBe("med:40dwl7cm4:2026-08-28:10:00");
    expect(medicationIdFromReminderKey(key)).toBe("40dwl7cm4");
    expect(medicationIdFromReminderKey("task:123")).toBeNull();
  });

  it("pekar ut köade notiser för borttagna mediciner som gamla", () => {
    const queued = [
      medicationReminderKey("m1", "2026-08-28", "10:00"),
      medicationReminderKey("borttagen", "2026-08-28", "11:30"),
    ];
    expect(staleMedicationReminderKeys(queued, [med()])).toEqual([
      "med:borttagen:2026-08-28:11:30",
    ]);
    // Tom lista i appen => inga medicinnotiser får leva kvar.
    expect(staleMedicationReminderKeys(queued, [])).toEqual(queued);
  });

  it("en medicin som kan ge påminnelse finns också i listan", () => {
    window.localStorage.setItem(
      "myflow-medications",
      JSON.stringify([{ name: "Elvanse", time: "11:30" }]),
    );
    const { medications } = migrateMedicationStorage();
    const remindable = medications.filter((m) => m.times.length > 0);
    expect(remindable).toHaveLength(1);
    const key = medicationReminderKey(remindable[0].id, "2026-08-28", remindable[0].times[0]);
    expect(staleMedicationReminderKeys([key], medications)).toEqual([]);
  });

  it("håller medicinlistan krypterad på disk", async () => {
    window.localStorage.setItem("myflow-medications", JSON.stringify([med()]));
    migrateMedicationStorage();
    for (let i = 0; i < 50; i++) {
      await new Promise((r) => setTimeout(r, 5));
      if (window.localStorage.getItem(MEDICATIONS_KEY)?.startsWith("enc:v1:")) break;
    }
    const raw = window.localStorage.getItem(MEDICATIONS_KEY);
    expect(raw?.startsWith("enc:v1:")).toBe(true);
    expect(raw).not.toContain("Elvanse");
  });
});
