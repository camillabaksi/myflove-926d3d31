import { describe, expect, it } from "vitest";
import { getMoreItems, MORE_GROUPS, MORE_FAMILY, MORE_INSIGHTS, MORE_LEGACY, MORE_FEATURED_HREFS, type MoreItem } from "./more-view";
import { User } from "lucide-react";

describe("Mer navigation presentation", () => {
  const item = (href: string, essential = false): MoreItem => ({ href, label: href, hint: "Test", icon: User, essential });
  it("covers every existing navigation destination", () => {
    const existing = ["/hem", "/idag", "/halsa", "/mitt-batteri", "/energifloede", "/aterhamtning", "/stop-paus", "/traning", "/daglig-rutin", "/quickflow", "/anteckningar", "/assistant", "/kalender", "/paminnelser", "/tasks", "/flowscore", "/pomodoro", "/shopping", "/matlista", "/stadning", "/finances", "/relationer", "/familjeflow", "/familj", "/barn", "/historik", "/statistik", "/beloningar", "/insight", "/flowplan", "/flow", "/friktionsindex", "/studyflow", "/jobb", "/admin", "/admin-statistik", "/installningar"];
    const covered = [...MORE_FEATURED_HREFS, ...MORE_FAMILY, ...MORE_INSIGHTS, ...MORE_LEGACY, ...MORE_GROUPS.flatMap((group) => [...group.hrefs])];
    expect(new Set(covered)).toEqual(new Set(existing));
  });
  it("keeps only supplied account-authorized destinations", () => {
    expect(getMoreItems([item("/tasks")], ["/tasks", "/admin", "/studyflow"], false).map((entry) => entry.href)).toEqual(["/tasks"]);
  });
  it("preserves essential filtering without mutating source items", () => {
    const items = [item("/flow", true), item("/flowplan")];
    expect(getMoreItems(items, ["/flow", "/flowplan"], true)).toEqual([items[0]]);
    expect(getMoreItems(items, ["/flow", "/flowplan"], false)).toEqual(items);
    expect(items).toHaveLength(2);
  });
  it("keeps older Home in the separate legacy group", () => {
    expect(MORE_LEGACY).toContain("/hem");
    expect(MORE_GROUPS.flatMap((group) => [...group.hrefs])).not.toContain("/hem");
  });
});