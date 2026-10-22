import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("Calendar tool entrypoints", () => {
  const page = readFileSync("src/pages/calendar.tsx", "utf8");
  const planner = readFileSync("src/components/calendar/calendar-planner.tsx", "utf8");
  const toolActions = page.split('tools={<>')[1]?.split('{quickAddOpen &&')[0] ?? "";

  it("retains a single prominent add entrypoint in the calendar heading", () => {
    expect(planner).toContain('onClick={() => openAdd(false, date)}><Plus size={16} aria-hidden />{t("Lägg till")}');
    expect(toolActions).not.toContain('{t("Lägg till")}');
    expect(toolActions).toContain('{t("Registrera aktivitet")}');
    expect(toolActions).toContain('{t("Påminnelse och upprepning")}');
  });

  it("keeps specialized logging, repeating reminders and copy-day available", () => {
    expect(page).toContain("<QuickAddInline");
    expect(page).toContain("newReminderRepeat");
    expect(page).toContain("<CopyDayButton");
    expect(page).toContain("<DailyFlowList");
  });

  it("offers picture support in the main calendar settings, not twice in tools", () => {
    expect(planner).toContain('{t("Bildstöd")}');
    expect(toolActions).not.toContain('setPictoMode(!pictoMode)');
  });
});
