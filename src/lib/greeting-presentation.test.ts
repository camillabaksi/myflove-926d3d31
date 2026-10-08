import { describe, expect, it } from "vitest";
import { greetingNameParts } from "./greeting-presentation";

describe("narrow greeting name presentation", () => {
  it("does not strand the final letter of the reported name", () => {
    const parts = greetingNameParts("Camillabaksi");
    expect(parts.join("")).toBe("Camillabaksi");
    expect(parts.every((part) => part.length > 1)).toBe(true);
  });
  it("preserves spaces, short names, unicode and long names without truncation", () => {
    for (const name of ["", "Åsa", "Anna Maria", "Alexandralånganvändarnamn", "😀Alexanderson"]) {
      expect(greetingNameParts(name).join("")).toBe(name);
    }
  });
});