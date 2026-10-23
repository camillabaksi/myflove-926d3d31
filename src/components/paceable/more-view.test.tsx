import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode, MouseEventHandler } from "react";
import MoreView, { getMoreItems, MORE_AREAS, MORE_OVERALL, MORE_LEGACY, MORE_ALL_HREFS, MORE_TOOL_GROUPS, MORE_QUICK_LINKS, type MoreItem } from "./more-view";
import { User } from "lucide-react";

vi.mock("wouter", () => ({ Link: ({ children, href, ...props }: { children: ReactNode; href: string; className?: string; onClick?: MouseEventHandler<HTMLAnchorElement> }) => <a href={href} {...props}>{children}</a> }));

const item = (href: string, essential = false): MoreItem => ({ href, label: href, hint: "Test", icon: User, essential });
const allItems = () => [...new Set(MORE_ALL_HREFS)].map((href) => item(href, href !== "/flowplan"));
const show = (items: MoreItem[], simpleMode = false) => render(<MoreView items={items} simpleMode={simpleMode} enlarged={false} onClose={vi.fn()} onNavigate={vi.fn()} t={(text) => text} />);

describe("Mer sorterad efter livsområden", () => {
  it("covers every existing navigation destination exactly once", () => {
    const existing = ["/idag", "/halsa", "/mitt-batteri", "/energifloede", "/aterhamtning", "/stop-paus", "/traning", "/daglig-rutin", "/quickflow", "/anteckningar", "/assistant", "/kalender", "/paminnelser", "/tasks", "/flowscore", "/pomodoro", "/shopping", "/matlista", "/stadning", "/finances", "/relationer", "/familjeflow", "/familj", "/barn", "/historik", "/statistik", "/beloningar", "/insight", "/flowplan", "/planera", "/friktionsindex", "/studyflow", "/jobb", "/admin", "/admin-statistik", "/installningar"];
    expect(new Set(MORE_ALL_HREFS)).toEqual(new Set(existing));
    expect(MORE_ALL_HREFS).toHaveLength(existing.length);
  });
  it("uses the calendar life areas with Familj+Barn and Hälsa+Egen tid combined", () => {
    expect(MORE_AREAS.map((g) => [g.title, g.area])).toEqual([["Hem & vardag", "vardag"], ["Arbete", "jobb"], ["Studier", "studier"], ["Ekonomi", "ekonomi"], ["Hälsa & egen tid", "halsa"], ["Familj & barn", "privat"]]);
    expect(MORE_AREAS.find((g) => g.title === "Familj & barn")?.hrefs).toContain("/barn");
    expect(MORE_OVERALL.map((g) => g.title)).toEqual(["Stöd & reflektion", "Insikter & historik"]);
    const support = MORE_OVERALL[0].hrefs;
    expect(support).toContain("/assistant");
    expect(support).toContain("/planera");
    expect(support).toContain("/flowplan");
    expect(support).not.toContain("/flow"); // legacy address remains accessible, but no duplicate chat link
    expect(MORE_TOOL_GROUPS.map((g) => g.title)).toEqual(["Konto och app", "Admin"]);
    expect(MORE_LEGACY).not.toContain("/hem");
  });
  it("keeps only authorized destinations and simple-mode filtering", () => {
    expect(getMoreItems([item("/tasks")], ["/tasks", "/admin"], false).map((e) => e.href)).toEqual(["/tasks"]);
    const items = [item("/flow", true), item("/flowplan")];
    expect(getMoreItems(items, ["/flow", "/flowplan"], true)).toEqual([items[0]]);
  });
  it("renders area sections, expands groups and links single-tool areas directly", () => {
    const { container } = show(allItems());
    expect([...container.querySelectorAll(".pace-more-section > h2")].map((h) => h.textContent)).toEqual(["DINA LIVSOMRÅDEN", "ÖVERGRIPANDE", "FLER VERKTYG"]);
    expect(screen.getByRole("link", { name: /Arbete/ })).toHaveAttribute("href", "/jobb");
    const toggle = screen.getByRole("button", { name: /Familj & barn/ });
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(container.querySelector('a[href="/barn"]')).not.toBeNull();
  });
  it("hides unauthorized links and empty areas, search still works", () => {
    const { container } = show(allItems().filter((e) => !["/assistant", "/admin", "/jobb"].includes(e.href)));
    expect(screen.queryByRole("link", { name: /Arbete/ })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /Stöd & reflektion/ }));
    expect(container.querySelectorAll('a[href="/assistant"]')).toHaveLength(0);
    fireEvent.click(screen.getByRole("button", { name: "Sök i appen" }));
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "/flowplan" } });
    expect(screen.getByRole("link", { name: /flowplan/ })).toHaveAttribute("href", "/flowplan");
  });
  it("shows exactly one Historik link near the top, without expanding, in normal and simple mode", () => {
    expect(MORE_QUICK_LINKS).toEqual(["/historik"]);
    expect(MORE_OVERALL.find((g) => g.title === "Insikter & historik")?.hrefs).toEqual(["/insight", "/statistik", "/friktionsindex"]);
    for (const simple of [false, true]) {
      const { container, unmount } = show(allItems().map((e) => e.href === "/historik" ? { ...e, label: "Dina aktiviteter", essential: true } : e), simple);
      const quick = screen.getByRole("navigation", { name: "Genvägar" });
      expect(screen.getByRole("link", { name: "Historik" })).toHaveAttribute("href", "/historik");
      expect(quick.contains(screen.getByRole("link", { name: "Historik" }))).toBe(true);
      expect(quick.compareDocumentPosition(container.querySelector(".pace-more-section")!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      fireEvent.click(screen.getByRole("button", { name: /Insikter & historik/ }));
      expect(container.querySelectorAll('a[href="/historik"]')).toHaveLength(1);
      expect(container.querySelector('a[href="/insight"]')).not.toBeNull();
      unmount();
    }
  });
  it("keeps the history destination in search as before", () => {
    const { container } = show(allItems().map((e) => e.href === "/historik" ? { ...e, label: "Dina aktiviteter" } : e));
    fireEvent.click(screen.getByRole("button", { name: "Sök i appen" }));
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "Dina aktiviteter" } });
    expect(container.querySelectorAll('a[href="/historik"]')).toHaveLength(1);
  });
});
