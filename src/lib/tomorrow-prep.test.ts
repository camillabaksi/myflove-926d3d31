import { describe, expect, it } from "vitest";
import {
  MORNING_TO_CAPACITY,
  mentionsTomorrow,
  quickflowReminderText,
  suggestFromEvents,
  travelHint,
} from "./tomorrow-prep";

describe("tomorrow-prep", () => {
  it("föreslår bara det som står i kalendern", () => {
    const s = suggestFromEvents([
      { id: "1", title: "Möte 10:00", note: "Ta med senaste rapporten." },
      { id: "2", title: "Träning", time: "18:00" },
      { id: "3", title: "Lunch med Eva" },
    ]);
    expect(s.map((x) => x.text)).toEqual(["Ta med senaste rapporten", "Lägg fram träningskläder"]);
  });

  it("räknar ut när det är dags att åka", () => {
    expect(travelHint({ id: "1", title: "Möte", time: "10:00", note: "Restid: 35 min" })?.leaveAt).toBe("09:20");
    expect(travelHint({ id: "1", title: "Möte", time: "10:00" })).toBeNull();
  });

  it("hittar QuickFlow om imorgon", () => {
    expect(mentionsTomorrow("Måste komma ihåg gympakläder imorgon.")).toBe(true);
    expect(quickflowReminderText("Måste komma ihåg gympakläder imorgon.")).toBe("Gympakläder");
  });

  it("väldigt försiktigt blir lågt läge", () => {
    expect(MORNING_TO_CAPACITY.forsiktigt).toBe("lagt");
  });
});
