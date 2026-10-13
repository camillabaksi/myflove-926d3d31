import { describe, expect, it } from "vitest";
import { usesRefreshedDesign } from "./design-refresh";
describe("Paceable design scope", () => {
  it.each([
    "/profile",
    "/familj",
    "/barn",
    "/finances",
    "/studier",
    "/historik",
    "/anpassa",
    "/medicin",
    "/daglig-rutin",
    "/mitt-batteri",
    "/workflow",
    "/aterhamtning",
  ])("refreshes secondary page %s", (path) => {
    expect(usesRefreshedDesign(path)).toBe(true);
  });
  it.each([
    "/",
    "/idag",
    "/kalender",
    "/quickflow",
    "/halsa",
    "/traning",
    "/traning/",
    "/traning/?pass=1",
    "/traning/program",
    "/designsystem",
    "/pitch",
    "/sign-in",
  ])("preserves approved or public page %s", (path) => {
    expect(usesRefreshedDesign(path)).toBe(false);
  });
});
