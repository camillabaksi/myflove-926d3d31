import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import type { ReactNode, MouseEventHandler } from "react";
import MoreView, { getMoreItems, MORE_GROUPS, MORE_TOOL_GROUPS, MORE_FAMILY, MORE_INSIGHTS, MORE_LEGACY, MORE_FEATURED_HREFS, type MoreItem } from "./more-view";
import { User } from "lucide-react";

vi.mock("wouter", () => ({ Link: ({ children, href, ...props }: { children: ReactNode; href: string; className?: string; onClick?: MouseEventHandler<HTMLAnchorElement> }) => <a href={href} {...props}>{children}</a> }));

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

  const allItems = () => [...new Set([...MORE_FEATURED_HREFS, ...MORE_FAMILY, ...MORE_INSIGHTS, ...MORE_LEGACY, ...MORE_GROUPS.flatMap((group) => [...group.hrefs])])].map((href) => item(href, href !== "/flowplan"));
  const show = (items: MoreItem[], simpleMode = false) => render(<MoreView items={items} simpleMode={simpleMode} enlarged={false} onClose={vi.fn()} onNavigate={vi.fn()} t={(text) => text} />);

  it("places each category only under its parent and keeps remaining tools and legacy", () => {
    const { container } = show(allItems());
    const headings = [...container.querySelectorAll(".pace-more-section > h2")].map((heading) => heading.textContent);
    expect(headings).toEqual(["MIN VARDAG", "HÄLSA & VÄLMÅENDE", "STÖD & SAMTAL", "FAMILJ & RELATIONER", "ÖVERBLICK & INSIKTER", "FLER VERKTYG"]);
    expect(screen.getByRole("link", { name: /Min profil/ })).toHaveAttribute("href", "/profil");
    expect(screen.getByRole("link", { name: /Uppgifter/ })).toHaveAttribute("href", "/tasks");
    expect(screen.getByRole("link", { name: /Träning och rörelse/ })).toHaveAttribute("href", "/traning");
    fireEvent.click(screen.getByRole("button", { name: /Fler funktioner/ }));
    const tools = container.querySelector("#pace-more-group-tools");
    expect(tools).not.toBeNull();
    if (!tools) return;
    const parents: Record<string, string> = { "Min dag": "MIN VARDAG", "Hem och vardag": "MIN VARDAG", "Ork och återhämtning": "HÄLSA & VÄLMÅENDE", "Flow och samtal": "STÖD & SAMTAL" };
    for (const group of MORE_GROUPS.slice(0, 4)) {
      const toggle = screen.getByRole("button", { name: new RegExp(group.title === "Flow och samtal" ? "Pace & samtal" : group.title) });
      expect(toggle).toHaveAttribute("aria-expanded", "false");
      expect(toggle.closest(".pace-more-section")?.querySelector("h2")?.textContent).toBe(parents[group.title]);
      expect(document.getElementById(`pace-more-group-direct-${group.title}`)).toBeNull();
      fireEvent.click(toggle);
      expect(toggle).toHaveAttribute("aria-expanded", "true");
      const direct = document.getElementById(`pace-more-group-direct-${group.title}`);
      expect(direct).not.toBeNull();
      if (!direct) continue;
      expect(within(tools as HTMLElement).queryByRole("heading", { name: group.title })).toBeNull();
      for (const section of [direct]) {
        const links = within(section as HTMLElement).getAllByRole("link");
        const hrefs = links.map((link) => link.getAttribute("href"));
        expect(hrefs).toEqual([...group.hrefs]);
        expect(new Set(hrefs).size).toBe(hrefs.length);
      }
      fireEvent.click(toggle);
      expect(toggle).toHaveAttribute("aria-expanded", "false");
    }
    expect(within(tools as HTMLElement).getByRole("heading", { name: "Konto och app" })).toBeInTheDocument();
    expect(within(tools as HTMLElement).getByRole("heading", { name: "Admin" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Äldre funktioner/ })).toBeInTheDocument();
  });

  it("preserves authorization, simple-mode filtering and unfiltered search", () => {
    const allowed = allItems().filter((entry) => !["/assistant", "/admin", "/admin-statistik"].includes(entry.href));
    const { container } = show(allowed, true);
    fireEvent.click(screen.getByRole("button", { name: /Fler funktioner/ }));
    fireEvent.click(screen.getByRole("button", { name: /Pace & samtal/ }));
    fireEvent.click(screen.getByRole("button", { name: /Min dag/ }));
    for (const href of ["/assistant", "/flowplan", "/admin", "/admin-statistik"]) {
      expect(container.querySelectorAll(`a[href="${href}"]`)).toHaveLength(0);
    }
    expect(container.querySelectorAll('a[href="/flow"]')).toHaveLength(1);
    expect(screen.getByRole("button", { name: /Pace & samtal/ })).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("button", { name: /Min dag/ })).toHaveAttribute("aria-expanded", "true");
    fireEvent.click(screen.getByRole("button", { name: "Sök i appen" }));
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "/flowplan" } });
    expect(screen.getByRole("link", { name: /flowplan/ })).toHaveAttribute("href", "/flowplan");
    expect(container.querySelectorAll('a[href="/assistant"]')).toHaveLength(0);
  });

  it("omits empty subcategories without removing the existing tools menu", () => {
    show([item("/installningar")]);
    for (const group of MORE_GROUPS.slice(0, 4)) expect(screen.queryByRole("button", { name: new RegExp(group.title === "Flow och samtal" ? "Pace & samtal" : group.title) })).toBeNull();
    expect(screen.queryByRole("heading", { name: "STÖD & SAMTAL" })).toBeNull();
    expect(screen.getByRole("button", { name: /Fler funktioner/ })).toBeInTheDocument();
  });
  it("uses six compact daily tiles with independent full-width expansions", () => {
    const { container } = show(allItems());
    const grid = container.querySelector(".pace-more-daily");
    if (!grid) throw new Error("Missing daily grid");
    const tiles = grid.querySelectorAll(".pace-more-small-card");
    expect(tiles).toHaveLength(6);
    expect([...tiles].map((tile) => tile.querySelector(".pace-more-card-title")?.textContent)).toEqual(["Uppgifter", "Ekonomi", "Studier", "Arbete", "Min dag", "Hem och vardag"]);
    for (const title of ["Min dag", "Hem och vardag"]) fireEvent.click(screen.getByRole("button", { name: new RegExp(title) }));
    for (const title of ["Min dag", "Hem och vardag"]) {
      const region = screen.getByRole("region", { name: title });
      expect(region.parentElement).toBe(grid);
      expect(region).toHaveClass("col-span-full");
      expect(region.closest(".pace-more-card-shell")).toBeNull();
    }
    fireEvent.click(screen.getByRole("button", { name: /Min dag/ }));
    expect(screen.queryByRole("region", { name: "Min dag" })).toBeNull();
    expect(screen.getByRole("region", { name: "Hem och vardag" })).toBeInTheDocument();
    expect(MORE_TOOL_GROUPS.map((group) => group.title)).toEqual(["Konto och app", "Admin"]);
  });
});